import http from 'http';
import crypto from 'crypto';

const WS_PORT = 3001;

export function initWebSocketServer() {
  if (globalThis.__wsServer) return globalThis.__wsServer;

  try {
    const server = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('WebSocket Server Active');
    });

    const clients = new Set();

    server.on('upgrade', (req, socket) => {
      const key = req.headers['sec-websocket-key'];
      if (!key) {
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
      socket.userId = null;
      clients.add(socket);

      socket.on('data', (buffer) => {
        try {
          const msg = parseFrame(buffer);
          if (msg) {
            const data = JSON.parse(msg);
            if (data.type === 'SUBSCRIBE' && data.userId) {
              socket.userId = data.userId;
            }
          }
        } catch {
          // Ignore non-json or partial frames
        }
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
  if (!globalThis.__wsServer?.clients) return;

  const frame = encodeFrame(JSON.stringify({ type, payload, targetUserId }));
  for (const client of globalThis.__wsServer.clients) {
    try {
      if (!targetUserId || client.userId === targetUserId) {
        client.write(frame);
      }
    } catch {
      // client stale
    }
  }
}
