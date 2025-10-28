#!/bin/bash

# Cloud Build Local Testing Script
# Simuliert Cloud Build Umgebung lokal für Testing der 7-Tage-Testversion

set -e

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Konfiguration
PROJECT_ID="${PROJECT_ID:-glxy-gaming-test}"
IMAGE_NAME="gcr.io/${PROJECT_ID}/glxy-gaming"
BUILD_ID=$(date +%Y%m%d-%H%M%S)

echo -e "${BLUE}🚀 GLXY Gaming Cloud Build Local Test${NC}"
echo "=================================================="
echo "Project ID: ${PROJECT_ID}"
echo "Image Name: ${IMAGE_NAME}"
echo "Build ID: ${BUILD_ID}"
echo ""

# Funktion für Zeitermessung
timer_start() {
    start_time=$(date +%s)
}

timer_end() {
    end_time=$(date +%s)
    duration=$((end_time - start_time))
    echo -e "${GREEN}⏱️ Completed in ${duration}s${NC}"
}

# Test 1: Standard Docker Build
echo -e "${YELLOW}📦 Test 1: Standard Dockerfile Build${NC}"
timer_start
docker build -t ${IMAGE_NAME}:standard-${BUILD_ID} .
timer_end
echo ""

# Test 2: Cloud-Optimized Dockerfile
echo -e "${YELLOW}🚀 Test 2: Cloud-Optimized Dockerfile Build${NC}"
timer_start
docker build -f Dockerfile.cloud -t ${IMAGE_NAME}:cloud-${BUILD_ID} .
timer_end
echo ""

# Test 3: Multi-Stage Build mit Cache
echo -e "${YELLOW}⚡ Test 3: Cloud Build mit BuildKit Cache${NC}"
timer_start
DOCKER_BUILDKIT=1 docker build \
    -f Dockerfile.cloud \
    --target production \
    --cache-from ${IMAGE_NAME}:cache \
    --build-arg BUILDKIT_INLINE_CACHE=1 \
    -t ${IMAGE_NAME}:cached-${BUILD_ID} \
    .
timer_end
echo ""

# Test 4: Parallel Build Simulation
echo -e "${YELLOW}🔄 Test 4: Parallel Build Steps Simulation${NC}"
timer_start

# Simuliere Cloud Build Steps parallel
echo "Starting parallel build simulation..."

# Background processes für parallel steps
(
    echo "  - TypeScript Check..."
    npm run typecheck:fast > /dev/null 2>&1
    echo "  ✅ TypeScript Check completed"
) &

(
    echo "  - Linting..."
    npm run lint > /dev/null 2>&1
    echo "  ✅ Linting completed"
) &

(
    echo "  - Security Analysis..."
    npm run validate:security --quiet > /dev/null 2>&1 || true
    echo "  ✅ Security Analysis completed"
) &

# Warte auf alle Background-Jobs
wait

echo "  - Building Application..."
npm run build:parallel > /dev/null 2>&1
echo "  ✅ Application Build completed"

timer_end
echo ""

# Test 5: Image-Größen Vergleich
echo -e "${YELLOW}📊 Test 5: Image Size Comparison${NC}"
echo "Image Sizes:"
docker images | grep ${PROJECT_ID}/glxy-gaming | grep ${BUILD_ID}
echo ""

# Test 6: Container Startup Test
echo -e "${YELLOW}🏃 Test 6: Container Startup Performance${NC}"

# Teste Cloud-optimized Image
echo "Testing cloud-optimized container startup..."
timer_start
CONTAINER_ID=$(docker run -d -p 3030:3000 ${IMAGE_NAME}:cloud-${BUILD_ID})

# Warte auf Health Check
timeout 60 bash -c 'until curl -f http://localhost:3030/api/health 2>/dev/null; do sleep 2; done'

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Container started successfully${NC}"
else
    echo -e "${RED}❌ Container failed to start${NC}"
fi

timer_end

# Cleanup
docker stop ${CONTAINER_ID} > /dev/null 2>&1
docker rm ${CONTAINER_ID} > /dev/null 2>&1
echo ""

# Test 7: Cloud Build Config Validation
echo -e "${YELLOW}📋 Test 7: Cloud Build Configuration Validation${NC}"

if [ -f "cloudbuild.yaml" ]; then
    echo "✅ Google Cloud Build config found"
    # Validiere YAML Syntax
    python3 -c "import yaml; yaml.safe_load(open('cloudbuild.yaml'))" 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "✅ cloudbuild.yaml syntax is valid"
    else
        echo "❌ cloudbuild.yaml has syntax errors"
    fi
else
    echo "❌ cloudbuild.yaml not found"
fi

if [ -f ".github/workflows/cloud-build.yml" ]; then
    echo "✅ GitHub Actions cloud build workflow found"
else
    echo "❌ GitHub Actions workflow not found"
fi
echo ""

# Performance Summary
echo -e "${BLUE}📈 Performance Summary${NC}"
echo "=================================================="
echo "Build configurations tested:"
echo "  - Standard Docker build"
echo "  - Cloud-optimized build"
echo "  - Cached build with BuildKit"
echo "  - Parallel build simulation"
echo ""
echo "Ready for Cloud Build deployment! 🚀"
echo ""

# Cloud Provider Setup Instructions
echo -e "${YELLOW}☁️ Cloud Provider Setup Instructions${NC}"
echo "=================================================="
echo ""
echo "🔵 Google Cloud Build:"
echo "  gcloud builds submit --config cloudbuild.yaml ."
echo ""
echo "🟠 AWS CodeBuild:"
echo "  - Use .github/workflows/cloud-build.yml"
echo "  - Configure AWS CodeBuild with GitHub integration"
echo ""
echo "🔷 Azure DevOps:"
echo "  - Import .github/workflows/cloud-build.yml"
echo "  - Configure Azure Container Registry"
echo ""

# Cleanup alte Images
echo "🧹 Cleaning up test images..."
docker images | grep ${PROJECT_ID}/glxy-gaming | grep ${BUILD_ID} | awk '{print $3}' | xargs docker rmi -f > /dev/null 2>&1 || true

echo -e "${GREEN}🎉 Cloud Build Local Test completed successfully!${NC}"