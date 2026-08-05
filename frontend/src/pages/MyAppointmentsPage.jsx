/**
 * My Appointments page — view and cancel booked appointments
 */
import { useEffect, useState } from 'react';
import { fetchMyAppointments } from '../api/appointments';
import AppointmentCard from '../components/AppointmentCard';
import LoadingSpinner from '../components/LoadingSpinner';
import Alert from '../components/Alert';

export default function MyAppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const loadAppointments = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await fetchMyAppointments();
      setAppointments(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const handleCancelled = () => {
    setSuccess('Appointment cancelled successfully.');
    loadAppointments();
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>My Appointments</h1>
        <p>View your confirmed bookings. Cancellations must be made at least 24 hours before start time.</p>
      </div>

      <Alert type="success" message={success} onClose={() => setSuccess(null)} />
      <Alert type="error" message={error} onClose={() => setError(null)} />

      {loading ? (
        <LoadingSpinner text="Loading your appointments..." />
      ) : appointments.length === 0 ? (
        <div className="empty-state">
          <p>You have no upcoming appointments.</p>
        </div>
      ) : (
        <div className="appointments-list">
          {appointments.map((appt) => (
            <AppointmentCard
              key={appt.id}
              appointment={appt}
              onCancelled={handleCancelled}
            />
          ))}
        </div>
      )}
    </div>
  );
}
