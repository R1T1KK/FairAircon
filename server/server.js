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
  await connectDB();
  server.listen(PORT, () => {
    console.log(`🚀 AirFix Server running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV}`);
  });
};

startServer();
