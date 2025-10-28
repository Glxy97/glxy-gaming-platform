#!/bin/bash

# ============================================
# Web-Adobe Service Deployment Script
# ============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}Web-Adobe Service Deployment${NC}"
echo -e "${GREEN}======================================${NC}"

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found!${NC}"
    echo -e "${YELLOW}Please copy .env.example to .env and configure it.${NC}"
    exit 1
fi

# Load environment variables
set -a
source .env
set +a

# Validate required environment variables
REQUIRED_VARS=(
    "DATABASE_URL"
    "REDIS_PASSWORD"
    "AI_PROVIDER"
    "AI_API_KEY"
)

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}Error: Required environment variable $var is not set!${NC}"
        exit 1
    fi
done

echo -e "${GREEN}Step 1: Building Web-Adobe API image...${NC}"
docker-compose build web-adobe-api

echo -e "${GREEN}Step 2: Building Web-Adobe Worker image...${NC}"
docker-compose build web-adobe-worker

echo -e "${GREEN}Step 3: Creating volumes...${NC}"
docker volume create glxy-gaming_pdf_storage || true
docker volume create glxy-gaming_pdf_uploads || true

echo -e "${GREEN}Step 4: Starting services...${NC}"
docker-compose up -d web-adobe-api web-adobe-worker

echo -e "${GREEN}Step 5: Waiting for services to be healthy...${NC}"
timeout=60
elapsed=0
while [ $elapsed -lt $timeout ]; do
    if docker ps | grep glxy-web-adobe-api | grep -q "healthy"; then
        echo -e "${GREEN}Web-Adobe API is healthy!${NC}"
        break
    fi
    echo -e "${YELLOW}Waiting for Web-Adobe API to be healthy... ($elapsed/$timeout)${NC}"
    sleep 5
    elapsed=$((elapsed + 5))
done

if [ $elapsed -ge $timeout ]; then
    echo -e "${RED}Error: Web-Adobe API failed to become healthy within $timeout seconds${NC}"
    docker-compose logs web-adobe-api
    exit 1
fi

echo -e "${GREEN}Step 6: Verifying service endpoints...${NC}"
curl -f http://localhost:8000/health || {
    echo -e "${RED}Error: Health check failed!${NC}"
    docker-compose logs web-adobe-api
    exit 1
}

echo -e "${GREEN}Step 7: Checking Celery worker status...${NC}"
docker exec glxy-web-adobe-worker celery -A app.services.task_queue.celery_app inspect ping || {
    echo -e "${RED}Error: Celery worker is not responding!${NC}"
    docker-compose logs web-adobe-worker
    exit 1
}

echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""
echo -e "${GREEN}Service URLs:${NC}"
echo -e "  API:     http://localhost:8000"
echo -e "  Health:  http://localhost:8000/health"
echo -e "  Docs:    http://localhost:8000/api/docs"
echo ""
echo -e "${GREEN}Useful commands:${NC}"
echo -e "  View logs:         docker-compose logs -f web-adobe-api"
echo -e "  View worker logs:  docker-compose logs -f web-adobe-worker"
echo -e "  Restart services:  docker-compose restart web-adobe-api web-adobe-worker"
echo -e "  Stop services:     docker-compose stop web-adobe-api web-adobe-worker"
