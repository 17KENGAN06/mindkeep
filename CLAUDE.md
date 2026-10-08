# CLAUDE.md — MindKeep

Practical guide for Claude Code sessions in this repo. MindKeep is a **live production app with real users and paid subscriptions**. Read the working rules first.

## Working rules (always apply)

1. Never make large architectural changes without explaining them first.
2. Preserve existing working functionality unless the user explicitly asks to change it.
3. Before modifying multiple important files, explain the planned changes.
4. Never delete functionality just to solve an error without asking the user.
5. Never expose, print, commit, or hardcode secrets or API keys (no `.env` contents in output, commits, or code).
6. Do not automatically commit or push changes unless the user explicitly asks.
   - This **overrides** `.cursor/rules/push-and-dist.mdc` (a Cursor rule that auto-commits/pushes/builds). Ignore that rule here.
7. Prefer small, focused changes that are easy to review and revert.
8. After significant changes, run the relevant checks/builds when possible (see Commands).
9. Treat the existing production application and user data as important — be careful with Prisma migrations, auth, billing and deletion logic.
10. If uncertain about an existing implementation, inspect it before changing it.

## What this is

npm-workspaces monorepo (historical name "learning-reminder", product name **MindKeep**). Started as a fixed 3 / 7 / 30-day spaced-review app; now a personal "daily desk": reviews (materials + categories), daily tasks + "forest", notes, nutrition (calories, water, steps, weight, macros, Gemini food scan), multi-currency budget, habits ("rhythm"), notifications, statistics, blog/guide, admin panel, paid plans (Free / Plus / Pro).

| Workspace | Package name | Purpose |
|---|---|---|
| `server/` | `learning-reminder-server` | Express REST API + Prisma/Postgres. Single backend for web and mobile. |
| `client/` | `learning-reminder-client` | React SPA for mindkeep.cloud (static, hosted on Hostinger). |
| `mobile/` | `mindkeep-mobile` | Expo / React Native app for iOS + Android. Native UI — **not** a wrapper of the website (do not introduce Capacitor/WebView). |

Other: `docs/store-release.md` (store listing / privacy answers), `docs/ios-app.md` (mobile plan, Russian, partly outdated), `deploy/railway-cron.http`.

## Tech stack

- **server**: Node ≥20, TypeScript ~5.9 (ESM, `@/` path alias via `tsc-alias`), Express 5, Prisma 6 + PostgreSQL, Zod 4, jsonwebtoken (HS256), bcrypt, helmet, express-rate-limit, node-cron, Stripe SDK, google-auth-library, Resend (email), Gemini (food/receipt scan).
- **client**: React 19, Vite 8, TypeScript ~6.0, Tailwind 4, React Router 7, TanStack Query 5, react-hook-form + Zod, i18next, motion, react-markdown.
- **mobile**: Expo SDK 57, React Native 0.86 (New Architecture), React Navigation 7 (bottom tabs + native stacks), TanStack Query 5, expo-secure-store, expo-web-browser, expo-linking, i18next.
- **i18n**: 9 locales in both client and mobile (`ru, uk, en, fi, de, es, fr, it, pl`) — JSON files are **duplicated** per app; update both when adding strings.

## Commands

Run from repo root unless noted.

```bash
npm install                                   # installs all workspaces (runs prisma generate)
npm run dev                                   # server + client together
npm run dev:server                            # API on :4000 (tsx watch)
npm run dev:client                            # Vite on :5173 (proxies /api to :4000)
npm run dev:mobile                            # Expo (Expo Go / dev)
npm run build                                 # client + server
npm run lint                                  # ESLint client + server
npm run test -w learning-reminder-server      # server tests (node --test via tsx; list is explicit in server/package.json)
npm run prisma:migrate -w learning-reminder-server   # dev migration (creates migration)
npm run prisma:deploy  -w learning-reminder-server   # apply migrations
npm run prisma:status  -w learning-reminder-server
```

