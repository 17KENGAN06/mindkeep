import { z } from 'zod';

// bcrypt only uses the first 72 bytes of a password.
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters');

const botFields = {
  /** Required in production by assertBotProtection; optional in local dev. */
  botToken: z.string().min(20).max(500).optional(),
  /** Honeypot — must stay empty */
  website: z.string().max(200).optional().default(''),
};

function isIanaTimeZone(value: string): boolean {
  try {
    Intl.DateTimeFormat('en-US', { timeZone: value }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

const localeSchema = z
  .string()
  .trim()
  .max(16)
  .optional()
  .transform((value) => {
    const code = (value ?? '').toLowerCase().split(/[-_]/)[0] ?? '';
    const allowed = ['uk', 'ru', 'en', 'pl', 'de', 'fr', 'it', 'es', 'fi'] as const;
    return (allowed as readonly string[]).includes(code) ? code : 'en';
  });

const timezoneSchema = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .refine(isIanaTimeZone, 'Invalid timezone');

export const registerSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(100),
    email: z.email('Invalid email'),
    password: passwordSchema,
    confirmPassword: passwordSchema,
    timezone: timezoneSchema.default('Europe/Helsinki'),
    locale: localeSchema,
    ...botFields,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email: z.email('Invalid email'),
  password: z.string().min(1, 'Password is required').max(72),
  ...botFields,
});

export const googleLoginSchema = z
  .object({
    credential: z.string().min(100).max(10_000).optional(),
    code: z.string().trim().min(20).max(128).optional(),
    timezone: timezoneSchema.default('Europe/Helsinki'),
  })
  .refine((data) => Boolean(data.credential) !== Boolean(data.code), {
    message: 'Provide either a Google credential or a one-time code',
    path: ['credential'],
  });

export const googleFinishSchema = z.object({
  credential: z.string().min(100).max(10_000),
  state: z.string().min(20).max(4000),
});

export const updateMeSchema = z.object({
  timezone: timezoneSchema,
});

export const verifyEmailSchema = z.object({
  token: z.string().trim().min(20).max(200),
});

export const forgotPasswordSchema = z.object({
  email: z.email('Invalid email'),
  locale: localeSchema,
  ...botFields,
});

export const resetPasswordSchema = z
  .object({
    token: z.string().trim().min(20).max(200),
    password: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().max(72).optional(),
    password: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const refreshSchema = z.object({
  refreshToken: z.string().trim().min(20).max(200),
});

export const sessionIdParamsSchema = z.object({
  id: z.string().cuid('Invalid session id'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type GoogleLoginInput = z.infer<typeof googleLoginSchema>;
export type GoogleFinishInput = z.infer<typeof googleFinishSchema>;
export type UpdateMeInput = z.infer<typeof updateMeSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type SessionIdParams = z.infer<typeof sessionIdParamsSchema>;
