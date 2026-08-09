pipeline {

    agent any

    environment {
        GITLEAKS_IMAGE = 'ghcr.io/gitleaks/gitleaks:v8.30.0'
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

                    docker build \
                        -t devsecops/auth-service:${BUILD_NUMBER} \
                        ./app/auth-service

                    docker build \
                        -t devsecops/data-service:${BUILD_NUMBER} \
                        ./app/data-service

                    docker build \
                        -t devsecops/frontend:${BUILD_NUMBER} \
                        ./app/frontend
                '''
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
            echo 'CI baseline with containerized secret scanning completed successfully.'
        }

        failure {
            echo 'CI pipeline failed. Review the failed stage.'
        }
    }
}
