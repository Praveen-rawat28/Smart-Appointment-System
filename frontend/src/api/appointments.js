/**
 * Appointments API module — booking, listing, cancellation
 */
import { apiRequest } from './client';

export async function bookSlot(slotId, subject = null, description = null) {
  return apiRequest('/appointments/book', {
    method: 'POST',
    body: JSON.stringify({ slotId, subject, description }),
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

export async function approveAppointment(appointmentId) {
  return apiRequest(`/appointments/${appointmentId}/approve`, {
    method: 'POST',
  });
}

export async function rejectAppointment(appointmentId, alternativeSlot = null) {
  return apiRequest(`/appointments/${appointmentId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ alternativeSlot }),
  });
}

export async function requestNewSlot(appointmentId, newSlotId) {
  return apiRequest(`/appointments/${appointmentId}/request-new-slot`, {
    method: 'POST',
    body: JSON.stringify({ slotId: newSlotId }),
  });
}

export async function fetchPendingAppointments() {
  return apiRequest('/appointments/pending');
}

export async function fetchAllAppointments() {
  return apiRequest('/appointments/all');
}
