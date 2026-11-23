# LabLink

**Making College Laboratories More Accessible.** Hackathon project (Hack2Skill).

> Status: feature-complete - catalogue, slot booking, project-based access requests, faculty approvals, fair conflict allocation with Gemini explanations, a Gemini-powered AI lab assistant (chatbot), Supabase PostgreSQL storage and Cloud Run deployment files.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React, TypeScript, Vite, Tailwind CSS v4, Shadcn/UI, Lucide React |
| Backend | Python, FastAPI, Pydantic |
| Database | Supabase PostgreSQL |
| AI | Google Gemini API |
| Charts | Recharts (added with the dashboard phase) |
| Deployment | Google Cloud Run |

No login or signup: the app opens directly.

## What LabLink does

A GenAI-powered campus laboratory resource-sharing platform. Students discover specialised equipment, development kits and lab workstations across departments, book slots, and submit project-based access requests that faculty approve. AI recommends fair, feasible allocations when schedules conflict, using project deadlines, availability and student requirements.

## Structure

```
LabLink/
├── frontend/   # React + Vite app (src/components, pages, hooks, services, lib, types)
├── backend/    # FastAPI app (app/api, core, schemas, services, db)
├── database/   # Supabase schema + seed data (later phase)
├── .env.example
└── README.md
```

## Run locally

Requirements: Node 20+ (22 recommended), Python 3.11+.

