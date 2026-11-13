import { Linking, Platform } from 'react-native';
import Purchases, { type PurchasesPackage } from 'react-native-purchases';
import { billingApi } from '../../api/billing';
import { env } from '../../config/env';
import type { User } from '../../types/auth';

/**
 * In-app subscriptions (App Store / Google Play) through RevenueCat. Purchases are tied to our
 * user id (Purchases.logIn), and the server re-reads them from RevenueCat — the app never tells
 * the server which plan it bought. Each platform turns on once its public SDK key is set.
 */
const isIos = Platform.OS === 'ios';
const revenueCatKey = isIos
  ? env.revenueCatIosKey
  : Platform.OS === 'android'
    ? env.revenueCatAndroidKey
    : '';
export const inAppPurchasesEnabled = revenueCatKey.length > 0;

/** The plan source a purchase made on this device gets on the server. */
export const deviceStore: 'app_store' | 'play_store' = isIos ? 'app_store' : 'play_store';

const STORE_SUBSCRIPTIONS_URL = isIos
  ? 'https://apps.apple.com/account/subscriptions'
  : 'https://play.google.com/store/account/subscriptions';
/** Terms next to auto-renewing plans: Apple's standard EULA on iOS, the site's terms on Android. */
export const TERMS_URL = isIos
  ? 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/'
  : 'https://mindkeep.cloud/terms';
export const PRIVACY_URL = 'https://mindkeep.cloud/privacy';
/** Suffix for platform-specific strings (iap.legal / iap.legalPlay, …). */
export const storeTextSuffix = isIos ? '' : 'Play';

export type StorePlanId = 'plus' | 'pro';
export type StoreInterval = 'month' | 'year';

export type StoreOffer = {
  plan: StorePlanId;
  interval: StoreInterval;
  priceString: string;
  pkg: PurchasesPackage;
};

// Play reports subscriptions as "<product id>:<base plan id>".
const PRODUCT_PATTERN = /^cloud\.mindkeep\.app\.(plus|pro)\.(monthly|yearly)(?::[\w.-]+)?$/;

let configured = false;
let currentUserId: string | null = null;

function ensureConfigured(): boolean {
  if (!inAppPurchasesEnabled) return false;
  if (!configured) {
    Purchases.configure({ apiKey: revenueCatKey });
    configured = true;
  }
  return true;
}

/** Keeps the RevenueCat user in step with the signed-in account (null = signed out). */
export async function syncPurchasesUser(userId: string | null): Promise<void> {
  if (!ensureConfigured() || userId === currentUserId) return;
  const previous = currentUserId;
  currentUserId = userId;
  try {
    if (userId) {
      await Purchases.logIn(userId);
    } else if (previous && !(await Purchases.isAnonymous())) {
      await Purchases.logOut();
    }
  } catch {
    // Not fatal: purchase and restore log in again before they run.
    currentUserId = previous;
  }
}

async function ensureUser(userId: string): Promise<void> {
  ensureConfigured();
  if (currentUserId !== userId) {
    await Purchases.logIn(userId);
    currentUserId = userId;
  }
}

/** The four plans with store prices (localized by the store). */
export async function loadStoreOffers(): Promise<StoreOffer[]> {
  if (!ensureConfigured()) return [];
  const offerings = await Purchases.getOfferings();
  const offers: StoreOffer[] = [];
  for (const pkg of offerings.current?.availablePackages ?? []) {
    const match = PRODUCT_PATTERN.exec(pkg.product.identifier);
    if (!match) continue;
    offers.push({
      plan: match[1] as StorePlanId,
      interval: match[2] === 'yearly' ? 'year' : 'month',
      priceString: pkg.product.priceString,
      pkg,
    });
  }
  return offers;
}

export type PurchaseOutcome = { status: 'done'; user: User } | { status: 'cancelled' };

/** Buys a plan, then asks the server to re-read the subscription so the plan applies at once. */
export async function buyStoreOffer(userId: string, offer: StoreOffer): Promise<PurchaseOutcome> {
  await ensureUser(userId);
  try {
    await Purchases.purchasePackage(offer.pkg);
  } catch (error) {
    if ((error as { userCancelled?: boolean | null }).userCancelled) return { status: 'cancelled' };
    throw error;
  }
  const result = await billingApi.storeSync();
  return { status: 'done', user: result.user };
}

/** "Restore purchases": re-attaches this store account's subscriptions to our account. */
export async function restoreStorePurchases(userId: string): Promise<User> {
  await ensureUser(userId);
  await Purchases.restorePurchases();
  const result = await billingApi.storeSync();
  return result.user;
}

/** Opens the store's subscription management (cancel, change plan). */
export async function openStoreSubscriptions(): Promise<void> {
  try {
    if (ensureConfigured()) {
      await Purchases.showManageSubscriptions();
      return;
    }
  } catch {
    // Fall back to the App Store page below.
  }
  await Linking.openURL(STORE_SUBSCRIPTIONS_URL);
}

export function isStoreError(error: unknown): error is { message: string; code?: string } {
  return typeof error === 'object' && error !== null && 'message' in error && !('status' in error);
}
