"""API tests for LabLink (in-memory data store, no network). Run from backend/: `pytest -q`."""

import os
from datetime import date, timedelta

os.environ["DATA_BACKEND"] = "memory"
os.environ["GEMINI_API_KEY"] = ""

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.core.config import get_settings  # noqa: E402
from app.main import app  # noqa: E402
from app.repositories import get_repositories  # noqa: E402
from app.services import gemini  # noqa: E402

D = lambda n: (date.today() + timedelta(days=n)).isoformat()  # noqa: E731


@pytest.fixture()
def client():
    get_repositories.cache_clear()  # fresh seed data for every test
    with TestClient(app) as c:
        yield c


def booking(**overrides):
    body = {
        "resourceId": "r-rpi",
        "date": D(1),
        "slotId": "s2",
        "studentName": "Test Student",
        "projectTitle": "Weather station",
        "purpose": "",
        "deadline": D(5),
    }
    body.update(overrides)
    return body


def assert_error(res, status, code, field=None):
    assert res.status_code == status, res.text
    err = res.json()["error"]
    assert err["code"] == code
    assert err["message"]
    if field:
        assert any(d["field"] == field for d in err["details"]), err


# ---------- health & routing ----------


def test_health(client):
    res = client.get("/api/health")
    assert res.status_code == 200 and res.json()["status"] == "ok"


def test_unknown_route_uses_error_envelope(client):
    assert_error(client.get("/api/nope"), 404, "not_found")


# ---------- catalogue ----------


def test_catalogue_and_filters(client):
    all_items = client.get("/api/resources").json()
    assert len(all_items) == 9
    assert {"id", "name", "requiresApproval", "status"} <= set(all_items[0])
    assert {r["type"] for r in client.get("/api/resources?type=kit").json()} == {"kit"}
    assert all(r["status"] == "available" for r in client.get("/api/resources?available=true").json())
    assert len(client.get("/api/resources?available=true").json()) == 8
    assert [r["id"] for r in client.get("/api/resources?q=oscilloscope").json()] == ["r-osc"]
    assert_error(client.get("/api/resources?type=laser"), 422, "validation_error", "type")


def test_resource_not_found(client):
    assert_error(client.get("/api/resources/r-missing"), 404, "not_found")


def test_availability(client):
    res = client.get(f"/api/resources/r-gpu/availability?date={D(2)}")
    assert res.status_code == 200
    slots = {s["id"]: s["state"] for s in res.json()["slots"]}
    assert slots["s3"] == "requested"  # two pending requests in seed data
    assert_error(client.get(f"/api/resources/r-gpu/availability?date={D(30)}"), 422, "validation_error", "date")
    assert_error(client.get("/api/resources/r-gpu/availability?date=not-a-date"), 422, "validation_error")


# ---------- bookings ----------


def test_instant_booking_and_double_booking(client):
    res = client.post("/api/bookings", json=booking())
    assert res.status_code == 201, res.text
    created = res.json()
    assert created["status"] == "confirmed" and created["studentName"] == "Test Student"
    assert client.get(f"/api/bookings/{created['id']}").json()["id"] == created["id"]
    assert_error(
        client.post("/api/bookings", json=booking(studentName="Someone Else")), 409, "slot_unavailable", "slotId"
    )
    assert client.get("/api/activity?limit=1").json()[0]["message"].startswith("Test Student booked")


def test_approval_resource_creates_pending_request(client):
    res = client.post(
        "/api/bookings",
        json=booking(resourceId="r-pcr", purpose="Amplify samples for the soil project."),
    )
    assert res.status_code == 201 and res.json()["status"] == "pending"
    again = client.post(
        "/api/bookings", json=booking(resourceId="r-pcr", purpose="Amplify samples for the soil project.")
    )
    assert_error(again, 409, "duplicate_booking", "slotId")


