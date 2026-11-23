# LabLink

**Making College Laboratories More Accessible.** Hackathon project (Hack2Skill).

> Status: Phase 6 complete - REST API with persistent Supabase PostgreSQL storage (in-memory fallback for local development). Gemini integration comes in a later phase.

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

**Backend** (http://localhost:8000)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # Windows: copy .env.example .env
uvicorn app.main:app --reload --port 8000
```

Health check: `GET http://localhost:8000/api/health` -> `{"status":"ok",...}`
API docs: http://localhost:8000/docs

**Frontend** (http://localhost:5173)

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

The home page shows whether the backend is reachable.

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
- `frontend/src/hooks/useLabStore.tsx` - app state and actions.
- `frontend/src/types/lab.ts` - domain types.

### Backend integration point

The backend currently exposes only `GET /api/health`, so all lab data is **mock data** in `frontend/src/data/mockLab.ts`. It is loaded through `frontend/src/services/labService.ts` (`fetchLabData`, `requestAllocationRecommendation`), which already returns Promises. When catalogue, booking and Gemini allocation endpoints exist, replace those function bodies with API calls and move the store actions in `useLabStore.tsx` to call them. Changes are in memory only and reset on reload.

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

## Environment variables

Copy the `.env.example` files; real `.env` files are git-ignored. See the root `.env.example` for the full list.

## License

MIT
