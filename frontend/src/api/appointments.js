/**
 * Appointments API module — booking, listing, cancellation
 */
import { apiRequest } from './client';

export async function bookSlot(slotId) {
  return apiRequest('/appointments/book', {
    method: 'POST',
    body: JSON.stringify({ slotId }),
  });
}

export async function fetchMyAppointments() {
  return apiRequest('/appointments/my');
}

export async function cancelAppointment(appointmentId) {
  return apiRequest(`/appointments/${appointmentId}`, {
    method: 'DELETE',
  });
}
