pipeline {
    agent any

    environment {
        // Environment variables for the pipeline
        BUN_PATH = "/usr/local/bin/bun" // Adjust this to your server's Bun path
    }

    stages {
        stage('Checkout') {
            steps {
                // Pulls the latest code from the configured SCM
                checkout scm
            }
        }

        stage('Backend - Install Dependencies') {
            steps {
                dir('Backend') {
                    echo 'Installing Backend dependencies...'
                    sh 'python -m pip install --upgrade pip'
                    sh 'pip install -r requirements.txt'
                }
            }
        }

        stage('Frontend - Install & Build') {
            steps {
                dir('Frontend') {
                    echo 'Installing Frontend dependencies & Building...'
                    // Ensure Bun is in the path or use absolute path
                    sh 'bun install'
                    sh 'bun run build'
                }
            }
        }

        stage('Backend - Run Tests') {
            steps {
                dir('Backend') {
                    echo 'Running Backend tests...'
                    // Runs pytest (will look for tests/ directory or test_*.py files)
                    sh 'pytest'
                }
            }
        }

        stage('Deployment - Preview') {
            steps {
                echo 'Deployment stage - ready for production staging'
                // Add deployment logic here (e.g., Cloudflare Pages, Docker, etc.)
            }
        }
    }

    post {
        always {
            echo 'Pipeline execution finished.'
        }
        success {
            echo 'Build and Tests passed successfully!'
        }
        failure {
            echo 'Pipeline failed. Please check the logs.'
        }
    }
}
