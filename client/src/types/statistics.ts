export type DashboardStats = {
  activeMaterials: number;
  todayReminders: number;
  overdueReminders: number;
  completedReviews: number;
  unreadNotifications: number;
};

export type DashboardNextReminder = {
  id: string;
  scheduledAt: string;
  sequenceNumber: number;
  status: 'PENDING' | 'COMPLETED' | 'OVERDUE' | 'SKIPPED';
  intervalType: 'THREE_DAYS' | 'SEVEN_DAYS' | 'THIRTY_DAYS';
  material: {
    id: string;
    title: string;
    category: { id: string; name: string } | null;
  };
} | null;

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
  nextReminder: DashboardNextReminder;
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
