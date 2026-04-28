import pytest
from fastapi.testclient import TestClient


def test_create_habit(client):
    res = client.post("/api/habits/", json={"name": "Read 20 min", "frequency": "daily"})
    assert res.status_code == 201
    data = res.json()
    assert data["name"] == "Read 20 min"
    assert data["is_active"] is True
    assert data["frequency"] == "daily"


def test_list_habits_empty(client):
    res = client.get("/api/habits/")
    assert res.status_code == 200
    assert res.json() == []


def test_list_habits(client):
    client.post("/api/habits/", json={"name": "Meditate"})
    client.post("/api/habits/", json={"name": "Run"})
    res = client.get("/api/habits/")
    assert res.status_code == 200
    assert len(res.json()) == 2


def test_list_habits_filter_active(client):
    client.post("/api/habits/", json={"name": "Active"})
    create = client.post("/api/habits/", json={"name": "Will Pause"})
    habit_id = create.json()["id"]
    client.patch(f"/api/habits/{habit_id}/toggle")

    res = client.get("/api/habits/?active=true")
    assert res.status_code == 200
    assert all(h["is_active"] for h in res.json())
    assert len(res.json()) == 1


def test_update_habit(client):
    create = client.post("/api/habits/", json={"name": "Run", "frequency": "daily"})
    habit_id = create.json()["id"]
    res = client.put(f"/api/habits/{habit_id}", json={"name": "Run 5km", "frequency": "weekdays"})
    assert res.status_code == 200
    assert res.json()["name"] == "Run 5km"
    assert res.json()["frequency"] == "weekdays"


def test_toggle_habit(client):
    create = client.post("/api/habits/", json={"name": "Toggle Me"})
    habit_id = create.json()["id"]
    res = client.patch(f"/api/habits/{habit_id}/toggle")
    assert res.status_code == 200
    assert res.json()["is_active"] is False
    res = client.patch(f"/api/habits/{habit_id}/toggle")
    assert res.json()["is_active"] is True


def test_delete_habit(client):
    create = client.post("/api/habits/", json={"name": "Delete Me"})
    habit_id = create.json()["id"]
    res = client.delete(f"/api/habits/{habit_id}")
    assert res.status_code == 204
    assert client.get("/api/habits/").json() == []


def test_habit_not_found_on_update(client):
    res = client.put("/api/habits/999", json={"name": "Ghost", "frequency": "daily"})
    assert res.status_code == 404


def test_habit_not_found_on_toggle(client):
    res = client.patch("/api/habits/999/toggle")
    assert res.status_code == 404


def test_habit_not_found_on_delete(client):
    res = client.delete("/api/habits/999")
    assert res.status_code == 404


def test_habit_with_category(client):
    cat = client.post("/api/categories/", json={"name": "Fitness", "color": "#c9614a"}).json()
    res = client.post("/api/habits/", json={"name": "Run", "category_id": cat["id"]})
    assert res.status_code == 201
    assert res.json()["category"]["name"] == "Fitness"
