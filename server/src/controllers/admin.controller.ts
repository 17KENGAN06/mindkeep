import type { Request, Response } from 'express';
import { adminService } from '@/services/admin.service.js';
import { AppError } from '@/utils/AppError.js';
import type { SetBetaTesterInput } from '@/validations/admin.schemas.js';

export class AdminController {
  async overview(_req: Request, res: Response): Promise<void> {
    const overview = await adminService.getOverview();
    res.json({ overview });
  }

  async listUsers(_req: Request, res: Response): Promise<void> {
    const users = await adminService.listUsers();
    res.json({ users });
  }

  async listSubscribers(_req: Request, res: Response): Promise<void> {
    res.json({ subscribers: await adminService.listSubscribers() });
  }

  async listBetaTesters(_req: Request, res: Response): Promise<void> {
    res.json({ testers: await adminService.listBetaTesters() });
  }

  async getUserActivity(req: Request, res: Response): Promise<void> {
    const activity = await adminService.getUserActivity(req.params.id as string);
    res.json({ activity });
  }

  async setBetaTester(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new AppError('Authentication required', {
        statusCode: 401,
        code: 'UNAUTHORIZED',
      });
    }

    const body = req.body as SetBetaTesterInput;
    const user = await adminService.setBetaTester(req.params.id as string, body.betaTester, req.user.id);
    res.json({ user });
  }

  async listAudit(_req: Request, res: Response): Promise<void> {
    res.json({ events: await adminService.listAuditEvents() });
  }
}

export const adminController = new AdminController();
