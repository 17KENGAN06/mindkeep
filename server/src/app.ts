import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Request } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';
import { isAllowedBrowserOrigin, env } from '@/config/env.js';
import { billingController } from '@/controllers/billing.controller.js';
import { asyncHandler } from '@/middleware/asyncHandler.js';
import { getAccessTokenFromRequest } from '@/utils/accessToken.js';
import { sessionRateLimitKey } from '@/utils/rateLimitKey.js';
import { errorHandler } from '@/middleware/errorHandler.js';
import { notFoundHandler } from '@/middleware/notFoundHandler.js';
import { requireSameOrigin } from '@/middleware/requireSameOrigin.js';
import { apiRouter } from '@/routes/index.js';

/** Auth endpoints skipped here have their own IP limiters. Login is not left unthrottled. */
const RATE_LIMIT_SKIP_PATHS = new Set([
  '/api/health',
  '/api/auth/me',
  '/api/auth/login',
  '/api/auth/login/code',
  '/api/auth/google',
  '/api/auth/google/start',
  '/api/auth/google/mobile-start',
  '/api/auth/google/callback',
  '/api/auth/google/finish',
  '/api/auth/logout',
  '/api/auth/refresh',
  '/api/auth/challenge',
  '/api/auth/forgot-password',
  '/api/auth/verify-email',
  '/api/auth/reset-password',
  '/api/billing/webhook',
]);

function normalizePath(req: Request): string {
  return (req.originalUrl.split('?')[0] ?? req.path).replace(/\/$/, '') || '/';
}

// Verified once per request (limit and keyGenerator both ask); null = guest.
const sessionKeys = new WeakMap<Request, string | null>();

function sessionKey(req: Request): string | undefined {
  let key = sessionKeys.get(req);
  if (key === undefined) {
    key = sessionRateLimitKey(getAccessTokenFromRequest(req)) ?? null;
    sessionKeys.set(req, key);
  }
  return key ?? undefined;
}

const app = express();

app.set('trust proxy', 1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
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
app.post(
  '/api/billing/webhook',
  express.raw({ type: 'application/json' }),
  asyncHandler((req, res) => billingController.webhook(req, res)),
);
app.use((req, res, next) => {
  const path = normalizePath(req);
  const limit = path === '/api/nutrition/scan' ? '3mb' : '1mb';
  return express.json({ limit })(req, res, next);
});
app.use(cookieParser());
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    // Logged-in work is keyed per session, so 20 people on one Wi-Fi do not share a bucket.
    // Only a validly signed, unexpired token counts; anything else uses the IP bucket.
    limit: (req) => (sessionKey(req) ? 20_000 : 800),
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator: (req) => sessionKey(req) ?? ipKeyGenerator(req.ip ?? 'anonymous'),
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
