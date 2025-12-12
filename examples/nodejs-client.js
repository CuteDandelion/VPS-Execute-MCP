#!/usr/bin/env node

/**
 * Example Node.js client for VPS-Execute-MCP REST API
 *
 * This demonstrates how to interact with the API server from Node.js/JavaScript.
 */

const axios = require('axios');

class VPSExecuteClient {
  constructor(baseUrl, apiKey) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.headers = {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey
    };
  }

  async executeCommand(command, timeout = null) {
    const data = { command };
    if (timeout) data.timeout = timeout;

    const response = await axios.post(
      `${this.baseUrl}/execute`,
      data,
      { headers: this.headers }
    );
    return response.data;
  }

  async uploadFile(localPath, remotePath) {
    const response = await axios.post(
      `${this.baseUrl}/upload`,
      { localPath, remotePath },
      { headers: this.headers }
    );
    return response.data;
  }

  async downloadFile(remotePath, localPath) {
    const response = await axios.post(
      `${this.baseUrl}/download`,
      { remotePath, localPath },
      { headers: this.headers }
    );
    return response.data;
  }

  async listDirectory(remotePath) {
    const response = await axios.post(
      `${this.baseUrl}/list`,
      { remotePath },
      { headers: this.headers }
    );
    return response.data;
  }

  async getSystemInfo() {
    const response = await axios.get(
      `${this.baseUrl}/system-info`,
      { headers: this.headers }
    );
    return response.data;
  }

  async listProcesses() {
    const response = await axios.get(
      `${this.baseUrl}/processes`,
      { headers: this.headers }
    );
    return response.data;
  }
}

async function main() {
  // Configuration
  const API_URL = 'http://localhost:3000';
  const API_KEY = 'your-api-key-here';

  // Initialize client
  const client = new VPSExecuteClient(API_URL, API_KEY);

  try {
    // Example 1: Execute a command
    console.log('='.repeat(50));
    console.log('Executing command: uptime');
    console.log('='.repeat(50));
    const result = await client.executeCommand('uptime');
    if (result.success) {
      console.log(result.result.stdout);
    }

    // Example 2: Get system information
    console.log('\n' + '='.repeat(50));
    console.log('Getting system information');
    console.log('='.repeat(50));
    const sysInfo = await client.getSystemInfo();
    if (sysInfo.success) {
      const info = sysInfo.info;
      console.log(`Hostname: ${info.hostname}`);
      console.log(`Uptime: ${info.uptime}`);
      console.log(`Load Average: ${info.loadAverage}`);
    }

    // Example 3: List directory
    console.log('\n' + '='.repeat(50));
    console.log('Listing /var directory');
    console.log('='.repeat(50));
    const files = await client.listDirectory('/var');
    if (files.success) {
      files.files.slice(0, 5).forEach(file => {
        console.log(`${file.type} ${file.name} (${file.size} bytes)`);
      });
    }

    // Example 4: Check disk usage
    console.log('\n' + '='.repeat(50));
    console.log('Checking disk usage');
    console.log('='.repeat(50));
    const diskUsage = await client.executeCommand('df -h');
    if (diskUsage.success) {
      console.log(diskUsage.result.stdout);
    }

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { VPSExecuteClient };
