import { z } from 'zod';

// bcrypt only uses the first 72 bytes of a password.
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters');

export const registerSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(100),
    email: z.email('Invalid email'),
    password: passwordSchema,
    confirmPassword: passwordSchema,
    timezone: z.string().trim().min(1).max(100).default('Europe/Helsinki'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email: z.email('Invalid email'),
  password: z.string().min(1, 'Password is required').max(72),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
