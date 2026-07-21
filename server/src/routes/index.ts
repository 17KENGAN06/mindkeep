import { Router } from 'express';
import { authRouter } from '@/routes/auth.routes.js';
import { categoryRouter } from '@/routes/category.routes.js';
import { cronRouter } from '@/routes/cron.routes.js';
import { healthRouter } from '@/routes/health.routes.js';
import { materialRouter } from '@/routes/material.routes.js';
import { notificationRouter } from '@/routes/notification.routes.js';
import { reminderRouter } from '@/routes/reminder.routes.js';
import { statisticsRouter } from '@/routes/statistics.routes.js';

export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/categories', categoryRouter);
apiRouter.use('/materials', materialRouter);
apiRouter.use('/reminders', reminderRouter);
apiRouter.use('/notifications', notificationRouter);
apiRouter.use('/statistics', statisticsRouter);
apiRouter.use('/internal/cron', cronRouter);