- New server test files must be **added to the `test` script list** in `server/package.json` — it does not glob.
- Client has no tests; mobile has no tests, lint or typecheck script. For mobile type checks use `npx tsc --noEmit` inside `mobile/`.
- Mobile builds (EAS, from `mobile/`): `npm run build:apk` (preview APK), `build:android` / `build:ios` / `build:store` (production), `submit:android` / `submit:ios`. These hit EAS cloud — only run when the user asks.
- Hostinger web dist (only when the user asks): set `VITE_API_URL=https://api.mindkeep.cloud`, `npm run build -w client`, copy `client/public/.htaccess` into `client/dist/`. The user uploads `client/dist` manually.
- No CI exists (only Dependabot). Checks must be run locally.

## Server structure

`route → middleware → controller → service → Prisma`

- `src/app.ts` — middleware order: helmet → CORS → **Stripe webhook (raw body, registered before JSON parser)** → JSON (1 MB; 3 MB for `/api/nutrition/scan`) → cookies → global rate limit → `requireSameOrigin` (CSRF) → `/api` router.
- `src/routes/*.routes.ts`, `src/controllers/*`, `src/services/*`, `src/validations/*.schemas.ts` (Zod, applied with `validate(schema, 'body'|'params'|'query')`).
- `src/config/env.ts` — Zod-validated env; `assertRequiredSecrets()` refuses to boot in production without `JWT_SECRET` (≥32), `DATABASE_URL`, `CRON_SECRET` (≥16).
- Errors: throw `AppError(message, { statusCode, code, details })`; responses look like `{ error: { code, message, details } }`. Clients map on `code`.
- Ownership: use helpers in `src/utils/owned.ts`; every resource is scoped to `req.user.id` (see `ownership.idor.test.ts`).
- Plan limits: `src/config/entitlements.ts` (`FREE_LIMITS`, `throwPlanLimit` → 403 `PLAN_LIMIT`) + `services/entitlements.service.ts`. Enforce limits on the server, never only in UI.
- Jobs: `jobs/reminderJob.ts` (hourly due/overdue + in-app notifications). Production triggers it via Railway Cron → `POST /api/internal/cron/reminders` with header `x-cron-secret`. `ENABLE_NODE_CRON=true` runs it in-process (local only).
- Empty `src/modules/*` folders are leftover scaffolding.

## Communication: web ↔ API ↔ mobile

All apps call the same REST API (`/api/*`, production `https://api.mindkeep.cloud`).

