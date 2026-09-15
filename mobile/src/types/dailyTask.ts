export type DailyTask = {
  id: string;
  title: string;
  minutes: number;
  date: string;
  completed: boolean;
  note: string;
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

export type DailyTaskPeriodResponse = {
  period: {
    view: 'month' | 'year';
    year: number;
    month: number | null;
  };
  days: DailyTaskDaySummary[];
  tasks: DailyTask[];
};

export type CreateDailyTaskPayload = {
  title: string;
  minutes: number;
  date: string;
  note?: string;
};
