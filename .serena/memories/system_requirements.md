# System Requirements & Setup - GLXY Gaming Platform

## Development Environment Requirements

### Operating System
- **Primary**: Windows 11 (current setup)
- **Compatible**: Windows 10+, macOS 10.15+, Ubuntu 18.04+

### Required Software

#### Node.js & Package Management
- **Node.js**: Current LTS (18.x or 20.x recommended)
- **npm**: Comes with Node.js (version 9.x+)
- **Alternative**: pnpm or Yarn (optional)

#### Database
- **PostgreSQL**: Version 13+ (local development)
- **Redis**: Version 6+ (for caching and sessions)
- **GUI Tools** (optional):
  - pgAdmin or DBeaver for PostgreSQL management
  - RedisInsight for Redis management

#### Development Tools
- **Git**: Version 2.30+
- **VS Code**: Recommended IDE with extensions:
  - TypeScript and JavaScript Language Features
  - Tailwind CSS IntelliSense
  - Prisma
  - ESLint
  - Prettier

### Hardware Requirements

#### Minimum Development Setup
- **RAM**: 8GB (16GB recommended)
- **Storage**: 10GB free space (SSD recommended)
- **CPU**: Dual-core 2GHz+ (Quad-core recommended)

#### Recommended Development Setup
- **RAM**: 16GB+ (32GB optimal for heavy development)
- **Storage**: 25GB+ SSD
- **CPU**: Quad-core 3GHz+ (6-core+ optimal)

## Network Requirements

### Local Development
- **Port 3000**: Next.js development server
- **Port 5432**: PostgreSQL database
- **Port 6379**: Redis cache server
- **Port 3001**: Alternative development port (if 3000 occupied)

### External Services
- **GitHub/GitLab**: For code hosting
- **Node Package Registry**: npm registry access
- **Optional**: Docker Hub (for container deployment)

## Environment Configuration

### Required Environment Variables
Create `.env.local` from `.env.example`:

```bash
# Database (required)
DATABASE_URL="postgresql://postgres:password@localhost:5432/glxy_gaming"

# Authentication (required)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Redis (required)
REDIS_URL="redis://localhost:6379"

# OAuth (optional but recommended)
GITHUB_ID="your-github-client-id"
GITHUB_SECRET="your-github-client-secret"
GOOGLE_ID="your-google-client-id"
GOOGLE_SECRET="your-google-client-secret"
```

## Installation Steps

### 1. Repository Setup
```bash
# Clone repository
git clone https://github.com/Glxy97/glxy-gaming-platform.git
cd glxy-gaming-platform

# Install dependencies
npm install
```

### 2. Database Setup
```bash
# Install PostgreSQL (Windows)
# Download from: https://www.postgresql.org/download/windows/
# Create database: glxy_gaming
# Create user: postgres with password

# Install Redis (Windows)
# Download from: https://redis.io/download
# Or use WSL with Ubuntu
```

### 3. Environment Configuration
```bash
# Copy environment template
Copy-Item .env.example .env.local

# Edit with your credentials
notepad .env.local
```

### 4. Database Initialization
```bash
# Run migrations and seed data
npm run db:migrate
npm run db:seed
```

### 5. Start Development
```bash
# Verify everything works
npm run build:full

# Start development server
npm run dev
```

## Windows-Specific Setup

### Using Windows Package Manager
```powershell
# Install PostgreSQL
winget install PostgreSQL.PostgreSQL

# Install Redis (using Chocolatey)
choco install redis-64

# Install Node.js
winget install OpenJS.NodeJS
```

### Using WSL (Windows Subsystem for Linux)
```bash
# Enable WSL
wsl --install

# In Ubuntu (WSL):
sudo apt update
sudo apt install postgresql redis-server nodejs npm
```

### PowerShell Scripts
The project includes Windows-specific scripts:
- `setup-database.ps1`: Automated database setup
- `scripts/verify_glxy.sh`: Cross-platform verification (Git Bash)

## Docker Setup (Alternative)

### Requirements
- **Docker Desktop**: Latest version
- **Docker Compose**: Included with Docker Desktop

### Quick Start with Docker
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Testing Environment Requirements

### Unit Testing (Vitest)
- **Memory**: 4GB+ RAM
- **CPU**: Single-core sufficient
- **Time**: <5 minutes for full test suite

### E2E Testing (Playwright)
- **Memory**: 8GB+ RAM
- **CPU**: Dual-core recommended
- **Browsers**: Chromium, Firefox, Safari (via Playwright)
- **Time**: 10-15 minutes for full E2E suite

### Headless Testing
```bash
# Run tests without browser UI
npm run test:e2e

# Run with browser UI (debugging)
npm run test:e2e:ui
```

## Performance Monitoring

### Development Monitoring
- **Task Manager**: Monitor Node.js process memory usage
- **Resource Monitor**: Track CPU and disk I/O
- **Browser DevTools**: Performance profiling

### Database Monitoring
- **PostgreSQL**: `pg_stat_activity`, `EXPLAIN ANALYZE`
- **Redis**: `INFO memory`, `INFO stats`

## Troubleshooting Common Issues

### Port Conflicts
```bash
# Check what's using port 3000
netstat -ano | findstr :3000

# Kill process if needed
taskkill /PID <PID> /F
```

### Memory Issues
```bash
# Increase Node.js memory limit
set NODE_OPTIONS=--max-old-space-size=4096
npm run dev
```

### Database Connection Issues
- Verify PostgreSQL service is running
- Check `pg_hba.conf` for connection settings
- Ensure database exists: `CREATE DATABASE glxy_gaming;`

### Permission Issues
- Run PowerShell as Administrator for system-level changes
- Check file permissions for `.env.local`

## IDE Configuration

### VS Code Recommended Extensions
```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "Prisma.prisma",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-json",
    "ms-vscode-remote.remote-containers"
  ]
}
```

### VS Code Settings
```json
{
  "typescript.preferences.preferTypeOnlyAutoImports": true,
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "tailwindCSS.includeLanguages": {
    "typescript": "javascript",
    "typescriptreact": "html"
  }
}
```

## Backup and Recovery

### Development Database Backup
```bash
# Backup PostgreSQL
pg_dump glxy_gaming > backup.sql

# Restore PostgreSQL
psql glxy_gaming < backup.sql
```

### Configuration Backup
```bash
# Backup environment (NEVER commit to Git)
Copy-Item .env.local .env.local.backup

# Backup custom configurations
git add . && git commit -m "backup: configuration snapshot"
```

## Security Considerations

### Development Security
- Never commit `.env.local` to version control
- Use strong, unique secrets for development
- Enable Windows Defender or other antivirus
- Keep Node.js and dependencies updated

### Network Security
- Development server only binds to localhost
- Use firewall to restrict database access
- VPN recommended when working from public networks