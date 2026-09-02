import { env } from '../config/env.js';

/**
 * Global Error Handling Middleware
 * Prevents stack trace leakage in production while providing actionable error messages.
 */
export function errorHandler(err, req, res, next) {
  const statusCode = err.status || err.statusCode || 500;
  const isProd = env.NODE_ENV === 'production';

  console.error(`💥 Error [${req.method} ${req.originalUrl}]:`, {
    message: err.message,
    code: err.code,
    stack: isProd ? undefined : err.stack,
  });

  res.status(statusCode).json({
    error: err.name || 'InternalServerError',
    message: err.message || 'An unexpected error occurred.',
    code: err.code || 'SERVER_ERROR',
    ...(isProd ? {} : { stack: err.stack }),
  });
}
