pipeline {

    agent any

    options {
        skipDefaultCheckout(true)
    }

    environment {
        GITLEAKS_IMAGE = 'ghcr.io/gitleaks/gitleaks:v8.30.0'
        TRIVY_IMAGE = 'aquasec/trivy:0.72.0'

        AWS_REGION = 'ap-south-1'
        ECR_REGISTRY = '882640845424.dkr.ecr.ap-south-1.amazonaws.com'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Validate Source') {
            steps {
                sh '''
                    set -e

                    echo "Checking repository structure..."

                    test -f app/auth-service/package.json
                    test -f app/auth-service/index.js

                    test -f app/data-service/app.py
                    test -f app/data-service/requirements.txt

                    test -f app/frontend/package.json
                    test -f app/frontend/package-lock.json
                    test -f docker-compose.yml

                    echo "Repository structure OK"
                '''
            }
        }

        stage('Secret Scan - Gitleaks') {
            steps {
                sh '''
                    set -e

                    echo "Running Gitleaks in an ephemeral container..."

                    docker run --rm \
                        -v "$WORKSPACE:/repo:ro" \
                        "$GITLEAKS_IMAGE" \
                        dir /repo --redact

                    echo "Gitleaks scan passed"
                '''
            }
        }

        stage('Application Syntax Checks') {
            steps {
                sh '''
                    set -e

                    echo "Checking Node.js syntax..."
                    node --check app/auth-service/index.js

                    echo "Checking Python syntax..."
                    python3 -m py_compile app/data-service/app.py

                    echo "Application syntax checks passed"
                '''
            }
        }

        stage('SonarQube Analysis') {
            steps {
                script {
                    def scannerHome = tool 'sonar-scanner'

                    withSonarQubeEnv('sonarqube') {
                        sh """
                            set -e

                            echo "======================================"
                            echo "Running SonarQube Analysis"
                            echo "======================================"

                            "${scannerHome}/bin/sonar-scanner" \
                                -Dsonar.projectKey=devsecops-kubernetes-ci-cd \
                                -Dsonar.projectName=devsecops-kubernetes-ci-cd \
                                -Dsonar.sources=app \
                                -Dsonar.exclusions='**/node_modules/**,**/package-lock.json,**/__pycache__/**'

                            echo "======================================"
                            echo "SonarQube analysis completed"
                            echo "======================================"
                        """
                    }
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                sh '''
                    set -e

                    echo "======================================"
                    echo "Building auth-service"
                    echo "======================================"

                    docker build \
                        -t devsecops/auth-service:${BUILD_NUMBER} \
                        ./app/auth-service

                    echo "======================================"
                    echo "Building data-service"
                    echo "======================================"

                    docker build \
                        -t devsecops/data-service:${BUILD_NUMBER} \
                        ./app/data-service

                    echo "======================================"
                    echo "Building frontend"
                    echo "======================================"

                    docker build \
                        -t devsecops/frontend:${BUILD_NUMBER} \
                        ./app/frontend

                    echo "Docker image builds completed"
                '''
            }
        }

        stage('Security Scan - Trivy') {
            steps {
                sh '''
                    set -e

                    echo "Running Trivy vulnerability scans in ephemeral containers..."

                    echo "======================================"
                    echo "Scanning auth-service"
                    echo "======================================"

                    docker run --rm \
                        -v /var/run/docker.sock:/var/run/docker.sock \
                        "$TRIVY_IMAGE" \
                        image \
                        --severity HIGH,CRITICAL \
                        --exit-code 1 \
                        devsecops/auth-service:${BUILD_NUMBER}

                    echo "auth-service Trivy scan passed"

                    echo "======================================"
                    echo "Scanning data-service"
                    echo "======================================"

                    docker run --rm \
                        -v /var/run/docker.sock:/var/run/docker.sock \
                        "$TRIVY_IMAGE" \
                        image \
                        --severity HIGH,CRITICAL \
                        --exit-code 1 \
                        devsecops/data-service:${BUILD_NUMBER}

                    echo "data-service Trivy scan passed"

                    echo "======================================"
                    echo "Scanning frontend"
                    echo "======================================"

                    docker run --rm \
                        -v /var/run/docker.sock:/var/run/docker.sock \
                        "$TRIVY_IMAGE" \
                        image \
                        --severity HIGH,CRITICAL \
                        --exit-code 1 \
                        devsecops/frontend:${BUILD_NUMBER}

                    echo "frontend Trivy scan passed"

                    echo "All Trivy security scans passed"
                '''
            }
        }

        stage('Push Images to ECR') {
            steps {
                withCredentials([
                    [$class: 'AmazonWebServicesCredentialsBinding',
                     credentialsId: 'aws-ecr-jenkins']
                ]) {
                    sh '''
                        set -e

                        echo "======================================"
                        echo "Authenticating with Amazon ECR"
                        echo "======================================"

                        aws sts get-caller-identity

                        aws ecr get-login-password \
                            --region "$AWS_REGION" \
                            | docker login \
                                --username AWS \
                                --password-stdin \
                                "$ECR_REGISTRY"

                        echo "ECR authentication successful"

                        echo "======================================"
                        echo "Tagging Docker images"
                        echo "======================================"

                        docker tag \
                            devsecops/auth-service:${BUILD_NUMBER} \
                            "$ECR_REGISTRY/auth-service:${BUILD_NUMBER}"

                        docker tag \
                            devsecops/data-service:${BUILD_NUMBER} \
                            "$ECR_REGISTRY/data-service:${BUILD_NUMBER}"

                        docker tag \
                            devsecops/frontend:${BUILD_NUMBER} \
                            "$ECR_REGISTRY/frontend:${BUILD_NUMBER}"

                        echo "Docker images tagged successfully"

                        echo "======================================"
                        echo "Pushing auth-service"
                        echo "======================================"

                        docker push \
                            "$ECR_REGISTRY/auth-service:${BUILD_NUMBER}"

                        echo "auth-service:${BUILD_NUMBER} pushed successfully"

                        echo "======================================"
                        echo "Pushing data-service"
                        echo "======================================"

                        docker push \
                            "$ECR_REGISTRY/data-service:${BUILD_NUMBER}"

                        echo "data-service:${BUILD_NUMBER} pushed successfully"

                        echo "======================================"
                        echo "Pushing frontend"
                        echo "======================================"

                        docker push \
                            "$ECR_REGISTRY/frontend:${BUILD_NUMBER}"

                        echo "frontend:${BUILD_NUMBER} pushed successfully"

                        echo "======================================"
                        echo "All images pushed to ECR successfully"
                        echo "======================================"

                        docker logout "$ECR_REGISTRY"
                    '''
                }
            }
        }

        stage('Build Summary') {
            steps {
                sh '''
                    echo "======================================"
                    echo "Docker images created by Jenkins"
                    echo "======================================"

                    docker images devsecops/auth-service
                    docker images devsecops/data-service
                    docker images devsecops/frontend

                    echo "======================================"
                    echo "ECR artifacts"
                    echo "======================================"

                    echo "$ECR_REGISTRY/auth-service:${BUILD_NUMBER}"
                    echo "$ECR_REGISTRY/data-service:${BUILD_NUMBER}"
                    echo "$ECR_REGISTRY/frontend:${BUILD_NUMBER}"
                '''
            }
        }
    }

    post {

        success {
            echo 'CI security pipeline completed successfully.'
        }

        failure {
            echo 'CI pipeline failed. Review the failed stage.'
        }
    }
}
