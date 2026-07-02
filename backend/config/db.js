const User = require('../models/User');
const Table = require('../models/Table');

const seedDatabase = async () => {
  try {
    // 1. Seed tables if none exist
    const tableCount = await Table.countDocuments();
    if (tableCount === 0) {
      console.log('No tables found. Seeding default tables...');
      const defaultTables = [
        { tableNumber: 1, capacity: 2 },
        { tableNumber: 2, capacity: 2 },
        { tableNumber: 3, capacity: 4 },
        { tableNumber: 4, capacity: 4 },
        { tableNumber: 5, capacity: 6 },
        { tableNumber: 6, capacity: 8 }
      ];
      await Table.insertMany(defaultTables);
      console.log('Default tables seeded successfully.');
    }

    // 2. Seed admin if none exists
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      console.log('No admin user found. Seeding default admin...');
      const admin = new User({
        name: 'Admin User',
        email: 'admin@restaurant.com',
        password: 'adminpassword',
        role: 'admin'
      });
      await admin.save();
      console.log('Default admin seeded successfully (admin@restaurant.com / adminpassword).');
    }

    // 3. Seed test customer if none exists
    const customerExists = await User.findOne({ email: 'customer@restaurant.com' });
    if (!customerExists) {
      console.log('No test customer found. Seeding default test customer...');
      const customer = new User({
        name: 'Customer User',
        email: 'customer@restaurant.com',
        password: 'customerpassword',
        role: 'customer'
      });
      await customer.save();
      console.log('Default customer seeded successfully (customer@restaurant.com / customerpassword).');
    }
  } catch (error) {
    console.error('Error seeding database:', error.message);
  }
};

module.exports = seedDatabase;
