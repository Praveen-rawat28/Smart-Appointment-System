/**
 * Appointment slots API module
 */
import { apiRequest } from './client';

/**
 * @param {{ date?: string, status?: string, page?: number, limit?: number }} [params]
 */
export async function fetchSlots(params = {}) {
  const query = new URLSearchParams();
  if (params.date) query.set('date', params.date);
  if (params.status) query.set('status', params.status);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));

  const qs = query.toString();
  return apiRequest(`/slots${qs ? `?${qs}` : ''}`);
}
