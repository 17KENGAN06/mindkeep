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
- Google: web uses Google Identity; mobile opens `/api/auth/google/start?returnUrl=…` in the system browser → `/google/callback` → returns to `mindkeep://google` (or `exp://` in Expo Go) with a code → app exchanges it. Uses `GoogleSignInTicket`.
- Bot protection: `GET /auth/challenge` token required on signup flows.
- CSRF (`requireSameOrigin`): unsafe methods need an allowed Origin, or no Origin + `X-Requested-With: learning-reminder`. Cron and Stripe webhook are exempt.
- Admin: `role=ADMIN` or email in `ADMIN_EMAILS` (auto-promoted). `MAINTENANCE_MODE=true` locks out non-admins.
- Account deletion (`POST /auth/delete-account`) cancels Stripe and cascades all user data — required for store policies; do not remove.

## Database / storage

- PostgreSQL via Prisma; schema `server/prisma/schema.prisma`, migrations in `server/prisma/migrations` (applied automatically on prod start by `scripts/start-prod.mjs` with a 45 s timeout).
- Main models: `User` (plan + Stripe fields, `enabledModules`, timezone), `AuthSession`, `EmailToken`, `GoogleSignInTicket`, `Category`, `LearningMaterial`, `ReviewReminder`, `Notification`, `DailyTask`, `Note`, `NutritionSettings`/`Meal`/`WaterDay`/`StepsDay`/`WeightDay`, `Habit`/`HabitLog`, `BudgetSettings`/`BudgetCategory`/`BudgetOperation`/`ExchangeRate`, `StripeEvent`, `AdminAuditEvent`.
- Migrations: always create new ones with `prisma migrate dev`; never edit already-applied migrations; avoid destructive column drops on production data without discussing it.
- Dates: day-based records are sent as `YYYY-MM-DD` and stored at **UTC noon**. Review "today/overdue" uses the user's IANA `timezone`. Review dates (3/7/30 from `learnedAt`) are computed **only on the server** (`reviewScheduleService`); completing/skipping never reschedules.
- Client-side storage: web uses cookies + localStorage for UI prefs; mobile uses SecureStore for tokens and AsyncStorage for theme/language. No offline data store.

## Payments (Stripe)

- Website-first Stripe Checkout + Customer Portal. Code: `config/stripe.ts`, `services/billing.service.ts`, `controllers/billing.controller.ts`, `routes/billing.routes.ts`.
- Plans: `FREE`, `PLUS` (limits lifted, no scan), `PRO` (scan). Monthly/yearly. Legacy `STRIPE_PRICE_MONTHLY/YEARLY` IDs are still treated as Pro.
- Webhook `POST /api/billing/webhook` (raw body, signature verified, idempotent via `StripeEvent`). Events: `checkout.session.completed`, `customer.subscription.created|updated|deleted`, `invoice.paid`, `invoice.payment_failed`.
- Production only accepts **live** keys (`sk_live_`/`rk_live_`); test keys are ignored when `NODE_ENV=production`.
- Native clients get return URLs under `CLIENT_URL/billing/return` (`X-Mindkeep-Client: native`).
- Mobile `features/billing/BillingCard.tsx` currently shows prices and opens Stripe Checkout in the browser — see store blockers.
- `planForPriceId` defaults unknown price IDs to `PRO` — be careful when changing prices.

## Deployment

- **API + Postgres**: Railway, Nixpacks, Node 20. `server/railway.toml` (Root Directory = `server`) or root `railway.toml` (Root Directory empty) — check which one Railway uses before editing. Start = `npm run start:prod` (migrate deploy → `dist/server.js`). Health check `/api/health`.
- **Cron**: Railway Cron hourly → `/api/internal/cron/reminders`.
- **Web**: static `client/dist` uploaded manually to Hostinger `public_html` with `client/public/.htaccess` (SPA rewrite + security headers + CSP). The CSP `connect-src` must include any new API/third-party origin. (`client/railway.toml` exists as an alternative.)
- **Mobile**: EAS Build/Submit, EAS project `e3304cc5-f62e-4cd8-b580-ed47b2b6c118`, owner `17kengan06`.

## Android / iOS setup (mobile/)

