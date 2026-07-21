import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';

type RequestTarget = 'body' | 'query' | 'params';

export function validate(schema: ZodType, target: RequestTarget = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req[target]);

    if (!parsed.success) {
      next(parsed.error);
      return;
    }

    req[target] = parsed.data;
    next();
  };
}
