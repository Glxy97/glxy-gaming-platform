#!/bin/bash
set -e

echo "🚀 Starting GLXY Gaming Platform Deployment"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Load environment variables
if [ -f .env.production ]; then
    print_status "Loading production environment variables"
    export $(cat .env.production | grep -v '^#' | xargs)
else
    print_error ".env.production not found!"
    exit 1
fi

# Pull latest images
print_status "Pulling latest Docker images"
docker-compose -f docker-compose.prod.yml pull

# Stop existing containers
print_status "Stopping existing containers"
docker-compose -f docker-compose.prod.yml down

# Start new containers
print_status "Starting new containers"
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy
print_status "Waiting for services to be healthy..."
sleep 10

# Check if app is healthy
if docker-compose -f docker-compose.prod.yml ps | grep -q "healthy"; then
    print_status "Deployment successful! 🎉"
else
    print_warning "Services started but health check pending"
fi

# Show running containers
print_status "Running containers:"
docker-compose -f docker-compose.prod.yml ps

echo ""
print_status "Deployment completed!"
