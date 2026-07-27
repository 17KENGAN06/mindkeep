export type Habit = {
  id: string;
  title: string;
  isActive: boolean;
  createdAt: string;
  completedToday: boolean;
};

export type HabitStats = {
  activeHabits: number;
  completedToday: number;
  totalLogs: number;
  completionRateToday: number;
  streak: number;
};
