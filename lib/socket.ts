'use client';

import { io, Socket } from 'socket.io-client';
import { getAccessToken } from '@/lib/cookies';
import { config } from '@/lib/config';

/**
 * Socket.IO Event Constants matching the MYPGPMS Backend Event Catalog
 */
export const SOCKET_EVENTS = {
  // Maintenance & Complaints
  COMPLAINT_NEW: 'complaint:new',
  COMPLAINT_STATUS_UPDATED: 'complaint:status_updated',
  COMPLAINT_ACTIVITY: 'complaint:activity',
  COMPLAINT_STATS_UPDATED: 'complaint:stats_updated',

  // Notices & Broadcasts
  NOTICE_NEW: 'notice:new',
  NOTICE_STATS_UPDATED: 'notice:stats_updated',

  // Community Feed & Social Hub
  COMMUNITY_POST_NEW: 'community:post_new',
  COMMUNITY_POST_LIKED: 'community:post_liked',
  COMMUNITY_COMMENT_NEW: 'community:comment_new',
  COMMUNITY_EVENT_UPDATED: 'community:event_updated',
  NOTIFICATION_NEW: 'notification:new',

  // Visitor Management & Gate Access
  VISITOR_NEW: 'visitor:new',
  VISITOR_STATUS_UPDATED: 'visitor:status_updated',
  VISITOR_ENTRY: 'visitor:entry',
  VISITOR_STATS_UPDATED: 'visitor:stats_updated',

  // Rooms & Inventory
  ROOM_NEW: 'room:new',
  ROOM_UPDATED: 'room:updated',
  ROOM_DELETED: 'room:deleted',
  ROOM_STATS_UPDATED: 'room:stats_updated',
  ROOM_SHIFT_NEW: 'room_shift:new',
  ROOM_SHIFT_STATUS_UPDATED: 'room_shift:status_updated',
  ROOM_SHIFT_STATS_UPDATED: 'room_shift:stats_updated',

  // Payments & Finance
  PAYMENT_NEW: 'payment:new',
  PAYMENT_STATUS_UPDATED: 'payment:status_updated',
  PAYMENT_STATS_UPDATED: 'payment:stats_updated',

  // Residents & Staff (Users)
  USER_NEW: 'user:new',
  USER_UPDATED: 'user:updated',
  USER_STATUS_UPDATED: 'user:status_updated',
  RESIDENT_STATS_UPDATED: 'resident:stats_updated',
  STAFF_STATS_UPDATED: 'staff:stats_updated',

  // Branches
  BRANCH_NEW: 'branch:new',
  BRANCH_UPDATED: 'branch:updated',
  BRANCH_DELETED: 'branch:deleted',
  BRANCH_STATS_UPDATED: 'branch:stats_updated',

  // Buildings & Floors
  BUILDING_NEW: 'building:new',
  BUILDING_UPDATED: 'building:updated',
  BUILDING_DELETED: 'building:deleted',
  BUILDING_STATS_UPDATED: 'building:stats_updated',

  // Laundry
  LAUNDRY_NEW: 'laundry:new',
  LAUNDRY_STATUS_UPDATED: 'laundry:status_updated',
  LAUNDRY_STATS_UPDATED: 'laundry:stats_updated',

  // Subscriptions
  SUBSCRIPTION_STATS_UPDATED: 'subscription:stats_updated',

  // Stay Clearance & Checkout
  CHECKOUT_NEW: 'checkout:new',
  CHECKOUT_STATUS_UPDATED: 'checkout:status_updated',
  CHECKOUT_STATS_UPDATED: 'checkout:stats_updated',

  // Dashboard & Metrics
  DASHBOARD_STATS_UPDATED: 'dashboard:stats_updated',

  // Client Dynamic Room Subscriptions
  SUBSCRIBE_POST: 'subscribe:post',
  UNSUBSCRIBE_POST: 'unsubscribe:post',
} as const;

let socket: Socket | null = null;
let currentToken: string | null = null;

/**
 * Initialize and establish a WebSocket connection via Socket.IO
 * Adheres strictly to the MYPGPMS WebSocket documentation.
 */
export const initializeSocket = (token?: string): Socket | null => {
  if (typeof window === 'undefined') return null;

  const accessToken = token || getAccessToken();
  if (!accessToken) {
    disconnectSocket();
    return null;
  }

  // Reuse existing connected socket if token hasn't changed
  if (socket?.connected && currentToken === accessToken) {
    return socket;
  }

  // Disconnect previous socket if token changed
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  currentToken = accessToken;
  const socketUrl = config.socketUrl || 'http://localhost:5000';

  socket = io(socketUrl, {
    auth: {
      token: accessToken,
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  socket.on('connect', () => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Socket.IO] Connected successfully with ID:', socket?.id);
    }
  });

  socket.on('connect_error', (err) => {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[Socket.IO] Connection error:', err.message);
    }
    if (err.message.includes('Authentication error')) {
      // Disconnect cleanly if token is rejected
      disconnectSocket();
    }
  });

  socket.on('disconnect', (reason) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Socket.IO] Disconnected:', reason);
    }
  });

  return socket;
};

/**
 * Get current active socket instance
 */
export const getSocket = (): Socket | null => socket;

/**
 * Disconnect and release the active socket instance
 */
export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
    currentToken = null;
  }
};
