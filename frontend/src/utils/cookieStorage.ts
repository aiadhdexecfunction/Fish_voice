/**
 * Cookie storage utilities for managing daily tasks
 */

const COOKIE_NAME = 'daily_tasks';
const COOKIE_EXPIRY_DAYS = 1;

interface DailyTasksData {
  date: string; // ISO date string (YYYY-MM-DD)
  tasks: string[]; // Array of subtask IDs
}

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Set a cookie with the given name, value, and expiration
 */
function setCookie(name: string, value: string, days: number = COOKIE_EXPIRY_DAYS): void {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/`;
}

/**
 * Get a cookie value by name
 */
function getCookie(name: string): string | null {
  const nameEQ = name + '=';
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
  }
  return null;
}

/**
 * Save daily tasks to cookie
 */
export function saveDailyTasks(tasks: string[]): void {
  const data: DailyTasksData = {
    date: getTodayDate(),
    tasks,
  };
  setCookie(COOKIE_NAME, JSON.stringify(data), COOKIE_EXPIRY_DAYS);
}

/**
 * Load daily tasks from cookie, but only if they're for today
 */
export function loadDailyTasks(): string[] {
  const cookieValue = getCookie(COOKIE_NAME);
  if (!cookieValue) {
    return [];
  }

  try {
    const data: DailyTasksData = JSON.parse(cookieValue);
    const today = getTodayDate();

    // Only return tasks if they're from today
    if (data.date === today) {
      return data.tasks || [];
    }

    // If it's a different day, return empty array
    return [];
  } catch (error) {
    console.error('Failed to parse daily tasks from cookie:', error);
    return [];
  }
}

/**
 * Check if there's stored data for today
 */
export function hasTodaysTasks(): boolean {
  const cookieValue = getCookie(COOKIE_NAME);
  if (!cookieValue) return false;

  try {
    const data: DailyTasksData = JSON.parse(cookieValue);
    const today = getTodayDate();
    return data.date === today;
  } catch {
    return false;
  }
}

