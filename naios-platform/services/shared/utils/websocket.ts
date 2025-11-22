/**
 * NAIOS Platform - WebSocket Utilities
 *
 * Real-time communication utilities using WebSocket with:
 * - Room-based messaging
 * - User presence tracking
 * - Event broadcasting
 * - Connection management
 * - Automatic reconnection
 *
 * @module shared/utils/websocket
 * @version 1.0.0
 */

import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { logger } from './logger';
import { verifyAccessToken } from './auth';
import { JWTPayload } from '../types';

// ============================================================================
// WEBSOCKET SERVER CONFIGURATION
// ============================================================================

let io: SocketIOServer | null = null;

interface SocketWithUser extends Socket {
  user?: JWTPayload;
  rooms?: Set<string>;
}

/**
 * Initialize WebSocket server
 *
 * @param httpServer - HTTP server instance
 * @returns Socket.IO server instance
 */
export function initializeWebSocket(httpServer: HTTPServer): SocketIOServer {
  if (io) {
    return io;
  }

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling']
  });

  // Authentication middleware
  io.use(async (socket: SocketWithUser, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const payload = verifyAccessToken(token);
      socket.user = payload;
      socket.rooms = new Set();

      logger.info('WebSocket client authenticated', {
        socket_id: socket.id,
        user_id: payload.user_id
      });

      next();
    } catch (error) {
      logger.warn('WebSocket authentication failed', { error });
      next(new Error('Invalid token'));
    }
  });

  // Connection handling
  io.on('connection', (socket: SocketWithUser) => {
    handleConnection(socket);
  });

  logger.info('WebSocket server initialized');

  return io;
}

/**
 * Get WebSocket server instance
 */
export function getWebSocketServer(): SocketIOServer {
  if (!io) {
    throw new Error('WebSocket server not initialized');
  }
  return io;
}

// ============================================================================
// CONNECTION HANDLING
// ============================================================================

/**
 * Handle new WebSocket connection
 */
function handleConnection(socket: SocketWithUser): void {
  const userId = socket.user?.user_id;
  const organizationId = socket.user?.organization_id;

  logger.info('WebSocket client connected', {
    socket_id: socket.id,
    user_id: userId,
    organization_id: organizationId
  });

  // Join user-specific room
  if (userId) {
    socket.join(`user:${userId}`);
    socket.rooms?.add(`user:${userId}`);
  }

  // Join organization-specific room
  if (organizationId) {
    socket.join(`org:${organizationId}`);
    socket.rooms?.add(`org:${organizationId}`);
  }

  // Emit presence
  if (organizationId) {
    socket.to(`org:${organizationId}`).emit('user:online', {
      user_id: userId,
      timestamp: new Date().toISOString()
    });
  }

  // Handle room joining
  socket.on('room:join', (roomId: string) => {
    handleRoomJoin(socket, roomId);
  });

  // Handle room leaving
  socket.on('room:leave', (roomId: string) => {
    handleRoomLeave(socket, roomId);
  });

  // Handle messages
  socket.on('message:send', (data: any) => {
    handleMessage(socket, data);
  });

  // Handle typing indicators
  socket.on('typing:start', (data: any) => {
    handleTypingStart(socket, data);
  });

  socket.on('typing:stop', (data: any) => {
    handleTypingStop(socket, data);
  });

  // Handle presence updates
  socket.on('presence:update', (data: any) => {
    handlePresenceUpdate(socket, data);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    handleDisconnect(socket);
  });

  // Handle errors
  socket.on('error', (error) => {
    logger.error('WebSocket error', {
      socket_id: socket.id,
      user_id: userId,
      error
    });
  });

  // Send initial connection confirmation
  socket.emit('connected', {
    socket_id: socket.id,
    user_id: userId,
    timestamp: new Date().toISOString()
  });
}

/**
 * Handle room join
 */
function handleRoomJoin(socket: SocketWithUser, roomId: string): void {
  socket.join(roomId);
  socket.rooms?.add(roomId);

  logger.debug('Client joined room', {
    socket_id: socket.id,
    user_id: socket.user?.user_id,
    room_id: roomId
  });

  // Notify room members
  socket.to(roomId).emit('room:user_joined', {
    user_id: socket.user?.user_id,
    room_id: roomId,
    timestamp: new Date().toISOString()
  });

  // Send room state to new member
  socket.emit('room:joined', {
    room_id: roomId,
    timestamp: new Date().toISOString()
  });
}

/**
 * Handle room leave
 */
function handleRoomLeave(socket: SocketWithUser, roomId: string): void {
  socket.leave(roomId);
  socket.rooms?.delete(roomId);

  logger.debug('Client left room', {
    socket_id: socket.id,
    user_id: socket.user?.user_id,
    room_id: roomId
  });

  // Notify room members
  socket.to(roomId).emit('room:user_left', {
    user_id: socket.user?.user_id,
    room_id: roomId,
    timestamp: new Date().toISOString()
  });
}

/**
 * Handle message sending
 */
function handleMessage(socket: SocketWithUser, data: any): void {
  const { room_id, content, metadata } = data;

  if (!room_id || !content) {
    socket.emit('error', { message: 'Invalid message data' });
    return;
  }

  const message = {
    message_id: crypto.randomUUID(),
    user_id: socket.user?.user_id,
    room_id,
    content,
    metadata,
    timestamp: new Date().toISOString()
  };

  // Broadcast to room
  socket.to(room_id).emit('message:received', message);

  // Confirm to sender
  socket.emit('message:sent', message);

  logger.debug('Message sent', {
    message_id: message.message_id,
    room_id,
    user_id: socket.user?.user_id
  });
}

