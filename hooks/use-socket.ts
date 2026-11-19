'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';
import { getSocket, SOCKET_EVENTS } from '@/lib/socket';

export { SOCKET_EVENTS };

/**
 * Reusable React Hook to listen for real-time WebSocket events.
 * Safely registers and unregisters listeners, preserving reference identity.
 */
export const useSocketEvent = <T = unknown>(
  event: string,
  handler: (data: T) => void,
  enabled: boolean = true
): void => {
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!enabled) return;

    const socket = getSocket();
    if (!socket) return;

    const eventListener = (data: T) => {
      handlerRef.current(data);
    };

    socket.on(event, eventListener);

    return () => {
      socket.off(event, eventListener);
    };
  }, [event, enabled]);
};

const subscribeSocketConnection = (callback: () => void) => {
  const socket = getSocket();
  if (!socket) return () => {};

  socket.on('connect', callback);
  socket.on('disconnect', callback);

  return () => {
    socket.off('connect', callback);
    socket.off('disconnect', callback);
  };
};

const getSocketSnapshot = (): boolean => {
  return Boolean(getSocket()?.connected);
};

const getSocketServerSnapshot = (): boolean => {
  return false;
};

/**
 * React hook to observe the live connection state of the WebSocket client
 * using useSyncExternalStore for tear-free external store synchronization.
 */
export const useSocketConnection = () => {
  const isConnected = useSyncExternalStore(
    subscribeSocketConnection,
    getSocketSnapshot,
    getSocketServerSnapshot
  );

  return { isConnected };
};
