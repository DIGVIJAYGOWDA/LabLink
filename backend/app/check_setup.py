"""LabLink setup checker. Run from the backend folder (with the venv active):

    python -m app.check_setup            # full check, includes a save/read/delete test in the database
    python -m app.check_setup --no-write # skip the database write test

Checks Python, packages, backend/.env, CORS, the database (Supabase tables, row counts, a real
save + read-back + delete) and the Gemini chatbot key/model. Secrets are never printed.
"""

import importlib
import logging
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path

OK, WARN, FAIL = "[ OK ]", "[WARN]", "[FAIL]"
problems: list[str] = []
warnings: list[str] = []


def report(status: str, message: str, fix: str = "") -> None:
    print(f"{status} {message}")
    if fix:
        print(f"       -> {fix}")
    if status == FAIL:
        problems.append(message)
    elif status == WARN:
        warnings.append(message)


def section(title: str) -> None:
    print(f"\n== {title} ==")


def check_python_and_packages() -> bool:
    section("Python and packages")
    if sys.version_info >= (3, 11):
        report(OK, f"Python {sys.version.split()[0]}")
    else:
        report(FAIL, f"Python {sys.version.split()[0]} is too old", "Install Python 3.11 or newer")
    ok = True
    for module, pip_name in [("fastapi", "fastapi"), ("uvicorn", "uvicorn"), ("pydantic_settings", "pydantic-settings"),
                             ("httpx", "httpx"), ("supabase", "supabase")]:
        try:
            importlib.import_module(module)
            report(OK, f"package '{pip_name}' installed")
        except ImportError:
            ok = False
            report(FAIL, f"package '{pip_name}' is missing", "Run: pip install -r requirements.txt")
    return ok


def check_settings():
    section("Configuration (backend/.env)")
    env_file = Path(".env")
    if not Path("app").is_dir():
        report(FAIL, "Run this from the backend folder", "cd backend, then: python -m app.check_setup")
        return None
    if env_file.exists():
        report(OK, ".env file found")
    else:
        report(WARN, "no .env file: using defaults", "Copy .env.example to .env and fill in your keys")
    try:
        from app.core.config import get_settings

        settings = get_settings()
    except Exception as exc:  # pydantic validation error, bad value types...
        report(FAIL, f"settings could not be loaded: {exc}", "Fix the value named above in backend/.env")
        return None
    report(OK, f"ENVIRONMENT={settings.environment}, DATA_BACKEND={settings.data_backend}")

    origins = settings.cors_origin_list
    if not settings.is_production:
        report(OK, "CORS (development): any http://localhost:<port> frontend is allowed")
    elif origins:
        report(OK, f"CORS allows: {', '.join(origins)}")
    else:
        report(WARN, f"CORS does not include the local frontend (http://localhost:5173): {origins}",
               "Add http://localhost:5173 to CORS_ORIGINS in backend/.env")
    return settings


