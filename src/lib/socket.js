import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

let socket = null;
let socketToken = null;

/**
 * Connect to Socket.io with JWT authentication.
 * The socket is shared by the notifications provider and the chat, so this
 * reuses the existing connection (even while it is still connecting) as long
 * as it belongs to the same token. A different token (another user) gets a new socket.
 */
export const connectSocket = (token) => {
  if (socket && socketToken === token && (socket.connected || socket.active)) {
    return socket;
  }

  if (socket) {
    socket.disconnect();
  }

  socketToken = token;
  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    // Keep retrying (e.g. while the dev server restarts) — notifications rely on this socket
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
  });

  socket.on('connect', () => {
    console.log('🔌 Socket connected:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('🔌 Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('❌ Socket connection error:', error.message);
  });

  return socket;
};

/**
 * Get current socket instance.
 */
export const getSocket = () => socket;

/**
 * Disconnect socket.
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    socketToken = null;
  }
};

/**
 * Join a chat room for an order.
 */
export const joinRoom = (orderId) => {
  if (socket && socket.connected) {
    socket.emit('join_room', { orderId });
  }
};

/**
 * Leave a chat room.
 */
export const leaveRoom = (orderId) => {
  if (socket && socket.connected) {
    socket.emit('leave_room', { orderId });
  }
};

/**
 * Send an encrypted message via socket.
 */
export const sendSocketMessage = ({ orderId, encryptedMessage, iv, wrappedKey, senderWrappedKey, adminWrappedKeys, messageType }) => {
  if (socket && socket.connected) {
    socket.emit('send_message', {
      orderId,
      encryptedMessage,
      iv,
      wrappedKey,
      senderWrappedKey,
      adminWrappedKeys,
      messageType: messageType || 'text',
    });
  }
};

/**
 * Emit typing indicator.
 */
export const emitTyping = (orderId) => {
  if (socket && socket.connected) {
    socket.emit('typing', { orderId });
  }
};

/**
 * Emit stop typing indicator.
 */
export const emitStopTyping = (orderId) => {
  if (socket && socket.connected) {
    socket.emit('stop_typing', { orderId });
  }
};

export default {
  connectSocket,
  getSocket,
  disconnectSocket,
  joinRoom,
  leaveRoom,
  sendSocketMessage,
  emitTyping,
  emitStopTyping,
};