- Expo **managed** workflow: `android/` and `ios/` are generated by EAS and gitignored — configure via `app.json` / config plugins, not native folders.
- `app.json`: name MindKeep, scheme `mindkeep`, bundle/package `cloud.mindkeep.app`, iPhone only (`supportsTablet: false`), `ITSAppUsesNonExemptEncryption: false`, adaptive + monochrome icons, `expo-build-properties` (Android min 24 / target 35 / compile 35; iOS deployment target 15.1).
- `eas.json`: `preview` → Android APK (internal); `production` → AAB + iOS store build, `autoIncrement`, `appVersionSource: local`; Android submit → internal track draft. iOS submit lacks `ascAppId`.
- `metro.config.js` is customized for the monorepo (hand-maps root + nested `node_modules`). `mobile/package-lock.json` exists in addition to the root lockfile. Handle both carefully.
- No camera, location, push, or tracking permissions are used — do not add permission strings that aren't used.
- Status: works via Expo Go / preview APK. No standalone iOS build has been made yet (Windows host, no Apple Developer account yet).

## Environment variables (names only — never commit values)

Templates: `.env.example`, `server/.env.example`, `client/.env.example`, `mobile/.env.example`. Real `.env` files are gitignored.

- **server**: `DATABASE_URL`, `JWT_SECRET`, `CRON_SECRET`, `NODE_ENV`, `PORT`, `CLIENT_URL`, `CLIENT_URLS`, `API_PUBLIC_URL`, `ENABLE_NODE_CRON`, `MAINTENANCE_MODE`, `ADMIN_EMAILS`, `GOOGLE_CLIENT_ID`, `EMAIL_FROM`, `RESEND_API_KEY`, `TELEGRAM_BOT_TOKEN` (unused), `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_YEARLY`, `STRIPE_PRICE_PLUS_MONTHLY`, `STRIPE_PRICE_PLUS_YEARLY`, `STRIPE_PRICE_PRO_MONTHLY`, `STRIPE_PRICE_PRO_YEARLY`, `GEMINI_API_KEY`, `GEMINI_MODEL`.
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
- Global rate limiter (`app.ts` `sessionToken`) treats any Bearer/cookie value >16 chars as a session key without verifying it, so fake tokens bypass the IP bucket.
- Duplicated types, API clients and i18n between client and mobile → drift.
- Two lockfiles (root + `mobile/`), custom Metro resolver; mobile deps use `^` ranges instead of Expo-pinned versions (run `npx expo install --check` / `npx expo-doctor`).
- `planForPriceId` falls back to `PRO` for unknown prices.
- Mixed TypeScript versions (client ~6.0, server/mobile ~5.9).
- Docs are outdated: README (old name, 4 languages, "no push/email"), `docs/ios-app.md` (says no refresh tokens), `docs/store-release.md` ("IAP: No" while the app shows Stripe checkout).
- No error tracking (console/morgan logging only). Email login depends on Resend.

## Store-release blockers (Google Play / App Store)

1. **In-app purchases**: mobile `BillingCard` shows prices and opens Stripe Checkout — violates Apple 3.1.1 and Google Play payments policy outside narrow regional exceptions. Either hide all purchase UI/prices/links in store builds (web-purchased Pro still works — Apple 3.1.3(b)) or implement StoreKit / Play Billing (e.g. RevenueCat) with server entitlement support.
2. **App Review login**: password login always requires an emailed code, so reviewers can't use a demo account. Needs a safe reviewer access path.
3. **Android target SDK**: `targetSdkVersion`/`compileSdkVersion` pinned to 35; Google Play now requires API 36 for new apps/updates (verify current requirement in Play Console).
4. **Sign in with Apple**: Google login is offered, so Apple guideline 4.8 likely requires Sign in with Apple (or an equivalent privacy-focused option).
5. Setup items: Play ($25) / Apple Developer ($99/yr) accounts, store records, Data safety / App Privacy / age rating, screenshots, `ascAppId` in `eas.json`, Google OAuth redirect `https://api.mindkeep.cloud/api/auth/google/callback`, test Google sign-in in a standalone build, verify iOS deployment target vs Expo SDK 57.
6. Nice to have: push notifications (Expo Notifications + FCM/APNs); consider `appVersionSource: "remote"`.
