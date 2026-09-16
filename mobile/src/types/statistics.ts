export type DashboardStats = {
  activeMaterials: number;
  todayReminders: number;
  overdueReminders: number;
  completedReviews: number;
  unreadNotifications: number;
};

export type DashboardRecentMaterial = {
  id: string;
  title: string;
  status: 'ACTIVE' | 'ARCHIVED';
  learnedAt: string;
  createdAt: string;
  category: { id: string; name: string } | null;
};

export type DashboardResponse = {
  timezone: string;
  stats: DashboardStats;
  recentMaterials: DashboardRecentMaterial[];
};

export type ActivityPoint = {
  date: string;
  count: number;
};

export type ActivityResponse = {
  timezone: string;
  activity: ActivityPoint[];
};
