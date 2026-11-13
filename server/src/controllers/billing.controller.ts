import type { Request, Response } from 'express';
import { isPlusStripeConfigured, isStripeConfigured } from '@/config/stripe.js';
import { authService } from '@/services/auth.service.js';
import {
  createCheckoutSession,
  createPortalSession,
  getBillingFlags,
  handleStripeWebhook,
  schedulePlanChange,
  clearScheduledPlanChange,
  cancelSubscriptionAtPeriodEnd,
  resumeSubscription,
  syncCheckoutSession,
} from '@/services/billing.service.js';
import { getUsageSnapshot } from '@/services/entitlements.service.js';
import { handleRevenueCatWebhook, syncStoreSubscription } from '@/services/revenuecat.service.js';
import { AppError } from '@/utils/AppError.js';
import type { ChangePlanInput, CheckoutInput, SyncCheckoutInput } from '@/validations/billing.schemas.js';

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
      plusConfigured: isPlusStripeConfigured(),
      plan: user.plan,
      planInterval: user.planInterval,
      planExpiresAt: user.planExpiresAt,
      cancelAtPeriodEnd: user.cancelAtPeriodEnd,
      planSource: user.planSource,
      betaTester: user.betaTester,
      ...flags,
      ...usage,
    });
  }

  async checkout(req: Request, res: Response): Promise<void> {
    const input = req.body as CheckoutInput;
    // Paid through the App Store / Play: a second (web) subscription would charge twice.
    const current = await authService.me(requireUserId(req));
    if (current.planSource === 'app_store' || current.planSource === 'play_store') {
      throw new AppError('The plan is managed in the app store', {
        statusCode: 409,
        code: 'STORE_SUBSCRIPTION_ACTIVE',
        details: { planSource: current.planSource },
      });
    }
    const result = await createCheckoutSession(
      requireUserId(req),
      input.interval,
      req.header('x-app-language') ?? req.header('accept-language'),
      isNativeClient(req),
      input.plan,
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

  async change(req: Request, res: Response): Promise<void> {
    const input = req.body as ChangePlanInput;
    await schedulePlanChange(requireUserId(req), input.plan, input.interval);
    res.status(200).json({ ok: true });
  }

  async clearChange(req: Request, res: Response): Promise<void> {
    await clearScheduledPlanChange(requireUserId(req));
    res.status(200).json({ ok: true });
  }

  async cancel(req: Request, res: Response): Promise<void> {
    await cancelSubscriptionAtPeriodEnd(requireUserId(req));
    res.status(200).json({ ok: true });
  }

  async resume(req: Request, res: Response): Promise<void> {
    await resumeSubscription(requireUserId(req));
    res.status(200).json({ ok: true });
  }

  /** After an in-app purchase or restore: re-read the store subscription now (the webhook may lag). */
  async storeSync(req: Request, res: Response): Promise<void> {
    const userId = requireUserId(req);
    await syncStoreSubscription(userId);
    const user = await authService.me(userId);
    res.status(200).json({ user });
  }

  async revenueCatWebhook(req: Request, res: Response): Promise<void> {
    const result = await handleRevenueCatWebhook(req.get('authorization') ?? undefined, req.body);
    res.status(200).json({ received: true, ...result });
  }

  async webhook(req: Request, res: Response): Promise<void> {
    const signature = req.get('stripe-signature') ?? undefined;
    const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body ?? {}));
    await handleStripeWebhook(raw, signature);
    res.status(200).json({ received: true });
  }
}

export const billingController = new BillingController();
