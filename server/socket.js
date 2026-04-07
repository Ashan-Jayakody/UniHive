let ioInstance = null;

const initSocket = (io) => {
  ioInstance = io;

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join', (userId) => {
      socket.join(`user:${userId}`);
      console.log(`Socket ${socket.id} joined room user:${userId}`);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};

const getIO = () => {
  if (!ioInstance) {
    throw new Error('Socket.io not initialized');
  }
  return ioInstance;
};

module.exports = { initSocket, getIO };