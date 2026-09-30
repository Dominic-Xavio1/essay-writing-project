'use client';

class WebSocketClient {
  constructor() {
    this.ws = null;
    this.listeners = new Map();
    this.reconnectTimer = null;
    this.userId = null;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect(userId = null) {
    if (typeof window === 'undefined') return;
    if (userId) this.userId = userId;

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      if (userId && this.ws.readyState === WebSocket.OPEN) {
        this.send('SUBSCRIBE', { userId });
      }
      return;
    }

    // Stop trying to reconnect after max attempts
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max WebSocket reconnection attempts reached. Giving up.');
      return;
    }

    const host = window.location.hostname || 'localhost';
    const wsUrl = `ws://${host}:3001`;

    try {
      this.isConnecting = true;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnecting = false;
        this.reconnectAttempts = 0; // Reset on successful connection
        console.log('WebSocket connected');
        if (this.userId) {
          this.send('SUBSCRIBE', { userId: this.userId });
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const { type, payload, targetUserId } = data;
          
          // Only process messages if they're for this user or broadcast to all
          if (targetUserId && targetUserId !== this.userId) {
            return;
          }
          
          if (type && this.listeners.has(type)) {
            this.listeners.get(type).forEach((fn) => fn(payload));
          }
        } catch (err) {
          console.error('Error parsing WS message:', err);
        }
      };

      this.ws.onclose = () => {
        this.isConnecting = false;
        this.reconnectAttempts++;
        
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          const backoffTime = Math.min(3000 * this.reconnectAttempts, 15000); // Exponential backoff, max 15s
          console.log(`WebSocket disconnected, reconnecting in ${backoffTime/1000}s... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = setTimeout(() => {
            this.connect(this.userId);
          }, backoffTime);
        } else {
          console.log('WebSocket connection failed after maximum attempts. Real-time features may be limited.');
        }
      };

      this.ws.onerror = (error) => {
        this.isConnecting = false;
        // Reduce error logging spam - only log on first few attempts
        if (this.reconnectAttempts < 3) {
          console.error('WebSocket error:', error);
        }
        if (this.ws) this.ws.close();
      };
    } catch (error) {
      this.isConnecting = false;
      if (this.reconnectAttempts < 3) {
        console.error('WebSocket connection failed:', error);
      }
    }
  }

  subscribe(type, callback) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type).add(callback);

    // Return cleanup function to prevent memory leaks in component lifecycle
    return () => {
      const set = this.listeners.get(type);
      if (set) {
        set.delete(callback);
        if (set.size === 0) this.listeners.delete(type);
      }
    };
  }

  send(type, payload, targetUserId = null) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload, targetUserId }));
    }
  }

  disconnect() {
    clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners.clear();
    this.reconnectAttempts = 0;
  }
}

export const wsClient = new WebSocketClient();
