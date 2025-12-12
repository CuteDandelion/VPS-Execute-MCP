import winston from 'winston';
import { config } from './config.js';
import fs from 'fs';
import path from 'path';

// Ensure logs directory exists
const logDir = path.dirname(config.logging.file);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

export const logger = winston.createLogger({
  level: config.logging.level,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: config.logging.file }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

export function logAudit(action: string, details: Record<string, any>, success: boolean, error?: string) {
  logger.info('Audit Log', {
    action,
    ...details,
    success,
    error,
    timestamp: new Date().toISOString(),
  });
}
