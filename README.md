# LabLink

**Making College Laboratories More Accessible.** Hackathon project (Hack2Skill).

> Status: Phase 2 complete - landing page. Application features (catalogue, booking, approvals, AI) come in later phases.

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

Landing sections: sticky navbar with mobile menu, hero with dashboard preview, problem, solution (About), features, how it works, call to action, footer. Smooth scrolling is CSS-only and respects `prefers-reduced-motion`.

Code layout:

- `frontend/src/pages/Landing.tsx` composes the sections.
- `frontend/src/components/landing/` holds the section components and shared `Section`, `SectionHeading` and `FeatureCard`.
- `frontend/src/data/landing.ts` holds all landing copy and icons, so content changes need no component edits.

The hero dashboard is a static preview with clearly labelled sample data. No backend calls, authentication or new dependencies were added in this phase.

## Environment variables

Copy the `.env.example` files; real `.env` files are git-ignored. See the root `.env.example` for the full list.

## License

MIT
