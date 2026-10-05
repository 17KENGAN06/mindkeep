import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

/** About 10 statement scans per hour per signed-in user. */
export const financeScanRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id ?? ipKeyGenerator(req.ip ?? 'anonymous'),
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many finance scans. Please try again later.',
    },
  },
});
