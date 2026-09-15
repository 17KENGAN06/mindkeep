import { z } from 'zod';

// bcrypt only uses the first 72 bytes of a password.
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters');

const botFields = {
  /** Optional until challenge endpoint is available on all deploys */
  botToken: z.string().min(20).max(500).optional(),
  /** Honeypot — must stay empty */
  website: z.string().max(200).optional().default(''),
};

export const registerSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(100),
    email: z.email('Invalid email'),
    password: passwordSchema,
    confirmPassword: passwordSchema,
    timezone: z.string().trim().min(1).max(100).default('Europe/Helsinki'),
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

export const googleLoginSchema = z.object({
  credential: z.string().min(100, 'Google credential is required').max(10_000),
  timezone: z.string().trim().min(1).max(100).default('Europe/Helsinki'),
});

function isIanaTimeZone(value: string): boolean {
  try {
    Intl.DateTimeFormat('en-US', { timeZone: value }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

export const updateMeSchema = z.object({
  timezone: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .refine(isIanaTimeZone, 'Invalid timezone'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type GoogleLoginInput = z.infer<typeof googleLoginSchema>;
export type UpdateMeInput = z.infer<typeof updateMeSchema>;
