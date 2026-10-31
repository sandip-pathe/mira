const http = require('node:http');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
const apiPath = /^\/(?:health|workers(?:\/[^?]*)?|sessions(?:\/[0-9a-f-]{36}(?:\/[^?]*)?)?)(?:\?|$)/i;

// A public Wi-Fi profile blocks LAN access to the separate FastAPI port.
// Forward only Mira's API routes through Metro's existing, high-entropy tunnel.
config.server.enhanceMiddleware = metro => (req, res, next) => {
  if (!apiPath.test(req.url ?? '')) return metro(req, res, next);
  const upstream = http.request({
    hostname: '127.0.0.1', port: 8000, method: req.method, path: req.url,
    headers: { ...req.headers, host: '127.0.0.1:8000' },
  }, response => {
    res.writeHead(response.statusCode ?? 502, response.headers);
    response.pipe(res);
  });
  upstream.on('error', () => {
    if (!res.headersSent) res.writeHead(502, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ detail: 'Mira is temporarily offline.' }));
  });
  req.pipe(upstream);
};

module.exports = config;
