#!/bin/bash

# Script to deploy all 3 services to Railway
# Usage: ./deploy-railway.sh

echo "🚀 Deploying LOSIA Store to Railway..."

# Install Railway CLI if not installed
if ! command -v railway &> /dev/null
then
    echo "📦 Installing Railway CLI..."
    npm i -g @railway/cli
fi

# Login to Railway
echo "🔐 Login to Railway..."
railway login

# Create new project or link existing
echo "📁 Link to Railway project..."
railway link

# Deploy Backend
echo "🔧 Deploying Backend..."
cd backend
railway up --service backend
cd ..

# Deploy Frontend Admin
echo "🎨 Deploying Frontend Admin..."
cd frontend
railway up --service frontend
cd ..

# Deploy UI Commerce
echo "🛍️ Deploying UI Commerce..."
cd ui-commerce
railway up --service ui-commerce
cd ..

echo "✅ All services deployed successfully!"
echo "🌐 Check your Railway dashboard for URLs"

