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
  MaterialDetail: { id: string };
  Categories: undefined;
};

export type MoreStackParamList = {
  MoreHome: undefined;
  Notes: undefined;
  NoteCreate: undefined;
  NoteDetail: { id: string };
  NoteEdit: { id: string };
  Notifications: undefined;
  Finance: undefined;
};

export type AppTabParamList = {
  Today: undefined;
  Review: NavigatorScreenParams<ReviewStackParamList>;
  Tasks: undefined;
  Fuel: undefined;
  More: NavigatorScreenParams<MoreStackParamList>;
};
