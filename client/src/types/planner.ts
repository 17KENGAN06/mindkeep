export type TaskRecurrenceType = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM_DAYS';
export type TaskOccurrenceStatus = 'PENDING' | 'COMPLETED' | 'OVERDUE' | 'CANCELLED';

export type TaskCategory = {
  id: string;
  name: string;
  _count?: { tasks: number };
};

export type TaskOccurrence = {
  id: string;
  dueDate: string;
  status: TaskOccurrenceStatus;
  completedAt: string | null;
  taskId: string;
  dateKey: string;
  weekday: number;
  daysOverdue: number;
  task: {
    id: string;
    title: string;
    recurrenceType: TaskRecurrenceType;
    intervalDays: number | null;
    isActive: boolean;
    category: { id: string; name: string } | null;
  };
};

export type PlannerFilter =
  | 'today'
  | 'tomorrow'
  | 'week'
  | 'month'
  | 'overdue'
  | 'completed'
  | 'pending'
  | 'all';

export type PlannerStats = {
  totalTasks: number;
  completedOccurrences: number;
  overdueOccurrences: number;
  pendingOccurrences: number;
  completedToday: number;
  completionRate: number;
  streak: number;
};
