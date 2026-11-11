import os
import sqlite3
from contextlib import contextmanager
from typing import Literal
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, field_validator

app = FastAPI(title="ForgeBoard")

@contextmanager
def database():
    with sqlite3.connect(os.getenv("FORGEBOARD_DB", "forgeboard.db")) as db:
        db.row_factory = sqlite3.Row
        db.execute("CREATE TABLE IF NOT EXISTS tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, description TEXT NOT NULL, priority TEXT NOT NULL, status TEXT NOT NULL)")
        yield db

class TaskInput(BaseModel):
    title: str
    description: str = ""
    priority: Literal["low", "medium", "high"] = "medium"
    status: Literal["todo", "in_progress", "done"] = "todo"

    @field_validator("title")
    @classmethod
    def validate_title(cls, value):
        value = value.strip()
        if not 1 <= len(value) <= 100:
            raise ValueError("标题须为 1～100 字符")
        return value

@app.get("/api/tasks")
def tasks():
    with database() as db:
        return [dict(row) for row in db.execute("SELECT * FROM tasks ORDER BY id DESC")]

@app.post("/api/tasks", status_code=201)
def create(task: TaskInput):
    with database() as db:
        cursor = db.execute("INSERT INTO tasks(title,description,priority,status) VALUES(?,?,?,?)", (task.title,task.description,task.priority,task.status))
        return dict(db.execute("SELECT * FROM tasks WHERE id=?", (cursor.lastrowid,)).fetchone())

@app.put("/api/tasks/{task_id}")
def update(task_id: int, task: TaskInput):
    with database() as db:
        cursor = db.execute("UPDATE tasks SET title=?,description=?,priority=?,status=? WHERE id=?", (task.title,task.description,task.priority,task.status,task_id))
        if not cursor.rowcount:
            raise HTTPException(404, "任务不存在")
        return dict(db.execute("SELECT * FROM tasks WHERE id=?", (task_id,)).fetchone())

@app.delete("/api/tasks/{task_id}", status_code=204)
def delete(task_id: int):
    with database() as db:
        if not db.execute("DELETE FROM tasks WHERE id=?", (task_id,)).rowcount:
            raise HTTPException(404, "任务不存在")
