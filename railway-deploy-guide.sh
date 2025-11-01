#!/bin/bash

# Railway CLI Deployment Guide for LOSIA Store
# Run this script step by step

set -e  # Exit on error

echo "🚀 Railway CLI Deployment Guide"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Install Railway CLI
echo -e "${BLUE}Step 1: Install Railway CLI${NC}"
echo "Run this command manually:"
echo -e "${YELLOW}sudo npm i -g @railway/cli${NC}"
echo ""
read -p "Press Enter after installing Railway CLI..."

# Step 2: Login to Railway
echo -e "${BLUE}Step 2: Login to Railway${NC}"
echo "This will open browser for authentication"
railway login
echo -e "${GREEN}✓ Logged in successfully${NC}"
echo ""

# Step 3: Create new project
echo -e "${BLUE}Step 3: Create Railway Project${NC}"
echo "Creating new project..."
railway init
echo -e "${GREEN}✓ Project created${NC}"
echo ""

# Step 4: Add PostgreSQL
echo -e "${BLUE}Step 4: Add PostgreSQL Database${NC}"
echo "Go to Railway Dashboard and:"
echo "1. Click 'New' → 'Database' → 'PostgreSQL'"
echo "2. Wait for database to provision"
echo "3. Copy DATABASE_URL from Variables tab"
echo ""
read -p "Press Enter after adding PostgreSQL..."

# Step 5: Deploy Backend
echo -e "${BLUE}Step 5: Deploy Backend${NC}"
cd backend

echo "Creating backend service..."
railway service create backend

echo "Setting environment variables..."
railway variables set NODE_ENV=production
railway variables set PORT=3001
railway variables set JWT_EXPIRES_IN=7d

# Generate JWT secret
JWT_SECRET=$(openssl rand -base64 32)
railway variables set JWT_SECRET="$JWT_SECRET"
echo -e "${GREEN}✓ JWT_SECRET generated: $JWT_SECRET${NC}"

echo "Enter your PostgreSQL DATABASE_URL:"
read -p "DATABASE_URL: " DATABASE_URL
railway variables set DATABASE_URL="$DATABASE_URL"

echo "Deploying backend..."
railway up

echo "Getting backend URL..."
BACKEND_URL=$(railway domain)
echo -e "${GREEN}✓ Backend deployed at: $BACKEND_URL${NC}"
echo ""

cd ..

# Step 6: Deploy Frontend Admin
echo -e "${BLUE}Step 6: Deploy Frontend Admin${NC}"
cd frontend

echo "Creating frontend service..."
railway service create frontend

echo "Setting environment variables..."
railway variables set NODE_ENV=production
railway variables set PORT=3000
railway variables set NUXT_PUBLIC_API_URL="https://$BACKEND_URL"

echo "Deploying frontend..."
railway up

echo "Getting frontend URL..."
FRONTEND_URL=$(railway domain)
echo -e "${GREEN}✓ Frontend deployed at: $FRONTEND_URL${NC}"
echo ""

cd ..

# Step 7: Deploy UI Commerce
echo -e "${BLUE}Step 7: Deploy UI Commerce${NC}"
cd ui-commerce

echo "Creating ui-commerce service..."
railway service create ui-commerce

echo "Setting environment variables..."
railway variables set NODE_ENV=production
railway variables set PORT=3002
railway variables set NEXT_PUBLIC_API_URL="https://$BACKEND_URL"

echo "Deploying ui-commerce..."
railway up

echo "Getting ui-commerce URL..."
UI_COMMERCE_URL=$(railway domain)
railway variables set NEXT_PUBLIC_SITE_URL="https://$UI_COMMERCE_URL"

echo -e "${GREEN}✓ UI Commerce deployed at: $UI_COMMERCE_URL${NC}"
echo ""

cd ..

# Step 8: Update Backend CORS
echo -e "${BLUE}Step 8: Update Backend CORS${NC}"
cd backend

CORS_ORIGIN="https://$FRONTEND_URL,https://$UI_COMMERCE_URL"
railway variables set CORS_ORIGIN="$CORS_ORIGIN"

echo "Redeploying backend with CORS settings..."
railway up

echo -e "${GREEN}✓ Backend CORS updated${NC}"
echo ""

cd ..

# Summary
echo ""
echo "================================"
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo "================================"
echo ""
echo "Your services are deployed at:"
echo -e "${BLUE}Backend:${NC}      https://$BACKEND_URL"
echo -e "${BLUE}Frontend:${NC}     https://$FRONTEND_URL"
echo -e "${BLUE}UI Commerce:${NC}  https://$UI_COMMERCE_URL"
echo ""
echo "Next steps:"
echo "1. Run database migrations:"
echo "   cd backend && railway run npm run migration:run"
echo ""
echo "2. Seed initial data (optional):"
echo "   cd backend && railway run npm run seed"
echo ""
echo "3. Monitor logs:"
echo "   railway logs --service backend"
echo ""
echo "4. Open Railway Dashboard:"
echo "   railway open"
echo ""

