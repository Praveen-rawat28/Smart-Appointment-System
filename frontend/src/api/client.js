/**
 * Centralized HTTP client for all API communication.
 * Handles auth headers, JSON parsing, and consistent error extraction.
 */

const API_BASE = '/api';

/**
 * Retrieve stored JWT from localStorage
 */
export function getToken() {
  return localStorage.getItem('token');
}

/**
 * Persist or clear JWT in localStorage
 * @param {string|null} token
 */
export function setToken(token) {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
}

/**
 * Generic API request wrapper
 * @param {string} endpoint - Path relative to /api
 * @param {RequestInit} [options={}]
 * @returns {Promise<{ success: boolean, message: string, data: * }>}
 */
export async function apiRequest(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(
      'Cannot connect to the server. Start the backend with: cd backend && npm run dev'
    );
  }

  const text = await response.text();
  let body = {};
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      throw new Error(
        'Server returned an invalid response. Make sure the backend is running on port 5000.'
      );
    }
  }

  if (!response.ok || !body.success) {
    const error = new Error(body.message || 'Request failed');
    error.status = response.status;
    error.errors = body.errors;
    throw error;
  }

  return body;
}
