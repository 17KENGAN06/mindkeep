import { apiClient } from './client';
import type { ContactTopic } from '../config/contact';

export type ContactPayload = {
  topic: ContactTopic;
  name: string;
  email: string;
  message: string;
  website?: string;
};

export const contactApi = {
  send: (payload: ContactPayload) => apiClient.post<{ success: boolean }>('/api/contact', payload),
};
