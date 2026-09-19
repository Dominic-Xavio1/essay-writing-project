'use client';

class WebSocketClient {
  constructor() {
    this.ws = null;
    this.listeners = new Map();
    this.reconnectTimer = null;
    this.userId = null;
    this.isConnecting = false;
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

    const host = window.location.hostname || 'localhost';
    const wsUrl = `ws://${host}:3001`;

    try {
      this.isConnecting = true;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnecting = false;
        if (this.userId) {
          this.send('SUBSCRIBE', { userId: this.userId });
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const { type, payload } = data;
          if (type && this.listeners.has(type)) {
            this.listeners.get(type).forEach((fn) => fn(payload));
          }
        } catch (err) {
          console.error('Error parsing WS message:', err);
        }
      };

      this.ws.onclose = () => {
        this.isConnecting = false;
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => {
          this.connect(this.userId);
        }, 3000);
      };

      this.ws.onerror = () => {
        this.isConnecting = false;
        if (this.ws) this.ws.close();
      };
    } catch {
      this.isConnecting = false;
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
  }
}

export const wsClient = new WebSocketClient();
