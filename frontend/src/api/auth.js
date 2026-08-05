/**
 * Authentication API module
 */
import { apiRequest } from './client';

export async function register({ name, email, password }) {
  return apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
}

export async function login({ email, password }) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}
