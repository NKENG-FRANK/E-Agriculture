pipeline {
    agent any

    environment {
        DOCKER_COMPOSE = 'docker-compose'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Backend - Build & Deploy') {
            steps {
                dir('Backend') {
                    echo 'Building and starting Backend Microservices...'
                    // Build and restart containers in detached mode
                    sh "${DOCKER_COMPOSE} up -d --build"
                }
            }
        }

        stage('Frontend - Install & Build') {
            steps {
                dir('Frontend') {
                    echo 'Building Frontend Production Assets...'
                    // Using npm as it is standard, but you can use bun if installed on Jenkins agent
                    sh 'npm install'
                    sh 'npm run build'
                }
            }
        }

        stage('Health Check') {
            steps {
                echo 'Verifying services are reachable...'
                // Wait a few seconds for services to initialize
                sleep 5
                sh 'curl -f http://localhost:8000/health || exit 1'
                sh 'curl -f http://localhost:8001/health || exit 1'
            }
        }
    }

    post {
        always {
            echo 'Cleanup and notification...'
        }
        success {
            echo 'SFMS deployed successfully to VPS!'
        }
        failure {
            echo 'Deployment failed. Check logs and container status.'
        }
    }
}
