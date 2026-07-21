# Learning Reminder

Web app for consolidating recently learned material in long-term memory using a **fixed** review schedule:

- 1st review — **3 days** after the learning date  
- 2nd review — **7 days** after the learning date  
- 3rd review — **30 days** after the learning date  

Intervals are calculated only from the original `learnedAt` date. There is **no SM-2**, no “Remember / Forgot” scoring, and no interval changes after completion.

Languages (i18n): **Russian**, **Ukrainian**, **English**, **Finnish**.

---

## Stack

| Layer | Technologies |
|-------|----------------|
| Frontend | React, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query, React Hook Form, Zod, date-fns, Lucide, i18next |
| Backend | Node.js, TypeScript, Express, PostgreSQL, Prisma, Zod, JWT (httpOnly cookie), bcrypt |
| Jobs | Railway Cron → protected HTTP endpoint (`reminderJob`); optional `node-cron` locally |
| Deploy | Railway (API + Postgres + frontend) |

---

## Monorepo layout

```text
learning-reminder/
  client/                 # React SPA
  server/                 # Express API + Prisma
  deploy/railway-cron.http
  .env.example
  README.md
```

---

## Features (MVP)

- Registration / login / logout (JWT in **httpOnly** cookie)
- Categories CRUD
- Learning materials CRUD + archive, search, filters
- Auto-create 3 reminders (3 / 7 / 30 days) on material create
- Review today: overdue / today / upcoming, **Completed** / **Skip**
- In-app notifications + unread bell
- Hourly server job for due/overdue + notification creation
- Dashboard + 7-day activity chart + statistics page
- Review calendar by month
- Profile timezone (IANA) for “today” / overdue calculations
- UI in `ru` / `uk` / `en` / `fi`

### Intentionally out of scope

- Adaptive intervals / SM-2  
- Email / Telegram / push (hooks prepared in `notificationService` + env vars)  
- Answer quality ratings  

---

## Prerequisites

- Node.js **≥ 20**
- PostgreSQL (local or Railway)

---

## Local setup

### 1. Install

```bash
cd learning-reminder
npm install
```

### 2. Environment

Copy examples:

```bash
cp .env.example server/.env
cp client/.env.example client/.env
```

Minimal `server/.env`:

```env
NODE_ENV=development
PORT=4000
CLIENT_URL=http://localhost:5173
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/learning_reminder?schema=public
JWT_SECRET=dev-local-jwt-secret-min-16
CRON_SECRET=dev-local-cron-secret
ENABLE_NODE_CRON=false
```

Minimal `client/.env`:

```env
VITE_API_URL=http://localhost:4000
```

### 3. Database

```bash
npm run prisma:deploy -w learning-reminder-server
# or during development:
npm run prisma:migrate -w learning-reminder-server
```

### 4. Run

```bash
npm run dev:server
npm run dev:client
```

- App: http://localhost:5173  
- API health: http://localhost:4000/api/health  

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev:client` | Vite dev server |
| `npm run dev:server` | API with hot reload |
| `npm run build` | Build client + server |
| `npm run start:server` | Production API (`migrate deploy` + start) |
| `npm run start:client` | Serve client `dist` on `PORT` |
| `npm run lint` | ESLint for both packages |

---

## Review schedule (backend only)

```ts
threeDaysDate  = addDays(learnedAt, 3);   // THREE_DAYS
sevenDaysDate  = addDays(learnedAt, 7);   // SEVEN_DAYS
thirtyDaysDate = addDays(learnedAt, 30);  // THIRTY_DAYS
```

- Stored in UTC; “today” / overdue use the user’s IANA timezone  
- Completing or skipping a reminder does **not** reschedule later ones  
- Frontend never invents reminder dates  

---

## Main API routes

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET  /api/auth/me`

### Materials / categories / reminders

