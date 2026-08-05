/**
 * Single appointment slot card with book action, optimistic UI, and live status.
 */
import { useState } from 'react';
import { bookSlot } from '../api/appointments';
import { getSlotDisplayState, SLOT_MESSAGES } from '../utils/slotStatus';

export default function SlotCard({ slot, onBooked, userBookedDates, now }) {
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState(null);
  const [optimisticStatus, setOptimisticStatus] = useState(null);

  const displayState = getSlotDisplayState(slot, {
    now,
    userBookedDates,
    optimisticStatus,
  });

  const isBookable = displayState === 'available';

  const badgeLabel = {
    available: 'Available',
    booked: 'Occupied',
    past: 'Past',
    'day-blocked': 'Unavailable',
  }[displayState];

  const badgeClass = {
    available: 'green',
    booked: 'gray',
    past: 'gray',
    'day-blocked': 'amber',
  }[displayState];

  const handleBook = async () => {
    if (!isBookable) return;

    setBooking(true);
    setError(null);
    setOptimisticStatus('booked');

    try {
      await bookSlot(slot.id);
      onBooked?.(slot.id);
    } catch (err) {
      setOptimisticStatus(null);
      setError(err.message);
    } finally {
      setBooking(false);
    }
  };

  return (
    <div className={`slot-card slot-card--${displayState}`} aria-disabled={!isBookable}>
      <div className="slot-time">
        <span className="slot-date">{slot.slot_date}</span>
        <span className="slot-hours">{slot.start_time} – {slot.end_time}</span>
      </div>

      <div className="slot-actions">
        <span className={`badge badge-${badgeClass}`}>
          {badgeLabel}
        </span>

        {isBookable && (
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

      {!isBookable && (
        <p className="slot-message">{SLOT_MESSAGES[displayState]}</p>
      )}

      {error && <p className="slot-error">{error}</p>}
    </div>
  );
}
