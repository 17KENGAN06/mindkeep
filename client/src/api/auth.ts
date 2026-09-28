import { apiClient } from '@/api/client';
import type { AuthResponse, User } from '@/types/auth';

export type BotPayload = {
  botToken?: string;
  website?: string;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  timezone?: string;
  locale?: string;
} & BotPayload;

export type LoginPayload = {
  email: string;
  password: string;
} & BotPayload;

export type GoogleLoginPayload = {
  credential: string;
  timezone: string;
};

export const authApi = {
  challenge: () => apiClient.get<{ botToken: string }>('/api/auth/challenge'),
  register: (payload: RegisterPayload) =>
    apiClient.post<{ pending: true }>('/api/auth/register', payload),
  login: (payload: LoginPayload) => apiClient.post<AuthResponse>('/api/auth/login', payload),
  googleLogin: (payload: GoogleLoginPayload) =>
    apiClient.post<AuthResponse>('/api/auth/google', payload),
  verifyEmail: (payload: { token: string }) =>
    apiClient.post<AuthResponse>('/api/auth/verify-email', payload),
  forgotPassword: (payload: { email: string; locale?: string } & BotPayload) =>
    apiClient.post<{ sent: true }>('/api/auth/forgot-password', payload),
  resetPassword: (payload: { token: string; password: string; confirmPassword: string }) =>
    apiClient.post<AuthResponse>('/api/auth/reset-password', payload),
  changePassword: (payload: {
    currentPassword?: string;
    password: string;
    confirmPassword: string;
  }) => apiClient.post<{ user: User }>('/api/auth/change-password', payload),
  logout: () => apiClient.post<{ success: boolean }>('/api/auth/logout'),
  me: () => apiClient.get<{ user: User }>('/api/auth/me'),
};
