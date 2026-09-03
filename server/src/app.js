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

// Trust Cloud Run / Vercel proxy headers
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

// Liveness & Readiness Probes
app.use('/', healthRoutes);

// Apply API Rate Limiting to /api routes
app.use('/api', apiRateLimiter);

// Mount API Routers
app.use('/api', authRoutes);             // /api/me
app.use('/api/gemini', geminiRoutes);     // /api/gemini
app.use('/api/entries', journalRoutes);   // /api/entries CRUD
app.use('/api/ai', aiRoutes);             // /api/ai/reflect & /api/ai/prompts

// In standalone/Cloud Run container mode, serve the built Single Page Application (SPA)
const publicPath = path.resolve(__dirname, '../public');
app.use(express.static(publicPath));

// Fallback SPA routing for non-API routes (when serving standalone)
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
            <p>Environment: <code>${env.NODE_ENV}</code></p>
            <p>Explore API: <code>/healthz</code> | <code>/api/me</code></p>
          </body>
        </html>
      `);
    }
  });
});

// Centralized Error Handler
app.use(errorHandler);

export default app;
