const path = require('path');
const http = require('http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { Server } = require('socket.io');

dotenv.config({ path: path.join(__dirname, '.env') });

const { createApp, allowedOrigins } = require('./app');
const { attachSocketAuth } = require('./socket');

const required = ['MONGODB_URI', 'JWT_SECRET'];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`[startup] Missing required env vars: ${missing.join(', ')}`);
  process.exit(1);
}

const io = new Server({ cors: { origin: allowedOrigins(), methods: ['GET', 'POST', 'PUT', 'DELETE'] } });
const app = createApp({ io, dbReady: () => mongoose.connection.readyState === 1 });
const server = http.createServer(app);
io.attach(server);
attachSocketAuth(io);

mongoose.connection.on('disconnected', () => console.warn('[db] disconnected'));
mongoose.connection.on('reconnected', () => console.info('[db] reconnected'));

mongoose
  .connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS: 45000,
    maxPoolSize: 5,
  })
  .then(() => console.info('[db] connected'))
  .catch((err) => {
    console.error('[db] initial connection failed:', err.message);
    process.exit(1);
  });

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.info(`[startup] VigilEye API listening on ${PORT}`));
