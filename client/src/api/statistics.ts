import { apiClient } from '@/api/client';
import type { ActivityResponse, DashboardResponse, OverviewResponse } from '@/types/statistics';

export const statisticsApi = {
  dashboard: () => apiClient.get<DashboardResponse>('/api/statistics/dashboard'),
  activity: () => apiClient.get<ActivityResponse>('/api/statistics/activity'),
  overview: () => apiClient.get<OverviewResponse>('/api/statistics/overview'),
};