@pytest.mark.parametrize(
    "overrides,status,code,field",
    [
        ({"resourceId": "r-gpu", "purpose": "short"}, 422, "validation_error", "purpose"),
        ({"resourceId": "r-cad"}, 409, "resource_unavailable", None),
        ({"resourceId": "r-missing"}, 404, "not_found", None),
        ({"date": D(-1)}, 422, "validation_error", "date"),
        ({"date": D(20)}, 422, "validation_error", "date"),
        ({"deadline": D(-1)}, 422, "validation_error", "deadline"),
        ({"projectTitle": "ab"}, 422, "validation_error", "projectTitle"),
        ({"slotId": "s9"}, 422, "validation_error", "slotId"),
        ({"studentName": "   "}, 422, "validation_error", "studentName"),
    ],
)
def test_booking_validation(client, overrides, status, code, field):
    assert_error(client.post("/api/bookings", json=booking(**overrides)), status, code, field)


def test_approve_reject_cancel(client):
    res = client.post("/api/bookings/b-5/approve", json={})
    assert res.status_code == 200 and res.json()["status"] == "confirmed"
    assert_error(client.post("/api/bookings/b-5/approve", json={}), 409, "invalid_state")

    assert_error(client.post("/api/bookings/b-6/reject", json={"note": "no"}), 422, "validation_error", "note")
    res = client.post("/api/bookings/b-6/reject", json={"note": "Please add safety clearance."})
    assert res.json()["status"] == "rejected" and res.json()["facultyNote"] == "Please add safety clearance."

    assert client.post("/api/bookings/b-7/cancel").json()["status"] == "cancelled"
    assert_error(client.post("/api/bookings/b-7/cancel"), 409, "invalid_state")
    assert_error(client.post("/api/bookings/b-15/cancel"), 409, "invalid_state")  # past booking
    assert_error(client.post("/api/bookings/b-missing/cancel"), 404, "not_found")


def test_booking_filters(client):
    mine = client.get("/api/bookings?student=demo student").json()
    assert mine and all(b["studentName"] == "Demo Student" for b in mine)
    assert all(b["status"] == "pending" for b in client.get("/api/bookings?status=pending").json())


# ---------- conflicts & allocation ----------


def test_conflict_recommendation_and_resolution(client):
    conflicts = client.get("/api/conflicts").json()
    assert len(conflicts) == 2
    gpu = next(c for c in conflicts if c["resourceId"] == "r-gpu")

    rec = client.get(f"/api/conflicts/{gpu['id']}/recommendation").json()
    assert rec["winnerId"] == "b-1"  # nearest deadline (+6 days vs +12)
    assert rec["explanationSource"] == "rule"
    assert [r["bookingId"] for r in rec["reassignments"]] == ["b-2"]

    res = client.post(f"/api/conflicts/{gpu['id']}/resolve")
    assert res.status_code == 200
    updated = {b["id"]: b for b in res.json()["bookings"]}
    assert updated["b-1"]["status"] == "confirmed"
    assert updated["b-2"]["status"] == "pending" and (updated["b-2"]["date"], updated["b-2"]["slotId"]) != (D(2), "s3")
    assert len(client.get("/api/conflicts").json()) == 1
    assert_error(client.post(f"/api/conflicts/{gpu['id']}/resolve"), 404, "not_found")


def test_deadline_first_beats_earlier_submission(client):
    printer = next(c for c in client.get("/api/conflicts").json() if c["resourceId"] == "r-3dp")
    rec = client.get(f"/api/conflicts/{printer['id']}/recommendation").json()
    assert rec["winnerId"] == "b-4"  # deadline +4 wins over b-3 (deadline +9)


def test_approve_blocked_when_slot_confirmed(client):
    client.post("/api/bookings/b-1/approve", json={})
    assert_error(client.post("/api/bookings/b-2/approve", json={}), 409, "slot_unavailable")


# ---------- dashboard ----------


def test_dashboard(client):
    faculty = client.get("/api/dashboard?role=faculty").json()
    assert faculty["totalResources"] == 9 and faculty["availableResources"] == 8
    assert faculty["conflicts"] == 2 and len(faculty["bookingsPerDay"]) == 7
    student = client.get("/api/dashboard?role=student&student=Demo Student").json()
    assert student["pendingRequests"] == 2 and student["conflicts"] == 1
    assert_error(client.get("/api/dashboard?role=student"), 422, "validation_error", "student")


# ---------- AI assistant ----------


def chat_body(**overrides):
    body = {
        "messages": [{"role": "user", "content": "Which labs are free today?"}],
        "role": "student",
        "studentName": "Demo Student",
    }
    body.update(overrides)
    return body


