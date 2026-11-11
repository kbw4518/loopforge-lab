import pytest
from fastapi.testclient import TestClient
from app import app

@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("FORGEBOARD_DB", str(tmp_path / "test.db"))
    with TestClient(app) as client:
        yield client

def test_crud_persistence(client):
    assert client.get("/api/tasks").json() == []
    response = client.post("/api/tasks", json={"title": "  测试  "})
    assert response.status_code == 201
    task = response.json()
    assert task["title"] == "测试"
    assert task["priority"] == "medium"
    updated = {**task, "description": "详情", "priority": "high", "status": "done"}
    assert client.put(f"/api/tasks/{task['id']}", json=updated).json() == updated
    with TestClient(app) as restarted:
        assert restarted.get("/api/tasks").json() == [updated]
    assert client.delete(f"/api/tasks/{task['id']}").status_code == 204
    assert client.get("/api/tasks").json() == []

@pytest.mark.parametrize("fields", [
    {"title": ""}, {"title": "   "}, {"title": "字"*101}, {"title": 12},
    {"title": "ok", "priority": "urgent"}, {"title": "ok", "status": "bad"}, {},
])
def test_invalid(client, fields):
    assert client.post("/api/tasks", json=fields).status_code == 422
    assert client.put("/api/tasks/999", json=fields).status_code == 422

def test_boundaries(client):
    for title in [" 字 ", "字"*100]:
        assert client.post("/api/tasks", json={"title": title}).status_code == 201

def test_missing(client):
    assert client.put("/api/tasks/999", json={"title": "ok"}).status_code == 404
    assert client.delete("/api/tasks/999").status_code == 404