/**
 * Handle typing start
 */
function handleTypingStart(socket: SocketWithUser, data: any): void {
  const { room_id } = data;

  if (!room_id) {
    return;
  }

  socket.to(room_id).emit('typing:user_started', {
    user_id: socket.user?.user_id,
    room_id,
    timestamp: new Date().toISOString()
  });
}

/**
 * Handle typing stop
 */
function handleTypingStop(socket: SocketWithUser, data: any): void {
  const { room_id } = data;

  if (!room_id) {
    return;
  }

  socket.to(room_id).emit('typing:user_stopped', {
    user_id: socket.user?.user_id,
    room_id,
    timestamp: new Date().toISOString()
  });
}

/**
 * Handle presence update
 */
function handlePresenceUpdate(socket: SocketWithUser, data: any): void {
  const { status } = data;
  const organizationId = socket.user?.organization_id;

  if (!organizationId) {
    return;
  }

  socket.to(`org:${organizationId}`).emit('presence:updated', {
    user_id: socket.user?.user_id,
    status,
    timestamp: new Date().toISOString()
  });
}

/**
 * Handle disconnection
 */
function handleDisconnect(socket: SocketWithUser): void {
  const userId = socket.user?.user_id;
  const organizationId = socket.user?.organization_id;

  logger.info('WebSocket client disconnected', {
    socket_id: socket.id,
    user_id: userId
  });

  // Notify organization members
  if (organizationId) {
    socket.to(`org:${organizationId}`).emit('user:offline', {
      user_id: userId,
      timestamp: new Date().toISOString()
    });
  }

  // Notify all rooms
  socket.rooms?.forEach(roomId => {
    socket.to(roomId).emit('room:user_left', {
      user_id: userId,
      room_id: roomId,
      timestamp: new Date().toISOString()
    });
  });
}

// ============================================================================
// BROADCASTING UTILITIES
// ============================================================================

/**
 * Broadcast event to specific user
 *
 * @param userId - User ID
 * @param event - Event name
 * @param data - Event data
 *
 * @example
 * broadcastToUser('user-123', 'notification', { message: 'New donor!' });
 */
export function broadcastToUser(userId: string, event: string, data: any): void {
  const server = getWebSocketServer();
  server.to(`user:${userId}`).emit(event, {
    ...data,
    timestamp: new Date().toISOString()
  });

  logger.debug('Broadcast to user', { user_id: userId, event });
}

/**
 * Broadcast event to organization
 *
 * @param organizationId - Organization ID
 * @param event - Event name
 * @param data - Event data
 *
 * @example
 * broadcastToOrganization('org-456', 'donation:new', donationData);
 */
export function broadcastToOrganization(
  organizationId: string,
  event: string,
  data: any
): void {
  const server = getWebSocketServer();
  server.to(`org:${organizationId}`).emit(event, {
    ...data,
    timestamp: new Date().toISOString()
  });

  logger.debug('Broadcast to organization', { organization_id: organizationId, event });
}

/**
 * Broadcast event to specific room
 *
 * @param roomId - Room ID
 * @param event - Event name
 * @param data - Event data
 *
 * @example
 * broadcastToRoom('campaign-789', 'update', campaignUpdate);
 */
export function broadcastToRoom(roomId: string, event: string, data: any): void {
  const server = getWebSocketServer();
  server.to(roomId).emit(event, {
    ...data,
    timestamp: new Date().toISOString()
  });

  logger.debug('Broadcast to room', { room_id: roomId, event });
}

/**
 * Broadcast event to all connected clients
 *
 * @param event - Event name
 * @param data - Event data
 *
 * @example
 * broadcastToAll('system:maintenance', { message: 'Scheduled maintenance in 10 minutes' });
 */
export function broadcastToAll(event: string, data: any): void {
  const server = getWebSocketServer();
  server.emit(event, {
    ...data,
    timestamp: new Date().toISOString()
  });

  logger.debug('Broadcast to all', { event });
}

// ============================================================================
// PRESENCE TRACKING
// ============================================================================

/**
 * Get online users in organization
 *
 * @param organizationId - Organization ID
 * @returns Array of online user IDs
 */
export async function getOnlineUsers(organizationId: string): Promise<string[]> {
  const server = getWebSocketServer();
  const sockets = await server.in(`org:${organizationId}`).fetchSockets();

  return sockets
    .map((socket: any) => socket.user?.user_id)
    .filter((userId): userId is string => userId !== undefined);
}

/**
 * Get user presence status
 *
 * @param userId - User ID
 * @returns True if user is online
 */
export async function isUserOnline(userId: string): Promise<boolean> {
  const server = getWebSocketServer();
  const sockets = await server.in(`user:${userId}`).fetchSockets();

  return sockets.length > 0;
}

/**
 * Get room members
 *
 * @param roomId - Room ID
 * @returns Array of user IDs in room
 */
export async function getRoomMembers(roomId: string): Promise<string[]> {
  const server = getWebSocketServer();
  const sockets = await server.in(roomId).fetchSockets();

  return sockets
    .map((socket: any) => socket.user?.user_id)
    .filter((userId): userId is string => userId !== undefined);
}

// ============================================================================
// EXPORT ALL UTILITIES
// ============================================================================

export default {
  // Initialization
  initializeWebSocket,
  getWebSocketServer,

  // Broadcasting
  broadcastToUser,
  broadcastToOrganization,
  broadcastToRoom,
  broadcastToAll,

  // Presence tracking
  getOnlineUsers,
  isUserOnline,
  getRoomMembers
};
