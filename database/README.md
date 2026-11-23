# database

Supabase PostgreSQL schema and sample data for LabLink.

| File | Purpose |
|------|---------|
| `schema.sql` | Tables `resources`, `bookings`, `activities` with constraints, indexes and row-level security. Initial migration (v1); safe to re-run. |
| `seed.sql` | Sample catalogue, bookings and activity (dates relative to the day it runs). Safe to re-run. |

## Set up

1. Create a Supabase project.
2. In **SQL Editor**, run `schema.sql`, then (optionally) `seed.sql`.
3. In **Project Settings -> API**, copy the project URL and the service-role (secret) key into `backend/.env`:
   ```
   SUPABASE_URL=https://<project-ref>.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=<service-role key>
   ```
4. Install backend dependencies (`pip install -r requirements.txt`) and start the API. The log shows `Data store ready (supabase)`.

## Data model

- `resources` - lab equipment, development kits and workstations. Unique per name + department + lab.
- `bookings` - slot bookings and project-based access requests; `resource_id` references `resources(id)` (delete restricted).
  - Only one **confirmed** booking per resource, date and slot (`uq_bookings_confirmed_slot`). Several **pending** requests for one slot are allowed: that is a conflict faculty resolve.
  - A student cannot hold two active bookings/requests for the same slot (`uq_bookings_student_slot`).
  - Cancelling or declining keeps the row (status change), so history is preserved.
- `activities` - activity feed entries, newest first.

RLS is enabled with no policies: the public anon key has no access. Only the backend, using the service-role key, reads and writes.

## Future changes

Add new migrations as numbered files (e.g. `migrations/002_<change>.sql`) and run them in order after `schema.sql`.
