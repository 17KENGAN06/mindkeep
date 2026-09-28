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
- No Face ID / camera / tracking strings (unused permission strings get rejected).
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

## Store listing (English, paste into both consoles)

**Name:** MindKeep

**Subtitle (30 chars):** Tasks, reviews, budget

**Short description (80, Play):** Daily tasks, 3·7·30 reviews, notes, calories, and a simple budget — one account with the site.

**Description:**

MindKeep is a calm daily desk: tasks, spaced reviews on a fixed 3 · 7 · 30 rhythm, notes, calories and water, and a budget that stays in each currency.

Use the same account as mindkeep.cloud. Sign in with email or Google. Data stays on your account, not in a social feed.

Delete the account anytime in Account. That removes your notes, tasks, reviews, finance, and other personal data from our servers.

**Keywords (Apple, comma-separated, 100 chars):** tasks, notes, review, memory, budget, calories, habits, planner, focus

**Category:** Productivity  
**Age:** 4+ / Everyone  
**Price:** Free  
**Ads:** No  
**IAP:** No

Localized name can stay MindKeep. Paste the same description in RU/UK from the website voice if you add extra locales in the consoles.

## Screenshots (you take these on a phone)

Apple, for a phone-only app (`supportsTablet: false`):

- iPhone 6.7" (1320 × 2868 or 1290 × 2796) — 3–10 shots
- iPhone 6.5" — required on some years; take the same frames

Play:

- At least 2, up to 8, JPEG/PNG, 16:9 or 9:16, min 320px on the short side

Suggested frames: Today, Review inbox, Tasks + forest, Fuel, Notes, Account.

Keep a bright first frame. No Expo Go banner.

## Apple privacy nutrition (App Privacy)

| Type | Used | Linked to identity | Tracking |
|------|------|--------------------|----------|
| Email | Yes (account) | Yes | No |
| Name | Yes | Yes | No |
| User content (notes, tasks, materials) | Yes | Yes | No |
| Financial info (budget amounts you enter) | Yes | Yes | No |
| Health (calories, water, weight you enter) | Yes | Yes | No |
| Product interaction | No analytics SDK | — | No |
| Device ID / Advertising | No | — | No |

Purpose: App Functionality. No third-party ads. Hosting: Railway (API/DB), Hostinger (site). Auth: Google if the user taps Google.

## Play Data safety

- Collected: email, name, user-generated content, financial figures the user types, optional health figures the user types.
- Encrypted in transit: yes (HTTPS).
- Users can request deletion: yes, in Account.
- Shared: no sale; processors only to run the service.
- Not used for ads.

## Age questionnaire

Educational / productivity, no social network, no user-to-user chat, no location, no gambling. Expected result: 4+ / Everyone / PEGI 3.

## Export compliance

`ITSAppUsesNonExemptEncryption` is false (HTTPS only). Answer **No** to extra encryption on App Store Connect.

## What you still do by hand

1. Pay Play ($25) and/or Apple ($99) when you want a public listing.
2. Create the apps in Play Console and App Store Connect with bundle `cloud.mindkeep.app`.
3. Take screenshots on a device.
4. Put `ascAppId` into `mobile/eas.json` submit.ios after Apple gives you the numeric id.
5. First iOS build: `eas credentials` (or let EAS generate) once the Apple team exists.
6. After review, swap the “Soon” store badges on the homepage for real store URLs.
7. Push notifications (APNs / FCM) are still later — not required to ship 1.0.

## Review notes (attach if asked)

MindKeep is a personal productivity app. Accounts are email or Google. There is no public feed. Support: https://mindkeep.cloud/contact and kengangenkay@gmail.com. Test account: create one before submit (App Review cannot use your Google login easily — leave a review email+password).
