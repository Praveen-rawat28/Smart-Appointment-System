/**
 * Slots listing page — browse and book available appointment slots
 */
import { useEffect, useState, useCallback } from 'react';
import { fetchSlots } from '../api/slots';
import { fetchMyAppointments } from '../api/appointments';
import SlotCard from '../components/SlotCard';
import LoadingSpinner from '../components/LoadingSpinner';
import Alert from '../components/Alert';
import { useCurrentTime } from '../hooks/useCurrentTime';
import { isWeekend, getWeekendErrorMessage } from '../utils/timeFormat';

const REFRESH_INTERVAL_MS = 30000;

export default function SlotsPage() {
  const [slots, setSlots] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [userBookedDates, setUserBookedDates] = useState(new Set());
  const [userPendingSlotIds, setUserPendingSlotIds] = useState(new Set());
  const [filters, setFilters] = useState({ date: '', status: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [weekendError, setWeekendError] = useState(null);
  const now = useCurrentTime(REFRESH_INTERVAL_MS);

  const loadSlots = useCallback(async (page = 1, { silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const params = { page, limit: 12 };
      if (filters.date) params.date = filters.date;
      if (filters.status) params.status = filters.status;

      const [slotsRes, appointmentsRes] = await Promise.all([
        fetchSlots(params),
        fetchMyAppointments(),
      ]);

      const bookedDates = new Set(
        appointmentsRes.data
          .filter((appt) => appt.status === 'confirmed')
          .map((appt) => appt.slot_date)
      );
      const pendingSlotIds = new Set(
        appointmentsRes.data
          .filter((appt) => appt.status === 'pending')
          .map((appt) => appt.slot_id)
      );

      setSlots(slotsRes.data.slots);
      setPagination(slotsRes.data.pagination);
      setUserBookedDates(bookedDates);
      setUserPendingSlotIds(pendingSlotIds);
    } catch (err) {
      setError(err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadSlots(1);
  }, [loadSlots]);

  // Refresh slot data periodically so cancellations and bookings stay in sync
  useEffect(() => {
    const id = setInterval(() => loadSlots(pagination.page, { silent: true }), REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [loadSlots, pagination.page]);

  const handleBooked = () => {
    setSuccess('Appointment request submitted successfully! Waiting for admin approval.');
    loadSlots(pagination.page);
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    
    // Check if selected date is a weekend
    if (filters.date && isWeekend(filters.date)) {
      setWeekendError(getWeekendErrorMessage());
      return;
    }
    
    setWeekendError(null);
    loadSlots(1);
  };

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setFilters((f) => ({ ...f, date: newDate }));
    
    // Clear weekend error when date changes
    if (weekendError && (!newDate || !isWeekend(newDate))) {
      setWeekendError(null);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Available Slots</h1>
        <p>Browse system-generated appointment slots and book one that fits your schedule.</p>
      </div>

      <Alert type="success" message={success} onClose={() => setSuccess(null)} />
      <Alert type="error" message={error} onClose={() => setError(null)} />
      <Alert type="error" message={weekendError} onClose={() => setWeekendError(null)} />

      <form className="filters-bar" onSubmit={handleFilterSubmit}>
        <label>
          Date
          <input
            type="date"
            value={filters.date}
            onChange={handleDateChange}
          />
        </label>

        <label>
          Status
          <select
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
          >
            <option value="">All</option>
            <option value="available">Available</option>
            <option value="booked">Booked</option>
          </select>
        </label>

        <button type="submit" className="btn btn-secondary">Filter</button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setFilters({ date: '', status: '' })}
        >
          Reset
        </button>
      </form>

      {loading ? (
        <LoadingSpinner text="Loading slots..." />
      ) : slots.length === 0 ? (
        <div className="empty-state">
          <p>No slots found for the selected filters.</p>
        </div>
      ) : (
        <>
          <div className="slots-grid">
            {slots.map((slot) => (
              <SlotCard
                key={slot.id}
                slot={slot}
                onBooked={handleBooked}
                userBookedDates={userBookedDates}
                userPendingSlotIds={userPendingSlotIds}
                now={now}
              />
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                type="button"
                className="btn btn-ghost"
                disabled={pagination.page <= 1}
                onClick={() => loadSlots(pagination.page - 1)}
              >
                Previous
              </button>
              <span>Page {pagination.page} of {pagination.totalPages}</span>
              <button
                type="button"
                className="btn btn-ghost"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => loadSlots(pagination.page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
