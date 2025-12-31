import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.eventListeners = new Map();
  }

  connect(token) {
    if (this.socket && this.isConnected) {
      return this.socket;
    }

    // Get API URL from environment or use default
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    
    this.socket = io(apiUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      timeout: 10000
    });

    this.setupEventListeners();
    return this.socket;
  }

  setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('🔌 Socket.IO connected:', this.socket.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Socket.IO disconnected:', reason);
      this.isConnected = false;
      
      if (reason === 'io server disconnect') {
        // The server has forcefully disconnected the socket
        this.socket.connect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔌 Socket.IO connection error:', error.message);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
      }
    });

    this.socket.on('live_stats_update', (data) => {
      // Dispatch custom event for LiveUsers component
      window.dispatchEvent(new CustomEvent('live_stats_update', { detail: data }));
      
      // Call registered callbacks
      this.callEventListeners('live_stats_update', data);
    });

    this.socket.on('user_activity_update', (data) => {
      window.dispatchEvent(new CustomEvent('user_activity_update', { detail: data }));
      this.callEventListeners('user_activity_update', data);
    });

    this.socket.on('error', (error) => {
      console.error('🔌 Socket.IO error:', error);
      this.callEventListeners('error', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.eventListeners.clear();
    }
  }

  emit(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
      return true;
    } else {
      console.warn('Socket not connected, cannot emit:', event);
      return false;
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
    
    // Store callback for reconnection
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
    
    // Remove from stored listeners
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // Join admin room for live updates
  joinAdminRoom() {
    return this.emit('join_admin_room');
  }

  // Track user activity
  trackUserActivity(sessionId, userId, activity, metadata = {}) {
    return this.emit('user_activity', {
      sessionId,
      userId,
      activity,
      metadata
    });
  }

  // Register event listener and store it
  addEventListener(event, callback) {
    this.on(event, callback);
  }

  // Remove event listener
  removeEventListener(event, callback) {
    this.off(event, callback);
  }

  // Call all registered listeners for an event
  callEventListeners(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  getSocket() {
    return this.socket;
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      socketId: this.socket?.id,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

export default new SocketService();