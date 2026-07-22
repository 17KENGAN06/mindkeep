import type { Request, Response } from 'express';
import { adminService } from '@/services/admin.service.js';

export class AdminController {
  async overview(_req: Request, res: Response): Promise<void> {
    const overview = await adminService.getOverview();
    res.json({ overview });
  }

  async listUsers(_req: Request, res: Response): Promise<void> {
    const users = await adminService.listUsers();
    res.json({ users });
  }
}

export const adminController = new AdminController();
