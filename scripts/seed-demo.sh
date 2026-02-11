#!/bin/bash
set -euo pipefail

ENVIRONMENT=${1:-staging}

echo "🌱 Seeding demo data for ${ENVIRONMENT}..."

aws eks update-kubeconfig --name "medix-${ENVIRONMENT}" --region us-east-1

kubectl delete job medix-db-seed -n medix --ignore-not-found

kubectl apply -f infra/k8s/db-migration-job.yaml

echo "⏳ Waiting for seed job..."
kubectl wait --for=condition=complete job/medix-db-seed -n medix --timeout=120s

echo "✅ Seed complete!"
echo ""
echo "🔐 Demo Credentials:"
echo "   Admin:   admin@medix.hospital / Demo@2024!"
echo "   Doctor:  dr.lee@medix.hospital / Demo@2024!"
echo "   Patient: jane.doe@demo.com / Demo@2024!"