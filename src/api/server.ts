import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config, validateConfig } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import { authMiddleware, errorHandler } from './middleware.js';
import routes from './routes.js';
import { getSSHManager } from '../services/ssh-manager.js';

export async function startAPIServer() {
  // Validate configuration
  try {
    validateConfig();
  } catch (error: any) {
    logger.error('Configuration validation failed', { error: error.message });
    process.exit(1);
  }

  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  // Rate limiting
  const limiter = rateLimit({
    windowMs: config.security.rateLimitWindowMs,
    max: config.security.rateLimitMaxRequests,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use(limiter);

  // Request logging
  app.use((req, res, next) => {
    logger.info('API request', {
      method: req.method,
      path: req.path,
      ip: req.ip,
    });
    next();
  });

  // Authentication middleware (except health check)
  app.use((req, res, next) => {
    if (req.path === '/health') {
      return next();
    }
    authMiddleware(req, res, next);
  });

  // Routes
  app.use('/', routes);

  // Error handler
  app.use(errorHandler);

  // Initialize SSH connection
  const sshManager = getSSHManager();

  try {
    await sshManager.connect();
    logger.info('SSH connection established for API server');
  } catch (error: any) {
    logger.error('Failed to establish SSH connection', { error: error.message });
    process.exit(1);
  }

  // Start server
  const server = app.listen(config.api.port, config.api.host, () => {
    logger.info('API server started', {
      host: config.api.host,
      port: config.api.port,
    });
    console.log(`API server running at http://${config.api.host}:${config.api.port}`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    logger.info('Shutting down API server...');
    server.close(() => {
      logger.info('API server closed');
    });
    await sshManager.disconnect();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  return server;
}
