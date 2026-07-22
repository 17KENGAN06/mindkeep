export type User = {
  id: string;
  name: string;
  email: string;
  timezone: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
  updatedAt: string;
};

export type AuthResponse = {
  user: User;
};

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};
