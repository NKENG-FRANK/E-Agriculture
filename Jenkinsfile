pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                git 'https://github.com/NKENG-FRANK/E-Agriculture.git'
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'pip install -r requirements.txt'
            }
        }

        stage('Run Tests') {
            steps {
                sh 'pytest'
            }
        }

        stage('Run App') {
            steps {
                sh 'uvicorn main:app --host 0.0.0.0 --port 8000 &'
            }
        }
    }
}
