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
      { name: 'Utkarsh Sharma', email: 'utkarsh@example.com', password: 'driver123', phone: '+91 9123456701', licenseNumber: 'DL-2024-004', vehicleNumber: 'DL 01 CX 1234' },
      { name: 'Shreya Verma', email: 'shreya@example.com', password: 'driver123', phone: '+91 9123456702', licenseNumber: 'DL-2024-005', vehicleNumber: 'DL 02 CX 5678' },
      { name: 'Shaan Mehta', email: 'shaan@example.com', password: 'driver123', phone: '+91 9123456703', licenseNumber: 'DL-2024-006', vehicleNumber: 'DL 03 CX 9012' },
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
