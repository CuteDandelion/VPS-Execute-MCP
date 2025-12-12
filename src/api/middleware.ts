import { Request, Response, NextFunction } from 'express';
import { config } from '../utils/config.js';
import { logger } from '../utils/logger.js';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'] || req.query.api_key;

  if (!apiKey) {
    logger.warn('API request without API key', {
      ip: req.ip,
      path: req.path,
    });
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'API key is required. Provide it in X-API-Key header or api_key query parameter.',
    });
  }

  if (apiKey !== config.api.apiKey) {
    logger.warn('API request with invalid API key', {
      ip: req.ip,
      path: req.path,
    });
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Invalid API key.',
    });
  }

  next();
}

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  logger.error('API error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
  });
}
