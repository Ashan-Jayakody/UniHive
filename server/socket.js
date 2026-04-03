let ioInstance = null;

const initSocket = (io) => {
  ioInstance = io;
};

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
