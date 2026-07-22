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

    if (target === 'query') {
      // Express 5 exposes req.query as a getter without a setter. Define an
      // own property so downstream handlers receive the validated values.
      Object.defineProperty(req, 'query', {
        value: parsed.data,
        configurable: true,
        enumerable: true,
        writable: true,
      });
    } else {
      req[target] = parsed.data;
    }
    next();
  };
}
