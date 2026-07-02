const Table = require('../models/Table');

// Get list of all tables
exports.getTables = async (req, res) => {
  try {
    const tables = await Table.find({}).sort({ tableNumber: 1 });
    res.json(tables);
  } catch (error) {
    res.status(500).json({ message: 'Server error retrieving restaurant tables.', error: error.message });
  }
};

// Create a new table (Admin only)
exports.createTable = async (req, res) => {
  try {
    const { tableNumber, capacity } = req.body;

    if (!tableNumber || !capacity) {
      return res.status(400).json({ message: 'Table number and seating capacity are required.' });
    }

    const tableExists = await Table.findOne({ tableNumber });
    if (tableExists) {
      return res.status(400).json({ message: `Table number ${tableNumber} already exists.` });
    }

    const table = new Table({ tableNumber, capacity });
    await table.save();
    res.status(201).json(table);
  } catch (error) {
    res.status(500).json({ message: 'Server error creating new table.', error: error.message });
  }
};

// Delete a table (Admin only)
exports.deleteTable = async (req, res) => {
  try {
    const tableId = req.params.id;
    const table = await Table.findById(tableId);

    if (!table) {
      return res.status(404).json({ message: 'Table not found.' });
    }

    await Table.deleteOne({ _id: tableId });
    res.json({ message: `Table number ${table.tableNumber} deleted successfully.` });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting table.', error: error.message });
  }
};

// Direct script execution for seeding from CLI
if (require.main === module) {
  const path = require('path');
  require('dotenv').config({ path: path.join(__dirname, '../.env') });
  const mongoose = require('mongoose');
  const seedDatabase = require('../config/db');

  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/restaurant-reservation';

  console.log('Connecting to database for seeding...');
  mongoose.connect(mongoUri)
    .then(async () => {
      console.log('Database connection successful. Running seeding script...');
      await seedDatabase();
      console.log('Seeding completed. Closing connection.');
      mongoose.connection.close();
    })
    .catch((error) => {
      console.error('Database connection failed during seeding:', error.message);
      process.exit(1);
    });
}
