export type DailyTask = {
  id: string;
  title: string;
  minutes: number;
  date: string;
  completed: boolean;
  completedAt: string | null;
  note: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
};

export type DailyTaskView = 'month' | 'year';

export type DailyTaskDaySummary = {
  date: string;
  total: number;
  overdue: number;
  pending: number;
  completed: number;
  minutes: number;
  minutesDone: number;
};

export type DailyTaskMonthSummary = {
  month: number;
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  minutes: number;
  minutesDone: number;
};

export type DailyTaskPeriodResponse = {
  period: {
    view: DailyTaskView;
    year: number;
    month: number | null;
    from: string;
    to: string;
  };
  totals: {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
    minutes: number;
    minutesDone: number;
  };
  days: DailyTaskDaySummary[];
  byMonth: DailyTaskMonthSummary[];
  tasks: DailyTask[];
};

export type DailyTaskDayResponse = {
  date: string;
  tasks: DailyTask[];
  totals: {
    total: number;
    completed: number;
    pending: number;
    minutes: number;
    minutesDone: number;
  };
};

export type DailyTaskPeriodParams = {
  view: DailyTaskView;
  year: number;
  month?: number;
};

export type ForestSummaryResponse = {
  year: number;
  month: number;
  totalCompleted: number;
  completedToday: number;
};
