import type { Request, Response } from 'express';
import { isStripeConfigured } from '@/config/stripe.js';
import { authService } from '@/services/auth.service.js';
import {
  createCheckoutSession,
  createPortalSession,
  getBillingFlags,
  handleStripeWebhook,
  syncCheckoutSession,
} from '@/services/billing.service.js';
import { getUsageSnapshot } from '@/services/entitlements.service.js';
import { AppError } from '@/utils/AppError.js';
import type { CheckoutInput, SyncCheckoutInput } from '@/validations/billing.schemas.js';

function requireUserId(req: Request): string {
  if (!req.user) {
    throw new AppError('Authentication required', {
      statusCode: 401,
      code: 'UNAUTHORIZED',
    });
  }
  return req.user.id;
}

function isNativeClient(req: Request): boolean {
  return req.get('x-mindkeep-client')?.toLowerCase() === 'native';
}

export class BillingController {
  async status(req: Request, res: Response): Promise<void> {
    const userId = requireUserId(req);
    const [user, usage, flags] = await Promise.all([
      authService.me(userId),
      getUsageSnapshot(userId),
      getBillingFlags(userId),
    ]);
    res.status(200).json({
      configured: isStripeConfigured(),
      plan: user.plan,
      planInterval: user.planInterval,
      planExpiresAt: user.planExpiresAt,
      cancelAtPeriodEnd: user.cancelAtPeriodEnd,
      betaTester: user.betaTester,
      ...flags,
      ...usage,
    });
  }

  async checkout(req: Request, res: Response): Promise<void> {
    const input = req.body as CheckoutInput;
    const result = await createCheckoutSession(
      requireUserId(req),
      input.interval,
      req.header('x-app-language') ?? req.header('accept-language'),
      isNativeClient(req),
    );
    res.status(200).json(result);
  }

  async portal(req: Request, res: Response): Promise<void> {
    const result = await createPortalSession(requireUserId(req), isNativeClient(req));
    res.status(200).json(result);
  }

  async sync(req: Request, res: Response): Promise<void> {
    const input = req.body as SyncCheckoutInput;
    const userId = requireUserId(req);
    await syncCheckoutSession(userId, input.sessionId);
    const user = await authService.me(userId);
    res.status(200).json({ user });
  }

  async webhook(req: Request, res: Response): Promise<void> {
    const signature = req.get('stripe-signature') ?? undefined;
    const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body ?? {}));
    await handleStripeWebhook(raw, signature);
    res.status(200).json({ received: true });
  }
}

export const billingController = new BillingController();
