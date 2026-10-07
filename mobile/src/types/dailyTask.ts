export type DailyTask = {
  id: string;
  title: string;
  minutes: number;
  date: string;
  completed: boolean;
  completedAt?: string | null;
  note: string;
  splitCount?: number;
  splitDone?: number;
  important?: boolean;
};

export type DailyTaskDayResponse = {
  date: string;
  tasks: DailyTask[];
  totals?: {
    total: number;
    completed: number;
    pending: number;
    minutes: number;
    minutesDone: number;
  };
};

export type DailyTaskDaySummary = {
  date: string;
  total: number;
  overdue: number;
  pending: number;
  completed: number;
  minutes: number;
  minutesDone: number;
  important?: number;
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
    view: 'month' | 'year';
    year: number;
    month: number | null;
    from?: string;
    to?: string;
  };
  totals?: {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
    minutes: number;
    minutesDone: number;
  };
  days: DailyTaskDaySummary[];
  byMonth?: DailyTaskMonthSummary[];
  tasks: DailyTask[];
};

export type ForestSummaryResponse = {
  year: number;
  month: number;
  totalCompleted: number;
  completedToday: number;
};

export type CreateDailyTaskPayload = {
  title: string;
  minutes: number;
  date: string;
  note?: string;
};

export type UpdateDailyTaskPayload = {
  title?: string;
  minutes?: number;
  note?: string;
  completed?: boolean;
  important?: boolean;
  splitCount?: number;
  splitDone?: number;
};
