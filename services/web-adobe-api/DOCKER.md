# Docker Deployment - Web-Adobe API

## Docker Architecture

This service uses a multi-stage Docker build to optimize image size and security:

```
Stage 1: deps      (Build dependencies with system packages)
   └─> Stage 2: runner  (Minimal runtime with only necessary packages)
```

## Image Details

**Base Image:** `python:3.11-slim`

**Installed System Packages:**
- Tesseract OCR (eng, deu)
- PyMuPDF (mupdf-tools)
- Image processing libraries (libjpeg, libpng, libtiff)
- PostgreSQL client libraries

**Security:**
- Runs as non-root user `webadobe` (UID 1001)
- Multi-stage build reduces attack surface
- No unnecessary build tools in final image

## Building the Image

### Local Build

```bash
cd services/web-adobe-api

# Build with default tag
docker build -t web-adobe-api:latest .

# Build with custom tag
docker build -t web-adobe-api:v1.0.0 .

# Build without cache
docker build --no-cache -t web-adobe-api:latest .
```

### Build via Docker Compose

```bash
# From project root
docker-compose build web-adobe-api

# Build with no cache
docker-compose build --no-cache web-adobe-api
```

## Running the Container

### Standalone Container

```bash
docker run -d \
  --name web-adobe-api \
  -p 8000:8000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/db" \
  -e REDIS_URL="redis://host:6379/1" \
  -e AI_PROVIDER="openai" \
  -e AI_API_KEY="sk-your-key" \
  -v pdf_storage:/app/var/storage \
  -v pdf_uploads:/app/var/uploads \
  web-adobe-api:latest
```

### With Docker Compose

```bash
# Start all services
docker-compose up -d

# Start only Web-Adobe services
docker-compose up -d web-adobe-api web-adobe-worker

# View logs
docker-compose logs -f web-adobe-api

# Stop services
docker-compose stop web-adobe-api web-adobe-worker
```

## Environment Variables

### Required

```bash
DATABASE_URL=postgresql://user:pass@db:5432/glxy_gaming
REDIS_URL=redis://redis:6379/1
AI_PROVIDER=openai
AI_API_KEY=sk-your-openai-key
```

### Optional

```bash
# Application
APP_NAME="Web Adobe Backend"
ENVIRONMENT=production
DEBUG=false

# CORS
ALLOWED_ORIGINS='["https://glxy.at"]'

# Storage
STORAGE_DIR=/app/var/storage
UPLOAD_DIR=/app/var/uploads

# AI
AI_MODEL=gpt-4

# DataPad
DATAPAD_BASE_URL=https://datapad.example.com
DATAPAD_API_KEY=your-key
```

## Volumes

The container uses two persistent volumes:

### PDF Storage (`pdf_storage`)
- **Mount:** `/app/var/storage`
- **Purpose:** Long-term storage of processed PDFs
- **Permissions:** Read/Write for user `webadobe`

### PDF Uploads (`pdf_uploads`)
- **Mount:** `/app/var/uploads`
- **Purpose:** Temporary storage for uploaded files
- **Permissions:** Read/Write for user `webadobe`

### Creating Volumes

```bash
# Create manually
docker volume create glxy-gaming_pdf_storage
docker volume create glxy-gaming_pdf_uploads

# Or via Docker Compose (automatic)
docker-compose up -d
```

### Volume Inspection

```bash
# List volumes
docker volume ls | grep glxy-gaming

# Inspect volume
docker volume inspect glxy-gaming_pdf_storage

# View contents
docker run --rm -v glxy-gaming_pdf_storage:/data alpine ls -la /data
```

## Health Checks

The container includes built-in health checks:

```yaml
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1
```

### Manual Health Check

```bash
# From host
curl http://localhost:8000/health

# Inside container
docker exec web-adobe-api curl -f http://localhost:8000/health

# Check health status
docker inspect --format='{{.State.Health.Status}}' web-adobe-api
```

## Container Management

### Logs

```bash
# View logs
docker logs web-adobe-api

# Follow logs
docker logs -f web-adobe-api

# Last 100 lines
docker logs --tail=100 web-adobe-api

# With timestamps
docker logs -f --timestamps web-adobe-api
```

### Shell Access

```bash
# Interactive shell
docker exec -it web-adobe-api bash

# Run command
docker exec web-adobe-api python -c "import fitz; print(fitz.__version__)"

# Check Tesseract
docker exec web-adobe-api tesseract --version
```

### Resource Monitoring

```bash
# Real-time stats
docker stats web-adobe-api

# Container info
docker inspect web-adobe-api

# Processes
docker top web-adobe-api
```

## Celery Worker Container

The worker uses the same image but with different command:

### Start Worker

