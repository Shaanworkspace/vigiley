process.env.JWT_SECRET = 'test-secret-for-unit-tests-only';

jest.mock('../models/User', () => {
  const created = [];
  const User = {
    created,
    findOne: jest.fn(async () => null),
    findById: jest.fn(),
    create: jest.fn(async (doc) => {
      const user = { _id: 'u1', ...doc, toJSON() { const { password, ...rest } = this; return rest; } };
      created.push(user);
      return user;
    }),
  };
  return User;
});

const request = require('supertest');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { createApp } = require('../app');
const { attachSocketAuth } = require('../socket');

describe('auth: public signup', () => {
  const app = createApp();

  beforeEach(() => { User.created.length = 0; });

  test('ignores a role sent by the client and always creates a driver', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Eve', email: 'eve@example.com', password: 'longenough1', role: 'admin' });

    expect(res.status).toBe(201);
    expect(User.created[0].role).toBe('driver');
  });

  test('rejects short passwords', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Eve', email: 'eve@example.com', password: 'short' });
    expect(res.status).toBe(400);
  });
});

describe('no HTTP seed endpoint', () => {
  test('POST /api/setup does not exist', async () => {
    const res = await request(createApp()).post('/api/setup');
    expect(res.status).toBe(404);
  });
});

describe('health', () => {
  test('reports 503 when the database is down', async () => {
    const res = await request(createApp({ dbReady: () => false })).get('/api/health');
    expect(res.status).toBe(503);
    expect(res.body.db).toBe(false);
  });
});

describe('socket auth', () => {
  // Minimal fake of the socket.io server: captures the middleware and connection handler.
  function fakeIo() {
    const io = { mw: null, onConnection: null };
    io.use = (fn) => { io.mw = fn; };
    io.on = (evt, fn) => { if (evt === 'connection') io.onConnection = fn; };
    return io;
  }
  function fakeSocket(token) {
    const handlers = {};
    return {
      handshake: { auth: token ? { token } : {} },
      data: {},
      rooms: new Set(),
      on: (evt, fn) => { handlers[evt] = fn; },
      emit: (evt, ...args) => handlers[evt] && handlers[evt](...args),
      join(room) { this.rooms.add(room); },
    };
  }
  const run = (io, socket) => new Promise((resolve) => io.mw(socket, resolve));

  test('rejects a socket without a token', async () => {
    const io = fakeIo();
    attachSocketAuth(io);
    const err = await run(io, fakeSocket());
    expect(err).toBeInstanceOf(Error);
  });

  test('a driver cannot join the admin room or another driver room', async () => {
    User.findById.mockReturnValue({ select: async () => ({ _id: 'd1', role: 'driver', isActive: true }) });
    const io = fakeIo();
    attachSocketAuth(io);
    const socket = fakeSocket(jwt.sign({ id: 'd1' }, process.env.JWT_SECRET));
    expect(await run(io, socket)).toBeUndefined();
    io.onConnection(socket);

    socket.emit('join-admin');
    socket.emit('join-driver', 'd2');
    socket.emit('join-driver', 'd1');

    expect([...socket.rooms]).toEqual(['driver-d1']);
  });

  test('an admin can join the admin room', async () => {
    User.findById.mockReturnValue({ select: async () => ({ _id: 'a1', role: 'admin', isActive: true }) });
    const io = fakeIo();
    attachSocketAuth(io);
    const socket = fakeSocket(jwt.sign({ id: 'a1' }, process.env.JWT_SECRET));
    await run(io, socket);
    io.onConnection(socket);
    socket.emit('join-admin');
    expect(socket.rooms.has('admin-room')).toBe(true);
  });
});
