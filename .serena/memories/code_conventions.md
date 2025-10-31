# Code Conventions & Style Guide - GLXY Gaming Platform

## TypeScript Configuration
- **Strict Mode**: Enabled with most strict rules
- **Target**: ES2022 with modern module resolution
- **Path Aliases**: `@/*` maps to project root
- **Compilation**: `noEmit: true` (Next.js handles compilation)
- **Incremental**: Enabled for faster builds

## Code Style Rules

### Naming Conventions
- **Variables/Functions**: `camelCase` (e.g., `userName`, `getUserData()`)
- **Components**: `PascalCase` (e.g., `GameBoard`, `UserProfile`)
- **Types/Interfaces**: `PascalCase` (e.g., `UserType`, `GameState`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `API_BASE_URL`, `MAX_PLAYERS`)
- **Files**: `kebab-case` for folders, `PascalCase` for components (`game-board.tsx`)

### Import/Export Patterns
```typescript
// External libraries first
import React from 'react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// Internal imports with @ alias
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { GameService } from '@/services/game-service';
import type { GameState } from '@/types/game';
```

### Component Structure
```typescript
// 1. Imports
// 2. Type definitions (if any)
interface GameBoardProps {
  gameId: string;
  onMove: (move: Move) => void;
}

// 3. Component definition
export function GameBoard({ gameId, onMove }: GameBoardProps) {
  // 4. Hooks (state, effects)
  const [gameState, setGameState] = useState<GameState>();
  
  // 5. Event handlers
  const handleMove = useCallback((move: Move) => {
    onMove(move);
  }, [onMove]);
  
  // 6. Effects
  useEffect(() => {
    // Setup logic
  }, []);
  
  // 7. Render
  return (
    <div className="game-board">
      {/* JSX content */}
    </div>
  );
}
```

### Database/Prisma Patterns
```typescript
// Schema: camelCase field names, PascalCase models
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  userName  String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  games     Game[]
}

// Usage: Type-safe with Prisma Client
const users = await prisma.user.findMany({
  include: {
    games: true,
  },
});
```

### API Routes (Next.js App Router)
```typescript
// app/api/games/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { GameService } from '@/services/game-service';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const games = await GameService.getAvailableGames();
    return NextResponse.json(games);
  } catch (error) {
    console.error('Failed to fetch games:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
```

### Socket.IO Patterns
```typescript
// Server-side
io.to(`game:${gameId}`).emit('gameStateUpdate', gameState);

// Client-side
useEffect(() => {
  socket.on('gameStateUpdate', (gameState: GameState) => {
    setGameState(gameState);
  });
  
  return () => {
    socket.off('gameStateUpdate');
  };
}, [socket]);
```

### Error Handling
```typescript
// Custom error classes
class GameError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'GameError';
  }
}

// Error handling in services
export class GameService {
  static async createGame(params: CreateGameParams): Promise<Game> {
    try {
      // Game creation logic
      return game;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new GameError('Failed to create game', 'DB_ERROR', 400);
      }
      throw error;
    }
  }
}
```

### Testing Patterns
```typescript
// Unit tests with Vitest
import { describe, it, expect, beforeEach } from 'vitest';
import { GameService } from '@/services/game-service';

describe('GameService', () => {
  beforeEach(() => {
    // Setup test data
  });

  it('should create a new game', async () => {
    const game = await GameService.createGame({
      name: 'Test Game',
      maxPlayers: 4,
    });
    
    expect(game).toBeDefined();
    expect(game.name).toBe('Test Game');
  });
});
```

## CSS/Tailwind Conventions
- **Utility-first**: Use Tailwind utilities primarily
- **Component variants**: Use `class-variance-authority` for component variations
- **Responsive design**: Mobile-first approach with `sm:`, `md:`, `lg:` prefixes
- **Dark mode**: Support with `dark:` prefixes
- **Custom animations**: Use Framer Motion for complex animations

```typescript
// Component with Tailwind + CVA patterns
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);
```

## Security Patterns
- **Input validation**: Use Zod schemas for validation
- **Authentication**: Check session in API routes
- **Authorization**: Role-based access control
- **Sanitization**: Use DOMPurify for user content
- **Rate limiting**: Implement in API routes

```typescript
import { z } from 'zod';

const CreateGameSchema = z.object({
  name: z.string().min(1).max(50),
  maxPlayers: z.number().min(2).max(8),
  isPrivate: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const body = await request.json();
    const validatedData = CreateGameSchema.parse(body);
    // Process validated data
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
  }
}
```

## File Organization
- **Barrel exports**: Use `index.ts` files for clean imports
- **Feature-based structure**: Group related files together
- **Separation of concerns**: Clear separation between UI, logic, and data
- **Consistent exports**: Named exports for most things, default for main component

## Performance Guidelines
- **Server components**: Use for data fetching without interactivity
- **Client components**: Only use when necessary (interactivity, browser APIs)
- **Image optimization**: Use Next.js Image component
- **Code splitting**: Dynamic imports for large components
- **Database queries**: Optimize with proper indexing and pagination