#!/usr/bin/env node

import { startAPIServer } from './api/server.js';

startAPIServer().catch((error) => {
  console.error('Fatal error starting API server:', error);
  process.exit(1);
});
