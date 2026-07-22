import type { Request, Response } from 'express';
import { adminService } from '@/services/admin.service.js';
import type { ModerateReviewInput } from '@/validations/admin.schemas.js';

export class AdminController {
  async overview(_req: Request, res: Response): Promise<void> {
    const overview = await adminService.getOverview();
    res.json({ overview });
  }

  async listUsers(_req: Request, res: Response): Promise<void> {
    const users = await adminService.listUsers();
    res.json({ users });
  }

  async listReviews(_req: Request, res: Response): Promise<void> {
    res.json({ reviews: await adminService.listReviews() });
  }

  async moderateReview(req: Request, res: Response): Promise<void> {
    const review = await adminService.moderateReview(
      req.params.id as string,
      req.body as ModerateReviewInput,
    );
    res.json({ review });
  }
}

export const adminController = new AdminController();
