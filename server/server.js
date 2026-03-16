const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const {Server} = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000", //fontend  
        methods: ["GET","POST","PUT","DELETE"] 
    }
});

// import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const helpRequestRoutes = require('./routes/helpRequestRoutes');
const { Socket } = require('dgram');

//middleware
app.use(cors());
app.use(express.json());


// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(()=> console.log('MongoDB successfully connected'))
    .catch((err)=> console.log('Failed to connect to the Database:',err));

//routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/request', helpRequestRoutes);

io.on('connection', (Socket) => {
    console.log(`User connected via Socket: ${socket.id}`);

    socket.on('join_request_room', (requestId) => {
        socket.join(requestId);
        console.log(`User ${socket.id} joined help request room: ${requestId}`);
    });

    socket.on('send_message', (data) => {
        socket.to(data.requestId).emit('receive_message', data);
    });

    socket.on('disconnect', () => {
        console.log(`User Disconnected: ${socket.id}`);
    });
});


const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});