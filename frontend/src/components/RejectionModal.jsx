/**
 * Rejection modal for admin to suggest alternative time slots
 */
import { useState } from 'react';
import { formatTime12Hour } from '../utils/timeFormat';

export default function RejectionModal({ appointment, onConfirm, onCancel }) {
  const [suggestAlternative, setSuggestAlternative] = useState(false);
  const [alternativeDate, setAlternativeDate] = useState('');
  const [alternativeStartTime, setAlternativeStartTime] = useState('');
  const [alternativeEndTime, setAlternativeEndTime] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let alternativeSlot = null;
      
      if (suggestAlternative && alternativeDate && alternativeStartTime && alternativeEndTime) {
        alternativeSlot = {
          date: alternativeDate,
          startTime: alternativeStartTime,
          endTime: alternativeEndTime,
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
              <>
                <div className="form-group">
                  <label htmlFor="alternativeDate">Alternative Date *</label>
                  <input
                    id="alternativeDate"
                    type="date"
                    value={alternativeDate}
                    onChange={(e) => setAlternativeDate(e.target.value)}
                    required={suggestAlternative}
                    disabled={submitting}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="alternativeStartTime">Start Time *</label>
                  <input
                    id="alternativeStartTime"
                    type="time"
                    value={alternativeStartTime}
                    onChange={(e) => setAlternativeStartTime(e.target.value)}
                    required={suggestAlternative}
                    disabled={submitting}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="alternativeEndTime">End Time *</label>
                  <input
                    id="alternativeEndTime"
                    type="time"
                    value={alternativeEndTime}
                    onChange={(e) => setAlternativeEndTime(e.target.value)}
                    required={suggestAlternative}
                    disabled={submitting}
                  />
                </div>
              </>
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
                disabled={submitting}
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
