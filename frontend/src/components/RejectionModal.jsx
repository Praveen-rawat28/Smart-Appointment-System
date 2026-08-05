/**
 * Rejection modal for admin to suggest alternative time slots
 */
import { useEffect, useState } from 'react';
import { fetchSlots } from '../api/slots';
import { formatTime12Hour } from '../utils/timeFormat';

export default function RejectionModal({ appointment, onConfirm, onCancel }) {
  const [suggestAlternative, setSuggestAlternative] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotError, setSlotError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!suggestAlternative) {
      setSelectedSlotId('');
      setSlotError(null);
      return;
    }

    let cancelled = false;

    async function loadSlotsForDay() {
      setLoadingSlots(true);
      setSlotError(null);

      try {
        const { data } = await fetchSlots({
          date: appointment.slot_date,
          status: 'available',
          limit: 100,
        });
        const slots = data.slots.filter((slot) => slot.id !== appointment.slot_id);

        if (!cancelled) {
          setAvailableSlots(slots);
          setSelectedSlotId(slots[0]?.id ? String(slots[0].id) : '');
        }
      } catch (err) {
        if (!cancelled) {
          setAvailableSlots([]);
          setSelectedSlotId('');
          setSlotError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoadingSlots(false);
        }
      }
    }

    loadSlotsForDay();

    return () => {
      cancelled = true;
    };
  }, [appointment.slot_date, appointment.slot_id, suggestAlternative]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let alternativeSlot = null;
      
      const selectedSlot = availableSlots.find((slot) => String(slot.id) === selectedSlotId);

      if (suggestAlternative && selectedSlot) {
        alternativeSlot = {
          date: selectedSlot.slot_date,
          startTime: selectedSlot.start_time,
          endTime: selectedSlot.end_time,
        };
      }
      
      await onConfirm(alternativeSlot);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Reject Appointment</h2>
          <button 
            className="modal-close" 
            onClick={onCancel}
            disabled={submitting}
          >
            ×
          </button>
        </div>
        
        <div className="modal-body">
          <div className="appointment-summary">
            <p><strong>User:</strong> {appointment.user_name}</p>
            <p><strong>Email:</strong> {appointment.user_email}</p>
            <p><strong>Date:</strong> {appointment.slot_date}</p>
            <p><strong>Time:</strong> {formatTime12Hour(appointment.start_time)} – {formatTime12Hour(appointment.end_time)}</p>
            {appointment.subject && (
              <p><strong>Subject:</strong> {appointment.subject}</p>
            )}
            {appointment.description && (
              <p><strong>Description:</strong> {appointment.description}</p>
            )}
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={suggestAlternative}
                  onChange={(e) => setSuggestAlternative(e.target.checked)}
                  disabled={submitting}
                />
                Suggest alternative time slot
              </label>
            </div>
            
            {suggestAlternative && (
              <div className="form-group">
                <label htmlFor="alternativeSlot">Alternative Slot on {appointment.slot_date} *</label>
                <select
                  id="alternativeSlot"
                  value={selectedSlotId}
                  onChange={(e) => setSelectedSlotId(e.target.value)}
                  required={suggestAlternative}
                  disabled={submitting || loadingSlots || availableSlots.length === 0}
                >
                  {loadingSlots ? (
                    <option value="">Loading slots...</option>
                  ) : availableSlots.length === 0 ? (
                    <option value="">No available slots for this day</option>
                  ) : (
                    availableSlots.map((slot) => (
                      <option key={slot.id} value={slot.id}>
                        {formatTime12Hour(slot.start_time)} - {formatTime12Hour(slot.end_time)}
                      </option>
                    ))
                  )}
                </select>
                {slotError && <p className="slot-error">{slotError}</p>}
              </div>
            )}
            
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onCancel}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-danger"
                disabled={submitting || (suggestAlternative && (loadingSlots || !selectedSlotId))}
              >
                {submitting ? 'Rejecting...' : 'Reject Appointment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
