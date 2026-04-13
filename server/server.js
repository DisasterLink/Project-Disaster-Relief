const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const connectDB = require('./config/db');

const app = express();
const server = http.createServer(app);

// Socket.IO setup with CORS
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// ── Middleware ──────────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting on auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

// Inject io instance into every request (for controllers to use)
app.use((req, res, next) => {
  req.io = io;
  next();
});

// ── Routes ──────────────────────────────────────────────
app.use('/api/auth', authLimiter, require('./routes/authRoutes'));
app.use('/api/requests', require('./routes/requestRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/resources', require('./routes/resourceRoutes'));
app.use('/api/users', require('./routes/userRoutes'));

// Health check
app.get('/api/health', (req, res) =>
  res.json({ success: true, message: '🚨 Disaster Relief API is running', timestamp: new Date() })
);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({ success: false, message: err.message || 'Internal Server Error' });
});

// ── Socket.IO Events ─────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`🔌 New connection: ${socket.id}`);

  // Join role-based rooms
  socket.on('join_room', ({ room }) => {
    socket.join(room);
    console.log(`  ↳ Joined room: ${room}`);
  });

  // Join personal room (for direct notifications)
  socket.on('join_user_room', ({ userId }) => {
    socket.join(`user_${userId}`);
    console.log(`  ↳ Joined personal room: user_${userId}`);
  });

  // Volunteer availability update
  socket.on('volunteer_available', ({ volunteerId, available }) => {
    io.to('staff').emit('volunteer_status_update', { volunteerId, available });
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Disconnected: ${socket.id}`);
  });
});

// ── Start Server ─────────────────────────────────────────
connectDB().then(() => {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`🚀 Server live at http://localhost:${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
});