def test_chat_fallback_without_key(client):
    res = client.post("/api/assistant/chat", json=chat_body())
    assert res.status_code == 200
    assert res.json()["source"] == "fallback" and "Tomorrow" in res.json()["reply"]


def test_chat_validation(client):
    assert_error(client.post("/api/assistant/chat", json=chat_body(messages=[])), 422, "validation_error")
    last_assistant = [{"role": "user", "content": "hi"}, {"role": "assistant", "content": "hello"}]
    assert_error(
        client.post("/api/assistant/chat", json=chat_body(messages=last_assistant)), 422, "validation_error", "messages"
    )
    assert_error(
        client.post("/api/assistant/chat", json=chat_body(studentName=None)), 422, "validation_error", "studentName"
    )
    too_long = [{"role": "user", "content": "x" * 2001}]
    assert_error(client.post("/api/assistant/chat", json=chat_body(messages=too_long)), 422, "validation_error")


def test_chat_with_gemini_grounds_answers_and_protects_privacy(client, monkeypatch):
    captured = {}

    def fake_generate(system, messages):
        captured["system"], captured["messages"] = system, messages
        return "The Raspberry Pi Kit is free at 09:00 - 11:00."

    monkeypatch.setattr(get_settings(), "gemini_api_key", "test-key")
    monkeypatch.setattr(gemini, "generate", fake_generate)

    res = client.post("/api/assistant/chat", json=chat_body())
    assert res.status_code == 200 and res.json() == {
        "reply": "The Raspberry Pi Kit is free at 09:00 - 11:00.",
        "source": "gemini",
    }
    system = captured["system"]
    assert "AVAILABILITY" in system and "Raspberry Pi Kit" in system
    assert "YOUR BOOKINGS AND REQUESTS (user: Demo Student)" in system
    assert "Priya S." not in system and "Meera N." not in system  # students never see other students' details
    assert captured["messages"] == [("user", "Which labs are free today?")]

    res = client.post("/api/assistant/chat", json=chat_body(role="faculty", studentName=None))
    assert "PENDING ACCESS REQUESTS" in captured["system"] and "Priya S." in captured["system"]


def test_chat_ai_errors_become_503(client, monkeypatch):
    def failing(*_):
        raise gemini.AIUnavailableError("The AI service is busy right now.", code="ai_rate_limited")

    monkeypatch.setattr(get_settings(), "gemini_api_key", "test-key")
    monkeypatch.setattr(gemini, "generate", failing)
    assert_error(client.post("/api/assistant/chat", json=chat_body()), 503, "ai_rate_limited")
    # recommendations fall back to the rule-based explanation when the AI fails
    gpu = next(c for c in client.get("/api/conflicts").json() if c["resourceId"] == "r-gpu")
    rec = client.get(f"/api/conflicts/{gpu['id']}/recommendation").json()
    assert rec["explanationSource"] == "rule" and rec["reason"]


def test_gemini_http_errors_are_mapped(monkeypatch):
    import httpx

    monkeypatch.setattr(get_settings(), "gemini_api_key", "test-key")

    def respond(status, payload=None):
        return lambda *a, **k: httpx.Response(status, json=payload or {}, request=httpx.Request("POST", "https://x"))

    monkeypatch.setattr(gemini.httpx, "post", respond(429))
    with pytest.raises(gemini.AIUnavailableError) as exc:
        gemini.generate("sys", [("user", "hi")])
    assert exc.value.code == "ai_rate_limited"

    ok = {"candidates": [{"content": {"parts": [{"text": "thinking", "thought": True}, {"text": "Answer"}]}}]}
    monkeypatch.setattr(gemini.httpx, "post", respond(200, ok))
    assert gemini.generate("sys", [("user", "hi")]) == "Answer"


# ---------- database error mapping ----------


