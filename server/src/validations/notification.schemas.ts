import { z } from 'zod';

export const notificationIdParamsSchema = z.object({
  id: z.string().cuid('Invalid notification id'),
});
