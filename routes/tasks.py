from fastapi import APIRouter, HTTPException
from typing import Dict, List, Optional
from pydantic import BaseModel
import tasks as tasks_module

router = APIRouter(prefix="/tasks", tags=["tasks"])


class Task(BaseModel):
    name: str
    description: str
    subtasks: List[str]
    due_date: str = ""


class TaskUpdate(BaseModel):
    description: Optional[str] = None
    subtasks: Optional[List[str]] = None
    due_date: Optional[str] = None


class SubtaskOperation(BaseModel):
    task_name: str
    subtask: str


@router.get("/", summary="Get all tasks")
async def get_all_tasks():
    """Fetch all tasks from the GitHub Gist."""
    try:
        tasks = tasks_module.get_tasks()
        return {"tasks": tasks, "count": len(tasks)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch tasks: {str(e)}")


@router.post("/add", summary="Add a new task")
async def add_task(task: Task):
    """Add a new task to the gist."""
    success = tasks_module.add_task(
        task_name=task.name,
        description=task.description,
        subtasks=task.subtasks,
        due_date=task.due_date
    )
    if not success:
        raise HTTPException(status_code=500, detail="Failed to add task")
    return {"message": f"Task '{task.name}' added successfully", "success": True}


@router.put("/update/{task_name}", summary="Update an existing task")
async def update_task(task_name: str, update: TaskUpdate):
    """Update an existing task."""
    success = tasks_module.update_task(
        task_name=task_name,
        description=update.description,
        subtasks=update.subtasks,
        due_date=update.due_date
    )
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update task")
    return {"message": f"Task '{task_name}' updated successfully", "success": True}


@router.delete("/delete/{task_name}", summary="Delete a task")
async def delete_task(task_name: str):
    """Delete a task from the gist."""
    success = tasks_module.delete_task(task_name)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete task")
    return {"message": f"Task '{task_name}' deleted successfully", "success": True}


@router.post("/subtask/add", summary="Add a subtask to a task")
async def add_subtask(operation: SubtaskOperation):
    """Add a subtask to an existing task."""
    success = tasks_module.add_subtask(
        task_name=operation.task_name,
        subtask=operation.subtask
    )
    if not success:
        raise HTTPException(status_code=500, detail="Failed to add subtask")
    return {"message": f"Subtask added to '{operation.task_name}'", "success": True}


@router.delete("/subtask/remove", summary="Remove a subtask from a task")
async def remove_subtask(operation: SubtaskOperation):
    """Remove a subtask from an existing task."""
    success = tasks_module.remove_subtask(
        task_name=operation.task_name,
        subtask=operation.subtask
    )
    if not success:
        raise HTTPException(status_code=500, detail="Failed to remove subtask")
    return {"message": f"Subtask removed from '{operation.task_name}'", "success": True}