def test_supabase_error_mapping():
    from postgrest.exceptions import APIError

    from app.core.errors import ConflictError, DatabaseError, NotFoundError
    from app.repositories.supabase_repo import _map_api_error

    def api_error(code, message):
        return APIError({"code": code, "message": message, "details": None, "hint": None})

    err = _map_api_error(
        api_error("23505", 'duplicate key value violates unique constraint "uq_bookings_confirmed_slot"')
    )
    assert isinstance(err, ConflictError) and err.code == "slot_unavailable"
    err = _map_api_error(api_error("23505", 'violates unique constraint "uq_bookings_student_slot"'))
    assert err.code == "duplicate_booking"
    assert isinstance(_map_api_error(api_error("23503", "fk")), NotFoundError)
    err = _map_api_error(api_error("42P01", 'relation "bookings" does not exist'))
    assert isinstance(err, DatabaseError) and err.status_code == 503 and "schema.sql" in err.message


def test_assistant_rate_limit(client, monkeypatch):
    from app.core.rate_limit import assistant_limiter

    monkeypatch.setattr(get_settings(), "assistant_rate_limit_per_minute", 2)
    assistant_limiter.cache_clear()
    try:
        headers = {"X-Forwarded-For": "203.0.113.9"}
        assert client.post("/api/assistant/chat", json=chat_body(), headers=headers).status_code == 200
        assert client.post("/api/assistant/chat", json=chat_body(), headers=headers).status_code == 200
        assert_error(client.post("/api/assistant/chat", json=chat_body(), headers=headers), 429, "rate_limited")
        other = {"X-Forwarded-For": "198.51.100.7"}
        assert client.post("/api/assistant/chat", json=chat_body(), headers=other).status_code == 200
    finally:
        assistant_limiter.cache_clear()


def test_gemini_falls_back_when_primary_is_busy(monkeypatch):
    import httpx

    monkeypatch.setattr(get_settings(), "gemini_api_key", "test-key")
    monkeypatch.setattr(get_settings(), "gemini_model", "primary-model")
    monkeypatch.setattr(get_settings(), "gemini_fallback_model", "fallback-model")
    calls = []

    def fake_post(url, **_):
        calls.append(url)
        req = httpx.Request("POST", url)
        if "primary-model" in url:
            return httpx.Response(503, json={"error": {"message": "high demand"}}, request=req)
        return httpx.Response(
            200, json={"candidates": [{"content": {"parts": [{"text": "From fallback"}]}}]}, request=req
        )

    monkeypatch.setattr(gemini.httpx, "post", fake_post)
    assert gemini.generate("sys", [("user", "hi")]) == "From fallback"
    assert len(calls) == 2

    def bad_key(url, **_):
        calls.append(url)
        return httpx.Response(
            400, text='{"error": {"details": [{"reason": "API_KEY_INVALID"}]}}', request=httpx.Request("POST", url)
        )

    calls.clear()
    monkeypatch.setattr(gemini.httpx, "post", bad_key)
    with pytest.raises(gemini.AIUnavailableError) as exc:
        gemini.generate("sys", [("user", "hi")])
    assert exc.value.code == "ai_key_invalid" and len(calls) == 1  # no pointless retry on a bad key


# ---------- Security hardening ----------


def test_security_headers_on_api_responses(client):
    res = client.get("/api/health")
    assert res.headers["x-content-type-options"] == "nosniff"
    assert res.headers["x-frame-options"] == "DENY"
    assert res.headers["cache-control"] == "no-store"
    assert "default-src 'none'" in res.headers["content-security-policy"]


def test_docs_page_is_not_blocked_by_api_csp(client):
    res = client.get("/docs")
    assert res.status_code == 200
    assert "content-security-policy" not in res.headers


def test_oversized_body_is_rejected_with_413(client):
    res = client.post(
        "/api/assistant/chat",
        content=b"x" * (get_settings().max_request_body_bytes + 1),
        headers={"Content-Type": "application/json"},
    )
    assert res.status_code == 413
    assert res.json()["error"]["code"] == "payload_too_large"


def test_413_still_carries_cors_headers(client):
    res = client.post(
        "/api/bookings",
        content=b"x" * (get_settings().max_request_body_bytes + 1),
        headers={"Content-Type": "application/json", "Origin": "http://localhost:5173"},
    )
    assert res.status_code == 413
    assert res.headers.get("access-control-allow-origin") == "http://localhost:5173"


def test_cors_rejects_unlisted_methods(client):
    res = client.options(
        "/api/bookings",
        headers={"Origin": "http://localhost:5173", "Access-Control-Request-Method": "DELETE"},
    )
    assert res.status_code == 400
