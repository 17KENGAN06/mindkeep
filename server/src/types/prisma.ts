export type {
  User,
  Category,
  LearningMaterial,
  ReviewReminder,
  Notification,
  MaterialStatus,
  ReminderStatus,
  ReminderIntervalType,
  NotificationType,
} from '@prisma/client';

export {
  MaterialStatus as MaterialStatusEnum,
  ReminderStatus as ReminderStatusEnum,
  ReminderIntervalType as ReminderIntervalTypeEnum,
  NotificationType as NotificationTypeEnum,
} from '@prisma/client';
