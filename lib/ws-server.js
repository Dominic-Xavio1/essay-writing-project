import http from 'http';
import crypto from 'crypto';
import { unsealData } from 'iron-session';
import { findUserById } from './services/users';

const WS_PORT = 3001;
const SECRET_KEY = process.env.SECRET_KEY || 'complex_password_at_least_32_characters_long';

function parseCookies(cookieHeader) {
  const list = {};
  if (!cookieHeader) return list;
  cookieHeader.split(';').forEach((cookie) => {
    const parts = cookie.split('=');
    const name = parts.shift()?.trim();
    if (name) {
      list[name] = decodeURIComponent(parts.join('='));
    }
  });
  return list;
}

export function initWebSocketServer() {
  if (globalThis.__wsServer) return globalThis.__wsServer;

  try {
    const server = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('WebSocket Server Active');
    });

    const clients = new Set();

    server.on('upgrade', async (req, socket) => {
      const key = req.headers['sec-websocket-key'];
      if (!key) {
        socket.destroy();
        return;
      }

      // Issue 4: Require authentication for WebSocket connections
      const cookies = parseCookies(req.headers.cookie);
      let session = null;
      let user = null;

      if (cookies.essayhub_session) {
        try {
          session = await unsealData(cookies.essayhub_session, { password: SECRET_KEY });
          if (session?.userId && session?.isLoggedIn) {
            user = await findUserById(session.userId);
          }
        } catch {
          session = null;
          user = null;
        }
      }

      if (!session || !session.isLoggedIn || !session.userId || !user) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }

      const acceptKey = crypto
        .createHash('sha1')
        .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
        .digest('base64');

      const headers = [
        'HTTP/1.1 101 Switching Protocols',
        'Upgrade: websocket',
        'Connection: Upgrade',
        `Sec-WebSocket-Accept: ${acceptKey}`,
      ];

      socket.write(headers.join('\r\n') + '\r\n\r\n');
      
      // Derive identity directly from verified session and DB, NOT client-supplied payload
      socket.userId = user.id;
      socket.isSuperuser = Boolean(user.is_superuser);
      clients.add(socket);

      socket.on('data', (buffer) => {
        // Ignore any client attempt to alter socket.userId
      });

      socket.on('close', () => clients.delete(socket));
      socket.on('error', () => {
        clients.delete(socket);
        socket.destroy();
      });
    });

    server.listen(WS_PORT, () => {
      console.log(`📡 WebSocket server running on ws://localhost:${WS_PORT}`);
    });

    server.on('error', (err) => {
      if (err.code !== 'EADDRINUSE') console.error('WS Server error:', err);
    });

    globalThis.__wsServer = { server, clients };
    return globalThis.__wsServer;
  } catch (err) {
    console.error('Failed to init WS server:', err);
    return null;
  }
}

function parseFrame(buffer) {
  if (buffer.length < 2) return null;
  const secondByte = buffer[1];
  const isMasked = (secondByte & 0x80) === 0x80;
  let payloadLength = secondByte & 0x7f;
  let currentOffset = 2;

  if (payloadLength === 126) {
    if (buffer.length < 4) return null;
    payloadLength = buffer.readUInt16BE(2);
    currentOffset = 4;
  } else if (payloadLength === 127) {
    if (buffer.length < 10) return null;
    payloadLength = Number(buffer.readBigUInt64BE(2));
    currentOffset = 10;
  }

  let maskingKey = null;
  if (isMasked) {
    if (buffer.length < currentOffset + 4) return null;
    maskingKey = buffer.subarray(currentOffset, currentOffset + 4);
    currentOffset += 4;
  }

  const payload = buffer.subarray(currentOffset, currentOffset + payloadLength);
  if (isMasked && maskingKey) {
    for (let i = 0; i < payload.length; i++) {
      payload[i] ^= maskingKey[i % 4];
    }
  }

  return payload.toString('utf8');
}

function encodeFrame(text) {
  const payload = Buffer.from(text, 'utf8');
  const length = payload.length;
  let header;

  if (length <= 125) {
    header = Buffer.alloc(2);
    header[0] = 0x81;
    header[1] = length;
  } else if (length <= 65535) {
    header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(length, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x81;
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(length), 2);
  }

  return Buffer.concat([header, payload]);
}

export function broadcastWS(type, payload, targetUserId = null) {
  if (!globalThis.__wsServer) {
    initWebSocketServer();
  }
  if (!globalThis.__wsServer?.clients) return 0;

  const frame = encodeFrame(JSON.stringify({ type, payload, targetUserId }));
  let sentCount = 0;
  
  for (const client of globalThis.__wsServer.clients) {
    try {
      // Issue 4: Restrict event visibility based on authorization and target user
      if (type === 'NEW_PENDING_POST') {
        if (!client.isSuperuser) continue;
      } else if (targetUserId && client.userId !== targetUserId) {
        continue;
      }

      client.write(frame);
      sentCount++;
    } catch (err) {
      console.error('WS send error, removing client:', err.message);
      globalThis.__wsServer.clients.delete(client);
    }
  }
  
  return sentCount;
}
