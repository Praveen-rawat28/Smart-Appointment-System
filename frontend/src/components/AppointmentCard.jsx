/**
 * User appointment card with cancel action and optimistic rollback
 */
import { useState } from 'react';
import { cancelAppointment } from '../api/appointments';

export default function AppointmentCard({ appointment, onCancelled }) {
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState(null);
  const [removed, setRemoved] = useState(false);

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;

    setCancelling(true);
    setError(null);
    setRemoved(true); // Optimistic removal

    try {
      await cancelAppointment(appointment.id);
      onCancelled?.(appointment.id);
    } catch (err) {
      setRemoved(false); // Rollback
      setError(err.message);
    } finally {
      setCancelling(false);
    }
  };

  if (removed) return null;

  return (
    <div className="appointment-card">
      <div className="appointment-info">
        <h3>{appointment.slot_date}</h3>
        <p>{appointment.start_time} – {appointment.end_time}</p>
        <span className="badge badge-blue">Confirmed</span>
      </div>

      <button
        type="button"
        className="btn btn-danger btn-sm"
        onClick={handleCancel}
        disabled={cancelling}
      >
        {cancelling ? 'Cancelling...' : 'Cancel'}
      </button>

      {error && <p className="slot-error">{error}</p>}
    </div>
  );
}