**1. Backend** (http://localhost:8000)

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
copy .env.example .env           # macOS/Linux: cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs. With no keys in `backend/.env` the API runs on built-in sample data (not saved) and the chatbot answers in basic mode, so you can try everything straight away.

**2. Frontend** (http://localhost:5173)

```bash
cd frontend
npm install
copy .env.example .env           # macOS/Linux: cp .env.example .env
npm run dev
```

Open http://localhost:5173: it opens the dashboard (the landing page was removed; `/` redirects to `/app`).

## What you need to provide

| What | Why | Where to get it | Put it in |
|------|-----|-----------------|-----------|
| **Gemini API key** | AI lab assistant (chatbot) and AI explanations of conflict decisions | https://aistudio.google.com/apikey (free tier available) | `backend/.env` -> `GEMINI_API_KEY` |
| **Supabase project** (URL + service-role key) | Saves bookings permanently | https://supabase.com -> new project -> run `database/schema.sql` then `database/seed.sql` in SQL Editor -> Project Settings -> API | `backend/.env` -> `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| Google Cloud project with billing enabled | Hosting (Cloud Run free tier covers a demo) | https://console.cloud.google.com | see **Deploy** below |

**Check your setup** at any time (from `backend/`, venv active): `python -m app.check_setup`. It verifies packages, `.env`, CORS, the Supabase tables, a real save/read/delete in the database, and a live Gemini call, and tells you how to fix anything that fails. Secrets are never printed.

Keys stay on the backend only. Never put them in `frontend/.env` or commit `.env` files (they are git-ignored).
If the default model alias stops working, set `GEMINI_MODEL` to a current Flash model id from https://ai.google.dev/gemini-api/docs/models.
## Phase 2: landing page

Routes (React Router):

| Route | Page |
|-------|------|
| `/` | Landing page |
| `/status` | Phase 1 backend health status page |
| `/app` | Application (Phases 3-4, see below) |

Landing sections: sticky navbar with mobile menu, hero with dashboard preview, problem, solution (About), features, how it works, call to action, footer. Smooth scrolling is CSS-only and respects `prefers-reduced-motion`.

Code layout:

- `frontend/src/pages/Landing.tsx` composes the sections.
- `frontend/src/components/landing/` holds the section components and shared `Section`, `SectionHeading` and `FeatureCard`.
- `frontend/src/data/landing.ts` holds all landing copy and icons, so content changes need no component edits.

The hero dashboard is a static preview with clearly labelled sample data. No backend calls, authentication or new dependencies were added in this phase.

## Phases 3-4: application and core features

| Route | Page |
|-------|------|
| `/app` | Dashboard: summary cards, 7-day bookings chart, utilisation by department, recent activity, quick actions |
| `/app/catalogue` | Resource catalogue with search and department/type/availability filters; book or request access |
| `/app/bookings` | Bookings by status (upcoming, awaiting approval, past & closed); cancel or withdraw |
| `/app/approvals` | Faculty: approve/decline project-based requests, resolve slot conflicts with an allocation recommendation |

There is no login. A **Student / Faculty** switch in the top bar changes the view.

How the features behave:

- Resources that do not need approval are confirmed instantly. Approval-required resources create a pending request with the project title, requirements and deadline.
- Two or more pending requests for the same resource, date and slot form a **conflict**. The recommendation gives the slot to the nearest project deadline (earliest submission breaks ties) and moves the others to the next free slot, flagging any move past a deadline.
- Forms validate dates (14-day booking window), free slots, duplicate requests, project title, requirements and deadline.

Code layout:

- `frontend/src/components/layout/AppShell.tsx` - sidebar, top bar, mobile drawer, view switch.
- `frontend/src/pages/app/` - Dashboard, Catalogue, Bookings, Approvals.
- `frontend/src/components/app/` - feature components (booking dialog, resource card, conflict card, charts, activity feed, shared page pieces).
- `frontend/src/components/ui/` - card, badge, form fields, dialog (native `<dialog>`), table, spinner, toast.
- `frontend/src/hooks/useLabStore.tsx` - app state, loaded from and saved to the API.
- `frontend/src/types/lab.ts` - domain types.

### Data flow

The frontend talks to the backend API through `frontend/src/services/api.ts` (shared fetch + error handling) and `frontend/src/services/labService.ts` / `assistantService.ts` (one function per endpoint). `useLabStore.tsx` loads the data once and updates it from each API response; errors show as toasts or inline form messages, and an offline backend shows a retry screen.

## Phase 5: backend API

All routes are under `/api`. Interactive docs: http://localhost:8000/docs (hidden when `ENVIRONMENT=production`). JSON uses camelCase, matching `frontend/src/types/lab.ts`.

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/health` | Health check (Phase 1) |
| GET | `/api/resources?q=&department=&type=&available=` | Catalogue with search and filters |
| GET | `/api/resources/{id}` | One resource |
| GET | `/api/resources/{id}/availability?date=YYYY-MM-DD` | Slot states (free / requested / booked) for a day |
| GET | `/api/bookings?student=&status=&resourceId=` | Bookings and requests |
| POST | `/api/bookings` | Book a slot (instant) or submit a project-based access request (pending) |
| GET | `/api/bookings/{id}` | One booking |
| POST | `/api/bookings/{id}/cancel` | Cancel a booking or withdraw a request |
| POST | `/api/bookings/{id}/approve` | Faculty approval, optional `{ "note" }` |
| POST | `/api/bookings/{id}/reject` | Faculty decline, `{ "note" }` required (5+ chars) |
| GET | `/api/conflicts` | Open slot conflicts |
| GET | `/api/conflicts/{id}/recommendation` | Deadline-first allocation recommendation |
| POST | `/api/conflicts/{id}/resolve` | Apply it: approve the winner, move the others |
| GET | `/api/dashboard?role=faculty` or `?role=student&student=Name` | Summary stats, 7-day bookings, utilisation |
| GET | `/api/activity?limit=20` | Recent activity |
| POST | `/api/assistant/chat` | AI lab assistant (Gemini), `{ messages, role, studentName }` |

Errors always use one shape, with `404` (not found), `409` (slot taken, duplicate, wrong status, resource under maintenance), `422` (invalid input or booking rule) and `500`:

```json
{ "error": { "code": "slot_unavailable", "message": "This slot is already booked.", "details": [{ "field": "slotId", "message": "..." }] } }
```

Backend layout:

- `app/main.py` - app setup; `python -m app.main` runs uvicorn on `PORT`.
- `app/core/` - settings (`config.py`), middleware (CORS, request timing/logging), centralised errors.
- `app/api/routes/` - HTTP layer (the controllers); `app/api/deps.py` injects repositories.
- `app/services/` - business logic: catalogue, bookings, allocation, dashboard, activity, shared scheduling rules.
- `app/repositories/` - data access. `base.py` defines the interfaces; `supabase_repo.py` stores data in Supabase PostgreSQL; `memory.py` + `mock_data.py` are an in-memory fallback. `DATA_BACKEND` picks one (see `backend/.env.example`).
- `app/db/client.py` - Supabase client (service-role key, server-side only).

There is no authentication (no login, per the project scope); the caller sends `studentName` when booking.

## Phase 6: database

Supabase PostgreSQL. Schema, constraints and setup steps: [`database/README.md`](database/README.md). Database errors are mapped to the API error format: duplicate or double-booked slots return `409`, invalid data `422`, and an unreachable or unconfigured database `503`. The server logs the data store it uses at startup.

## AI features (Google Gemini)

- **AI lab assistant** - the "Ask LabLink AI" button in the app. Students ask things like "Which labs are free today?" or "When is the GPU Workstation free this week?"; faculty can ask for pending requests and conflicts. `POST /api/assistant/chat` sends Gemini a compact snapshot of live data (catalogue, free slots for 7 days, the user's own bookings), so answers come from the database. Students never receive other students' booking details. Limited to `ASSISTANT_RATE_LIMIT_PER_MINUTE` questions per client.
- **Fair conflict allocation** - the allocation itself is a transparent rule, so it is always feasible: the nearest project deadline keeps the slot; on equal deadlines the student with less recent time on that equipment goes first; then the earlier submission. Every other request moves to the earliest free slot from today, so it lands before its own deadline whenever possible. When a Gemini key is set, Gemini writes the explanation faculty see, weighing the deadlines and each student's stated requirements.
- **Intelligent slot booking** - when a student picks a slot another team has requested, or a day that is full, the booking form offers the soonest completely free slots in one click.
- **Utilisation insights** - the dashboard names the most in-demand equipment and the equipment that is free all week, with a role-specific action (book early / add lab hours or promote idle kit).
- Without `GEMINI_API_KEY` both still work: the chatbot lists free slots for today and tomorrow, and explanations use the built-in text.

## Testing

```bash
# Backend: 39 API and allocation tests (in-memory data, no network), lint and format check
cd backend && pip install -r requirements-dev.txt
pytest -q --cov=app && ruff check . && ruff format --check .

# Frontend: unit, component and booking-form tests (Vitest + Testing Library), lint, type-check, build
cd frontend && npm install
npm run test:coverage && npm run lint && npm run typecheck && npm run build
```

GitHub Actions (`.github/workflows/ci.yml`) runs all of these on every push and pull request.

## Security and accessibility

- API responses carry `nosniff`, `X-Frame-Options: DENY`, a strict CSP, `no-store` and (in production) HSTS; bodies over 64 KB are rejected with 413; CORS allows only the configured origins and the methods the app uses; API docs are hidden in production.
- Inputs are validated with Pydantic; the database is reached only through the service-role key on the server, with RLS on and no grants for `anon`/`authenticated`. The chatbot is rate-limited and students never receive other students' booking details.
- The website sends a CSP, Permissions-Policy and HSTS (`frontend/vercel.json`).
- Keyboard and screen-reader support: skip link, labelled landmarks and radio groups, visible focus, `aria-live` for toasts and suggestions, and all animations respect `prefers-reduced-motion`. Automated axe-core (WCAG 2.1 AA) checks report no violations on the main pages.
- Demo limitation: the Student/Faculty switch is a demo toggle, not a login. A production deployment would add Supabase Auth and enforce the faculty role on approve/resolve endpoints.

## Deploy on Render (free)

`render.yaml` (repo root) is a Render Blueprint that creates both services.

1. Push the latest code to GitHub (never commit `.env` files).
2. Render -> **New -> Blueprint** -> connect GitHub -> pick the LabLink repo -> it reads `render.yaml`.
3. Fill the prompted values: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `CORS_ORIGINS=https://lablink-web.onrender.com`, `VITE_API_BASE_URL=https://lablink-api.onrender.com` -> **Apply**.
4. When both are live, check the real URLs on each service page. If Render added a suffix to a name, fix `CORS_ORIGINS` (API) and `VITE_API_BASE_URL` (website) under **Environment** and redeploy.
5. Check `https://<api>/api/health`, then open the website.

The free web service sleeps after a period without traffic; the first request afterwards takes about a minute.

## Deploy on Vercel (free, recommended)

Two Vercel projects from the same GitHub repo. Push your latest code to GitHub first (never commit `.env` files).

**1. Backend** - Vercel -> Add New -> Project -> import the repo:
- Root Directory: `backend` (FastAPI is detected automatically from `app/main.py`; `backend/vercel.json` pins the Seoul region `icn1`, next to the Supabase database)
- Environment Variables:
  `ENVIRONMENT=production`, `DATA_BACKEND=supabase`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `CORS_ORIGINS=https://placeholder.vercel.app`
- Deploy, then open `https://<backend>.vercel.app/api/health` -> `{"status":"ok",...}`

**2. Frontend** - Add New -> Project -> import the same repo again:
- Root Directory: `frontend` (Vite is detected automatically; `frontend/vercel.json` adds SPA routing and security headers)
- Environment Variable: `VITE_API_BASE_URL=https://<backend>.vercel.app` (no trailing slash)
- Deploy

**3. Connect them** - in the backend project: Settings -> Environment Variables -> set `CORS_ORIGINS` to the frontend URL (e.g. `https://lablink-web.vercel.app`) -> Deployments -> Redeploy.

Environment variable changes only apply after a redeploy. Every `git push` redeploys both projects automatically.

## Deploy (Google Cloud Run + Supabase)

Both services ship as containers: `backend/Dockerfile` (FastAPI + uvicorn) and `frontend/Dockerfile` (static build served by nginx with SPA routing). The frontend reads the API URL at start-up from `API_BASE_URL`, so the same image works everywhere.

1. **Database** - create a Supabase project, run `database/schema.sql` (and optionally `database/seed.sql`) in the SQL Editor. Copy the project URL and the service-role key.
2. **Google Cloud set-up** (once; region `asia-south1` = Mumbai):
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com
   printf "%s" "YOUR_SUPABASE_SERVICE_ROLE_KEY" | gcloud secrets create supabase-service-role-key --data-file=-
   printf "%s" "YOUR_GEMINI_API_KEY" | gcloud secrets create gemini-api-key --data-file=-
   PROJECT_NUMBER=$(gcloud projects describe YOUR_PROJECT_ID --format="value(projectNumber)")
   for s in supabase-service-role-key gemini-api-key; do gcloud secrets add-iam-policy-binding $s --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" --role=roles/secretmanager.secretAccessor; done
   ```
3. **Backend**:
   ```bash
   gcloud run deploy lablink-api --source backend --region asia-south1 --allow-unauthenticated \
     --set-env-vars "ENVIRONMENT=production,DATA_BACKEND=supabase,SUPABASE_URL=https://YOUR_REF.supabase.co" \
     --set-secrets "SUPABASE_SERVICE_ROLE_KEY=supabase-service-role-key:latest,GEMINI_API_KEY=gemini-api-key:latest"
   ```
   Note the service URL it prints (e.g. `https://lablink-api-xxxx.a.run.app`); check `<url>/api/health`.
4. **Frontend**:
   ```bash
   gcloud run deploy lablink-web --source frontend --region asia-south1 --allow-unauthenticated \
     --set-env-vars "API_BASE_URL=https://lablink-api-xxxx.a.run.app"
   ```
5. **Allow the frontend in CORS**:
   ```bash
   gcloud run services update lablink-api --region asia-south1 --update-env-vars "CORS_ORIGINS=https://lablink-web-xxxx.a.run.app"
   ```

In production (`ENVIRONMENT=production`) the API docs are hidden. Secrets live in Secret Manager, never in the images or the repository. For a custom domain, map it in Cloud Run and add it to `CORS_ORIGINS`.

**Security note:** LabLink has no login (project scope), so anyone with the URL can use the student and faculty views, including approvals. Add authentication (e.g. Supabase Auth with a faculty role) before real campus use.

## Environment variables

Copy the `.env.example` files; real `.env` files are git-ignored. See the root `.env.example` for the full list.

## License

MIT




