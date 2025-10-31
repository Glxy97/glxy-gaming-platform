# Essential Commands - GLXY Gaming Platform Development

## Daily Development Workflow

### Starting Development
```bash
# 1. Ensure services are running
# Start PostgreSQL (if not running)
# Start Redis (if not running)

# 2. Start development server
npm run dev              # Runs on http://localhost:3000

# 3. Run tests in watch mode (separate terminal)
npm run test:watch       # Unit tests with auto-reload
```

### Code Quality Checks
```bash
# Run frequently during development
npm run typecheck        # TypeScript compilation check
npm run lint             # ESLint check

# Full quality gate (before commits)
npm run build:full       # Complete verification pipeline
```

### Testing Commands
```bash
# Unit testing
npm run test             # Run all unit tests
npm run test:coverage    # Generate coverage report
npm run test:ui          # Interactive test interface

# E2E testing
npm run test:e2e         # Full Playwright test suite
npm run test:e2e:debug   # Debug E2E tests with browser
npm run test:e2e:report  # View test results
```

## Database Operations

### Setup & Migration
```bash
# Initial setup
npm run db:migrate       # Apply database migrations
npm run db:seed          # Populate with initial data

# Individual seeding
npm run seed:achievements # Seed achievements
npm run seed:rooms       # Seed game rooms
```

### Reset Development Database
```bash
# In PostgreSQL:
DROP DATABASE IF EXISTS glxy_gaming;
CREATE DATABASE glxy_gaming;
# Then run:
npm run db:migrate
npm run db:seed
```

## Gaming Development Commands

### Game Testing
```bash
npm run test:games       # Test game validators
npm run test:security    # Security-related tests
```

### Web Adobe PDF Integration
```bash
npm run verify:web-adobe # Verify PDF functionality
npm run test:e2e:web-adobe # E2E tests for PDF features
```

## Windows-Specific Commands

### Git Workflow (PowerShell)
```powershell
# Feature branch workflow
git checkout -b feature/game-name
git add .
git commit -m "feat: implement new game logic"
git push origin feature/game-name

# Pull latest changes
git pull origin main
git rebase main  # If needed
```

### Environment Setup
```powershell
# Copy environment template
Copy-Item .env.example .env.local

# Check running processes
Get-Process | Where-Object {$_.ProcessName -like "*postgres*"}
Get-Process | Where-Object {$_.ProcessName -like "*redis*"}
```

### File Operations
```powershell
# Find TypeScript files
Get-ChildItem -Recurse -Filter "*.ts" | Select-Object FullName

# Clean build artifacts
Remove-Item .next -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item node_modules\.cache -Recurse -Force -ErrorAction SilentlyContinue
```

## Troubleshooting Commands

### TypeScript Issues
```bash
# Diagnose TypeScript errors
npm run typecheck        # Check compilation issues

# Clear TypeScript cache
Remove-Item .next\types -Recurse -Force -ErrorAction SilentlyContinue
npm run build
```

### Dependency Issues
```bash
# Clear and reinstall dependencies
Remove-Item node_modules -Recurse -Force
Remove-Item package-lock.json
npm install
```

### Database Connection Issues
```bash
# Check database connection
# Test with psql or pgAdmin
# Verify .env.local has correct DATABASE_URL

# Reset database connection pool
npm run dev              # Restart development server
```

### Redis Issues
```bash
# Check Redis connection
# Test with redis-cli
# Verify .env.local has correct REDIS_URL

# Clear Redis cache
# In Redis CLI: FLUSHDB (development only)
```

## Performance Monitoring

### Build Analysis
```bash
# Analyze bundle size
npm run build            # Check build output for bundle sizes

# Lighthouse CI (if configured)
npm run build:lighthouse # Run performance audit
```

### Database Performance
```sql
-- In PostgreSQL:
SELECT * FROM pg_stat_activity WHERE state = 'active';
SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;
```

## Security Commands

### Security Audit
```bash
npm run security:scan    # Check for known vulnerabilities
```

### Environment Security
```powershell
# Check environment variables are set correctly
Get-Content .env.local | Select-String -Pattern "SECRET|KEY|PASSWORD"
```

## Deployment Commands

### Production Build
```bash
npm run build:full       # Complete verification and build
npm run deploy:prod      # Deploy to production (Docker)
```

### Docker Commands
```bash
# Development
docker-compose up -d     # Start all services
docker-compose logs -f   # View logs
docker-compose down      # Stop all services

# Production
docker-compose -f docker-compose.prod.yml up -d --build
```

## Development Tips

### Hot Reloading
- Next.js automatically reloads on file changes
- Socket.IO requires server restart for changes
- Database changes require migration restart

### Debugging
```bash
# Debug TypeScript in VS Code
# Use breakpoints and debugger statements

# Debug E2E tests
npm run test:e2e:debug   # Opens browser with dev tools

# Debug Socket.IO
# Check browser Network tab for WebSocket frames
```

### Code Quality Integration
Set up your IDE to run:
- `npm run typecheck` on save
- `npm run lint` on commit
- `npm run test:watch` during development

## Quick Reference Cheat Sheet

```bash
# Start dev server
npm run dev

# Quality checks
npm run build:full

# Testing
npm run test:watch
npm run test:e2e

# Database
npm run db:migrate && npm run db:seed

# Security
npm run security:scan

# Deployment
npm run deploy:prod
```