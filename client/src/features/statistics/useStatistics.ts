import { useQuery } from '@tanstack/react-query';
import { statisticsApi } from '@/api/statistics';

export function useDashboardStatistics() {
  return useQuery({
    queryKey: ['statistics', 'dashboard'],
    queryFn: () => statisticsApi.dashboard(),
  });
}

export function useActivityStatistics() {
  return useQuery({
    queryKey: ['statistics', 'activity'],
    queryFn: () => statisticsApi.activity(),
  });
}

export function useOverviewStatistics() {
  return useQuery({
    queryKey: ['statistics', 'overview'],
    queryFn: () => statisticsApi.overview(),
  });
}
