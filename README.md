# LabLink

**Making College Laboratories More Accessible.** Hackathon project (Hack2Skill).

> Status: Phase 1 - architecture and scaffolding only. No application features yet.

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

## Environment variables

Copy the `.env.example` files; real `.env` files are git-ignored. See the root `.env.example` for the full list.

## License

MIT
