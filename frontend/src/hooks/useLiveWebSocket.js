import { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_WS_URL || 'http://localhost:3000';

export const useLiveWebSocket = (options = {}) => {
  const {
    enabled = true,
    onStatsUpdate,
    onHeartbeat,
    onUserDisconnected,
    onAdminDisconnected
  } = options;

  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastStats, setLastStats] = useState(null);
  const [error, setError] = useState(null);

  // Initialize socket connection
  useEffect(() => {
    if (!enabled) return;

    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: true
    });

    setSocket(newSocket);

    // Connection events
    newSocket.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      setError(null);
      
      // Join admin room
      newSocket.emit('admin:join-live');
    });

    newSocket.on('connect_error', (err) => {
      console.error('WebSocket connection error:', err);
      setError(err.message);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      setIsConnected(false);
    });

    // Live events
    newSocket.on('live:stats', (stats) => {
      setLastStats(stats);
      if (onStatsUpdate) onStatsUpdate(stats);
    });

    newSocket.on('live:heartbeat', (data) => {
      if (onHeartbeat) onHeartbeat(data);
    });

    newSocket.on('live:disconnected', (data) => {
      if (onUserDisconnected) onUserDisconnected(data);
    });

    newSocket.on('live:admin-disconnected', (data) => {
      if (onAdminDisconnected) onAdminDisconnected(data);
    });

    newSocket.on('force:disconnect', (data) => {
      console.log('Received force disconnect:', data);
      // Handle forced disconnect from admin
      newSocket.disconnect();
    });

    // Cleanup
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [enabled, onStatsUpdate, onHeartbeat, onUserDisconnected, onAdminDisconnected]);

  // Send heartbeat
  const sendHeartbeat = useCallback((data) => {
    if (socket && isConnected) {
      socket.emit('heartbeat', data);
    }
  }, [socket, isConnected]);

  // Disconnect a user (admin action)
  const disconnectUser = useCallback((sessionId, adminId) => {
    if (socket && isConnected) {
      socket.emit('admin:disconnect-user', { sessionId, adminId });
    }
  }, [socket, isConnected]);

  // Send user disconnected event
  const sendUserDisconnected = useCallback((sessionId) => {
    if (socket && isConnected) {
      socket.emit('user:disconnected', { sessionId });
    }
  }, [socket, isConnected]);

  return {
    socket,
    isConnected,
    lastStats,
    error,
    sendHeartbeat,
    disconnectUser,
    sendUserDisconnected
  };
};