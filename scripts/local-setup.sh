#!/bin/bash
set -euo pipefail

echo "🏥 Setting up Medix local development environment..."

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "❌ Node.js required"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "❌ Docker required"; exit 1; }

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Start infrastructure
echo "🐳 Starting Docker services..."
docker-compose up -d postgres redis rabbitmq

echo "⏳ Waiting for services..."
sleep 5

# Setup API environment
echo "🔧 Setting up API..."
cp apps/api/.env.local apps/api/.env 2>/dev/null || true

# Run migrations
echo "🔄 Running migrations..."
cd apps/api
npx prisma migrate dev --name init
npx prisma generate

# Seed data
echo "🌱 Seeding database..."
npx prisma db seed
cd ../..

echo ""
echo "✅ Setup complete! Run these commands:"
echo ""
echo "   npm run dev          # Start all services"
echo ""
echo "   Web:  http://localhost:3000"
echo "   API:  http://localhost:4000"
echo "   Docs: http://localhost:4000/docs"
echo "   RabbitMQ: http://localhost:15672"
echo ""
echo "🔐 Credentials:"
echo "   Admin:   admin@medix.hospital / Demo@2024!"
echo "   Doctor:  dr.lee@medix.hospital / Demo@2024!"
echo "   Patient: jane.doe@demo.com / Demo@2024!"