import { apiClient } from '@/api/client';
import type { ActivityResponse, DashboardResponse } from '@/types/statistics';

export const statisticsApi = {
  dashboard: () => apiClient.get<DashboardResponse>('/api/statistics/dashboard'),
  activity: () => apiClient.get<ActivityResponse>('/api/statistics/activity'),
};
