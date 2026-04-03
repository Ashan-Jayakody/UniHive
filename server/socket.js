const socketSetup = io  => {
    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        // join a private room for a specific help request
        socket.on('join-room', ({roomId, userId, userName}) =>{
            socket.join(`request-${roomId}`);
            console.log(`${userName} joined room: request-${roomId}`);

            // notify others in the room that a new user has joined
            socket.to(`request-${roomId}`).emit('User joined', {
                userId,
                userName
            });
        });

        // handle incoming messages
        socket.on('send-message', ({roomId, message, sender}) => {
            socket.to(`request-${roomId}`).emit('receive-message', {
                message,
                sender,
                createdAt: new Date()
            });
        });

        // user leaves the room
        socket.on('leave-room', ({roomId, userName}) => {
            socket.leave(`request-${roomId}`);
            socket.to(`request-${roomId}`).emit('User left', {
                userName
            });
            console.log(`${userName} left room: request-${roomId}`);
        });

        // handle disconnection
        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        }); 
    });
};

module.exports = socketSetup;