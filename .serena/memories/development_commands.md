# Development Commands - GLXY Gaming Platform

## Core Development
```bash
npm run dev              # Start development server (tsx server.ts)
npm run dev:node         # Start with Node.js directly
npm run dev:next         # Start Next.js dev only
npm run dev:turbo        # Start with Turbo mode
npm run build            # Production build
npm run start            # Start production server
```

## Code Quality
```bash
npm run lint             # ESLint check
npm run typecheck        # TypeScript compilation check
npm run typecheck:server # Server-side TypeScript check
```

## Testing
```bash
npm run test             # Run unit tests (Vitest)
npm run test:watch       # Watch mode for unit tests
npm run test:coverage    # Generate coverage report
npm run test:ui          # Vitest UI interface
npm run test:security    # Security-specific tests
npm run test:games       # Game validator tests
npm run test:e2e         # Playwright E2E tests
npm run test:e2e:auth    # Auth flow E2E tests
npm run test:e2e:multiplayer # Multiplayer E2E tests
npm run test:e2e:admin   # Admin panel E2E tests
npm run test:e2e:ui      # Playwright UI mode
npm run test:e2e:debug   # Playwright debug mode
npm run test:e2e:report  # Show Playwright report
```

## Database Operations
```bash
npm run db:migrate       # Deploy database migrations
npm run db:seed          # Seed database with initial data
npm run seed             # Run general seed script
npm run seed:achievements # Seed achievements data
npm run seed:rooms       # Seed game rooms data
```

## Full Quality Gates
```bash
npm run build:full       # typecheck + lint + test + build
npm run test:full        # test + coverage + E2E
npm run verify            # Run verification script
npm run verify:web-adobe  # Verify Web Adobe integration
```

## Security & Monitoring
```bash
npm run security:scan    # Run npm security audit
```

## Deployment
```bash
npm run deploy:prod      # Full production deployment
```

## Windows-Specific Commands
Since this is a Windows development environment:
```powershell
# Git operations
git status
git checkout -b feature-branch-name
git add .
git commit -m "feat: add new feature"
git push origin feature-branch-name

# File operations (PowerShell)
Get-ChildItem -Recurse -Filter "*.ts" | Select-Object FullName
Get-Content package.json | ConvertFrom-Json

# Environment setup
Copy-Item .env.example .env.local
```

## Development Workflow
1. **Start**: `npm run dev` (runs on http://localhost:3000)
2. **Code changes**: Auto-reload enabled
3. **Quality checks**: `npm run typecheck` and `npm run lint`
4. **Testing**: `npm run test:watch` during development
5. **Pre-commit**: `npm run build:full` to ensure everything works
6. **Database**: Set up with `npm run db:migrate && npm run db:seed`

## Key Configuration Files
- `package.json` - Scripts and dependencies
- `tsconfig.json` - TypeScript configuration (strict mode)
- `next.config.js` - Next.js configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `jest.config.js` - Jest testing configuration
- `playwright.config.ts` - E2E testing configuration
- `vitest.config.ts` - Unit testing configuration
- `.env.example` - Environment variables template

## Common Issues & Solutions
- **Port conflicts**: Check if port 3000 is available
- **Database connection**: Ensure PostgreSQL is running locally
- **Redis connection**: Ensure Redis is running for caching/sessions
- **TypeScript errors**: Run `npm run typecheck` to identify issues
- **Build failures**: Check environment variables in `.env.local`