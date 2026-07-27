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

export type OverviewResponse = {
  timezone: string;
  reviews: DashboardStats;
  planner: {
    totalTasks: number;
    completedOccurrences: number;
    overdueOccurrences: number;
    pendingOccurrences: number;
    completedToday: number;
    completionRate: number;
    streak: number;
  };
  habits: {
    activeHabits: number;
    completedToday: number;
    totalLogs: number;
    completionRateToday: number;
    streak: number;
  };
  budget: {
    currentBalance: number;
    monthIncome: number;
    monthExpenses: number;
    mandatoryPaid: number;
    mandatoryTotal: number;
    displayCurrency: 'RUB' | 'USD' | 'EUR' | 'UAH';
  };
  nextReminder: DashboardNextReminder;
  recentMaterials: DashboardRecentMaterial[];
};
