// Swagger configuration for API documentation
// Note: swagger-jsdoc is only used at runtime, not during build
let swaggerJSDoc: any

// Dynamic import to avoid build issues
const getSwaggerJSDoc = async () => {
  if (!swaggerJSDoc) {
    swaggerJSDoc = (await import('swagger-jsdoc')).default
  }
  return swaggerJSDoc
}

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'GLXY Gaming Platform API',
    version: '1.0.0',
    description: 'Comprehensive API documentation for the GLXY Gaming Platform',
    contact: {
      name: 'GLXY Gaming Platform',
      url: 'https://glxy-gaming.com',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development server',
    },
    {
      url: 'https://api.glxy-gaming.com',
      description: 'Production server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      sessionAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'next-auth.session-token',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'cuid' },
          email: { type: 'string', format: 'email' },
          username: { type: 'string' },
          role: { type: 'string', enum: ['USER', 'MODERATOR', 'ADMIN'] },
          avatar: { type: 'string', nullable: true },
          bio: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      GameRoom: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'cuid' },
          name: { type: 'string' },
          gameType: { type: 'string', enum: ['TETRIS', 'CONNECT4', 'TICTACTOE', 'CHESS', 'UNO'] },
          status: { type: 'string', enum: ['WAITING', 'ACTIVE', 'FINISHED'] },
          maxPlayers: { type: 'integer' },
          currentPlayers: { type: 'integer' },
          isPrivate: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      PDFDocument: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'cuid' },
          title: { type: 'string' },
          filename: { type: 'string' },
          status: { type: 'string', enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'ERROR'] },
          pageCount: { type: 'integer', nullable: true },
          fileSize: { type: 'integer' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string' },
          code: { type: 'string' },
        },
      },
    },
    responses: {
      UnauthorizedError: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              success: false,
              error: 'Unauthorized',
              code: 'AUTH_REQUIRED',
            },
          },
        },
      },
      ForbiddenError: {
        description: 'Insufficient permissions',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              success: false,
              error: 'Forbidden',
              code: 'INSUFFICIENT_PERMISSIONS',
            },
          },
        },
      },
      NotFoundError: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              success: false,
              error: 'Not Found',
              code: 'NOT_FOUND',
            },
          },
        },
      },
      ValidationError: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              success: false,
              error: 'Validation failed',
              code: 'VALIDATION_ERROR',
            },
          },
        },
      },
    },
  },
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication and session management',
    },
    {
      name: 'Users',
      description: 'User management and profiles',
    },
    {
      name: 'Games',
      description: 'Game room creation and management',
    },
    {
      name: 'Leaderboard',
      description: 'Rankings and statistics',
    },
    {
      name: 'PDF',
      description: 'PDF document processing and field management',
    },
    {
      name: 'Admin',
      description: 'Administrative endpoints (Admin access required)',
    },
    {
      name: 'Performance',
      description: 'Performance monitoring and metrics',
    },
  ],
}

const options = {
  swaggerDefinition,
  apis: [
    './app/api/**/*.ts',
    './app/api/**/*.js',
    './lib/**/*.ts',
  ],
}

// Generate swagger spec asynchronously
export const generateSwaggerSpec = async () => {
  const swaggerJSDoc = await getSwaggerJSDoc()
  return swaggerJSDoc(options)
}

// For backwards compatibility, export a default spec
// This will be generated at build time
export const swaggerSpec = swaggerDefinition

