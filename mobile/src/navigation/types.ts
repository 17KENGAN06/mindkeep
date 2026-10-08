import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

/**
 * The "Sections" stack holds every section: the hub (MoreHome), tasks, review, nutrition,
 * notes, finance, account… Opened from the hub tiles, the dashboard or quick add.
 */
export type MoreStackParamList = {
  MoreHome: undefined;
  // Tasks
  TasksHome: undefined;
  MonthPlan: undefined;
  Forest: { year?: number; month?: number };
  // Review
  ReviewInbox: undefined;
  ReviewCalendar: undefined;
  Materials: undefined;
  MaterialCreate: undefined;
  MaterialEdit: { id: string };
  MaterialDetail: { id: string };
  Categories: undefined;
  // Nutrition
  /** openScan: timestamp from quick add — opens the food scan once per value. */
  Fuel: { openScan?: number } | undefined;
  // Everything else
  Rhythm: undefined;
  Notes: undefined;
  NoteCreate: undefined;
  NoteDetail: { id: string };
  NoteEdit: { id: string };
  Notifications: undefined;
  Finance: undefined;
  Contact: undefined;
  Account: undefined;
  Settings: undefined;
  Guide: undefined;
  Statistics: undefined;
  Blog: undefined;
  BlogArticle: { slug: string };
  Admin: undefined;
  AdminUser: { id: string };
};

/** Former per-section stacks now live in the Sections stack; kept as aliases for screen props. */
export type TasksStackParamList = MoreStackParamList;
export type ReviewStackParamList = MoreStackParamList;

/** Bottom bar: Home (dashboard), Add (quick-add button, no screen), Sections (everything). */
export type AppTabParamList = {
  Today: undefined;
  Add: undefined;
  More: NavigatorScreenParams<MoreStackParamList>;
};
