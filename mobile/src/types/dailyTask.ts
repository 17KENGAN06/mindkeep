export type DailyTask = {
  id: string;
  title: string;
  minutes: number;
  date: string;
  completed: boolean;
  note: string;
  splitCount?: number;
  splitDone?: number;
};

export type DailyTaskDayResponse = {
  date: string;
  tasks: DailyTask[];
};

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
    view: 'month' | 'year';
    year: number;
    month: number | null;
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
  splitCount?: number;
  splitDone?: number;
};