def check_database(settings, write_test: bool) -> None:
    section("Database (persistent storage)")
    from app.core.errors import AppError

    has_creds = bool(settings.supabase_url and settings.supabase_service_role_key)
    backend = settings.data_backend if settings.data_backend != "auto" else ("supabase" if has_creds else "memory")
    if backend == "memory":
        report(WARN, "using in-memory sample data: bookings are NOT saved when the server restarts",
               "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env (see database/README.md)")
        return
    if not settings.supabase_url.startswith("https://") or ".supabase." not in settings.supabase_url:
        report(WARN, "SUPABASE_URL does not look like https://<project-ref>.supabase.co",
               "Copy it from Supabase: Project Settings -> API -> Project URL")

    try:
        from app.repositories import get_repositories

        repos = get_repositories()
        resources = repos.resources.list()
        bookings = repos.bookings.list()
        activities = repos.activities.list(5)
    except AppError as exc:
        fix = "Check SUPABASE_URL (https://<project-ref>.supabase.co) and your internet connection"
        if "API key" in exc.message:
            fix = "Copy the service-role (secret) key, not the anon/publishable key, into SUPABASE_SERVICE_ROLE_KEY"
        if "denied access" in exc.message:
            fix = "In Supabase SQL Editor run the 3 GRANT/REVOKE lines at the end of database/schema.sql"
        if "tables are missing" in exc.message:
            fix = "In Supabase SQL Editor run database/schema.sql, then database/seed.sql"
        report(FAIL, f"cannot read from Supabase: {exc.message}", fix)
        return
    except Exception as exc:
        report(FAIL, f"cannot connect to Supabase: {type(exc).__name__}: {exc}",
               "Check the URL and that you used the service-role (secret) key, not the anon key")
        return

    report(OK, f"connected to Supabase; tables found: {len(resources)} resources, {len(bookings)} bookings")
    if not resources:
        report(WARN, "the resources table is empty: the catalogue will show nothing",
               "Run database/seed.sql in the Supabase SQL Editor, or add your own lab resources")
    if not activities:
        report(WARN, "the activity table is empty (fine for a fresh install)")

    if not write_test:
        return
    from app.db.client import get_supabase
    from app.schemas.lab import Activity

    test_id = f"setup-check-{uuid.uuid4().hex[:8]}"
    try:
        repos.activities.add(Activity(id=test_id, kind="booking", message="LabLink setup check", at=datetime.now(timezone.utc)))
        rows = get_supabase().table("activities").select("id").eq("id", test_id).execute().data
        get_supabase().table("activities").delete().eq("id", test_id).execute()
        if rows:
            report(OK, "save test passed: wrote a row, read it back, deleted it (data is stored persistently)")
        else:
            report(FAIL, "save test: row was written but could not be read back", "Check that RLS is not blocking the service-role key")
    except AppError as exc:
        report(FAIL, f"save test failed: {exc.message}", "Make sure SUPABASE_SERVICE_ROLE_KEY is the service-role key")
    except Exception as exc:
        report(FAIL, f"save test failed: {type(exc).__name__}: {exc}")


def check_gemini(settings) -> None:
    section("AI chatbot (Google Gemini)")
    if not settings.gemini_api_key.strip():
        report(WARN, "GEMINI_API_KEY is empty: the chatbot runs in basic mode (free-slot list only)",
               "Get a key at https://aistudio.google.com/apikey and set GEMINI_API_KEY in backend/.env")
        return
    from app.core.errors import AppError
    from app.services import gemini

    try:
        answer = gemini.generate("Reply with the single word OK.", [("user", "Connection test")])
        models = " / ".join(m for m in (settings.gemini_model, settings.gemini_fallback_model) if m)
        report(OK, f"Gemini answered (models: {models}; reply: {answer[:40]!r})")
    except AppError as exc:
        fix = "Check your internet connection and GEMINI_API_KEY"
        if exc.code == "ai_key_invalid":
            fix = "Create a new key at https://aistudio.google.com/apikey and paste it into GEMINI_API_KEY (no quotes or spaces)"
        elif exc.code == "ai_model_not_found" or "GEMINI_MODEL" in exc.message:
            fix = "Set GEMINI_MODEL to a current model id from https://ai.google.dev/gemini-api/docs/models"
        elif exc.code == "ai_busy":
            fix = "Google's models are overloaded right now; run the check again in a few minutes"
        elif exc.code == "ai_rate_limited":
            fix = "Free-tier limit reached; wait a minute and run the check again"
        report(FAIL, f"Gemini test failed: {exc.message}", fix)


def main() -> int:
    write_test = "--no-write" not in sys.argv
    logging.disable(logging.CRITICAL)  # keep the output to the checklist below
    print("LabLink setup check")
    if not check_python_and_packages():
        print("\nInstall the missing packages first, then run the check again.")
        return 1
    settings = check_settings()
    if settings is None:
        return 1
    check_database(settings, write_test)
    check_gemini(settings)

    print("\n== Summary ==")
    if problems:
        print(f"{len(problems)} problem(s) to fix:")
        for p in problems:
            print(f"  - {p}")
    if warnings:
        print(f"{len(warnings)} warning(s):")
        for w in warnings:
            print(f"  - {w}")
    if not problems and not warnings:
        print("Everything is set up. Start the API with: uvicorn app.main:app --reload --port 8000")
    elif not problems:
        print("No blocking problems. The app runs; fix the warnings for full functionality.")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
