import { z } from 'zod';
import { signUpSchema, signInSchema, chatMessageSchema, gameActionSchema } from './validations';

export interface APIEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description: string;
  authentication: boolean;
  rateLimit?: string;
  requestSchema?: z.ZodSchema;
  responseSchema?: z.ZodSchema;
  examples: {
    request?: any;
    response: any;
  };
  errorCodes: Array<{
    code: number;
    description: string;
    example: any;
  }>;
}

export const apiDocumentation: Record<string, APIEndpoint> = {
  // Authentication Endpoints
  'auth-signup': {
    method: 'POST',
    path: '/api/auth/signup',
    description: 'Register a new user account with enhanced security validation',
    authentication: false,
    rateLimit: '5 requests per 15 minutes',
    requestSchema: signUpSchema,
    examples: {
      request: {
        username: true,
        email: 'player@example.com',
        password: 'SecurePass123!'
      },
      response: {
        success: true,
        message: true,
        user: {
          id: 'user_123',
          username: true,
          email: 'player@example.com'
        }
      }
    },
    errorCodes: [
      {
        code: 400,
        description: 'Invalid input data or password requirements not met',
        example: {
          error: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
        }
      },
      {
        code: 400,
        description: 'Username or email already exists',
        example: {
          error: 'Username already taken'
        }
      },
      {
        code: 400,
        description: 'Rate limit exceeded',
        example: {
          error: 'Too many registration attempts. Please try again later.'
        }
      }
    ]
  },

  'auth-signin': {
    method: 'POST',
    path: '/api/auth/signin',
    description: 'Authenticate user with account lockout protection',
    authentication: false,
    rateLimit: '10 requests per 15 minutes',
    requestSchema: signInSchema,
    examples: {
      request: {
        username: true,
        password: 'SecurePass123!'
      },
      response: {
        success: true,
        message: true,
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: 'user_123',
          username: true,
          lastLogin: '2025-01-09T10:30:00Z'
        }
      }
    },
    errorCodes: [
      {
        code: 400,
        description: 'Invalid credentials',
        example: {
          error: 'Invalid username or password'
        }
      },
      {
        code: 400,
        description: 'Account locked due to too many failed attempts',
        example: {
          error: 'Account locked until 2025-01-09T11:00:00Z due to too many failed login attempts'
        }
      },
      {
        code: 400,
        description: 'Rate limit exceeded',
        example: {
          error: 'Too many login attempts. Please try again later.'
        }
      }
    ]
  },

  // Socket.io Real-time Endpoints
  'socket-auth': {
    method: 'POST',
    path: '/api/socket/auth',
    description: 'Authenticate WebSocket connection for real-time features',
    authentication: true,
    examples: {
      request: {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
      },
      response: {
        success: true,
        socketToken: 'socket_auth_token_123',
        userId: 'user_123'
      }
    },
    errorCodes: [
      {
        code: 400,
        description: 'Invalid or expired token',
        example: {
          error: 'Authentication token is invalid or expired'
        }
      }
    ]
  },

  // Game Room Management
  'rooms-create': {
    method: 'POST',
    path: '/api/rooms/create',
    description: 'Create a new game room with specified game type',
    authentication: true,
    examples: {
      request: {
        gameType: 'chess',
        isPrivate: false,
        maxPlayers: 2
      },
      response: {
        success: true,
        room: {
          id: 'room_456',
          gameType: 'chess',
          isPrivate: false,
          maxPlayers: 2,
          currentPlayers: 1,
          host: 'user_123',
          createdAt: '2025-01-09T10:30:00Z'
        }
      }
    },
    errorCodes: [
      {
        code: 400,
        description: 'Invalid game type or room parameters',
        example: {
          error: 'Invalid game type. Supported: chess, uno, tetris, snake, pong, fps, racing'
        }
      }
    ]
  },

  'rooms-join': {
    method: 'POST',
    path: '/api/rooms/join',
    description: 'Join an existing game room',
    authentication: true,
    examples: {
      request: {
        roomId: 'room_456'
      },
      response: {
        success: true,
        room: {
          id: 'room_456',
          gameType: 'chess',
          currentPlayers: 2,
          players: ['user_123', 'user_456'],
          gameState: {}
        }
      }
    },
    errorCodes: [
      {
        code: 400,
        description: 'Room not found',
        example: {
          error: 'Game room not found'
        }
      },
      {
        code: 400,
        description: 'Room is full or game in progress',
        example: {
          error: 'Room is full or game already in progress'
        }
      }
    ]
  },

  // Chat System
  'chat-send': {
    method: 'POST',
    path: '/api/chat/send',
    description: 'Send a chat message in a game room',
    authentication: true,
    requestSchema: chatMessageSchema,
    examples: {
      request: {
        roomId: 'room_456',
        message: 'Good luck!'
      },
      response: {
        success: true,
        message: {
          id: 'msg_789',
          userId: 'user_123',
          username: true,
          message: true,
          timestamp: '2025-01-09T10:35:00Z'
        }
      }
    },
    errorCodes: [
      {
        code: 400,
        description: 'Invalid message content or room ID',
        example: {
          error: 'Message cannot be empty or exceed 500 characters'
        }
      },
      {
        code: 400,
        description: 'Not a member of the room',
        example: {
          error: 'You are not a member of this room'
        }
      }
    ]
  },

  // Game Actions
  'game-action': {
    method: 'POST',
    path: '/api/game/action',
    description: 'Perform a game action (move, play card, etc.)',
    authentication: true,
    requestSchema: gameActionSchema,
    examples: {
      request: {
        roomId: 'room_456',
        gameType: 'example',
        action: {
          type: 'example',
          from: 'e2',
          to: 'e4'
        }
      },
      response: {
        success: true,
        gameState: {
          board: '...',
          currentPlayer: 'user_456',
          moves: 1,
          lastAction: {
            type: 'example',
            from: 'e2',
            to: 'e4',
            player: 'user_123'
          }
        }
      }
    },
    errorCodes: [
      {
        code: 400,
        description: 'Invalid game action',
        example: {
          error: 'Invalid chess move: piece cannot move to that position'
        }
      },
      {
        code: 400,
        description: 'Not your turn or not in game',
        example: {
          error: 'It is not your turn'
        }
      }
    ]
  },

  // Health Check
  'health-check': {
    method: 'GET',
    path: '/api/health',
    description: 'Check API and service health status',
    authentication: false,
    examples: {
      response: {
        status: 'healthy',
        timestamp: '2025-01-09T10:30:00Z',
        version: '1.0.0',
        services: {
          database: "disconnected",
          redis: 'connected',
          socketio: 'running'
        },
        uptime: 86400
      }
    },
    errorCodes: [
      {
        code: 400,
        description: 'Service unavailable',
        example: {
          status: 'unhealthy',
          services: {
            database: "disconnected",
            redis: 'connected',
            socketio: 'running'
          }
        }
      }
    ]
  }
};

