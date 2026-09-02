import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import compression from 'compression';
import morgan from 'morgan';

import { env } from './config/env.js';
import { helmetMiddleware, corsMiddleware, apiRateLimiter } from './middleware/security.js';
import { errorHandler } from './middleware/errorHandler.js';

import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';
import journalRoutes from './routes/journalRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import geminiRoutes from './routes/geminiRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Trust Cloud Run / GCP load balancer proxy
app.set('trust proxy', 1);

// Core Security & Utility Middlewares
app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request Logging
if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// Liveness & Readiness Probes (Unthrottled for Cloud Run health checks)
app.use('/', healthRoutes);

// Apply API Rate Limiting to /api routes
app.use('/api', apiRateLimiter);

// Mount API Routers
app.use('/api', authRoutes);             // /api/me
app.use('/api/gemini', geminiRoutes);     // /api/gemini
app.use('/api/entries', journalRoutes);   // /api/entries CRUD
app.use('/api/ai', aiRoutes);             // /api/ai/reflect & /api/ai/prompts

// In production, serve the built Single Page Application (SPA)
const publicPath = path.resolve(__dirname, '../public');
app.use(express.static(publicPath));

// Handle SPA client-side routing for non-API routes
app.get('*', (req, res, next) => {
  if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/healthz')) {
    return next();
  }
  const indexFile = path.join(publicPath, 'index.html');
  res.sendFile(indexFile, (err) => {
    if (err) {
      res.status(200).send(`
        <!DOCTYPE html>
        <html>
          <head><title>MindScribe AI Server</title></head>
          <body style="font-family: sans-serif; text-align: center; padding: 50px;">
            <h1>MindScribe AI Backend is Running 🚀</h1>
            <p>Cloud Run environment: <code>${env.NODE_ENV}</code></p>
            <p>Explore API: <code>/healthz</code> | <code>/api/me</code></p>
          </body>
        </html>
      `);
    }
  });
});

// Centralized Error Handler
app.use(errorHandler);

// Start Server
const server = app.listen(env.PORT, '0.0.0.0', () => {
  console.log(`========================================================`);
  console.log(`🚀 MindScribe AI Server listening on port ${env.PORT}`);
  console.log(`🌍 Environment: ${env.NODE_ENV}`);
  console.log(`🔒 Security: Helmet CSP + Firebase Token Auth + Secret Manager`);
  console.log(`========================================================`);
});

// Graceful Shutdown for Cloud Run
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