- `GET|POST /api/materials`, `GET|PATCH|DELETE /api/materials/:id`, `PATCH /api/materials/:id/archive`
- `GET|POST /api/categories`, `PATCH|DELETE /api/categories/:id`
- `GET /api/reminders`, `/today`, `/upcoming`, `/overdue`, `/calendar`
- `POST /api/reminders/:id/complete`, `/skip`

### Notifications / statistics / system

- `GET /api/notifications`, `PATCH /api/notifications/:id/read`, `PATCH /api/notifications/read-all`
- `GET /api/statistics/dashboard`, `GET /api/statistics/activity`
- `GET /api/health`
- `POST /api/internal/cron/reminders` (header `x-cron-secret`)

All private routes require auth. Users can only access their own data.

---

## Frontend routes

`/`, `/login`, `/register`, `/dashboard`, `/review`, `/calendar`, `/materials`, `/materials/new`, `/materials/:id`, `/materials/:id/edit`, `/categories`, `/notifications`, `/statistics`, `/profile` (timezone via registration), `/*` (404).

---

## Cron / notifications

`reminderJob` (hourly):

1. Finds open reminders due in the user’s local calendar  
2. Marks overdue  
3. Creates in-app notifications via `notificationService`  
4. Never duplicates (`notificationCreatedAt` + unique `reminderId`)  

**Production (Railway Cron):**

```http
POST https://YOUR-API.up.railway.app/api/internal/cron/reminders
x-cron-secret: <CRON_SECRET>
```

See `deploy/railway-cron.http`.

**Local optional:** `ENABLE_NODE_CRON=true` (in-process `node-cron`). Do not run cron logic in React.

---

## Railway deploy

Create three services:

1. **PostgreSQL** plugin → provides `DATABASE_URL`  
2. **API** — Root Directory: `server`  
   - Env: `DATABASE_URL`, `JWT_SECRET` (≥32 chars in prod), `CLIENT_URL`, `NODE_ENV=production`, `CRON_SECRET`, `PORT`  
   - Start: `npm run start:prod` (runs migrations)  
   - Health: `/api/health`  
3. **Frontend** — Root Directory: `client`  
   - Build-time env: `VITE_API_URL=https://your-api.up.railway.app`  

Then set API `CLIENT_URL` to the frontend public URL and attach hourly Cron to the reminders endpoint.

Configs: `server/railway.toml`, `client/railway.toml`, `*/nixpacks.toml`.

Production cookies: `httpOnly` + `Secure` + `SameSite=None` for cross-origin Railway hosts. CSRF is mitigated with Origin checks + `X-Requested-With`.

---

## Security notes

- Passwords hashed with bcrypt (cost 12); max length 72 (bcrypt limit)  
- JWT only in httpOnly cookie; algorithms locked to `HS256`  
- Zod validation on inputs; ownership checks on every resource  
- Helmet, CORS allowlist, rate limits (global + auth + cron)  
- Timing-safe cron secret compare; login uses dummy hash when user missing  
- Never commit real secrets — use `.env.example` only  

---

## Environment variables

| Variable | Where | Purpose |
|----------|--------|---------|
| `DATABASE_URL` | server | PostgreSQL |
| `JWT_SECRET` | server | Sign cookies |
| `CLIENT_URL` | server | CORS + CSRF origin |
| `NODE_ENV` | server | `development` / `production` |
| `PORT` | server / client | Listen port (Railway injects) |
| `CRON_SECRET` | server | Protect cron endpoint |
| `ENABLE_NODE_CRON` | server | Optional local hourly job |
| `EMAIL_FROM`, `RESEND_API_KEY` | server | Future email |
| `TELEGRAM_BOT_TOKEN` | server | Future Telegram |
| `VITE_API_URL` | client (build) | API base URL |

---

## Architecture (backend)

```text
route → middleware → controller → service → Prisma
```

Key services:

- `reviewScheduleService` — fixed 3 / 7 / 30 dates  
- `notificationService` — in-app notifications (extensible)  
- `reminderJob` — due/overdue processing  

---

## License

Private / educational project unless you add a license file.
