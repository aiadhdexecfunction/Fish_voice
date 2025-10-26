import os
import requests
from typing import Dict, List, Optional


# GitHub Gist configuration
GIST_ID = "a8b3ca4b2d9acd0fb555a0c0748f4322"
GITHUB_TOKEN = "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"

# Cache for tasks
_tasks_cache: Optional[Dict] = None


def fetch_tasks() -> Dict:
    """Fetch tasks from GitHub Gist via API."""
    global _tasks_cache
    try:
        headers = {
            "Authorization": f"Bearer {GITHUB_TOKEN}",
            "Accept": "application/vnd.github.v3+json"
        }
        
        # Fetch gist via API
        response = requests.get(
            f"https://api.github.com/gists/{GIST_ID}",
            headers=headers,
            timeout=10
        )
        response.raise_for_status()
        gist_data = response.json()
        
        # Extract content from tasks.json file in the gist
        if "files" not in gist_data or "tasks.json" not in gist_data["files"]:
            print("[ERROR] tasks.json not found in gist")
            if _tasks_cache is not None:
                print("[WARNING] Using cached tasks")
                return _tasks_cache
            return {}
        
        import json
        tasks_content = gist_data["files"]["tasks.json"]["content"]
        _tasks_cache = json.loads(tasks_content)
        return _tasks_cache
    except Exception as e:
        print(f"[ERROR] Failed to fetch tasks: {e}")
        import traceback
        traceback.print_exc()
        if _tasks_cache is not None:
            print("[WARNING] Using cached tasks")
            return _tasks_cache
        return {}


def get_tasks() -> Dict:
    """Get tasks (fetch if not cached)."""
    if _tasks_cache is None:
        return fetch_tasks()
    return _tasks_cache


def update_gist(updated_tasks: Dict) -> bool:
    """Update the GitHub Gist with new tasks data."""
    try:
        # Get current gist to get the file SHA
        headers = {
            "Authorization": f"Bearer {GITHUB_TOKEN}",
            "Accept": "application/vnd.github.v3+json"
        }
        
        # Get current gist
        gist_response = requests.get(
            f"https://api.github.com/gists/{GIST_ID}",
            headers=headers,
            timeout=10
        )
        gist_response.raise_for_status()
        gist_data = gist_response.json()
        
        # Find the tasks.json file in the gist
        tasks_file = None
        for filename, file_info in gist_data["files"].items():
            if filename == "tasks.json":
                tasks_file = file_info
                break
        
        if not tasks_file:
            print("[ERROR] tasks.json not found in gist")
            return False
        
        # Update the gist
        import json
        update_data = {
            "description": "Task management for BodyDouble",
            "files": {
                "tasks.json": {
                    "content": json.dumps(updated_tasks, indent=2)
                }
            }
        }
        
        update_response = requests.patch(
            f"https://api.github.com/gists/{GIST_ID}",
            headers=headers,
            json=update_data,
            timeout=10
        )
        update_response.raise_for_status()
        
        # Update cache
        global _tasks_cache
        _tasks_cache = updated_tasks
        
        print(f"[SUCCESS] Gist updated successfully")
        return True
        
    except Exception as e:
        print(f"[ERROR] Failed to update gist: {e}")
        import traceback
        traceback.print_exc()
        return False


def add_task(task_name: str, description: str, subtasks: List[str], due_date: str = "") -> bool:
    """Add a new task to the gist."""
    tasks = get_tasks()
    tasks[task_name] = {
        "description": description,
        "subtasks": subtasks,
        "due_date": due_date
    }
    return update_gist(tasks)


def update_task(task_name: str, description: str = None, subtasks: List[str] = None, due_date: str = None) -> bool:
    """Update an existing task."""
    tasks = get_tasks()
    
    if task_name not in tasks:
        print(f"[ERROR] Task '{task_name}' not found")
        return False
    
    if description is not None:
        tasks[task_name]["description"] = description
    if subtasks is not None:
        tasks[task_name]["subtasks"] = subtasks
    if due_date is not None:
        tasks[task_name]["due_date"] = due_date
    
    return update_gist(tasks)


def delete_task(task_name: str) -> bool:
    """Delete a task from the gist."""
    tasks = get_tasks()
    
    if task_name not in tasks:
        print(f"[ERROR] Task '{task_name}' not found")
        return False
    
    del tasks[task_name]
    return update_gist(tasks)


def add_subtask(task_name: str, subtask: str) -> bool:
    """Add a subtask to an existing task."""
    tasks = get_tasks()
    
    if task_name not in tasks:
        print(f"[ERROR] Task '{task_name}' not found")
        return False
    
    if subtask not in tasks[task_name]["subtasks"]:
        tasks[task_name]["subtasks"].append(subtask)
    
    return update_gist(tasks)


def remove_subtask(task_name: str, subtask: str) -> bool:
    """Remove a subtask from an existing task."""
    tasks = get_tasks()
    
    if task_name not in tasks:
        print(f"[ERROR] Task '{task_name}' not found")
        return False
    
    if subtask in tasks[task_name]["subtasks"]:
        tasks[task_name]["subtasks"].remove(subtask)
    
    return update_gist(tasks)

