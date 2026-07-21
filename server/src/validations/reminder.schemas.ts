import { ReminderStatus } from '@prisma/client';
import { z } from 'zod';

export const reminderIdParamsSchema = z.object({
  id: z.string().cuid('Invalid reminder id'),
});

export const listRemindersQuerySchema = z.object({
  status: z.nativeEnum(ReminderStatus).optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const calendarQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});

export type ListRemindersQuery = z.infer<typeof listRemindersQuerySchema>;
export type CalendarQuery = z.infer<typeof calendarQuerySchema>;
