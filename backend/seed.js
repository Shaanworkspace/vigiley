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

    const drivers = [
      { name: 'Rajesh Kumar', email: 'driver1@example.com', password: 'driver123', phone: '+91 9876543210', licenseNumber: 'DL-2024-001', vehicleNumber: 'UP 32 AB 1234' },
      { name: 'Amit Singh', email: 'driver2@example.com', password: 'driver123', phone: '+91 8765432109', licenseNumber: 'DL-2024-002', vehicleNumber: 'HR 26 CD 5678' },
      { name: 'Suresh Patel', email: 'driver3@example.com', password: 'driver123', phone: '+91 7654321098', licenseNumber: 'DL-2024-003', vehicleNumber: 'GJ 01 EF 9012' },
    ];

    for (const d of drivers) {
      const exists = await User.findOne({ email: d.email });
      if (!exists) {
        await User.create(d);
        console.log(`Driver created: ${d.email} / ${d.password}`);
      } else {
        console.log(`Driver ${d.email} already exists`);
      }
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
