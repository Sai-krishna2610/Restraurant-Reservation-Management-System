import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';

const CustomerDashboard = ({ token }) => {
  const [reservations, setReservations] = useState([]);
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('20:00');
  const [guests, setGuests] = useState(2);
  const [availableTables, setAvailableTables] = useState([]);
  const [selectedTableId, setSelectedTableId] = useState('');
  
  // Checking states
  const [checkedAvailability, setCheckedAvailability] = useState(false);
  const [checking, setChecking] = useState(false);
  const [booking, setBooking] = useState(false);

  // Notifications
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/reservations`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setReservations(data);
      } else {
        throw new Error(data.message || 'Failed to fetch reservations.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheckAvailability = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setChecking(true);
    setCheckedAvailability(false);
    setAvailableTables([]);
    setSelectedTableId('');

    try {
      const response = await fetch(
        `${API_BASE_URL}/reservations/available-tables?date=${date}&startTime=${startTime}&endTime=${endTime}&guests=${guests}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error checking availability.');
      }

      setAvailableTables(data);
      setCheckedAvailability(true);
      if (data.length === 0) {
        setError('All matching tables are fully booked for this time block. Try a different date, time, or guest count.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setChecking(false);
    }
  };

  const handleConfirmBooking = async () => {
    if (!selectedTableId) {
      setError('Please select a table to complete your booking.');
      return;
    }

    setError('');
    setSuccess('');
    setBooking(true);

    try {
      const response = await fetch(`${API_BASE_URL}/reservations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          date,
          startTime,
          endTime,
          guests,
          tableId: selectedTableId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to confirm booking.');
      }

      setSuccess('Your reservation has been booked successfully.');
      
      // Reset form states
      setDate('');
      setStartTime('18:00');
      setEndTime('20:00');
      setGuests(2);
      setAvailableTables([]);
      setSelectedTableId('');
      setCheckedAvailability(false);

      fetchReservations();
    } catch (err) {
      setError(err.message);
    } finally {
      setBooking(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this reservation?')) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_BASE_URL}/reservations/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to cancel reservation.');
      }

      setSuccess('Reservation cancelled successfully.');
      fetchReservations();
    } catch (err) {
      setError(err.message);
    }
  };

  const getTodayDateString = () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${yyyy}-${mm}-${dd}`;
  };

  return (
    <div className="dashboard-grid">
      {/* Left Column: Form & Availability selection */}
      <div className="glass-card">
        <h2>Book a Table</h2>
        
        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleCheckAvailability}>
          <div className="form-group">
            <label htmlFor="date">Select Date</label>
            <input
              type="date"
              id="date"
              value={date}
              min={getTodayDateString()}
              onChange={(e) => {
                setDate(e.target.value);
                setCheckedAvailability(false);
              }}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="startTime">Start Time</label>
            <input
              type="time"
              id="startTime"
              value={startTime}
              onChange={(e) => {
                setStartTime(e.target.value);
                setCheckedAvailability(false);
              }}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="endTime">End Time</label>
            <input
              type="time"
              id="endTime"
              value={endTime}
              onChange={(e) => {
                setEndTime(e.target.value);
                setCheckedAvailability(false);
              }}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="guests">Number of Guests</label>
            <input
              type="number"
              id="guests"
              value={guests}
              min="1"
              max="20"
              onChange={(e) => {
                setGuests(parseInt(e.target.value));
                setCheckedAvailability(false);
              }}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '1rem' }}
            disabled={checking}
          >
            {checking ? 'Checking Availability...' : 'Check Available Tables'}
          </button>
        </form>

        {/* Display Available Tables */}
        {checkedAvailability && availableTables.length > 0 && (
          <div className="mt-4" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
            <h3>Choose a Table</h3>
            <p style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
              Select one of the available tables for {guests} guests:
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {availableTables.map(table => (
                <div
                  key={table._id}
                  onClick={() => setSelectedTableId(table._id)}
                  style={{
                    padding: '1rem',
                    borderRadius: '8px',
                    border: `2px solid ${selectedTableId === table._id ? 'var(--accent-blue)' : 'var(--border-color)'}`,
                    background: selectedTableId === table._id ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                    cursor: 'pointer',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Table {table.tableNumber}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{table.capacity} Seats</div>
                </div>
              ))}
            </div>

            <button
              onClick={handleConfirmBooking}
              className="btn btn-primary"
              style={{ width: '100%', background: 'var(--accent-emerald)' }}
              disabled={booking || !selectedTableId}
            >
              {booking ? 'Confirming...' : 'Confirm Reservation'}
            </button>
          </div>
        )}
      </div>

      {/* Right Column: Historical Booking List */}
      <div className="glass-card">
        <h2>Your Reservations</h2>
        
        {reservations.length === 0 ? (
          <p className="text-center" style={{ padding: '2rem' }}>You have no reservations booked.</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time Range</th>
                  <th>Guests</th>
                  <th>Table</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((resv) => (
                  <tr key={resv._id}>
                    <td>{resv.date}</td>
                    <td>{resv.startTime} - {resv.endTime}</td>
                    <td>{resv.guests}</td>
                    <td>
                      {resv.table ? `Table ${resv.table.tableNumber} (Seats ${resv.table.capacity})` : 'N/A'}
                    </td>
                    <td>
                      <span className={`badge ${resv.status === 'booked' ? 'badge-success' : 'badge-danger'}`}>
                        {resv.status}
                      </span>
                    </td>
                    <td>
                      {resv.status === 'booked' && (
                        <button 
                          className="btn btn-danger" 
                          onClick={() => handleCancel(resv._id)}
                          style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDashboard;
