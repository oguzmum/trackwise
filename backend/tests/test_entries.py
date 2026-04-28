import pytest
from fastapi.testclient import TestClient


def make_habit(client, name="Test Habit"):
    res = client.post("/api/habits/", json={"name": name, "frequency": "daily"})
    return res.json()["id"]


def test_create_entry(client):
    habit_id = make_habit(client)
    res = client.post("/api/entries/", json={"habit_id": habit_id, "date": "2026-04-01", "completed": True})
    assert res.status_code == 201
    assert res.json()["completed"] is True
    assert res.json()["date"] == "2026-04-01"


def test_upsert_updates_existing(client):
    habit_id = make_habit(client)
    client.post("/api/entries/", json={"habit_id": habit_id, "date": "2026-04-01", "completed": False})
    res = client.post("/api/entries/", json={"habit_id": habit_id, "date": "2026-04-01", "completed": True})
    assert res.status_code == 201
    assert res.json()["completed"] is True
    entries = client.get("/api/entries/?date=2026-04-01").json()
    assert len(entries) == 1


def test_list_entries_by_date(client):
    habit_id = make_habit(client)
    client.post("/api/entries/", json={"habit_id": habit_id, "date": "2026-04-01", "completed": True})
    client.post("/api/entries/", json={"habit_id": habit_id, "date": "2026-04-02", "completed": True})
    res = client.get("/api/entries/?date=2026-04-01")
    assert res.status_code == 200
    assert len(res.json()) == 1


def test_list_entries_by_habit_and_month(client):
    h1 = make_habit(client, "H1")
    h2 = make_habit(client, "H2")
    client.post("/api/entries/", json={"habit_id": h1, "date": "2026-04-01", "completed": True})
    client.post("/api/entries/", json={"habit_id": h1, "date": "2026-04-15", "completed": True})
    client.post("/api/entries/", json={"habit_id": h1, "date": "2026-05-01", "completed": True})
    client.post("/api/entries/", json={"habit_id": h2, "date": "2026-04-01", "completed": True})

    res = client.get(f"/api/entries/?habit_id={h1}&month=2026-04")
    assert res.status_code == 200
    assert len(res.json()) == 2


def test_patch_entry(client):
    habit_id = make_habit(client)
    create = client.post("/api/entries/", json={"habit_id": habit_id, "date": "2026-04-01", "completed": False})
    entry_id = create.json()["id"]
    res = client.patch(f"/api/entries/{entry_id}", json={"completed": True, "note": "Done!"})
    assert res.status_code == 200
    assert res.json()["completed"] is True
    assert res.json()["note"] == "Done!"


def test_patch_entry_note_only(client):
    habit_id = make_habit(client)
    create = client.post("/api/entries/", json={"habit_id": habit_id, "date": "2026-04-01", "completed": True})
    entry_id = create.json()["id"]
    res = client.patch(f"/api/entries/{entry_id}", json={"note": "Great session"})
    assert res.status_code == 200
    assert res.json()["completed"] is True
    assert res.json()["note"] == "Great session"


def test_patch_entry_not_found(client):
    res = client.patch("/api/entries/999", json={"completed": True})
    assert res.status_code == 404


def test_bulk_create_entries(client):
    h1 = make_habit(client, "Bulk1")
    h2 = make_habit(client, "Bulk2")
    payload = {
        "entries": [
            {"habit_id": h1, "date": "2026-04-10", "completed": True},
            {"habit_id": h2, "date": "2026-04-10", "completed": True},
        ]
    }
    res = client.post("/api/entries/bulk", json=payload)
    assert res.status_code == 201
    assert len(res.json()) == 2


def test_bulk_upsert(client):
    habit_id = make_habit(client)
    client.post("/api/entries/", json={"habit_id": habit_id, "date": "2026-04-10", "completed": False})
    payload = {"entries": [{"habit_id": habit_id, "date": "2026-04-10", "completed": True}]}
    res = client.post("/api/entries/bulk", json=payload)
    assert res.status_code == 201
    assert res.json()[0]["completed"] is True


def test_invalid_month_format(client):
    res = client.get("/api/entries/?month=April-2026")
    assert res.status_code == 400