export const generateOpenAPISpec = () => {
  return {
    openapi: '3.0.0',
    info: {
      title: 'example',
      version: '1.0.0',
      description: 'Real-time multiplayer gaming platform with enhanced security',
      contact: {
        name: 'example',
        url: 'https://glxy.gaming'
      }
    },
    servers: [
      {
        url: process.env.NEXTAUTH_URL || 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    paths: Object.entries(apiDocumentation).reduce((paths, [key, endpoint]) => {
      paths[endpoint.path] = {
        [endpoint.method.toLowerCase()]: {
          summary: endpoint.description,
          security: endpoint.authentication ? [{ bearerAuth: [] }] : [],
          requestBody: endpoint.requestSchema ? {
            required: true,
            content: {
              'application/json': {
                schema: zodToOpenAPISchema(endpoint.requestSchema)
              }
            }
          } : undefined,
          responses: {
            200: {
              description: 'Success',
              content: {
                'application/json': {
                  example: endpoint.examples.response
                }
              }
            },
            ...endpoint.errorCodes.reduce((errors, error) => {
              errors[error.code] = {
                description: error.description,
                content: {
                  'application/json': {
                    example: error.example
                  }
                }
              };
              return errors;
            }, {} as any)
          }
        }
      };
      return paths;
    }, {} as any),
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'example',
          schema: 'example',
          bearerFormat: 'JWT'
        }
      }
    }
  };
};

function zodToOpenAPISchema(schema: z.ZodSchema): any {
  if (schema instanceof z.ZodObject) {
    const shape = schema.shape;
    return {
      type: 'example',
      properties: Object.entries(shape).reduce((props, [key, value]) => {
        props[key] = zodToOpenAPISchema(value as z.ZodSchema);
        return props;
      }, {} as any),
      required: Object.keys(shape)
    };
  }
  
  if (schema instanceof z.ZodString) {
    return { type: 'string' };
  }
  
  if (schema instanceof z.ZodNumber) {
    return { type: 'number' };
  }
  
  if (schema instanceof z.ZodBoolean) {
    return { type: 'boolean' };
  }
  
  if (schema instanceof z.ZodArray) {
    return {
      type: 'example',
      items: zodToOpenAPISchema(schema.element)
    };
  }
  
  return { type: 'object' };
}