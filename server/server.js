require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./src/config/db');
const { initSocket } = require('./src/config/socket');

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

const startServer = async () => {
  // Start listening immediately so Render/Vercel don't see a "Connection Refused"
  server.listen(PORT, () => {
    console.log(`🚀 AirFix Server running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV}`);
  });

  // Connect to DB in parallel
  connectDB();

  // Keep-Alive Mechanism for Render Free Tier
  // Pings itself every 14 minutes to prevent sleep
  if (process.env.NODE_ENV === 'production') {
    const https = require('https');
    setInterval(() => {
      const url = `https://${process.env.RENDER_EXTERNAL_HOSTNAME}/api/health`;
      if (process.env.RENDER_EXTERNAL_HOSTNAME) {
        https.get(url, (res) => {
          console.log(`📡 Keep-alive ping sent: ${res.statusCode}`);
        }).on('error', (err) => {
          console.error(`❌ Keep-alive ping failed: ${err.message}`);
        });
      }
    }, 14 * 60 * 1000); // 14 mins
  }
};

startServer();
