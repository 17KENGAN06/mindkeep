import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { env } from '@/config/env.js';
import { logger } from '@/config/logger.js';
import { AppError } from '@/utils/AppError.js';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // Express requires 4-arity signature to recognize error middleware.
  next: NextFunction,
): void {
  void next;
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: err.flatten(),
      },
    });
    return;
  }

  if (err instanceof AppError) {
    if (!err.isOperational || err.statusCode >= 500) {
      logger.error(err.message, { code: err.code, details: err.details });
    }

    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details !== undefined ? { details: err.details } : {}),
      },
    });
    return;
  }

  logger.error('Unhandled error', err);

  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: env.NODE_ENV === 'production' ? 'Internal server error' : String(err),
    },
  });
}
