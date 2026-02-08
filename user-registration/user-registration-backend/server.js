const app = require('./src/app');
const connectDB = require('./src/config/db');
const config = require('./src/config/env');

// Connect to MongoDB and start server
async function startServer() {
  try {
    // Connect to database
    await connectDB();
    
    // Start Express server
    const server = app.listen(config.port, () => {
      console.log(`
╔════════════════════════════════════════════════════════════╗
║       Defence Incident Sentinel - Auth Backend             ║
╠════════════════════════════════════════════════════════════╣
║  Environment:  ${config.nodeEnv.padEnd(42)}║
║  Port:         ${config.port.toString().padEnd(42)}║
║  Frontend:     ${config.frontendUrl.padEnd(42)}║
╠════════════════════════════════════════════════════════════╣
║  Endpoints:                                                ║
║  - POST /api/auth/login/identity                          ║
║  - POST /api/auth/login/password                          ║
║  - POST /api/auth/login/mfa                               ║
║  - POST /api/auth/register/identity                       ║
║  - POST /api/auth/register/service                        ║
║  - POST /api/auth/register/security                       ║
║  - POST /api/auth/register/activate                       ║
║  - POST /api/auth/refresh                                 ║
║  - POST /api/auth/logout                                  ║
║  - GET  /api/auth/me                                      ║
║  - GET  /api/health                                       ║
╚════════════════════════════════════════════════════════════╝
      `);
    });
    
    // Graceful shutdown
    const shutdown = async () => {
      console.log('\nShutting down gracefully...');
      server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
      });
    };
    
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
