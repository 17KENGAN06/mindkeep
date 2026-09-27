import { apiClient } from './client';
import type { AuthResponse, User } from '../types/auth';

export type LoginPayload = {
  email: string;
  password: string;
  botToken?: string;
  website?: string;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  timezone?: string;
  botToken?: string;
  website?: string;
};

export type GoogleLoginPayload = {
  credential?: string;
  code?: string;
  timezone?: string;
};

export const authApi = {
  challenge: () => apiClient.get<{ botToken: string }>('/api/auth/challenge'),
  login: (payload: LoginPayload) => apiClient.post<AuthResponse>('/api/auth/login', payload),
  register: (payload: RegisterPayload) =>
    apiClient.post<{ pending: true }>('/api/auth/register', payload),
  googleLogin: (payload: GoogleLoginPayload) =>
    apiClient.post<AuthResponse>('/api/auth/google', payload),
  forgotPassword: (payload: { email: string; botToken?: string; website?: string }) =>
    apiClient.post<{ sent: true }>('/api/auth/forgot-password', payload),
  changePassword: (payload: {
    currentPassword?: string;
    password: string;
    confirmPassword: string;
  }) => apiClient.post<{ user: User }>('/api/auth/change-password', payload),
  me: () => apiClient.get<{ user: User }>('/api/auth/me'),
  updateMe: (payload: { timezone: string }) =>
    apiClient.patch<{ user: User }>('/api/auth/me', payload),
  logout: () => apiClient.post<{ success: boolean }>('/api/auth/logout'),
};
