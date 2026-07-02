import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';

const AdminDashboard = ({ token }) => {
  const [reservations, setReservations] = useState([]);
  const [tables, setTables] = useState([]);
  const [filterDate, setFilterDate] = useState('');
  
  // Table management states
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState('');

  // Editing state
  const [editingReservation, setEditingReservation] = useState(null);
  const [editDate, setEditDate] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editGuests, setEditGuests] = useState(1);
  const [editTableId, setEditTableId] = useState('');
  const [editStatus, setEditStatus] = useState('booked');

  // Messages
  const [resvError, setResvError] = useState('');
  const [resvSuccess, setResvSuccess] = useState('');
  const [tableError, setTableError] = useState('');
  const [tableSuccess, setTableSuccess] = useState('');
  const [editError, setEditError] = useState('');

  useEffect(() => {
    fetchReservations();
    fetchTables();
  }, [filterDate]);

  const fetchReservations = async () => {
    try {
      const url = filterDate 
        ? `${API_BASE_URL}/reservations/all?date=${filterDate}` 
        : `${API_BASE_URL}/reservations/all`;

      const response = await fetch(url, {
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
      setResvError(err.message);
    }
  };

  const fetchTables = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/tables`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setTables(data);
      } else {
        throw new Error(data.message || 'Failed to fetch tables.');
      }
    } catch (err) {
      setTableError(err.message);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this reservation?')) {
      return;
    }

    setResvError('');
    setResvSuccess('');

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

      setResvSuccess('Reservation cancelled successfully.');
      fetchReservations();
    } catch (err) {
      setResvError(err.message);
    }
  };

  const handleAddTable = async (e) => {
    e.preventDefault();
    setTableError('');
    setTableSuccess('');

    try {
      const response = await fetch(`${API_BASE_URL}/tables`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          tableNumber: parseInt(newTableNumber),
          capacity: parseInt(newTableCapacity)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to add table.');
      }

      setTableSuccess(`Table ${data.tableNumber} added successfully.`);
      setNewTableNumber('');
      setNewTableCapacity('');
      fetchTables();
    } catch (err) {
      setTableError(err.message);
    }
  };

  const handleDeleteTable = async (id) => {
    if (!window.confirm('Are you sure you want to delete this table? Reservation mappings might be affected.')) {
      return;
    }

    setTableError('');
    setTableSuccess('');

    try {
      const response = await fetch(`${API_BASE_URL}/tables/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete table.');
      }

      setTableSuccess(data.message);
      fetchTables();
    } catch (err) {
      setTableError(err.message);
    }
  };

  const openEditModal = (resv) => {
    setEditingReservation(resv);
    setEditDate(resv.date);
    setEditStartTime(resv.startTime);
    setEditEndTime(resv.endTime);
    setEditGuests(resv.guests);
    setEditTableId(resv.table ? resv.table._id : '');
    setEditStatus(resv.status);
    setEditError('');
  };

  const closeEditModal = () => {
    setEditingReservation(null);
    setEditError('');
  };

  const handleUpdateReservation = async (e) => {
    e.preventDefault();
    setEditError('');

    try {
      const response = await fetch(`${API_BASE_URL}/reservations/${editingReservation._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          date: editDate,
          startTime: editStartTime,
          endTime: editEndTime,
          guests: editGuests,
          tableId: editTableId,
          status: editStatus
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update reservation.');
      }

      setResvSuccess('Reservation updated successfully.');
      closeEditModal();
      fetchReservations();
    } catch (err) {
      setEditError(err.message);
    }
  };

  return (
    <div className="admin-theme">
      <div className="flex-between mb-4">
        <h1>Administrative Dashboard</h1>
        <span className="badge admin-badge">System Administrator Control</span>
      </div>

      <div className="dashboard-grid">
        {/* Left Column: Tables Management */}
        <div className="glass-card">
          <h2>Manage Restaurant Tables</h2>
          
          {tableError && <div className="alert alert-danger">{tableError}</div>}
          {tableSuccess && <div className="alert alert-success">{tableSuccess}</div>}

          <form onSubmit={handleAddTable} className="mb-4">
            <div className="form-group">
              <label htmlFor="tableNumber">Table Number</label>
              <input
                type="number"
                id="tableNumber"
                value={newTableNumber}
                onChange={(e) => setNewTableNumber(e.target.value)}
                required
                placeholder="e.g. 7"
              />
            </div>
            <div className="form-group">
              <label htmlFor="capacity">Seating Capacity</label>
              <input
                type="number"
                id="capacity"
                value={newTableCapacity}
                onChange={(e) => setNewTableCapacity(e.target.value)}
                required
                placeholder="e.g. 4"
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Add Table
            </button>
          </form>

          <h3>Active Tables List</h3>
          {tables.length === 0 ? (
            <p>No tables configured in system.</p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Num</th>
                    <th>Capacity</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tables.map((t) => (
                    <tr key={t._id}>
                      <td>Table {t.tableNumber}</td>
                      <td>{t.capacity} seats</td>
                      <td>
                        <button 
                          className="btn btn-danger" 
                          onClick={() => handleDeleteTable(t._id)}
                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Bookings list & filter */}
        <div className="glass-card">
          <h2>All System Reservations</h2>

          {resvError && <div className="alert alert-danger">{resvError}</div>}
          {resvSuccess && <div className="alert alert-success">{resvSuccess}</div>}

          {/* Filtering bar */}
          <div className="filter-bar">
            <div className="filter-item">
              <label htmlFor="filterDate">Filter By Date</label>
              <input
                type="date"
                id="filterDate"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
            </div>
            {filterDate && (
              <button 
                className="btn btn-secondary" 
                onClick={() => setFilterDate('')}
                style={{ padding: '0.5rem 0.75rem' }}
              >
                Clear Filter
              </button>
            )}
          </div>

          {reservations.length === 0 ? (
            <p className="text-center" style={{ padding: '2rem' }}>No reservations found for the selected view.</p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Time Range</th>
                    <th>Guests</th>
                    <th>Assigned Table</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.map((resv) => (
                    <tr key={resv._id}>
                      <td>
                        <div><strong>{resv.user?.name || 'N/A'}</strong></div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{resv.user?.email || 'N/A'}</div>
                      </td>
                      <td>{resv.date}</td>
                      <td>{resv.startTime} - {resv.endTime}</td>
                      <td>{resv.guests}</td>
                      <td>
                        {resv.table ? `Table ${resv.table.tableNumber} (Cap: ${resv.table.capacity})` : 'Unassigned'}
                      </td>
                      <td>
                        <span className={`badge ${resv.status === 'booked' ? 'badge-success' : 'badge-danger'}`}>
                          {resv.status}
                        </span>
                      </td>
                      <td>
                        <div className="flex-gap-2">
                          <button 
                            className="btn btn-secondary" 
                            onClick={() => openEditModal(resv)}
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                          >
                            Edit
                          </button>
                          {resv.status === 'booked' && (
                            <button 
                              className="btn btn-danger" 
                              onClick={() => handleCancel(resv._id)}
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal Dialog */}
      {editingReservation && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Modify Reservation</h3>
            <p style={{ fontSize: '0.9rem' }}>
              Booking for: <strong>{editingReservation.user?.name || 'Customer'}</strong>
            </p>

            {editError && <div className="alert alert-danger">{editError}</div>}

            <form onSubmit={handleUpdateReservation}>
              <div className="form-group">
                <label htmlFor="editDate">Date</label>
                <input
                  type="date"
                  id="editDate"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="editStartTime">Start Time</label>
                <input
                  type="time"
                  id="editStartTime"
                  value={editStartTime}
                  onChange={(e) => setEditStartTime(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="editEndTime">End Time</label>
                <input
                  type="time"
                  id="editEndTime"
                  value={editEndTime}
                  onChange={(e) => setEditEndTime(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="editGuests">Guests</label>
                <input
                  type="number"
                  id="editGuests"
                  value={editGuests}
                  min="1"
                  onChange={(e) => setEditGuests(parseInt(e.target.value))}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="editTable">Assigned Table</label>
                <select
                  id="editTable"
                  value={editTableId}
                  onChange={(e) => setEditTableId(e.target.value)}
                  required
                >
                  {tables.map(t => (
                    <option key={t._id} value={t._id}>
                      Table {t.tableNumber} (Seats {t.capacity})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="editStatus">Status</label>
                <select
                  id="editStatus"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  required
                >
                  <option value="booked">Booked</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeEditModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
