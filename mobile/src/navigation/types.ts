import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type ReviewStackParamList = {
  ReviewInbox: undefined;
  ReviewCalendar: undefined;
  Materials: undefined;
  MaterialCreate: undefined;
  MaterialEdit: { id: string };
  MaterialDetail: { id: string };
  Categories: undefined;
};

export type TasksStackParamList = {
  TasksHome: undefined;
  MonthPlan: undefined;
  Forest: { year?: number; month?: number };
};

export type MoreStackParamList = {
  MoreHome: undefined;
  Notes: undefined;
  NoteCreate: undefined;
  NoteDetail: { id: string };
  NoteEdit: { id: string };
  Notifications: undefined;
  Finance: undefined;
  Contact: undefined;
  Guide: undefined;
  Statistics: undefined;
  Blog: undefined;
  BlogArticle: { slug: string };
  Admin: undefined;
};

export type AppTabParamList = {
  Today: undefined;
  Review: NavigatorScreenParams<ReviewStackParamList>;
  Tasks: NavigatorScreenParams<TasksStackParamList>;
  Fuel: undefined;
  More: NavigatorScreenParams<MoreStackParamList>;
};
