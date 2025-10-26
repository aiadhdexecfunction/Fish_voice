import { API_BASE_URL } from '../config/api';

// Helper function to make API calls
export async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(endpoint, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `API call failed: ${response.statusText}`);
  }

  return response.json();
}

// Get auth token from localStorage
export function getAuthToken(): string | null {
  return localStorage.getItem('authToken');
}

// Get current user from localStorage
export function getCurrentUser(): string | null {
  return localStorage.getItem('currentUser');
}

// Set auth token and user
export function setAuth(token: string, user: string) {
  localStorage.setItem('authToken', token);
  localStorage.setItem('currentUser', user);
}

// Clear auth
export function clearAuth() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('currentUser');
}

// API client with automatic token handling
export async function authenticatedApiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  return apiCall<T>(endpoint, {
    ...options,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
}

