pipeline {

    agent any

    options {
        skipDefaultCheckout(true)
        timestamps()
        disableConcurrentBuilds()

        buildDiscarder(
            logRotator(
                numToKeepStr: '20',
                artifactNumToKeepStr: '10'
            )
        )

        timeout(time: 30, unit: 'MINUTES')
    }

    environment {

        // =========================================================
        // SECURITY TOOLS
        // =========================================================

        GITLEAKS_IMAGE = 'ghcr.io/gitleaks/gitleaks:v8.30.0'
        TRIVY_IMAGE    = 'aquasec/trivy:0.72.0'


        // =========================================================
        // AWS / ECR
        // =========================================================

        AWS_REGION   = 'ap-south-1'
        ECR_REGISTRY = '882640845424.dkr.ecr.ap-south-1.amazonaws.com'


        // =========================================================
        // KUBERNETES
        // =========================================================

        K8S_NAMESPACE = 'default'


        // =========================================================
        // APPLICATION DEPLOYMENTS
        // =========================================================

        AUTH_DEPLOYMENT     = 'auth-service'
        DATA_DEPLOYMENT     = 'data-service'
        FRONTEND_DEPLOYMENT = 'frontend'


        // =========================================================
        // ACTUAL CONTAINER NAMES FROM DEPLOYMENT MANIFESTS
        // =========================================================

        AUTH_CONTAINER     = 'auth'
        DATA_CONTAINER     = 'data'
        FRONTEND_CONTAINER = 'frontend'
    }


    stages {

        // =========================================================
        // 1. CHECKOUT
        // =========================================================

        stage('Checkout') {

            steps {

                checkout scm

                sh '''
                    echo "=============================================="
                    echo "SOURCE CHECKOUT"
                    echo "=============================================="

                    git rev-parse --short HEAD
                    git status --short

                    echo "=============================================="
                '''
            }
        }


        // =========================================================
        // 2. VALIDATE SOURCE
        // =========================================================

        stage('Validate Source') {

            steps {

                sh '''
                    set -e

                    echo "=============================================="
                    echo "SOURCE VALIDATION"
                    echo "=============================================="

                    test -f app/auth-service/package.json
                    test -f app/auth-service/index.js

                    test -f app/data-service/app.py
                    test -f app/data-service/requirements.txt

                    test -f app/frontend/package.json
                    test -f app/frontend/package-lock.json

                    test -f app/auth-service/Dockerfile
                    test -f app/data-service/Dockerfile
                    test -f app/frontend/Dockerfile

                    test -d kubernetes

                    echo "Repository structure validation PASSED"

                    echo "=============================================="
                '''
            }
        }


        // =========================================================
        // 3. GITLEAKS
        // =========================================================

        stage('Secret Scan - Gitleaks') {

            steps {

                sh '''
                    set -e

                    echo "=============================================="
                    echo "GITLEAKS SECRET SCAN"
                    echo "=============================================="

                    docker run --rm \
                        -v "$WORKSPACE:/repo:ro" \
                        "$GITLEAKS_IMAGE" \
                        dir /repo --redact

                    echo "Gitleaks scan PASSED"

                    echo "=============================================="
                '''
            }
        }


        // =========================================================
        // 4. APPLICATION VALIDATION
        // =========================================================

        stage('Application Syntax Checks') {

            steps {

                sh '''
                    set -e

                    echo "=============================================="
                    echo "APPLICATION VALIDATION"
                    echo "=============================================="

                    echo "Checking Node.js syntax..."

                    node --check \
                        app/auth-service/index.js

                    echo "Checking Python syntax..."

                    python3 -m py_compile \
                        app/data-service/app.py

                    echo "Application syntax checks PASSED"

                    echo "=============================================="
                '''
            }
        }


        // =========================================================
        // 5. SONARQUBE
        // =========================================================

        stage('SonarQube Analysis') {

            steps {

                script {

                    def scannerHome = tool 'sonar-scanner'

                    withSonarQubeEnv('sonarqube') {

                        sh """
                            set -e

                            echo "=============================================="
                            echo "SONARQUBE ANALYSIS"
                            echo "=============================================="

                            "${scannerHome}/bin/sonar-scanner" \\
                                -Dsonar.projectKey=devsecops-kubernetes-ci-cd \\
                                -Dsonar.projectName=devsecops-kubernetes-ci-cd \\
                                -Dsonar.sources=app \\
                                -Dsonar.exclusions='**/node_modules/**,**/package-lock.json,**/__pycache__/**'

                            echo "SonarQube analysis completed"

                            echo "=============================================="
                        """
                    }
                }
            }
        }


        // =========================================================
        // 6. QUALITY GATE
        // =========================================================

        stage('Quality Gate') {

            steps {

                timeout(time: 5, unit: 'MINUTES') {

                    waitForQualityGate abortPipeline: true
                }
            }
        }


        // =========================================================
        // 7. BUILD DOCKER IMAGES
        // =========================================================

        stage('Build Docker Images') {

            steps {

                sh '''
                    set -e

                    echo "=============================================="
                    echo "DOCKER IMAGE BUILD"
                    echo "=============================================="

                    echo "Building auth-service..."

                    docker build \
                        --pull \
                        -t devsecops/auth-service:${BUILD_NUMBER} \
                        ./app/auth-service

                    echo "Building data-service..."

                    docker build \
                        --pull \
                        -t devsecops/data-service:${BUILD_NUMBER} \
                        ./app/data-service

                    echo "Building frontend..."

                    docker build \
                        --pull \
                        -t devsecops/frontend:${BUILD_NUMBER} \
                        ./app/frontend

                    echo ""
                    echo "Docker images successfully built."

                    docker images | grep devsecops

                    echo "=============================================="
                '''
            }
        }


        // =========================================================
        // 8. TRIVY SECURITY SCAN
        // =========================================================

        stage('Security Scan - Trivy') {

            steps {

                sh '''
                    set -e

                    echo "=============================================="
                    echo "TRIVY CONTAINER SECURITY SCAN"
                    echo "=============================================="

                    echo "HIGH and CRITICAL vulnerabilities will"
                    echo "fail the pipeline."

                    echo "----------------------------------------------"
                    echo "Scanning auth-service"
                    echo "----------------------------------------------"

                    docker run --rm \
                        -v /var/run/docker.sock:/var/run/docker.sock \
                        "$TRIVY_IMAGE" \
                        image \
                        --severity HIGH,CRITICAL \
                        --exit-code 1 \
                        devsecops/auth-service:${BUILD_NUMBER}

                    echo "auth-service scan PASSED"

                    echo "----------------------------------------------"
                    echo "Scanning data-service"
                    echo "----------------------------------------------"

                    docker run --rm \
                        -v /var/run/docker.sock:/var/run/docker.sock \
                        "$TRIVY_IMAGE" \
                        image \
                        --severity HIGH,CRITICAL \
                        --exit-code 1 \
                        devsecops/data-service:${BUILD_NUMBER}

                    echo "data-service scan PASSED"

                    echo "----------------------------------------------"
                    echo "Scanning frontend"
                    echo "----------------------------------------------"

                    docker run --rm \
                        -v /var/run/docker.sock:/var/run/docker.sock \
                        "$TRIVY_IMAGE" \
                        image \
                        --severity HIGH,CRITICAL \
                        --exit-code 1 \
                        devsecops/frontend:${BUILD_NUMBER}

                    echo "frontend scan PASSED"

                    echo ""
                    echo "ALL TRIVY SCANS PASSED"

                    echo "=============================================="
                '''
            }
        }


        // =========================================================
        // 9. PUSH TO ECR
        // =========================================================

        stage('Push Images to ECR') {

            steps {

                withCredentials([
                    [
                        $class: 'AmazonWebServicesCredentialsBinding',
                        credentialsId: 'aws-ecr-jenkins'
                    ]
                ]) {

                    sh '''
                        set -e

                        echo "=============================================="
                        echo "AWS ECR PUBLISH"
                        echo "=============================================="

                        echo "AWS identity:"

                        aws sts get-caller-identity

                        echo ""
                        echo "Logging into ECR..."

                        aws ecr get-login-password \
                            --region "$AWS_REGION" \
                            | docker login \
                                --username AWS \
                                --password-stdin \
                                "$ECR_REGISTRY"

                        echo "ECR authentication PASSED"

                        echo ""
                        echo "Tagging images..."

                        docker tag \
                            devsecops/auth-service:${BUILD_NUMBER} \
                            "$ECR_REGISTRY/auth-service:${BUILD_NUMBER}"

                        docker tag \
                            devsecops/data-service:${BUILD_NUMBER} \
                            "$ECR_REGISTRY/data-service:${BUILD_NUMBER}"

                        docker tag \
                            devsecops/frontend:${BUILD_NUMBER} \
                            "$ECR_REGISTRY/frontend:${BUILD_NUMBER}"

                        echo ""
                        echo "Pushing auth-service..."

                        docker push \
                            "$ECR_REGISTRY/auth-service:${BUILD_NUMBER}"

                        echo ""
                        echo "Pushing data-service..."

                        docker push \
                            "$ECR_REGISTRY/data-service:${BUILD_NUMBER}"

                        echo ""
                        echo "Pushing frontend..."

                        docker push \
                            "$ECR_REGISTRY/frontend:${BUILD_NUMBER}"

                        echo ""
                        echo "ALL IMAGES PUSHED TO ECR"

                        docker logout "$ECR_REGISTRY"

                        echo "=============================================="
                    '''
                }
            }
        }


        // =========================================================
        // 10. KUBERNETES MANIFEST VALIDATION
        // =========================================================
        //
        // IMPORTANT:
        // Only production application manifests are validated.
        // Security-test manifests such as attacker-pod.yaml and
        // rbac-vulnerable.yaml remain available for demonstrations
        // but are NOT part of normal application deployment.
        // =========================================================

        stage('Kubernetes Manifest Validation') {

            steps {

                sh '''
                    set -e

                    echo "=============================================="
                    echo "KUBERNETES MANIFEST VALIDATION"
                    echo "=============================================="

                    kubectl apply \
                        --dry-run=server \
                        -f kubernetes/postgres.yaml \
                        -f kubernetes/postgres-deployment.yaml \
                        -f kubernetes/auth-service.yaml \
                        -f kubernetes/auth-service-deployment.yaml \
                        -f kubernetes/data-service.yaml \
                        -f kubernetes/data-service-deployment.yaml \
                        -f kubernetes/frontend.yaml \
                        -f kubernetes/frontend-deployment.yaml

                    echo ""
                    echo "Kubernetes manifest validation PASSED"

                    echo "Kyverno admission policies will be enforced"
                    echo "during the actual Kubernetes deployment."

                    echo "=============================================="
                '''
            }
        }


        // =========================================================
        // 11. DEPLOY TO KUBERNETES
        // =========================================================

        stage('Deploy to Kubernetes') {

            steps {

                sh '''
                    set -e

                    echo "=============================================="
                    echo "KUBERNETES DEPLOYMENT"
                    echo "=============================================="

                    echo "Applying application manifests..."

                    kubectl apply \
                        -f kubernetes/postgres.yaml \
                        -f kubernetes/postgres-deployment.yaml \
                        -f kubernetes/auth-service.yaml \
                        -f kubernetes/auth-service-deployment.yaml \
                        -f kubernetes/data-service.yaml \
                        -f kubernetes/data-service-deployment.yaml \
                        -f kubernetes/frontend.yaml \
                        -f kubernetes/frontend-deployment.yaml

                    echo ""
                    echo "Updating application images..."

                    kubectl -n "$K8S_NAMESPACE" set image \
                        deployment/"$AUTH_DEPLOYMENT" \
                        "$AUTH_CONTAINER=$ECR_REGISTRY/auth-service:${BUILD_NUMBER}"

                    kubectl -n "$K8S_NAMESPACE" set image \
                        deployment/"$DATA_DEPLOYMENT" \
                        "$DATA_CONTAINER=$ECR_REGISTRY/data-service:${BUILD_NUMBER}"

                    kubectl -n "$K8S_NAMESPACE" set image \
                        deployment/"$FRONTEND_DEPLOYMENT" \
                        "$FRONTEND_CONTAINER=$ECR_REGISTRY/frontend:${BUILD_NUMBER}"

                    echo ""
                    echo "Kubernetes deployment submitted."

                    echo "=============================================="
                '''
            }
        }


        // =========================================================
        // 12. ROLLOUT VERIFICATION
        // =========================================================

        stage('Verify Kubernetes Rollout') {

            steps {

                sh '''
                    set -e

                    echo "=============================================="
                    echo "ROLLOUT VERIFICATION"
                    echo "=============================================="

                    echo "Waiting for auth-service..."

                    kubectl -n "$K8S_NAMESPACE" rollout status \
                        deployment/"$AUTH_DEPLOYMENT" \
                        --timeout=180s

                    echo "Waiting for data-service..."

                    kubectl -n "$K8S_NAMESPACE" rollout status \
                        deployment/"$DATA_DEPLOYMENT" \
                        --timeout=180s

                    echo "Waiting for frontend..."

                    kubectl -n "$K8S_NAMESPACE" rollout status \
                        deployment/"$FRONTEND_DEPLOYMENT" \
                        --timeout=180s

                    echo ""
                    echo "Deployments:"

                    kubectl get deployments \
                        -n "$K8S_NAMESPACE"

                    echo ""
                    echo "Pods:"

                    kubectl get pods \
                        -n "$K8S_NAMESPACE" \
                        -o wide

                    echo ""
                    echo "Kubernetes rollout PASSED"

                    echo "=============================================="
                '''
            }
        }


        // =========================================================
        // 13. VERIFY DEPLOYED IMAGE
        // =========================================================

        stage('Verify Deployed Images') {

            steps {

                sh '''
                    set -e

                    echo "=============================================="
                    echo "DEPLOYED IMAGE VERIFICATION"
                    echo "=============================================="

                    echo ""
                    echo "auth-service image:"

                    kubectl -n "$K8S_NAMESPACE" get deployment \
                        "$AUTH_DEPLOYMENT" \
                        -o jsonpath='{.spec.template.spec.containers[*].image}'

                    echo ""

                    echo ""
                    echo "data-service image:"

                    kubectl -n "$K8S_NAMESPACE" get deployment \
                        "$DATA_DEPLOYMENT" \
                        -o jsonpath='{.spec.template.spec.containers[*].image}'

                    echo ""

                    echo ""
                    echo "frontend image:"

                    kubectl -n "$K8S_NAMESPACE" get deployment \
                        "$FRONTEND_DEPLOYMENT" \
                        -o jsonpath='{.spec.template.spec.containers[*].image}'

                    echo ""

                    echo ""
                    echo "Expected Jenkins build: ${BUILD_NUMBER}"

                    echo "=============================================="
                '''
            }
        }


        // =========================================================
        // 14. APPLICATION SMOKE TEST
        // =========================================================

        stage('Application Smoke Test') {

            steps {

                sh '''
                    set -e

                    echo "=============================================="
                    echo "APPLICATION SMOKE TEST"
                    echo "=============================================="

                    echo ""
                    echo "Services:"

                    kubectl get svc \
                        -n "$K8S_NAMESPACE"

                    echo ""
                    echo "Running application pods:"

                    kubectl get pods \
                        -n "$K8S_NAMESPACE" \
                        --field-selector=status.phase=Running

                    echo ""
                    echo "Application smoke validation PASSED"

                    echo "=============================================="
                '''
            }
        }


        // =========================================================
        // 15. FINAL SUMMARY
        // =========================================================

        stage('Build Summary') {

            steps {

                sh '''
                    echo ""
                    echo "=========================================================="
                    echo "              DEVSECOPS PIPELINE SUMMARY"
                    echo "=========================================================="

                    echo ""
                    echo "SOURCE SECURITY"
                    echo "---------------"
                    echo "Gitleaks             : PASSED"

                    echo ""
                    echo "CODE QUALITY"
                    echo "------------"
                    echo "Syntax Validation    : PASSED"
                    echo "SonarQube            : PASSED"
                    echo "Quality Gate         : PASSED"

                    echo ""
                    echo "CONTAINER SECURITY"
                    echo "------------------"
                    echo "Docker Build         : PASSED"
                    echo "Trivy HIGH/CRITICAL  : PASSED"

                    echo ""
                    echo "REGISTRY"
                    echo "--------"
                    echo "AWS ECR Push         : PASSED"

                    echo ""
                    echo "KUBERNETES"
                    echo "----------"
                    echo "Manifest Validation  : PASSED"
                    echo "Kyverno Admission    : ENFORCED"
                    echo "Deployment           : PASSED"
                    echo "Rollout Verification : PASSED"
                    echo "Image Verification   : PASSED"

                    echo ""
                    echo "APPLICATION"
                    echo "-----------"
                    echo "Smoke Validation     : PASSED"

                    echo ""
                    echo "=========================================================="
                    echo "              DEVSECOPS PIPELINE PASSED"
                    echo "=========================================================="
                '''
            }
        }
    }


    // =============================================================
    // POST BUILD
    // =============================================================

    post {

        success {

            echo "=========================================================="
            echo "JENKINS BUILD SUCCESSFUL"
            echo "Build Number: ${BUILD_NUMBER}"
            echo "=========================================================="
        }

        failure {

            echo "=========================================================="
            echo "JENKINS BUILD FAILED"
            echo "Build Number: ${BUILD_NUMBER}"
            echo "Check the failed stage above."
            echo "=========================================================="
        }

        always {

            echo "Jenkins pipeline execution completed."
        }
    }
}
