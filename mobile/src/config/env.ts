const apiUrl = (process.env.EXPO_PUBLIC_API_URL ?? 'https://api.mindkeep.cloud').replace(/\/$/, '');

export const env = {
  apiUrl,
  /**
   * App Store / Google Play build (set only in the EAS `production` profile). Store builds show
   * the plan but no links or calls to action toward buying outside the store (Apple 3.1.1,
   * Play payments policy). Plans bought on the website still apply.
   */
  storeBuild: process.env.EXPO_PUBLIC_STORE_BUILD === 'true',
  /** RevenueCat public iOS SDK key (appl_…, not a secret). Empty = no in-app purchases. */
  revenueCatIosKey: (process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? '').trim(),
  /** RevenueCat public Google Play SDK key (goog_…, not a secret). Empty = no in-app purchases on Android. */
  revenueCatAndroidKey: (process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? '').trim(),
} as const;
