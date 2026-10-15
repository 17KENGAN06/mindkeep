# MindKeep — App Store and Play Store

The Expo app is store-shaped. You still need developer accounts, screenshots from a real phone, and a paid Apple team before a live listing. Do **not** wrap the website in Capacitor.

| ID | Value |
|----|--------|
| Name | MindKeep |
| Bundle / package | `cloud.mindkeep.app` |
| EAS project | `e3304cc5-f62e-4cd8-b580-ed47b2b6c118` |
| API | `https://api.mindkeep.cloud` |
| Privacy | https://mindkeep.cloud/privacy |
| Support | https://mindkeep.cloud/contact |
| Marketing | https://mindkeep.cloud |
| Scheme | `mindkeep://` (Google sign-in return) |

## What is already in the repo

- Production EAS profile: Android **AAB**, iOS store binary, `EXPO_PUBLIC_API_URL` baked in.
- Preview profile: Android **APK** for sideload (`npm run build:apk -w mindkeep-mobile`).
- Icons, adaptive icon, splash, encryption export `ITSAppUsesNonExemptEncryption = false`.
- Camera and photo library permission strings only (food / receipt photos); no Face ID, location or tracking strings.
- In-app **account deletion** (Apple 5.1.1(v) and Play account-deletion policy).
- Device list + session revoke.
- Privacy policy text that matches deletion.

## Commands (when you are ready)

From `mobile/`:

```text
npx eas login
npx eas build -p android --profile production
npx eas build -p ios --profile production
```

Or: `npm run build:store -w mindkeep-mobile`.

Submit drafts (does not publish until you press Review):

```text
npm run submit:android -w mindkeep-mobile
npm run submit:ios -w mindkeep-mobile
```

iOS submit needs an App Store Connect app and `ascAppId` in `eas.json` after you create it.

## Accounts you pay for (not in this repo)

1. **Google Play** — one-time ~$25. Create app `cloud.mindkeep.app`, complete Data safety, content rating (IARC), store listing, then upload the AAB.
2. **Apple Developer** — $99 / year. Create the identifier `cloud.mindkeep.app`, App Store Connect listing, then EAS can use remote credentials. Until then, iOS stays on Expo Go / simulator.

EAS can keep Android keystore and iOS certs in the cloud. Do not download and commit them.

## Google Cloud (already used for web)

For the **standalone** app, add this Authorized redirect URI to the same Web client as the site:

`https://api.mindkeep.cloud/api/auth/google/callback`

Store builds return to `mindkeep://google`. The API already allows the `mindkeep:` scheme. Expo Go keep using `exp://` / `exps://`.

## Listing texts, privacy forms, age rating, review notes

All paste-ready content (EN + RU listing, Apple App Privacy, Play Data safety, age rating, review notes, pre-submit checklist) lives in [store-listing.md](store-listing.md). It replaces the older drafts that were here.

## Status (2026-10-15)

- iOS: App Store Connect app "MindKeep: Planner & Habits" (Apple ID 6821462960), TestFlight builds 1.0.3 up to build 6.
- Android: Play Console app pending developer verification; preview APK 1.0.3 built.
- Store builds hide prices and website purchase links (`EXPO_PUBLIC_STORE_BUILD`); reviewer login via `REVIEW_LOGIN_EMAIL` / `REVIEW_LOGIN_CODE`; Sign in with Apple is live with token revocation.
