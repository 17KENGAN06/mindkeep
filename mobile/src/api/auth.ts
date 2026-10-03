import { apiClient } from './client';
import type { AuthDevice, AuthResponse, User } from '../types/auth';

export type LoginPayload = {
  email: string;
  password: string;
  locale?: string;
  botToken?: string;
  website?: string;
};

export type LoginCodePayload = {
  email: string;
  code: string;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  timezone?: string;
  locale?: string;
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
  login: (payload: LoginPayload) => apiClient.post<{ pending: true }>('/api/auth/login', payload),
  confirmLogin: (payload: LoginCodePayload) =>
    apiClient.post<AuthResponse>('/api/auth/login/code', payload),
  register: (payload: RegisterPayload) =>
    apiClient.post<{ pending: true }>('/api/auth/register', payload),
  googleLogin: (payload: GoogleLoginPayload) =>
    apiClient.post<AuthResponse>('/api/auth/google', payload),
  forgotPassword: (payload: { email: string; locale?: string; botToken?: string; website?: string }) =>
    apiClient.post<{ sent: true }>('/api/auth/forgot-password', payload),
  changePassword: (payload: {
    currentPassword?: string;
    password: string;
    confirmPassword: string;
  }) => apiClient.post<{ user: User }>('/api/auth/change-password', payload),
  me: () => apiClient.get<{ user: User }>('/api/auth/me'),
  updateMe: (payload: { timezone: string }) =>
    apiClient.patch<{ user: User }>('/api/auth/me', payload),
  logout: (payload?: { refreshToken?: string }) =>
    apiClient.post<{ success: boolean }>('/api/auth/logout', payload),
  sessions: () => apiClient.get<{ sessions: AuthDevice[] }>('/api/auth/sessions'),
  revokeSession: (id: string) => apiClient.delete<{ success: boolean }>(`/api/auth/sessions/${id}`),
  deleteAccount: (payload: { password?: string; confirm: 'DELETE' }) =>
    apiClient.post<{ deleted: true }>('/api/auth/delete-account', payload),
};
