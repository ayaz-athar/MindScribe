import express from 'express';
import { env } from '../config/env.js';

const router = express.Router();

/**
 * Liveness Probe: GET /healthz
 * Cloud Run checks this to verify the container is alive
 */
router.get('/healthz', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * Readiness Probe: GET /readyz
 * Checks whether core dependencies are ready
 */
router.get('/readyz', (req, res) => {
  res.status(200).json({
    status: 'ready',
    environment: env.NODE_ENV,
    projectId: env.GCP_PROJECT_ID,
    timestamp: new Date().toISOString(),
  });
});

export default router;
