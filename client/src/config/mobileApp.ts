/** The Android app on Google Play. Pure module: the build-time prerender imports it too. */
export const GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/details?id=cloud.mindkeep.app';

/** Where on the site a store link sits; Play Console shows it as the traffic source. */
export type StorePlacement = 'home' | 'app' | 'footer' | 'strip' | 'settings' | 'banner';

/** Store page in the site language; `referrer` lets Play Console tell the placements apart. */
export function googlePlayUrl(placement: StorePlacement, lang: string): string {
  const referrer = encodeURIComponent(`utm_source=mindkeep.cloud&utm_medium=${placement}`);
  return `${GOOGLE_PLAY_URL}&hl=${encodeURIComponent(lang)}&referrer=${referrer}`;
}
