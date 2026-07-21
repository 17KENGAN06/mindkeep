import { z } from 'zod';

export function createLoginSchema(t: (key: string) => string) {
  return z.object({
    email: z.email(t('auth.errors.email')),
    password: z.string().min(1, t('auth.errors.required')),
  });
}

export function createRegisterSchema(t: (key: string) => string) {
  return z
    .object({
      name: z.string().trim().min(1, t('auth.errors.required')).max(100),
      email: z.email(t('auth.errors.email')),
      password: z.string().min(8, t('auth.errors.passwordMin')).max(72, t('auth.errors.passwordMax')),
      confirmPassword: z
        .string()
        .min(8, t('auth.errors.passwordMin'))
        .max(72, t('auth.errors.passwordMax')),
      timezone: z.string().min(1),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('auth.errors.passwordMatch'),
      path: ['confirmPassword'],
    });
}

export type LoginFormValues = z.infer<ReturnType<typeof createLoginSchema>>;
export type RegisterFormValues = z.infer<ReturnType<typeof createRegisterSchema>>;
