import { AppError } from '@/utils/AppError.js';

export function requireOwned<T>(record: T | null | undefined, message: string, code: string): T {
  if (!record) {
    throw new AppError(message, {
      statusCode: 404,
      code,
    });
  }

  return record;
}

export function requireDeleted(count: number, message: string, code: string): void {
  if (count === 0) {
    throw new AppError(message, {
      statusCode: 404,
      code,
    });
  }
}
