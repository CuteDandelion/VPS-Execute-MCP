#!/usr/bin/env node

import { startMCPServer } from './mcp/server.js';

startMCPServer().catch((error) => {
  console.error('Fatal error starting MCP server:', error);
  process.exit(1);
});
