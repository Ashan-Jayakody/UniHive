const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();
const path = require('path');


const app = express();
const server = http.createServer(app);

//socket IO server
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:3000","http://localhost:5173"], //fontend  
        methods: ["GET","POST","PUT","DELETE"] 
    }
});


io.on('connection', (socket) => {
    console.log(`User connected via Socket: ${socket.id}`);

    // User Room
    socket.on('join-user-room', (userId) => {
    if (userId) {
      socket.join(`user:${userId}`);
    }});

    //Help Request Room
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

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));


// routes
// User management, Authentication, accademic communication threads, notifications, admin analytics
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/threads', require('./routes/threadRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/admin/analytics', require('./routes/adminAnalyticsRoutes'));

// Resource management routes
app.use('/api/resources', require('./routes/resourceRoutes'));

// Student help request routes
app.use('/api/request', require('./routes/helpRequestRoutes'));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => {
  res.status(204).end();
});
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB successfully connected');

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.log('Failed to connect to the Database:', err.message);
  });
