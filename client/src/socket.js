import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:8000';

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  withCredentials: true,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5
});