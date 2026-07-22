import type { User } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: Pick<User, 'id' | 'name' | 'email' | 'timezone' | 'role' | 'createdAt' | 'updatedAt'>;
    }
  }
}

export {};
