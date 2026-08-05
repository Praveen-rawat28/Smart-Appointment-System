/**
 * Single appointment slot card with book action and optimistic UI
 */
import { useState } from 'react';
import { bookSlot } from '../api/appointments';

export default function SlotCard({ slot, onBooked }) {
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState(null);
  // Optimistic local status — rolled back on API failure
  const [optimisticStatus, setOptimisticStatus] = useState(null);

  const isAvailable = (optimisticStatus || slot.status) === 'available';

  const handleBook = async () => {
    setBooking(true);
    setError(null);
    setOptimisticStatus('booked'); // Optimistic update

    try {
      await bookSlot(slot.id);
      onBooked?.(slot.id);
    } catch (err) {
      setOptimisticStatus(null); // Rollback on failure
      setError(err.message);
    } finally {
      setBooking(false);
    }
  };

  return (
    <div className={`slot-card ${isAvailable ? 'available' : 'booked'}`}>
      <div className="slot-time">
        <span className="slot-date">{slot.slot_date}</span>
        <span className="slot-hours">{slot.start_time} – {slot.end_time}</span>
      </div>

      <div className="slot-actions">
        <span className={`badge badge-${isAvailable ? 'green' : 'gray'}`}>
          {isAvailable ? 'Available' : 'Booked'}
        </span>

        {isAvailable && (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleBook}
            disabled={booking}
          >
            {booking ? 'Booking...' : 'Book'}
          </button>
        )}
      </div>

      {error && <p className="slot-error">{error}</p>}
    </div>
  );
}
