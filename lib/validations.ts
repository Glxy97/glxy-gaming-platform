import { z } from 'zod'

// User validation schemas
export const signUpSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  email: z
    .string()
    .email('Invalid email address')
    .max(254, 'Email must be at most 254 characters'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/(?=.*[a-z])/, 'Password must contain at least one lowercase letter')
    .regex(/(?=.*[A-Z])/, 'Password must contain at least one uppercase letter')
    .regex(/(?=.*\d)/, 'Password must contain at least one number')
    .regex(/(?=.*[!@#$%^&*(),.?":{}|<>])/, 'Password must contain at least one special character')
})

export const signInSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .max(254, 'Email must be at most 254 characters'),
  password: z
    .string()
    .min(1, 'Password is required')
})

// Game room validation schemas
export const createGameRoomSchema = z.object({
  name: z
    .string()
    .min(3, 'Room name must be at least 3 characters')
    .max(50, 'Room name must be at most 50 characters')
    .regex(/^[a-zA-Z0-9\s_-]+$/, 'Room name can only contain letters, numbers, spaces, underscores, and hyphens'),
  gameType: z.enum(['chess', 'tetris', 'pong', 'snake', 'racing', 'uno', 'fps'], {
    errorMap: () => ({ message: 'Invalid game type' })
  }),
  maxPlayers: z
    .number()
    .int('Max players must be an integer')
    .min(2, 'Must allow at least 2 players')
    .max(8, 'Cannot exceed 8 players'),
  isPublic: z.boolean().default(true),
  settings: z.object({}).passthrough().optional() // Allow any game-specific settings
})

export const joinGameRoomSchema = z.object({
  roomId: z
    .string()
    .min(1, 'Room ID is required')
    .max(50, 'Invalid room ID')
})

// Chat validation schemas
export const chatMessageSchema = z.object({
  message: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(500, 'Message must be at most 500 characters')
    .regex(/^[^<>]*$/, 'Message contains invalid characters'), // Prevent HTML injection
  roomId: z.string().min(1, 'Room ID is required').optional(),
  type: z.enum(['room', 'global', 'system']).default('room')
})

// Profile validation schemas
export const updateProfileSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')
    .optional(),
  bio: z
    .string()
    .max(500, 'Bio must be at most 500 characters')
    .optional(),
  avatar: z
    .string()
    .url('Invalid avatar URL')
    .max(500, 'Avatar URL too long')
    .optional()
})

// Game action validation schemas
export const gameActionSchema = z.object({
  roomId: z.string().min(1, 'Room ID is required'),
  gameType: z.enum(['chess', 'tetris', 'pong', 'snake', 'racing', 'uno', 'fps']),
  action: z.object({
    type: z.string().min(1, 'Action type is required'),
  }).passthrough() // Allow additional action-specific fields
})

export const chessMoveSchema = z.object({
  from: z
    .string()
    .regex(/^[a-h][1-8]$/, 'Invalid chess position format'),
  to: z
    .string()
    .regex(/^[a-h][1-8]$/, 'Invalid chess position format'),
  promotion: z
    .enum(['queen', 'rook', 'bishop', 'knight'])
    .optional(),
  roomId: z.string().min(1, 'Room ID is required')
})

export const tetrisMoveSchema = z.object({
  type: z.enum(['move', 'rotate', 'drop']),
  direction: z.enum(['left', 'right', 'down']).optional(),
  roomId: z.string().min(1, 'Room ID is required')
})

// File upload validation
export const fileUploadSchema = z.object({
  filename: z
    .string()
    .min(1, 'Filename is required')
    .max(255, 'Filename too long')
    .regex(/^[a-zA-Z0-9._-]+$/, 'Invalid filename format'),
  fileType: z.enum(['image/jpeg', 'image/png', 'image/gif', 'image/webp'], {
    errorMap: () => ({ message: 'Only JPEG, PNG, GIF, and WebP images are allowed' })
  }),
  fileSize: z
    .number()
    .max(5 * 1024 * 1024, 'File size must be less than 5MB')
})

// API response wrapper
export const apiResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.any().optional(),
  error: z.string().optional()
})

// Pagination schema
export const paginationSchema = z.object({
  page: z
    .number()
    .int('Page must be an integer')
    .min(1, 'Page must be at least 1')
    .default(1),
  limit: z
    .number()
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(10),
  orderBy: z.enum(['createdAt', 'updatedAt', 'name']).default('createdAt'),
  orderDir: z.enum(['asc', 'desc']).default('desc')
})

// Validation helper function
export const validateInput = <T>(schema: z.ZodSchema<T>, data: unknown): { 
  success: boolean
  data?: T
  errors?: string[]
} => {
  const result = schema.safeParse(data)
  
  if (result.success) {
    return { success: true, data: result.data }
  }
  
  return {
    success: false,
    errors: result.error.errors.map(err => err.message)
  }
}

// Middleware helper for API validation
export const createValidatedApiHandler = <T>(
  schema: z.ZodSchema<T>,
  handler: (validatedData: T, req: any, res: any) => Promise<any>
) => {
  return async (req: any, res: any) => {
    const validation = validateInput(schema, req.body)
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: validation.errors
      })
    }
    
    try {
      return await handler(validation.data!, req, res)
    } catch (error) {
      console.error('API Handler Error:', error)
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      })
    }
  }
}