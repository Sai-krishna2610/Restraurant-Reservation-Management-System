const Reservation = require('../models/Reservation');
const Table = require('../models/Table');

// Helper to convert HH:MM string to minutes since midnight
const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// Check table availability endpoint
exports.getAvailableTables = async (req, res) => {
  try {
    const { date, startTime, endTime, guests } = req.query;

    if (!date || !startTime || !endTime || !guests) {
      return res.status(400).json({ message: 'Date, start time, end time, and guest count are required.' });
    }

    const reqGuests = parseInt(guests);
    if (reqGuests <= 0) {
      return res.status(400).json({ message: 'Number of guests must be at least 1.' });
    }

    const reqStart = timeToMinutes(startTime);
    const reqEnd = timeToMinutes(endTime);

    if (reqStart >= reqEnd) {
      return res.status(400).json({ message: 'Start time must be before end time.' });
    }

    // Operating hours check (11:00 AM to 11:00 PM)
    const minTime = timeToMinutes('11:00');
    const maxTime = timeToMinutes('23:00');
    if (reqStart < minTime || reqEnd > maxTime) {
      return res.status(400).json({ message: 'Reservations must be within business hours (11:00 to 23:00).' });
    }

    // 1. Fetch all bookings for this date that are not cancelled
    const activeBookings = await Reservation.find({
      date,
      status: 'booked'
    });

    // 2. Fetch all tables
    const tables = await Table.find({}).sort({ tableNumber: 1 });

    // 3. Filter tables that have sufficient capacity
    const qualifyingTables = tables.filter(t => t.capacity >= reqGuests);

    // 4. Exclude tables that have overlapping bookings or violate the 15-minute gap
    const availableTables = qualifyingTables.filter(table => {
      const tableBookings = activeBookings.filter(b => b.table.toString() === table._id.toString());
      
      const hasConflict = tableBookings.some(booking => {
        const existStart = timeToMinutes(booking.startTime);
        const existEnd = timeToMinutes(booking.endTime);
        // Overlap or gap < 15 min conflict check formula
        return reqStart < existEnd + 15 && existStart < reqEnd + 15;
      });

      return !hasConflict;
    });

    res.json(availableTables);
  } catch (error) {
    res.status(500).json({ message: 'Server error retrieving available tables.', error: error.message });
  }
};

// Create a reservation (Customer)
exports.createReservation = async (req, res) => {
  try {
    const { date, startTime, endTime, guests, tableId } = req.body;
    const userId = req.user.id;

    if (!date || !startTime || !endTime || !guests || !tableId) {
      return res.status(400).json({ message: 'Date, start time, end time, guest count, and table selection are required.' });
    }

    const reqGuests = parseInt(guests);
    if (reqGuests <= 0) {
      return res.status(400).json({ message: 'Number of guests must be at least 1.' });
    }

    const reqStart = timeToMinutes(startTime);
    const reqEnd = timeToMinutes(endTime);

    if (reqStart >= reqEnd) {
      return res.status(400).json({ message: 'Start time must be before end time.' });
    }

    const minTime = timeToMinutes('11:00');
    const maxTime = timeToMinutes('23:00');
    if (reqStart < minTime || reqEnd > maxTime) {
      return res.status(400).json({ message: 'Reservations must be within business hours (11:00 to 23:00).' });
    }

    // 1. Verify table exists and fits guests
    const table = await Table.findById(tableId);
    if (!table) {
      return res.status(404).json({ message: 'Selected table not found.' });
    }

    if (table.capacity < reqGuests) {
      return res.status(400).json({ message: `Seating capacity of Table ${table.tableNumber} is ${table.capacity}, which is too small for ${reqGuests} guests.` });
    }

    // 2. Double check booking conflict (in case of race conditions)
    const activeBookings = await Reservation.find({
      table: tableId,
      date,
      status: 'booked'
    });

    const hasConflict = activeBookings.some(booking => {
      const existStart = timeToMinutes(booking.startTime);
      const existEnd = timeToMinutes(booking.endTime);
      return reqStart < existEnd + 15 && existStart < reqEnd + 15;
    });

    if (hasConflict) {
      return res.status(400).json({ message: 'The table is no longer available at this time slot or conflicts with the 15-minute gap requirement.' });
    }

    // 3. Create reservation
    const reservation = new Reservation({
      user: userId,
      table: tableId,
      date,
      startTime,
      endTime,
      guests: reqGuests
    });

    await reservation.save();
    const populated = await reservation.populate('table');

    res.status(201).json({
      message: 'Reservation created successfully.',
      reservation: populated
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error creating reservation.', error: error.message });
  }
};

// Get reservations for the current customer
exports.getCustomerReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find({ user: req.user.id })
      .populate('table')
      .sort({ date: -1, startTime: -1 });
    res.json(reservations);
  } catch (error) {
    res.status(500).json({ message: 'Server error retrieving reservations.', error: error.message });
  }
};

