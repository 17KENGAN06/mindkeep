import type { Request, Response } from 'express';
import { contactService } from '@/services/contact.service.js';
import { assertBotProtection } from '@/services/botProtection.service.js';
import type { SendContactInput } from '@/validations/contact.schemas.js';

export class ContactController {
  async send(req: Request, res: Response): Promise<void> {
    const body = req.body as SendContactInput;
    assertBotProtection({
      botToken: body.botToken,
      website: body.website,
    });
    await contactService.send(body);
    res.status(200).json({ success: true });
  }
}

export const contactController = new ContactController();
