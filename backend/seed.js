const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config({ path: require('path').join(__dirname, '.env') });

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');

    const adminExists = await User.findOne({ email: 'admin@example.com' });
    if (!adminExists) {
      await User.create({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin',
        phone: '+91 9999999999',
      });
      console.log('Admin user created: admin@example.com / admin123');
    } else {
      console.log('Admin user already exists');
    }

    const driverExists = await User.findOne({ email: 'driver@example.com' });
    if (!driverExists) {
      await User.create({
        name: 'Test Driver',
        email: 'driver@example.com',
        password: 'driver123',
        role: 'driver',
        phone: '+91 9876543210',
        licenseNumber: 'DL-2024-001',
        vehicleNumber: 'UP 32 AB 1234',
      });
      console.log('Driver user created: driver@example.com / driver123');
    } else {
      console.log('Driver user already exists');
    }

    await mongoose.connection.close();
    console.log('Seed completed');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
};

seed();