// Get all reservations (Admin only, filterable by date)
exports.getAllReservations = async (req, res) => {
  try {
    const filter = {};
    if (req.query.date) {
      filter.date = req.query.date;
    }

    const reservations = await Reservation.find(filter)
      .populate('user', 'name email')
      .populate('table')
      .sort({ date: 1, startTime: 1 });

    res.json(reservations);
  } catch (error) {
    res.status(500).json({ message: 'Server error retrieving system reservations.', error: error.message });
  }
};

// Cancel a reservation (Customer for own, Admin for any)
exports.cancelReservation = async (req, res) => {
  try {
    const reservationId = req.params.id;
    const reservation = await Reservation.findById(reservationId);

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found.' });
    }

    // Verify ownership or admin privileges
    if (req.user.role !== 'admin' && reservation.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. You can only cancel your own reservations.' });
    }

    if (reservation.status === 'cancelled') {
      return res.status(400).json({ message: 'Reservation is already cancelled.' });
    }

    reservation.status = 'cancelled';
    await reservation.save();

    res.json({ message: 'Reservation cancelled successfully.', reservation });
  } catch (error) {
    res.status(500).json({ message: 'Server error during reservation cancellation.', error: error.message });
  }
};

// Update a reservation (Admin only)
exports.updateReservation = async (req, res) => {
  try {
    const reservationId = req.params.id;
    const { date, startTime, endTime, guests, tableId, status } = req.body;

    const reservation = await Reservation.findById(reservationId);
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found.' });
    }

    const checkDate = date || reservation.date;
    const checkStartStr = startTime || reservation.startTime;
    const checkEndStr = endTime || reservation.endTime;
    const checkGuests = guests !== undefined ? guests : reservation.guests;
    const checkStatus = status || reservation.status;
    const checkTableId = tableId || reservation.table.toString();

    const reqStart = timeToMinutes(checkStartStr);
    const reqEnd = timeToMinutes(checkEndStr);

    if (reqStart >= reqEnd) {
      return res.status(400).json({ message: 'Start time must be before end time.' });
    }

    // Verify table size and existence
    const table = await Table.findById(checkTableId);
    if (!table) {
      return res.status(400).json({ message: 'Target table not found.' });
    }
    if (table.capacity < checkGuests) {
      return res.status(400).json({ message: `Target table capacity (${table.capacity}) is too small for ${checkGuests} guests.` });
    }

    // Check overlap on target table (excluding current reservation itself)
    const activeBookings = await Reservation.find({
      _id: { $ne: reservationId },
      table: checkTableId,
      date: checkDate,
      status: 'booked'
    });

    const hasConflict = activeBookings.some(booking => {
      const existStart = timeToMinutes(booking.startTime);
      const existEnd = timeToMinutes(booking.endTime);
      return reqStart < existEnd + 15 && existStart < reqEnd + 15;
    });

    if (hasConflict && checkStatus === 'booked') {
      return res.status(400).json({ message: 'This change conflicts with another booking or the 15-minute gap requirement on the target table.' });
    }

    reservation.date = checkDate;
    reservation.startTime = checkStartStr;
    reservation.endTime = checkEndStr;
    reservation.guests = checkGuests;
    reservation.status = checkStatus;
    reservation.table = checkTableId;

    await reservation.save();
    const populated = await reservation.populate(['table', 'user']);

    res.json({
      message: 'Reservation updated successfully.',
      reservation: populated
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error updating reservation details.', error: error.message });
  }
};
