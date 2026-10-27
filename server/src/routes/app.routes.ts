import { Router } from 'express';
import { appVersionPolicy } from '@/config/appVersion.js';

export const appRouter = Router();

/** Public: the native app asks which store builds are required / newest (update prompt). */
appRouter.get('/version', (_req, res) => {
  res.set('Cache-Control', 'no-store');
  res.status(200).json(appVersionPolicy());
});
