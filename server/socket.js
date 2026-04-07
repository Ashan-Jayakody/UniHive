let ioInstance = null;

// initialize socket
const initSocket = (io) => {
  ioInstance = io;

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // join room
    socket.on('join-room', ({ roomId, userId, userName }) => {
      socket.join(`request-${roomId}`);
      console.log(`${userName} joined room: request-${roomId}`);

      socket.to(`request-${roomId}`).emit('user-joined', {
        userId,
        userName
      });
    });

    // send message
    socket.on('send-message', ({ roomId, message, sender }) => {
      socket.to(`request-${roomId}`).emit('receive-message', {
        message,
        sender,
        createdAt: new Date()
      });
    });

    // leave room
    socket.on('leave-room', ({ roomId, userName }) => {
      socket.leave(`request-${roomId}`);

      socket.to(`request-${roomId}`).emit('user-left', {
        userName
      });

      console.log(`${userName} left room: request-${roomId}`);
    });

    // disconnect
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};

// access io anywhere
const getIO = () => {
  if (!ioInstance) {
    throw new Error('Socket.io has not been initialized');
  }
  return ioInstance;
};

module.exports = {
  initSocket,
  getIO,
};