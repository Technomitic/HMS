#!/bin/bash
set -euo pipefail

ENVIRONMENT=${1:-staging}
IMAGE_TAG=${2:-latest}

echo "🏥 Deploying Medix to ${ENVIRONMENT}..."
echo "   Image tag: ${IMAGE_TAG}"

# Update kubeconfig
echo "📦 Configuring kubectl..."
aws eks update-kubeconfig --name "medix-${ENVIRONMENT}" --region us-east-1

# Apply namespace
kubectl apply -f infra/k8s/namespace.yaml

# Apply secrets (ensure they're updated)
kubectl apply -f infra/k8s/secrets.yaml

# Run migrations
echo "🔄 Running database migrations..."
kubectl delete job medix-db-migrate -n medix --ignore-not-found
cat infra/k8s/db-migration-job.yaml | \
  sed "s|ghcr.io/medix/api:latest|ghcr.io/medix/api:${IMAGE_TAG}|g" | \
  kubectl apply -f -
kubectl wait --for=condition=complete job/medix-db-migrate -n medix --timeout=120s

# Deploy API
echo "🚀 Deploying API..."
kubectl set image deployment/medix-api api="ghcr.io/medix/api:${IMAGE_TAG}" -n medix 2>/dev/null || \
  cat infra/k8s/api-deployment.yaml | \
    sed "s|ghcr.io/medix/api:latest|ghcr.io/medix/api:${IMAGE_TAG}|g" | \
    kubectl apply -f -

# Deploy Web
echo "🌐 Deploying Web..."
kubectl set image deployment/medix-web web="ghcr.io/medix/web:${IMAGE_TAG}" -n medix 2>/dev/null || \
  cat infra/k8s/web-deployment.yaml | \
    sed "s|ghcr.io/medix/web:latest|ghcr.io/medix/web:${IMAGE_TAG}|g" | \
    kubectl apply -f -

# Apply ingress
kubectl apply -f infra/k8s/ingress.yaml

# Wait for rollout
echo "⏳ Waiting for rollout..."
kubectl rollout status deployment/medix-api -n medix --timeout=180s
kubectl rollout status deployment/medix-web -n medix --timeout=180s

# Health check
echo "🏥 Running health check..."
API_POD=$(kubectl get pods -n medix -l app=medix-api -o jsonpath='{.items[0].metadata.name}')
kubectl exec -n medix "${API_POD}" -- wget -qO- http://localhost:4000/api/v1/health || true

echo "✅ Deployment complete!"
echo ""
echo "   Web: https://medix.hospital"
echo "   API: https://api.medix.hospital"
echo "   Docs: https://api.medix.hospital/docs"