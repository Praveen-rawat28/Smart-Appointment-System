/**
 * Single appointment slot card with book action, optimistic UI, and live status.
 */
import { useState } from 'react';
import { bookSlot } from '../api/appointments';
import { getSlotDisplayState, SLOT_MESSAGES } from '../utils/slotStatus';
import BookingModal from './BookingModal';
import { formatTime12Hour } from '../utils/timeFormat';

export default function SlotCard({ slot, onBooked, userBookedDates, userPendingSlotIds, now }) {
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState(null);
  const [optimisticStatus, setOptimisticStatus] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  const displayState = getSlotDisplayState(slot, {
    now,
    userBookedDates,
    userPendingSlotIds,
    optimisticStatus,
  });

  const isBookable = displayState === 'available';

  const badgeLabel = {
    available: 'Available',
    pending: 'Pending',
    booked: 'Occupied',
    past: 'Past',
    'day-blocked': 'Unavailable',
  }[displayState];

  const badgeClass = {
    available: 'green',
    pending: 'amber',
    booked: 'gray',
    past: 'gray',
    'day-blocked': 'amber',
  }[displayState];

  const handleBookClick = () => {
    if (!isBookable) return;
    setShowBookingModal(true);
  };

  const handleBookingConfirm = async (slotId, subject, description) => {
    setBooking(true);
    setError(null);
    setOptimisticStatus('pending');

    try {
      await bookSlot(slotId, subject, description);
      setShowBookingModal(false);
      onBooked?.();
    } catch (err) {
      setOptimisticStatus(null);
      setError(err.message);
    } finally {
      setBooking(false);
    }
  };

  return (
    <>
      <div className={`slot-card slot-card--${displayState}`} aria-disabled={!isBookable}>
        <div className="slot-time">
          <span className="slot-date">{slot.slot_date}</span>
          <span className="slot-hours">{formatTime12Hour(slot.start_time)} – {formatTime12Hour(slot.end_time)}</span>
        </div>

        <div className="slot-actions">
          <span className={`badge badge-${badgeClass}`}>
            {badgeLabel}
          </span>

          {isBookable && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleBookClick}
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

      {showBookingModal && (
        <BookingModal
          slot={slot}
          onConfirm={handleBookingConfirm}
          onCancel={() => setShowBookingModal(false)}
        />
      )}
    </>
  );
}
