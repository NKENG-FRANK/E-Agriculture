pipeline {
    agent any

    environment {
        KUBECONFIG = '/etc/rancher/k3s/k3s.yaml'
    }

    stages {
        stage('Build Docker Images') {
            steps {
                dir('Backend') {
                    echo 'Building Microservices Images...'
                    sh 'docker build -t e-agri/analytics-service:latest ./analytics_service'
                    sh 'docker build -t e-agri/user-management-service:latest ./user_mannagement_service'
                    sh 'docker build -t e-agri/ai-insights-service:latest ./ai_insights_service'
                    sh 'docker build -t e-agri/alert-service:latest ./alert_service'
                }
            }
        }

        stage('Import Images to K3s') {
            steps {
                echo 'Importing images into K3s container runtime...'
                // Using pipe instead of process substitution for shell compatibility
                sh 'docker save e-agri/analytics-service:latest | sudo k3s ctr images import -'
                sh 'docker save e-agri/user-management-service:latest | sudo k3s ctr images import -'
                sh 'docker save e-agri/ai-insights-service:latest | sudo k3s ctr images import -'
                sh 'docker save e-agri/alert-service:latest | sudo k3s ctr images import -'
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                dir('Backend/k8s') {
                    echo 'Verifying K3s Connection...'
                    sh 'sudo kubectl cluster-info'
                    
                    echo 'Applying Kubernetes manifests...'
                    sh 'sudo kubectl apply -f namespace.yaml'
                    sh 'sudo kubectl apply -f configmap.yaml'
                    sh 'sudo kubectl apply -f redis-deployment.yaml'
                    sh 'sudo kubectl apply -f analytics-deployment.yaml'
                    sh 'sudo kubectl apply -f user-management-deployment.yaml'
                    sh 'sudo kubectl apply -f ai-insights-deployment.yaml'
                    sh 'sudo kubectl apply -f alert-system-deployment.yaml'
                }
            }
        }

        stage('Verify Deployment') {
            steps {
                echo 'Checking Pod Status...'
                sh 'sudo kubectl get pods -n e-agri'
            }
        }
    }

    post {
        success {
            echo 'SFMS successfully launched on Kubernetes!'
        }
        failure {
            echo 'Kubernetes deployment failed. Check K3s logs.'
        }
    }
}
