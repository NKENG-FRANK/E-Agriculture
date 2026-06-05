# E-Agri Kubernetes Orchestration with Monitoring

This guide covers the full setup of the E-Agriculture Management System on a single VPS using K3s (lightweight Kubernetes) and Grafana for monitoring.

## 1. Install K3s on VPS
Run this command on your VPS to install Kubernetes:
```bash
curl -sfL https://get.k3s.io | sh -
# Verify installation
sudo kubectl get nodes
```

## 2. Build and Prepare Images
Since you are on a VPS, you need to build the Docker images and make them available to K3s:
```bash
cd ~/Desktop/E-Agriculture/Backend

# Build each service
docker build -t e-agri/analytics-service:latest ./analytics_service
docker build -t e-agri/user-management-service:latest ./user_mannagement_service
docker build -t e-agri/ai-insights-service:latest ./ai_insights_service
docker build -t e-agri/alert-service:latest ./alert_service

# Import images into K3s (so it doesn't try to pull from a registry)
sudo k3s ctr images import <(docker save e-agri/analytics-service:latest)
sudo k3s ctr images import <(docker save e-agri/user-management-service:latest)
sudo k3s ctr images import <(docker save e-agri/ai-insights-service:latest)
sudo k3s ctr images import <(docker save e-agri/alert-service:latest)
```

## 3. Deploy the System
Move into the `k8s` folder and apply the manifests:
```bash
cd ~/Desktop/E-Agriculture/Backend/k8s

# A. Create Namespace
sudo kubectl apply -f namespace.yaml

# B. Setup Secrets (MANUAL STEP)
# Create a secrets.yaml file based on secrets.yaml.template with your REAL keys
# Then apply it:
sudo kubectl apply -f secrets.yaml
sudo kubectl apply -f configmap.yaml

# C. Deploy Infrastructure & Services
sudo kubectl apply -f redis-deployment.yaml
sudo kubectl apply -f analytics-deployment.yaml
sudo kubectl apply -f user-management-deployment.yaml
sudo kubectl apply -f ai-insights-deployment.yaml
sudo kubectl apply -f alert-system-deployment.yaml

# D. Deploy Monitoring (Prometheus & Grafana)
sudo kubectl apply -f monitoring.yaml
```

## 4. Accessing the Dashboard
- **Grafana**: Accessible at `http://<your-vps-ip>:32000`
  - Default login: `admin` / `admin`
  - After login, add Prometheus as a data source (`http://prometheus-service:8080`).
- **APIs**: You can use NodePort or Ingress to expose the APIs publicly. Currently, they are internal to the cluster.

## 5. Verification
```bash
sudo kubectl get pods -n e-agri
```
Wait until all pods show `Running`.
