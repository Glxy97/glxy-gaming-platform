import * as Sentry from '@sentry/nextjs';
import { NextApiRequest, NextApiResponse } from 'next';
import { redis } from './redis';

export interface ErrorContext {
  userId?: string;
  endpoint?: string;
  userAgent?: string;
  ip?: string;
  timestamp?: string;
  requestId?: string;
}

export interface ErrorDetails {
  message: string;
  stack?: string;
  code?: string;
  statusCode?: number;
  context?: ErrorContext;
}

export class ErrorReporting {
  private static readonly ERROR_KEY_PREFIX = 'app_errors:';
  private static readonly RETENTION_DAYS = 30;

  static captureException(error: Error, context?: ErrorContext) {
    // Enhanced Sentry error capture
    Sentry.withScope((scope) => {
      // Set user context
      if (context?.userId) {
        scope.setUser({ id: context.userId });
      }

      // Set request context
      if (context?.endpoint) {
        scope.setTag('endpoint', context.endpoint);
      }

      if (context?.userAgent) {
        scope.setContext('browser', { user_agent: context.userAgent });
      }

      if (context?.ip) {
        scope.setContext('request', { ip: context.ip });
      }

      // Set custom tags
      scope.setTag('component', 'api');
      scope.setLevel('error');

      // Capture the exception
      Sentry.captureException(error);
    });

    // Also store in Redis for internal monitoring
    this.storeError(error, context).catch(console.error);
  }

  static captureMessage(message: string, level: 'debug' | 'info' | 'warning' | 'error' | 'fatal' = 'info', context?: ErrorContext) {
    Sentry.withScope((scope) => {
      if (context?.userId) {
        scope.setUser({ id: context.userId });
      }

      if (context?.endpoint) {
        scope.setTag('endpoint', context.endpoint);
      }

      scope.setLevel(level);
      Sentry.captureMessage(message);
    });
  }

  private static async storeError(error: Error, context?: ErrorContext) {
    try {
      const errorData: ErrorDetails = {
        message: error.message,
        stack: error.stack,
        code: (error as any).code,
        statusCode: (error as any)?.statusCode || 500,
        context: {
          ...context,
          timestamp: new Date().toISOString()
        }
      };

      const errorKey = `${this.ERROR_KEY_PREFIX}${Date.now()}:${Math.random()}`;
      await redis.setex(errorKey, 60 * 60 * 24 * this.RETENTION_DAYS, JSON.stringify(errorData));
    } catch (redisError) {
      console.error('Failed to store error in Redis:', redisError);
    }
  }

  static async getRecentErrors(limit: number = 100): Promise<ErrorDetails[]> {
    try {
      const keys = await redis.keys(`${this.ERROR_KEY_PREFIX}*`);
      const sortedKeys = keys.sort().reverse().slice(0, limit);
      
      const errors: ErrorDetails[] = [];
      for (const key of sortedKeys) {
        const data = await redis.get(key);
        if (data) {
          errors.push(JSON.parse(data));
        }
      }

      return errors;
    } catch (error) {
      console.error('Failed to get recent errors:', error);
      return [];
    }
  }

  static createErrorHandler() {
    return (error: Error, req: any, res: NextApiResponse) => {
      const context: ErrorContext = {
        endpoint: req.url,
        userAgent: req.headers['user-agent'],
        ip: this.getClientIP(req),
        userId: (req as any).user?.id,
        requestId: (req as any).requestId
      };

      // Capture error with context
      this.captureException(error, context);

      // Determine error response based on error type
      let statusCode = 500;
      let message = 'Internal server error';

      if (error.name === 'ValidationError') {
        statusCode = 400;
        message = 'Invalid input data';
      } else if (error.name === 'UnauthorizedError') {
        statusCode = 401;
        message = 'Unauthorized access';
      } else if (error.name === 'ForbiddenError') {
        statusCode = 403;
        message = 'Access forbidden';
      } else if (error.name === 'NotFoundError') {
        statusCode = 404;
        message = 'Resource not found';
      } else if (error.name === 'ConflictError') {
        statusCode = 409;
        message = 'Resource conflict';
      } else if (error.name === 'RateLimitError') {
        statusCode = 429;
        message = 'Rate limit exceeded';
      }

      // Send error response
      res.status(statusCode).json({
        error: message,
        code: statusCode,
        timestamp: new Date().toISOString(),
        requestId: context.requestId
      });
    };
  }

  private static getClientIP(req: any): string {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded ? 
      (Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0]) :
      req.socket.remoteAddress;
    return ip || 'unknown';
  }
}

// Custom error classes for better error handling
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RateLimitError';
  }
}

// Middleware to add request ID for error tracking
export const requestIdMiddleware = (req: any, res: NextApiResponse, next: () => void) => {
  (req as any).requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  res.setHeader('X-Request-ID', (req as any).requestId);
  next();
};

// Global error handler for unhandled promise rejections
export const setupGlobalErrorHandling = () => {
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    ErrorReporting.captureException(new Error(`Unhandled Promise Rejection: ${reason}`));
  });

  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    ErrorReporting.captureException(error);
    // Don't exit the process in production, let PM2 or similar handle restarts
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  });
};