import { apiCall } from './api';
import { API_ENDPOINTS } from '../config/api';
import { Task, Subtask } from '../App';

// Backend task structure (from GitHub Gist)
interface BackendTask {
  [taskName: string]: {
    description: string;
    subtasks: string[]; // Array of subtask strings
    due_date: string;
  };
}

// Convert backend task to frontend Task format
function backendToFrontend(backendTasks: BackendTask): Task[] {
  return Object.entries(backendTasks).map(([taskName, taskData], index) => ({
    id: `${index + 1}`,
    title: taskName,
    description: taskData.description,
    urgency: 50, // Default value (could be calculated from due_date)
    importance: 50, // Default value
    deadline: taskData.due_date ? new Date(taskData.due_date) : undefined,
    subtasks: taskData.subtasks.map((subtask, subIndex) => ({
      id: `${index + 1}-${subIndex + 1}`,
      title: subtask,
      completed: false,
    })),
    source: 'manual' as const,
    orderInCaterpillar: index,
  }));
}

// Convert frontend Task to backend format
function frontendToBackend(task: Task): { name: string; description: string; subtasks: string[]; due_date: string } {
  return {
    name: task.title,
    description: task.description || '',
    subtasks: task.subtasks.map(s => s.title),
    due_date: task.deadline ? task.deadline.toISOString() : '',
  };
}

export async function fetchTasks(): Promise<Task[]> {
  try {
    console.log('Fetching tasks from:', API_ENDPOINTS.tasks.getAll);
    const response = await apiCall<{ tasks: BackendTask; count: number }>(API_ENDPOINTS.tasks.getAll);
    console.log('Raw API response:', response);
    const convertedTasks = backendToFrontend(response.tasks || {});
    console.log('Converted tasks:', convertedTasks);
    return convertedTasks;
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
    throw error;
  }
}

export async function createTask(task: Task): Promise<void> {
  try {
    const backendTask = frontendToBackend(task);
    await apiCall(API_ENDPOINTS.tasks.add, {
      method: 'POST',
      body: JSON.stringify(backendTask),
    });
  } catch (error) {
    console.error('Failed to create task:', error);
    throw error;
  }
}

export async function updateTask(taskName: string, updates: { description?: string; subtasks?: string[]; due_date?: string }): Promise<void> {
  try {
    await apiCall(API_ENDPOINTS.tasks.update(taskName), {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  } catch (error) {
    console.error('Failed to update task:', error);
    throw error;
  }
}

export async function deleteTask(taskName: string): Promise<void> {
  try {
    await apiCall(API_ENDPOINTS.tasks.delete(taskName), {
      method: 'DELETE',
    });
  } catch (error) {
    console.error('Failed to delete task:', error);
    throw error;
  }
}

export async function addSubtaskToTask(taskName: string, subtaskTitle: string): Promise<void> {
  try {
    await apiCall(API_ENDPOINTS.tasks.addSubtask, {
      method: 'POST',
      body: JSON.stringify({ task_name: taskName, subtask: subtaskTitle }),
    });
  } catch (error) {
    console.error('Failed to add subtask:', error);
    throw error;
  }
}

export async function removeSubtaskFromTask(taskName: string, subtaskTitle: string): Promise<void> {
  try {
    await apiCall(API_ENDPOINTS.tasks.removeSubtask, {
      method: 'DELETE',
      body: JSON.stringify({ task_name: taskName, subtask: subtaskTitle }),
    });
  } catch (error) {
    console.error('Failed to remove subtask:', error);
    throw error;
  }
}

