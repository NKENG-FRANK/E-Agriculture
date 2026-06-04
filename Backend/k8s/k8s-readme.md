# E-Agri Kubernetes Deployment

This directory contains the Kubernetes manifests for orchestrating the E-Agriculture Management System.

## Prerequisites

1.  A running Kubernetes cluster (Minikube, Kind, or a cloud provider like GKE/EKS).
2.  `kubectl` CLI installed and configured.
3.  Docker images built and available to the cluster (either pushed to a registry or loaded into the cluster nodes).

## Deployment Steps

1.  **Create the Namespace**:
    ```bash
    kubectl apply -f namespace.yaml
    ```

2.  **Apply Configuration**:
    ```bash
    kubectl apply -f configmap.yaml
    kubectl apply -f secrets.yaml
    ```

3.  **Deploy Infrastructure (Redis)**:
    ```bash
    kubectl apply -f redis-deployment.yaml
    ```

4.  **Deploy Microservices**:
    ```bash
    kubectl apply -f analytics-deployment.yaml
    kubectl apply -f user-management-deployment.yaml
    kubectl apply -f ai-insights-deployment.yaml
    kubectl apply -f alert-system-deployment.yaml
    ```

## Verifying the Deployment

Check the status of the pods and services:
```bash
kubectl get pods -n e-agri
kubectl get svc -n e-agri
```

## Accessing the Services

To access the services from outside the cluster (e.g., from your frontend running locally), you can use `kubectl port-forward`:

```bash
# Analytics Service
kubectl port-forward svc/analytics-service 8000:8000 -n e-agri

# User Management Service
kubectl port-forward svc/user-management-service 8001:8001 -n e-agri

# AI Insights Service
kubectl port-forward svc/ai-insights-service 8002:8002 -n e-agri

# Alert API
kubectl port-forward svc/alert-api-service 8003:8003 -n e-agri
```

## Notes on Production

- **Secrets**: In a production environment, use a secure secret management system (like HashiCorp Vault, AWS Secrets Manager, or Sealed Secrets).
- **Ingress**: For production, you should set up an Ingress Controller (like NGINX Ingress) and define Ingress resources to expose your services via a single domain.
- **Persistence**: For Redis, consider using a PersistentVolume (PV) and PersistentVolumeClaim (PVC) if you need data to survive pod restarts.
