const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');

// Load env variables
dotenv.config();

const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

const defaultAllowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

const envOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = [...new Set([...defaultAllowedOrigins, ...envOrigins])];

const isOriginAllowed = (origin) => !origin || allowedOrigins.includes(origin);

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    credentials: true,
  },
});

// Attach io to requests for usage in routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);
app.use(express.json());

// Routes
const menuRoutes = require('./routes/menu');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payments');
const authRoutes = require('./routes/auth');

app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/auth', authRoutes);

// Base route
app.get('/', (req, res) => {
  res.json({ message: 'Restaurant Menu API is running' });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'restaurant-menu-api',
    timestamp: new Date().toISOString(),
  });
});

// Socket.io context
io.on('connection', (socket) => {
  console.log('Admin or Client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong on the server!' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server (with Sockets) is running on port ${PORT}`);
});
