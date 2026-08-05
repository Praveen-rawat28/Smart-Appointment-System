/**
 * Booking modal with subject and description fields
 */
import { useState } from 'react';

export default function BookingModal({ slot, onConfirm, onCancel }) {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      await onConfirm(slot.id, subject, description);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Book Appointment</h2>
          <button 
            className="modal-close" 
            onClick={onCancel}
            disabled={submitting}
          >
            ×
          </button>
        </div>
        
        <div className="modal-body">
          <div className="slot-summary">
            <p><strong>Date:</strong> {slot.slot_date}</p>
            <p><strong>Time:</strong> {slot.start_time} – {slot.end_time}</p>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="subject">Subject *</label>
              <input
                id="subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                placeholder="What is this appointment for?"
                disabled={submitting}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide additional details about your appointment..."
                rows={4}
                disabled={submitting}
              />
            </div>
            
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
                className="btn btn-primary"
                disabled={submitting || !subject.trim()}
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
