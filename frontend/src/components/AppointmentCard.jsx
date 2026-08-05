/**
 * User appointment card with cancel action and optimistic rollback
 */
import { useState } from 'react';
import { cancelAppointment, requestNewSlot } from '../api/appointments';
import { formatTime12Hour } from '../utils/timeFormat';

export default function AppointmentCard({ appointment, onCancelled, onNewSlotRequested }) {
  const [cancelling, setCancelling] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState(null);
  const [removed, setRemoved] = useState(false);
  const [showSlotSelector, setShowSlotSelector] = useState(false);

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

  const handleRequestNewSlot = async (newSlotId) => {
    setRequesting(true);
    setError(null);

    try {
      await requestNewSlot(appointment.id, newSlotId);
      setShowSlotSelector(false);
      onNewSlotRequested?.(appointment.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setRequesting(false);
    }
  };

  if (removed) return null;

  const statusConfig = {
    pending: {
      label: 'Pending Approval',
      badgeClass: 'amber',
      showCancel: true,
      showActions: false,
    },
    confirmed: {
      label: 'Confirmed',
      badgeClass: 'green',
      showCancel: true,
      showActions: false,
    },
    cancelled: {
      label: 'Cancelled',
      badgeClass: 'gray',
      showCancel: false,
      showActions: false,
    },
    rejected: {
      label: 'Rejected',
      badgeClass: 'red',
      showCancel: false,
      showActions: true,
    },
  };

  const config = statusConfig[appointment.status] || statusConfig.pending;

  return (
    <div className={`appointment-card appointment-card--${appointment.status}`}>
      <div className="appointment-info">
        <h3>{appointment.slot_date}</h3>
        <p>{formatTime12Hour(appointment.start_time)} – {formatTime12Hour(appointment.end_time)}</p>
        
        {appointment.subject && (
          <p className="appointment-subject"><strong>Subject:</strong> {appointment.subject}</p>
        )}
        
        {appointment.description && (
          <p className="appointment-description">{appointment.description}</p>
        )}
        
        <span className={`badge badge-${config.badgeClass}`}>{config.label}</span>
        
        {appointment.status === 'rejected' && appointment.alternative_slot_date && (
          <div className="alternative-suggestion">
            <p><strong>Admin suggested alternative:</strong></p>
            <p>{appointment.alternative_slot_date}</p>
            <p>{formatTime12Hour(appointment.alternative_slot_start_time)} – {formatTime12Hour(appointment.alternative_slot_end_time)}</p>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setShowSlotSelector(true)}
              disabled={requesting}
            >
              {requesting ? 'Requesting...' : 'Request New Time Slot'}
            </button>
          </div>
        )}
      </div>

      {config.showCancel && (
        <button
          type="button"
          className="btn btn-danger btn-sm"
          onClick={handleCancel}
          disabled={cancelling}
        >
          {cancelling ? 'Cancelling...' : 'Cancel'}
        </button>
      )}

      {error && <p className="slot-error">{error}</p>}
      
      {showSlotSelector && (
        <SlotSelector
          onRequestSlot={handleRequestNewSlot}
          onCancel={() => setShowSlotSelector(false)}
          loading={requesting}
        />
      )}
    </div>
  );
}

function SlotSelector({ onRequestSlot, onCancel, loading }) {
  const [selectedSlotId, setSelectedSlotId] = useState('');
  
  // This would normally fetch available slots, but for simplicity we'll use a basic input
  // In a real implementation, you'd want to show a dropdown or modal with available slots
  
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Select New Time Slot</h2>
          <button className="modal-close" onClick={onCancel} disabled={loading}>×</button>
        </div>
        <div className="modal-body">
          <p>Enter the slot ID you'd like to request:</p>
          <input
            type="number"
            value={selectedSlotId}
            onChange={(e) => setSelectedSlotId(e.target.value)}
            placeholder="Slot ID"
            disabled={loading}
          />
          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onRequestSlot(parseInt(selectedSlotId))}
              disabled={loading || !selectedSlotId}
            >
              {loading ? 'Requesting...' : 'Request Slot'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
