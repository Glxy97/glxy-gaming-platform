# Web-Adobe Integration - Quick Start Guide

## 5-Minute Setup

### 1. Prerequisites Check

```bash
# Verify Docker and Docker Compose
docker --version    # Should be >= 20.10
docker-compose --version  # Should be >= 1.29

# Clone repository (if not already done)
cd G:\website\verynew\glxy-gaming
```

### 2. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env and set REQUIRED variables:
# - AI_PROVIDER=openai
# - AI_API_KEY=sk-your-key-here
# - REDIS_PASSWORD=your-secure-password
# - DATABASE_URL=postgresql://user:pass@db:5432/glxy_gaming
```

**Minimal `.env` for testing:**

```env
# Database
DATABASE_URL=postgresql://glxy_user:secure_password_2024@db:5432/glxy_gaming
POSTGRES_USER=glxy_user
POSTGRES_PASSWORD=secure_password_2024

# Redis
REDIS_PASSWORD=redis_secure_2024

# AI Provider
AI_PROVIDER=openai
AI_API_KEY=sk-your-openai-key-here
AI_MODEL=gpt-4
```

### 3. Start Services

```bash
# Start all services (includes PostgreSQL, Redis, Nginx)
docker-compose up -d

# Or start only Web-Adobe services
docker-compose up -d db redis web-adobe-api web-adobe-worker
```

### 4. Verify Deployment

```bash
# Check all containers are running
docker-compose ps

# Expected output:
# glxy-web-adobe-api    running (healthy)
# glxy-web-adobe-worker running (healthy)
# glxy-db               running (healthy)
# glxy-redis            running (healthy)

# Test health endpoint
curl http://localhost:8000/health
# Expected: {"status":"ok"}

# Test Celery worker
docker exec glxy-web-adobe-worker celery -A app.services.task_queue.celery_app inspect ping
# Expected: {"celery@hostname": {"ok": "pong"}}
```

### 5. Access Services

- **API Documentation**: http://localhost:8000/api/docs
- **Health Check**: http://localhost:8000/health
- **Production URL**: https://glxy.at/web-adobe/api/

## Basic Usage Examples

### Upload and Process PDF

```bash
# Upload PDF
curl -X POST http://localhost:8000/api/pdfs/upload \
  -F "file=@/path/to/document.pdf" \
  -F "extract_text=true" \
  -F "extract_images=true"

# Response:
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "filename": "document.pdf",
  "status": "processing",
  "created_at": "2025-10-07T10:00:00Z"
}
```

### Check Processing Status

```bash
# Get PDF status
curl http://localhost:8000/api/pdfs/123e4567-e89b-12d3-a456-426614174000

# Response:
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "status": "completed",
  "text_content": "...",
  "image_count": 5,
  "page_count": 10
}
```

### AI-Powered Analysis (Optional)

```bash
# Analyze PDF with AI
curl -X POST http://localhost:8000/api/pdfs/123e4567-e89b-12d3-a456-426614174000/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "analysis_type": "summary",
    "options": {
      "max_length": 500
    }
  }'
```

## Troubleshooting

### Problem: Container fails to start

```bash
# Check logs
docker-compose logs web-adobe-api

# Common issues:
# 1. Missing environment variables
docker-compose config  # Validate config

# 2. Port conflicts
lsof -i :8000  # Check if port is in use

# 3. Database not ready
docker-compose up -d db  # Start DB first
sleep 10
docker-compose up -d web-adobe-api
```

### Problem: Worker not processing tasks

```bash
# Check worker logs
docker-compose logs web-adobe-worker

# Verify Redis connection
docker exec glxy-web-adobe-worker env | grep CELERY_BROKER_URL

# Restart worker
docker-compose restart web-adobe-worker
```

### Problem: PDF processing fails

```bash
# Check Tesseract installation
docker exec glxy-web-adobe-api tesseract --version

# Check PyMuPDF
docker exec glxy-web-adobe-api python -c "import fitz; print('PyMuPDF OK')"

# Check storage permissions
docker exec glxy-web-adobe-api ls -la /app/var/storage
```

## Development Workflow

### Local Development

```bash
# Start services in development mode
docker-compose up web-adobe-api web-adobe-worker

