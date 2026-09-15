import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Request } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';
import { isAllowedBrowserOrigin, env } from '@/config/env.js';
import { getAccessTokenFromRequest } from '@/utils/accessToken.js';
import { errorHandler } from '@/middleware/errorHandler.js';
import { notFoundHandler } from '@/middleware/notFoundHandler.js';
import { requireSameOrigin } from '@/middleware/requireSameOrigin.js';
import { apiRouter } from '@/routes/index.js';

const RATE_LIMIT_SKIP_PATHS = new Set([
  '/api/health',
  '/api/auth/me',
  '/api/auth/login',
  '/api/auth/google',
  '/api/auth/google/start',
  '/api/auth/google/callback',
  '/api/auth/google/finish',
  '/api/auth/logout',
  '/api/auth/challenge',
]);

function normalizePath(req: Request): string {
  return (req.originalUrl.split('?')[0] ?? req.path).replace(/\/$/, '') || '/';
}

function sessionToken(req: Request): string | undefined {
  const token = getAccessTokenFromRequest(req);
  return token && token.length > 16 ? token : undefined;
}

const app = express();

app.set('trust proxy', 1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }
      const normalized = origin.replace(/\/$/, '');
      if (isAllowedBrowserOrigin(normalized)) {
        callback(null, origin);
        return;
      }
      callback(null, false);
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    // Logged-in work is keyed per session, so 20 people on one Wi-Fi do not share a bucket.
    limit: (req) => (sessionToken(req) ? 20_000 : 800),
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator: (req) => {
      const token = sessionToken(req);
      if (token) return `session:${token}`;
      return ipKeyGenerator(req.ip ?? 'anonymous');
    },
    skip: (req) => RATE_LIMIT_SKIP_PATHS.has(normalizePath(req)),
    message: {
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many requests. Please try again later.',
      },
    },
  }),
);

app.use(requireSameOrigin);

app.use('/api', apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
