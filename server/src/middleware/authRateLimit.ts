import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

function ipAuthLimit(limit: number, message: string) {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator: (req) => ipKeyGenerator(req.ip ?? 'anonymous'),
    message: {
      error: {
        code: 'RATE_LIMITED',
        message,
      },
    },
  });
}

/** Credential stuffing: own IP bucket, skipped from the global guest limiter. */
export const loginRateLimit = ipAuthLimit(
  10,
  'Too many login attempts. Please try again later.',
);

/** Account creation is cheaper to abuse than login. */
export const registerRateLimit = ipAuthLimit(
  5,
  'Too many registration attempts. Please try again later.',
);

export const googleAuthRateLimit = ipAuthLimit(
  20,
  'Too many Google sign-in attempts. Please try again later.',
);

export const challengeRateLimit = ipAuthLimit(
  40,
  'Too many requests. Please try again later.',
);

export const forgotPasswordRateLimit = ipAuthLimit(
  5,
  'Too many password reset attempts. Please try again later.',
);

export const emailTokenRateLimit = ipAuthLimit(
  20,
  'Too many attempts. Please try again later.',
);

export const refreshRateLimit = ipAuthLimit(
  40,
  'Too many session refresh attempts. Please try again later.',
);

export const deleteAccountRateLimit = ipAuthLimit(
  3,
  'Too many account deletion attempts. Please try again later.',
);