- **Web**: `client/src/api/client.ts`. Auth via httpOnly cookie; sends `X-Requested-With: learning-reminder`, `X-App-Language`; 12 s timeout. Base URL from build-time `VITE_API_URL`.
- **Mobile**: `mobile/src/api/client.ts`. Sends `Authorization: Bearer <token>`, `X-Requested-With: learning-reminder`, `X-Mindkeep-Client: native`, `X-App-Language`. On 401 calls `/api/auth/refresh` once (single-flight) and retries. Base URL from `EXPO_PUBLIC_API_URL` (baked in by `eas.json`; default prod).
- API types are hand-duplicated in `client/src/types` and `mobile/src/types` — keep in sync when changing response shapes. Mobile users run older builds, so **API changes must stay backward compatible** (add fields, don't rename/remove).

## Authentication

- `requireAuth` (`middleware/auth.middleware.ts`) reads the JWT from `Authorization: Bearer` (wins) or the `access_token` cookie, verifies HS256, then requires an active, non-revoked `AuthSession` row matching the token `jti`. Logout/revoke = revoke the session row.
- **Browser vs native** is decided in `utils/authSession.ts`: request with an allowed browser `Origin` → cookie only, 7-day access token. No allowed Origin → JSON `{ user, token, refreshToken }`, **15-minute access token + rotating refresh token** (hash stored in `AuthSession.refreshTokenHash`).
- Mobile stores tokens in SecureStore (Keychain/Keystore) — `mobile/src/features/auth/session.ts`.
- Password login is two-step: `POST /auth/login` validates the password and **emails a one-time code**; `POST /auth/login/code` issues the session. Registration also uses an emailed code (Resend). Resend outage = no email login.
- Google: web uses Google Identity. Mobile calls `POST /api/auth/google/mobile-start` (gets the authorize URL + a one-time flow secret) → system browser → `/google/callback` → `/google/finish` → returns to `mindkeep://google?code=…` → app exchanges code + flow secret at `POST /api/auth/google`. Uses `GoogleSignInTicket`. Production accepts only `mindkeep://` return URLs, so **Google sign-in cannot be tested in Expo Go against production** (the app shows `auth.errors.googleNeedsApp`); test it in an APK. Refused return URLs are logged by scheme. Expo Go also sends `okhttp/4.12.0`, so the user agent does not tell Expo Go from the APK.
- Bot protection: `GET /auth/challenge` token required on signup flows.
- CSRF (`requireSameOrigin`): unsafe methods need an allowed Origin, or no Origin + `X-Requested-With: learning-reminder`. Cron and Stripe webhook are exempt.
- Admin: `role=ADMIN` or email in `ADMIN_EMAILS` (auto-promoted). `MAINTENANCE_MODE=true` locks out non-admins.
- Account deletion (`POST /auth/delete-account`) cancels Stripe and cascades all user data — required for store policies; do not remove.

## Database / storage

- PostgreSQL via Prisma; schema `server/prisma/schema.prisma`, migrations in `server/prisma/migrations` (applied automatically on prod start by `scripts/start-prod.mjs` with a 45 s timeout).
- Main models: `User` (plan + Stripe fields, `enabledModules`, timezone), `AuthSession`, `EmailToken`, `GoogleSignInTicket`, `Category`, `LearningMaterial`, `ReviewReminder`, `Notification`, `DailyTask`, `Note`, `NutritionSettings`/`Meal`/`WaterDay`/`StepsDay`/`WeightDay`, `Habit`/`HabitLog`, `BudgetSettings`/`BudgetCategory`/`BudgetOperation`/`ExchangeRate`, `StripeEvent`, `AdminAuditEvent`.
- Migrations: always create new ones with `prisma migrate dev`; never edit already-applied migrations; avoid destructive column drops on production data without discussing it.
- Dates: day-based records are sent as `YYYY-MM-DD` and stored at **UTC noon**. "Today", overdue and date defaults use the account IANA `User.timezone` on server, web and mobile (`useAccountToday` in `client/src/features/time` and `mobile/src/features/time`; zone helpers in each app's `utils/date.ts`). Clients never change the account zone silently — they only suggest the device/browser zone (`TimezoneSuggestion`). Review dates (3/7/30 from `learnedAt`) are computed **only on the server** (`reviewScheduleService`); completing/skipping never reschedules.
- Client-side storage: web uses cookies + localStorage for UI prefs; mobile uses SecureStore for tokens and AsyncStorage for theme/language. No offline data store.

## Payments (Stripe)

- Website-first Stripe Checkout + Customer Portal. Code: `config/stripe.ts`, `services/billing.service.ts`, `controllers/billing.controller.ts`, `routes/billing.routes.ts`.
- Plans: `FREE`, `PLUS` (limits lifted, no scan), `PRO` (scan). Monthly/yearly. Legacy `STRIPE_PRICE_MONTHLY/YEARLY` IDs are still treated as Pro.
- Webhook `POST /api/billing/webhook` (raw body, signature verified, idempotent via `StripeEvent`). Events: `checkout.session.completed`, `customer.subscription.created|updated|deleted`, `invoice.paid`, `invoice.payment_failed`.
- Production only accepts **live** keys (`sk_live_`/`rk_live_`); test keys are ignored when `NODE_ENV=production`.
- Native clients get return URLs under `CLIENT_URL/billing/return` (`X-Mindkeep-Client: native`).
- Mobile `features/billing/BillingCard.tsx` shows no prices; it links to the website plans page and the Stripe portal, and store builds hide both (see store blocker 1).
- `planForPriceId` defaults unknown price IDs to `PRO` — be careful when changing prices.

## Deployment

- **API + Postgres**: Railway, Nixpacks, Node 20. `server/railway.toml` (Root Directory = `server`) or root `railway.toml` (Root Directory empty) — check which one Railway uses before editing. Start = `npm run start:prod` (migrate deploy → `dist/server.js`). Health check `/api/health`.
- **Cron**: Railway Cron hourly → `/api/internal/cron/reminders`.
- **Web**: static `client/dist` uploaded manually to Hostinger `public_html` with `client/public/.htaccess` (SPA rewrite + security headers + CSP). The CSP `connect-src` must include any new API/third-party origin. (`client/railway.toml` exists as an alternative.)
- **Mobile**: EAS Build/Submit, EAS project `e3304cc5-f62e-4cd8-b580-ed47b2b6c118`, owner `17kengan06`.

## Android / iOS setup (mobile/)

- Navigation (`mobile/src/navigation`): bottom bar = **Home** (`TodayScreen`) · **+** (quick-add sheet, `features/quickAdd`) · **Sections** (`MoreNavigator`: hub `MoreScreen` with module tiles, plus every section screen — tasks, review, nutrition, notes, finance, account…). To open a section from another tab use `navigate('More', { screen, initial: false })` so the hub stays underneath. `TasksStackParamList`/`ReviewStackParamList` are aliases of `MoreStackParamList`.
- Expo **managed** workflow: `android/` and `ios/` are generated by EAS and gitignored — configure via `app.json` / config plugins, not native folders.
- `app.json`: name MindKeep, scheme `mindkeep`, bundle/package `cloud.mindkeep.app`, iPhone only (`supportsTablet: false`), `ITSAppUsesNonExemptEncryption: false`, adaptive + monochrome icons, `expo-build-properties` (Android min 24 / target 36 / compile 36; iOS deployment target 16.4).
- `eas.json`: `preview` → Android APK (internal); `production` → AAB + iOS store build, `autoIncrement`, `appVersionSource: local`; Android submit → internal track draft. iOS submit lacks `ascAppId`.
- `metro.config.js` is customized for the monorepo (hand-maps root + nested `node_modules`). The root `package-lock.json` is the real lockfile; `mobile/package-lock.json` is a stale leftover from the first mobile commit (it lacks later deps such as `expo-linking`). Handle both carefully.
- Permissions: **camera + photo library** only, via `expo-image-picker` (food/receipt scan; `microphonePermission: false` blocks `RECORD_AUDIO`; storage permissions only up to Android 12). No location, push or tracking — do not add permission strings that aren't used. Store forms (Play Data safety, App Privacy) must mention photos sent to the server and Gemini for scans.
- Status: works via Expo Go / preview APK (1.0.1, versionCode 2: Google sign-in verified on a real Android phone). No standalone iOS build has been made yet (Windows host — iOS builds go through EAS cloud + TestFlight). Google Play Console and Apple Developer accounts both exist and are paid (as of 2026-10-08); the apps themselves are not created/submitted yet.

## Environment variables (names only — never commit values)

Templates: `.env.example`, `server/.env.example`, `client/.env.example`, `mobile/.env.example`. Real `.env` files are gitignored.

- **server**: `DATABASE_URL`, `JWT_SECRET`, `CRON_SECRET`, `NODE_ENV`, `PORT`, `CLIENT_URL`, `CLIENT_URLS`, `API_PUBLIC_URL`, `ENABLE_NODE_CRON`, `MAINTENANCE_MODE`, `ADMIN_EMAILS`, `REVIEW_LOGIN_EMAIL`, `REVIEW_LOGIN_CODE`, `GOOGLE_CLIENT_ID`, `EMAIL_FROM`, `RESEND_API_KEY`, `TELEGRAM_BOT_TOKEN` (unused), `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_YEARLY`, `STRIPE_PRICE_PLUS_MONTHLY`, `STRIPE_PRICE_PLUS_YEARLY`, `STRIPE_PRICE_PRO_MONTHLY`, `STRIPE_PRICE_PRO_YEARLY`, `GEMINI_API_KEY`, `GEMINI_MODEL`.
- **client (build-time, public)**: `VITE_API_URL`, `VITE_GOOGLE_CLIENT_ID`, `VITE_MAINTENANCE_MODE`.
- **mobile (build-time, public)**: `EXPO_PUBLIC_API_URL`.
- `VITE_*` and `EXPO_PUBLIC_*` values ship inside the bundle — never put secrets in them.

## Conventions

- TypeScript strict everywhere; Prettier configs per package; ESLint for client and server.
- Server imports use `@/…` with `.js` extensions (ESM). Client uses `@/` → `client/src`. Mobile uses relative imports.
- Validate every request body/params with Zod schemas in `server/src/validations`.
- Data fetching via TanStack Query hooks in `features/*/use*.ts` (mobile) and `features/` / `hooks/` (client); API wrappers in `src/api/*.ts` in both apps.
- Feature modules can be toggled per user (`User.enabledModules`, `config/appModules.ts` in all three packages).
- New user-facing strings need translations in all 9 locale files of the app(s) touched.
- Match surrounding code style; keep changes small.

## Known risks / technical debt

- No CI; client and mobile have no tests.
- Duplicated types, API clients and i18n between client and mobile → drift.
- Two lockfiles (root + stale `mobile/`), custom Metro resolver. `npx expo install --check` reports `expo`/`expo-linking` patch updates, but installing just those nests a second copy of `expo-modules-core`/`expo-constants`/`@expo/cli` under `mobile/node_modules` — upgrade all `expo-*` packages together and check for duplicates (`npm ls expo-modules-core`).
- `planForPriceId` falls back to `PRO` for unknown prices (now logs "Unknown Stripe price treated as Pro" with the price id — check Railway logs before changing the fallback).
- Mixed TypeScript versions (client ~6.0, server/mobile ~5.9).
- Docs: README and `docs/store-release.md` were corrected on 2026-10-07; `docs/ios-app.md` is a historical plan with a status note at the top — trust the code and this file over it.
- No error tracking (console/morgan logging only). Email login depends on Resend.

## Store-release blockers (Google Play / App Store)

1. **In-app purchases**: mobile `BillingCard` no longer shows prices but still links to the website plans page and the Stripe portal, and limit messages say "Subscribe on Account" — not allowed by Apple 3.1.1 / Play payments policy. **Decided (2026-10-07): Option A** — a build-time flag (`EXPO_PUBLIC_STORE_BUILD=true` in the EAS `production` profile only) hides those links and calls to action in store builds; web-purchased Pro keeps working (Apple 3.1.3(b)). Implemented: `env.storeBuild` in `mobile/src/config/env.ts`, `billing.store.*` strings in all 9 mobile locales. Preview APKs and Expo Go keep the links; preview store mode in Expo Go with `EXPO_PUBLIC_STORE_BUILD=true npx expo start --clear`. StoreKit / Play Billing stays a later option.
2. **App Review login**: server support done — set `REVIEW_LOGIN_EMAIL` + `REVIEW_LOGIN_CODE` (6 digits, non-admin account) on Railway; that account gets the fixed code instead of an email (`config/reviewLogin.ts`). Create the demo account, then give reviewers email + password + code.
3. **Android target SDK**: done — `targetSdkVersion`/`compileSdkVersion` are 36 (verify the current requirement in Play Console before submitting).
4. **Sign in with Apple**: Google login is offered, so Apple guideline 4.8 likely requires Sign in with Apple (or an equivalent privacy-focused option).
5. Setup items: developer accounts done (Play + Apple, paid). Still: store records (Play app, App Store Connect app), Data safety / App Privacy / age rating, screenshots, `ascAppId` in `eas.json`, Google OAuth redirect `https://api.mindkeep.cloud/api/auth/google/callback` (works: Google sign-in verified on Android in preview APK 1.0.1 / versionCode 2 on 2026-10-08), verify iOS deployment target vs Expo SDK 57.
6. Nice to have: push notifications (Expo Notifications + FCM/APNs); consider `appVersionSource: "remote"`.
