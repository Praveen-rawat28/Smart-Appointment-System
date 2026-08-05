/**
 * Admin page for managing appointment requests
 */
import { useEffect, useState } from 'react';
import { fetchPendingAppointments, fetchAllAppointments, approveAppointment, rejectAppointment } from '../api/appointments';
import LoadingSpinner from '../components/LoadingSpinner';
import Alert from '../components/Alert';
import { formatTime12Hour } from '../utils/timeFormat';
import RejectionModal from '../components/RejectionModal';

export default function AdminPage() {
  const [appointments, setAppointments] = useState([]);
  const [filter, setFilter] = useState('pending'); // 'pending' or 'all'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showRejectionModal, setShowRejectionModal] = useState(false);

  const loadAppointments = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = filter === 'pending' 
        ? await fetchPendingAppointments()
        : await fetchAllAppointments();
      setAppointments(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [filter]);

  const handleApprove = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to approve this appointment?')) return;

    try {
      await approveAppointment(appointmentId);
      setSuccess('Appointment approved successfully!');
      loadAppointments();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRejectClick = (appointment) => {
    setSelectedAppointment(appointment);
    setShowRejectionModal(true);
  };

  const handleRejectConfirm = async (alternativeSlot) => {
    try {
      await rejectAppointment(selectedAppointment.id, alternativeSlot);
      setSuccess('Appointment rejected successfully!');
      setShowRejectionModal(false);
      setSelectedAppointment(null);
      loadAppointments();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>Manage appointment requests and bookings.</p>
      </div>

      <Alert type="success" message={success} onClose={() => setSuccess(null)} />
      <Alert type="error" message={error} onClose={() => setError(null)} />

      <div className="admin-filters">
        <button
          type="button"
          className={`btn ${filter === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilter('pending')}
        >
          Pending Requests
        </button>
        <button
          type="button"
          className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilter('all')}
        >
          All Appointments
        </button>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading appointments..." />
      ) : appointments.length === 0 ? (
        <div className="empty-state">
          <p>No {filter} appointments found.</p>
        </div>
      ) : (
        <div className="appointments-list">
          {appointments.map((appt) => (
            <div key={appt.id} className={`appointment-card appointment-card--${appt.status}`}>
              <div className="appointment-info">
                <h3>{appt.slot_date}</h3>
                <p>{formatTime12Hour(appt.start_time)} – {formatTime12Hour(appt.end_time)}</p>
                
                <div className="appointment-user">
                  <p><strong>User:</strong> {appt.user_name}</p>
                  <p><strong>Email:</strong> {appt.user_email}</p>
                </div>
                
                {appt.subject && (
                  <p className="appointment-subject"><strong>Subject:</strong> {appt.subject}</p>
                )}
                
                {appt.description && (
                  <p className="appointment-description">{appt.description}</p>
                )}
                
                <span className={`badge badge-${getStatusBadgeClass(appt.status)}`}>
                  {getStatusLabel(appt.status)}
                </span>
              </div>

              {appt.status === 'pending' && (
                <div className="appointment-actions">
                  <button
                    type="button"
                    className="btn btn-success btn-sm"
                    onClick={() => handleApprove(appt.id)}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => handleRejectClick(appt)}
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showRejectionModal && (
        <RejectionModal
          appointment={selectedAppointment}
          onConfirm={handleRejectConfirm}
          onCancel={() => {
            setShowRejectionModal(false);
            setSelectedAppointment(null);
          }}
        />
      )}
    </div>
  );
}

function getStatusBadgeClass(status) {
  const classes = {
    pending: 'amber',
    confirmed: 'green',
    cancelled: 'gray',
    rejected: 'red',
  };
  return classes[status] || 'gray';
}

function getStatusLabel(status) {
  const labels = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    cancelled: 'Cancelled',
    rejected: 'Rejected',
  };
  return labels[status] || status;
}
