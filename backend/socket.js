const jwt = require('jsonwebtoken');
const User = require('./models/User');

/**
 * Every socket must present a valid JWT (handshake auth.token).
 * Admins join `admin-room`; drivers can only join their own room.
 */
function attachSocketAuth(io) {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth && socket.handshake.auth.token;
      if (!token) return next(new Error('unauthorized'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('_id role isActive');
      if (!user || user.isActive === false) return next(new Error('unauthorized'));
      socket.data.user = { id: user._id.toString(), role: user.role };
      return next();
    } catch (err) {
      return next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const { id, role } = socket.data.user;

    socket.on('join-driver', (driverId) => {
      if (role === 'driver' && String(driverId) === id) socket.join(`driver-${id}`);
    });

    socket.on('join-admin', () => {
      if (role === 'admin') socket.join('admin-room');
    });
  });
}

module.exports = { attachSocketAuth };
