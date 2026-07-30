const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config({ path: require('path').join(__dirname, '.env') });

const authRoutes = require('./routes/auth');
const driverRoutes = require('./routes/driver');
const adminRoutes = require('./routes/admin');
const alertRoutes = require('./routes/alert');
const reportRoutes = require('./routes/report');

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  'http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002',
  'https://vigileye-driver.vercel.app', 'https://vigileye-admin.vercel.app', 'https://vigileye-landing.vercel.app',
  'https://vigiley-ml.onrender.com',
];

const io = new Server(server, {
  cors: { origin: allowedOrigins, methods: ['GET', 'POST', 'PUT', 'DELETE'] },
});

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

app.use((req, res, next) => {
  req.io = io;
  next();
});

let reqQueue = [];
let processing = false;

function processQueue() {
  if (processing || reqQueue.length === 0) return;
  processing = true;
  const entry = reqQueue.shift();
  const { req, res, next } = entry;
  let responded = false;
  const wrap = (fn) => function(body) {
    if (responded) return;
    responded = true;
    processing = false;
    processQueue();
    return fn.call(this, body);
  };
  res.send = wrap(res.send);
  res.json = wrap(res.json);
  res.end = wrap(res.end);
  next();
}

app.use((req, res, next) => {
  if (req.path === '/api/health' || req.path === '/api/wake-up') return next();
  reqQueue.push({ req, res, next });
  if (reqQueue.length <= 1) processQueue();
});

const requestCounts = new Map();
const RATE_LIMIT = 30;
const RATE_WINDOW = 60000;
const BURST_LIMIT = 5;

app.use((req, res, next) => {
  if (req.path === '/api/health' || req.path === '/api/wake-up') return next();
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, []);
  }
  const timestamps = requestCounts.get(ip).filter(t => now - t < RATE_WINDOW);
  if (timestamps.length >= RATE_LIMIT) {
    return res.status(429).json({ status: 'error', message: 'Too many requests. Please wait a moment.', retryAfter: 60 });
  }
  const recentBurst = timestamps.filter(t => now - t < 5000);
  if (recentBurst.length >= BURST_LIMIT) {
    return res.status(429).json({ status: 'error', message: 'Please slow down. Processing your previous request.', retryAfter: 5 });
  }
  timestamps.push(now);
  requestCounts.set(ip, timestamps);
  next();
});

setInterval(() => {
  const now = Date.now();
  for (const [ip, timestamps] of requestCounts.entries()) {
    const valid = timestamps.filter(t => now - t < RATE_WINDOW);
    if (valid.length === 0) requestCounts.delete(ip);
    else requestCounts.set(ip, valid);
  }
}, 60000);

app.use('/api/auth', authRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/reports', reportRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), queueLength: reqQueue.length });
});

app.get('/api/wake-up', (req, res) => {
  res.json({ status: 'awake', message: 'Server is ready' });
});

app.post('/api/setup', async (req, res) => {
  const User = require('./models/User');
  try {
    const admin = await User.findOne({ email: 'admin@example.com' });
    if (!admin) {
      await User.create({ name: 'Admin User', email: 'admin@example.com', password: 'admin123', role: 'admin', phone: '+91 9999999999' });
    }
    const driver = await User.findOne({ email: 'driver@example.com' });
    if (!driver) {
      await User.create({ name: 'Test Driver', email: 'driver@example.com', password: 'driver123', role: 'driver', phone: '+91 9876543210', licenseNumber: 'DL-2024-001', vehicleNumber: 'UP 32 AB 1234' });
    }
    res.json({ status: 'ok', message: 'Seed completed', admin: !admin, driver: !driver });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-driver', (driverId) => {
    socket.join(`driver-${driverId}`);
  });

  socket.on('join-admin', () => {
    socket.join('admin-room');
  });

  socket.on('drowsiness-alert', (data) => {
    io.to('admin-room').emit('alert', data);
    io.to(`driver-${data.driverId}`).emit('warning', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

mongoose.set('bufferCommands', true);
mongoose.set('bufferTimeoutMS', 30000);

mongoose
  .connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS: 45000,
    maxPoolSize: 5,
    minPoolSize: 0,
  })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
