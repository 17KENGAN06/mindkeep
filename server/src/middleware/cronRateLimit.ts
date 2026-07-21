import rateLimit from 'express-rate-limit';

export const cronRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many cron requests.',
    },
  },
});
