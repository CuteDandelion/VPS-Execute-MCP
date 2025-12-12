import dotenv from 'dotenv';
import { SSHConfig } from '../types/index.js';

dotenv.config();

export const config = {
  ssh: {
    host: process.env.SSH_HOST || '',
    port: parseInt(process.env.SSH_PORT || '22'),
    username: process.env.SSH_USERNAME || '',
    privateKeyPath: process.env.SSH_PRIVATE_KEY_PATH,
    privateKeyPassphrase: process.env.SSH_PRIVATE_KEY_PASSPHRASE,
    password: process.env.SSH_PASSWORD,
  } as SSHConfig,

  api: {
    port: parseInt(process.env.API_PORT || '3000'),
    host: process.env.API_HOST || 'localhost',
    apiKey: process.env.API_KEY || 'change-this-secret-key',
  },

  mcp: {
    serverName: process.env.MCP_SERVER_NAME || 'vps-execute-mcp',
    serverVersion: process.env.MCP_SERVER_VERSION || '1.0.0',
  },

  security: {
    enableCommandWhitelist: process.env.ENABLE_COMMAND_WHITELIST === 'true',
    allowedCommands: process.env.ALLOWED_COMMANDS?.split(',') || [],
    maxCommandTimeout: parseInt(process.env.MAX_COMMAND_TIMEOUT || '300000'),
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || './logs/server.log',
  },
};

export function validateConfig(): void {
  if (!config.ssh.host) {
    throw new Error('SSH_HOST is required in environment variables');
  }
  if (!config.ssh.username) {
    throw new Error('SSH_USERNAME is required in environment variables');
  }
  if (!config.ssh.privateKeyPath && !config.ssh.password) {
    throw new Error('Either SSH_PRIVATE_KEY_PATH or SSH_PASSWORD must be provided');
  }
}