# Watch logs
docker-compose logs -f web-adobe-api web-adobe-worker

# Run tests inside container
docker exec glxy-web-adobe-api pytest

# Access Python shell
docker exec -it glxy-web-adobe-api python
```

### Code Changes

```bash
# Rebuild after code changes
docker-compose build web-adobe-api

# Restart services
docker-compose restart web-adobe-api web-adobe-worker

# Or use --build flag
docker-compose up -d --build web-adobe-api
```

### Database Migrations

```bash
# Create migration
docker exec glxy-web-adobe-api alembic revision --autogenerate -m "Add new field"

# Apply migrations
docker exec glxy-web-adobe-api alembic upgrade head

# Rollback
docker exec glxy-web-adobe-api alembic downgrade -1
```

## Production Deployment

### Hetzner Cloud Deployment

```bash
# SSH into server
ssh root@your-hetzner-server.com

# Clone repository
git clone https://github.com/your-org/glxy-gaming.git
cd glxy-gaming

# Configure environment
cp .env.example .env
nano .env  # Edit production values

# Setup SSL
sudo certbot certonly --nginx -d glxy.at
sudo cp /etc/letsencrypt/live/glxy.at/fullchain.pem ./ssl/glxy.at.crt
sudo cp /etc/letsencrypt/live/glxy.at/privkey.pem ./ssl/glxy.at.key

# Deploy
docker-compose up -d

# Verify
curl https://glxy.at/web-adobe/health
```

### Environment Variables for Production

```env
# Production Settings
ENVIRONMENT=production
DEBUG=false

# Secure URLs
NEXT_PUBLIC_APP_URL=https://glxy.at
NEXT_PUBLIC_WEB_ADOBE_API_URL=https://glxy.at/web-adobe/api

# Strong passwords
REDIS_PASSWORD=$(openssl rand -base64 32)
POSTGRES_PASSWORD=$(openssl rand -base64 32)

# Production database (managed)
DATABASE_URL=postgresql://user:pass@your-db-host:5432/glxy_gaming?sslmode=require

# AI Provider
AI_PROVIDER=openai
AI_API_KEY=sk-prod-key-here

# Monitoring
SENTRY_DSN=https://your-sentry-dsn
```

## Monitoring and Maintenance

### View Logs

```bash
# Follow all logs
docker-compose logs -f

# Specific service
docker-compose logs -f web-adobe-api

# Last 100 lines
docker-compose logs --tail=100 web-adobe-api
```

### Resource Monitoring

```bash
# Container stats
docker stats

# Specific containers
docker stats glxy-web-adobe-api glxy-web-adobe-worker
```

### Backup Strategy

```bash
# Backup PDF storage
docker run --rm \
  -v glxy-gaming_pdf_storage:/source \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/pdf_storage-$(date +%Y%m%d).tar.gz -C /source .

# Backup database
docker exec glxy-db pg_dump -U glxy_user glxy_gaming > backup-$(date +%Y%m%d).sql
```

## Useful Commands

```bash
# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Rebuild from scratch
docker-compose build --no-cache

# Scale workers
docker-compose up -d --scale web-adobe-worker=3

# Execute command in container
docker exec -it glxy-web-adobe-api bash

# View container configuration
docker inspect glxy-web-adobe-api

# Clean up Docker system
docker system prune -a
```

## Next Steps

1. **Read Full Documentation**: [DEPLOYMENT-WEB-ADOBE.md](./DEPLOYMENT-WEB-ADOBE.md)
2. **API Documentation**: http://localhost:8000/api/docs
3. **Integration Guide**: [WEB-ADOBE-INTEGRATION.md](./WEB-ADOBE-INTEGRATION.md)
4. **Configure Monitoring**: Setup Sentry, Prometheus, or Grafana
5. **Setup CI/CD**: Automate deployments with GitHub Actions

## Support

- **Issues**: Check logs first: `docker-compose logs -f web-adobe-api`
- **Health**: `curl http://localhost:8000/health`
- **Documentation**: `/docs/` directory
- **API Docs**: http://localhost:8000/api/docs
