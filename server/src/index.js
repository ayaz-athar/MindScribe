import app from './app.js';
import { env } from './config/env.js';

// Start Standalone HTTP Server
const server = app.listen(env.PORT, '0.0.0.0', () => {
  console.log(`========================================================`);
  console.log(`🚀 MindScribe AI Server listening on port ${env.PORT}`);
  console.log(`🌍 Environment: ${env.NODE_ENV}`);
  console.log(`🔒 Security: Helmet CSP + Firebase Token Auth + Secret Manager`);
  console.log(`========================================================`);
});

// Graceful Shutdown for Cloud Run / Container Environments
const handleShutdown = (signal) => {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log('HTTP server closed. Exiting process.');
    process.exit(0);
  });

  // Force close after 10s if stuck
  setTimeout(() => {
    console.error('Forcing shutdown after timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

export default app;
