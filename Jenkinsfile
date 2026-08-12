pipeline {
    agent any

    options {
        skipDefaultCheckout(true)
    }

    environment {
        GITLEAKS_IMAGE = 'ghcr.io/gitleaks/gitleaks:v8.30.0'
        TRIVY_IMAGE = 'aquasec/trivy:0.72.0'
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

        stage('Build Docker Images') {
            steps {
                sh '''
                    set -e

                    echo "Building auth-service..."
                    docker build \
                        -t devsecops/auth-service:${BUILD_NUMBER} \
                        ./app/auth-service

                    echo "Building data-service..."
                    docker build \
                        -t devsecops/data-service:${BUILD_NUMBER} \
                        ./app/data-service

                    echo "Building frontend..."
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

        stage('ECR Authentication Test') {
            steps {
                withCredentials([
                    [$class: 'AmazonWebServicesCredentialsBinding',
                     credentialsId: 'aws-ecr-jenkins']
                ]) {
                    sh '''
                        set -e

                        echo "Testing AWS authentication from Jenkins..."

                        aws sts get-caller-identity

                        echo "Testing ECR authentication..."

                        aws ecr get-login-password \
                            --region ap-south-1 \
                            | docker login \
                                --username AWS \
                                --password-stdin \
                                882640845424.dkr.ecr.ap-south-1.amazonaws.com

                        echo "ECR authentication successful"
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
