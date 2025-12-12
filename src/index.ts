#!/usr/bin/env node

import { startAPIServer } from './api/server.js';
import { startMCPServer } from './mcp/server.js';

const mode = process.argv[2] || 'api';

async function main() {
  switch (mode) {
    case 'api':
      console.log('Starting API server...');
      await startAPIServer();
      break;
    case 'mcp':
      console.log('Starting MCP server...');
      await startMCPServer();
      break;
    case 'both':
      console.log('Starting both API and MCP servers...');
      await startAPIServer();
      console.log('API server started. Note: MCP server requires separate process.');
      break;
    default:
      console.error('Invalid mode. Use: api, mcp, or both');
      process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
