const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const threadRoutes = require('./routes/threadRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminAnalyticsRoutes = require('./routes/adminAnalyticsRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const helpRequestRoutes = require('./routes/helpRequestRoutes');

const { initSocket } = require('./socket');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: ["http://localhost:3000", "http://localhost:5173", "http://localhost:5174"],
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true,
    }
});

// Initialize socket
initSocket(io);

// Make io available in routes
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Socket events
io.on('connection', (socket) => {
    console.log(`User connected via Socket: ${socket.id}`);

    // User Room
    socket.on('join-user-room', (userId) => {
        if (userId) {
            socket.join(`user:${userId}`);
        }
    });

    // Help Request Room
    socket.on('join_request_room', (requestId) => {
        socket.join(`help:${requestId}`);
        console.log(`User ${socket.id} joined help request room: ${requestId}`);
    });

    socket.on('send_message', (data) => {
        socket.to(`help:${data.requestId}`).emit('receive_message', data);
    });

    socket.on('disconnect', () => {
        console.log(`User Disconnected: ${socket.id}`);
    });
});

app.use(cors({ 
    origin: ["http://localhost:3000", "http://localhost:5173", "http://localhost:5174"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB successfully connected');
  })
  .catch((error) => {
    console.error('Failed to connect to the Database:', error.message);
    process.exit(1);
  });

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/threads', require('./routes/threadRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/admin/analytics', require('./routes/adminAnalyticsRoutes'));
app.use('/api/resources', require('./routes/resourceRoutes'));
app.use('/api/request', require('./routes/helpRequestRoutes'));

const peerTutoringRoutes = require('./routes/peerTutoringRoutes');
app.use('/api/peer-tutoring', peerTutoringRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Server is running' });
});

app.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => {
    res.status(204).end();
});

app.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => {
  res.status(204).end();
});

app.use((req, res) => {
  res.status(404).json({
    message: `Route not found: ${req.originalUrl}`,
  });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});