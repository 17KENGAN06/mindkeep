export type RhythmHabit = {
  id: string;
  title: string;
  sortOrder: number;
  createdAt: string;
  checks: string[];
  done: number;
  target: number;
  lifetime: number;
  formed: boolean;
  streak: number;
};

export type RhythmPeriodResponse = {
  year: number;
  month: number;
  daysInMonth: number;
  today: string;
  cycleDays: number;
  habits: RhythmHabit[];
};
