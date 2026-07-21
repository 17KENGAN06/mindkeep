export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly isOperational: boolean;
  readonly details?: unknown;

  constructor(
    message: string,
    options?: {
      statusCode?: number;
      code?: string;
      details?: unknown;
      isOperational?: boolean;
    },
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = options?.statusCode ?? 500;
    this.code = options?.code ?? 'INTERNAL_ERROR';
    this.details = options?.details;
    this.isOperational = options?.isOperational ?? true;
  }
}
