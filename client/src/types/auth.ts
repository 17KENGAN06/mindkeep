export type UserPlan = 'FREE' | 'PLUS' | 'PRO';

export type User = {
  id: string;
  name: string;
  email: string;
  timezone: string;
  role: 'USER' | 'ADMIN';
  hasPassword?: boolean;
  plan?: UserPlan;
  planInterval?: 'MONTH' | 'YEAR' | null;
  planExpiresAt?: string | null;
  cancelAtPeriodEnd?: boolean;
  betaTester?: boolean;
  onboardingCompleted?: boolean;
  enabledModules?: string[];
  createdAt: string;
  updatedAt: string;
};

export type AuthResponse = {
  user: User;
  /** Present for native clients; the website keeps using the httpOnly cookie. */
  token?: string;
  refreshToken?: string;
};

export type AuthDevice = {
  id: string;
  kind: 'browser' | 'native';
  current: boolean;
  createdAt: string;
  expiresAt: string;
};

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};
