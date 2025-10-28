#!/bin/bash
set -e

# 🚀 GLXY Gaming Platform - Production Deployment Script
# Ausführen auf dem Server: bash scripts/deploy-to-production.sh

echo "🚀 Starting deployment to glxy.at..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in project directory!"
    echo "Please cd to /opt/glxy-gaming first"
    exit 1
fi

# Step 1: Pull latest changes
echo "📥 Pulling latest changes from GitHub..."
git pull origin master
if [ $? -ne 0 ]; then
    echo "❌ Git pull failed!"
    exit 1
fi
echo "✅ Code updated"
echo ""

# Step 2: Install dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps
if [ $? -ne 0 ]; then
    echo "❌ npm install failed!"
    exit 1
fi
echo "✅ Dependencies installed"
echo ""

# Step 3: Generate Prisma Client
echo "🗄️ Generating Prisma Client..."
npx prisma generate
if [ $? -ne 0 ]; then
    echo "❌ Prisma generate failed!"
    exit 1
fi
echo "✅ Prisma Client generated"
echo ""

# Step 4: Build production
echo "🔨 Building production version..."
NODE_ENV=production npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi
echo "✅ Build completed"
echo ""

# Step 5: Restart PM2 process
echo "🔄 Restarting PM2 process..."
if command -v pm2 &> /dev/null; then
    pm2 restart glxy-gaming || pm2 start npm --name "glxy-gaming" -- start
    echo "✅ PM2 restarted"
else
    echo "⚠️ PM2 not found, skipping restart"
    echo "Please restart manually: NODE_ENV=production npm start"
fi
echo ""

# Step 6: Check status
echo "📊 Checking deployment status..."
sleep 2

if command -v pm2 &> /dev/null; then
    pm2 status glxy-gaming
fi

echo ""
echo "✅ ========================================="
echo "✅ Deployment completed successfully!"
echo "✅ ========================================="
echo ""
echo "🌐 Application should be running at:"
echo "   https://glxy.at"
echo ""
echo "📋 Next steps:"
echo "   1. Check https://glxy.at to verify"
echo "   2. Monitor logs: pm2 logs glxy-gaming"
echo "   3. Check health: curl https://glxy.at/api/health"
echo ""