```bash
# Via Docker Compose
docker-compose up -d web-adobe-worker

# Standalone
docker run -d \
  --name web-adobe-worker \
  -e DATABASE_URL="..." \
  -e REDIS_URL="..." \
  -v pdf_storage:/app/var/storage \
  web-adobe-api:latest \
  celery -A app.services.task_queue.celery_app worker --loglevel=info
```

### Worker Management

```bash
# Check worker status
docker exec web-adobe-worker celery -A app.services.task_queue.celery_app inspect ping

# Active tasks
docker exec web-adobe-worker celery -A app.services.task_queue.celery_app inspect active

# Registered tasks
docker exec web-adobe-worker celery -A app.services.task_queue.celery_app inspect registered
```

## Networking

### Docker Compose Network

All services communicate via `glxy-network`:

```yaml
networks:
  glxy-network:
    driver: bridge
```

### Service Discovery

Services resolve each other by name:
- `web-adobe-api` → API service
- `db` → PostgreSQL
- `redis` → Redis cache

### Port Mapping

```yaml
web-adobe-api:
  ports:
    - "8000:8000"  # External:Internal
```

Access:
- Internal (container-to-container): `http://web-adobe-api:8000`
- External (host): `http://localhost:8000`
- Production (via Nginx): `https://glxy.at/web-adobe/api`

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker logs web-adobe-api

# Check environment
docker exec web-adobe-api env

# Validate config
docker-compose config
```

### Permission Issues

```bash
# Check volume permissions
docker run --rm -v glxy-gaming_pdf_storage:/data alpine ls -la /data

# Fix permissions (if needed)
docker run --rm -v glxy-gaming_pdf_storage:/data alpine chown -R 1001:1001 /data
```

### Dependencies Not Available

```bash
# Check PostgreSQL
docker exec web-adobe-api pg_isready -h db -p 5432

# Check Redis
docker exec web-adobe-api redis-cli -h redis ping
```

### Build Failures

```bash
# Clear build cache
docker builder prune

# Rebuild from scratch
docker-compose build --no-cache web-adobe-api
```

## Performance Tuning

### Resource Limits

Edit `docker-compose.yml`:

```yaml
web-adobe-api:
  deploy:
    resources:
      limits:
        cpus: '2'
        memory: 2G
      reservations:
        cpus: '1'
        memory: 1G
```

### Worker Concurrency

```yaml
web-adobe-worker:
  command: ["celery", "-A", "app.services.task_queue.celery_app", "worker", "--concurrency=4"]
```

### Uvicorn Workers

Update Dockerfile CMD:

```dockerfile
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

## Security

### User Isolation

Container runs as non-root:
- User: `webadobe`
- UID: `1001`
- Home: `/home/webadobe`

### Secrets Management

```bash
# Use Docker secrets
echo "sk-your-api-key" | docker secret create ai_api_key -

# Reference in compose
services:
  web-adobe-api:
    secrets:
      - ai_api_key
```

### Read-Only Filesystem (Optional)

```yaml
web-adobe-api:
  read_only: true
  tmpfs:
    - /tmp
    - /app/var/uploads
```

## Maintenance

### Update Image

```bash
# Build new version
docker-compose build web-adobe-api

# Stop old container
docker-compose stop web-adobe-api

# Start with new image
docker-compose up -d web-adobe-api

# Clean old images
docker image prune
```

### Backup Volumes

```bash
# Backup storage
docker run --rm \
  -v glxy-gaming_pdf_storage:/source \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/storage-$(date +%Y%m%d).tar.gz -C /source .

# Restore storage
docker run --rm \
  -v glxy-gaming_pdf_storage:/target \
  -v $(pwd)/backups:/backup \
  alpine tar xzf /backup/storage-20251007.tar.gz -C /target
```

### Clean Up

```bash
# Remove container
docker-compose down web-adobe-api

# Remove container and volumes
docker-compose down -v

# Remove images
docker rmi web-adobe-api:latest

# System cleanup
docker system prune -a
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build and Push Docker Image

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build image
        run: docker build -t web-adobe-api:${{ github.sha }} services/web-adobe-api

      - name: Push to registry
        run: docker push web-adobe-api:${{ github.sha }}
```

## Production Deployment

### Image Registry

```bash
# Tag for registry
docker tag web-adobe-api:latest registry.example.com/web-adobe-api:latest

# Push to registry
docker push registry.example.com/web-adobe-api:latest

# Pull on production server
docker pull registry.example.com/web-adobe-api:latest
```

### Rolling Update

```bash
# Build new image
docker-compose build web-adobe-api

# Update with zero downtime
docker-compose up -d --no-deps --build web-adobe-api
```

## Support

- **Dockerfile**: `services/web-adobe-api/Dockerfile`
- **Compose File**: `docker-compose.yml`
- **Deployment Guide**: `docs/DEPLOYMENT-WEB-ADOBE.md`
- **Quick Start**: `docs/QUICKSTART-WEB-ADOBE.md`
