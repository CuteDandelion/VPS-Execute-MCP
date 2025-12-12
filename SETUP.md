# Setup Guide

## Prerequisites

- Node.js 18+ installed
- SSH access to a remote host
- SSH key or password for authentication

## Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd VPS-Execute-MCP
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```

4. **Edit `.env` file with your SSH credentials:**
   ```env
   # SSH Connection
   SSH_HOST=your-server.com
   SSH_PORT=22
   SSH_USERNAME=your-username
   SSH_PRIVATE_KEY_PATH=/home/user/.ssh/id_rsa

   # API Server
   API_PORT=3000
   API_HOST=localhost
   API_KEY=your-secure-api-key-here

   # Security (optional)
   ENABLE_COMMAND_WHITELIST=false
   MAX_COMMAND_TIMEOUT=300000
   ```

5. **Build the project:**
   ```bash
   npm run build
   ```

## Running the Servers

### Option 1: MCP Server (for Claude Desktop)

```bash
npm run mcp
```

### Option 2: REST API Server

```bash
npm run api
```

### Option 3: Development Mode

```bash
npm run dev
```

## Testing the Connection

### Test MCP Server

The MCP server communicates via stdio and is designed to be used with Claude Desktop or other MCP clients.

### Test REST API

```bash
# Health check
curl http://localhost:3000/health

# Execute command (requires API key)
curl -X POST http://localhost:3000/execute \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secure-api-key-here" \
  -d '{"command": "ls -la"}'

# Get system info
curl http://localhost:3000/system-info \
  -H "X-API-Key: your-secure-api-key-here"
```

## Security Best Practices

1. **Use SSH Keys:** Always prefer SSH key authentication over passwords
2. **Strong API Key:** Generate a strong random API key
3. **Enable Whitelist:** For production, enable command whitelisting
4. **Rate Limiting:** Configure appropriate rate limits for your use case
5. **Firewall:** Only expose the API server to trusted networks
6. **Logs:** Regularly review audit logs in `./logs/server.log`

## Troubleshooting

### SSH Connection Issues

- Verify your SSH credentials are correct
- Test SSH connection manually: `ssh -i /path/to/key user@host`
- Check firewall rules on the remote host
- Ensure the private key has correct permissions: `chmod 600 /path/to/key`

### API Authentication Issues

- Verify the API key in your requests matches the `.env` file
- Check the API key is sent in the `X-API-Key` header

### Rate Limiting

If you're being rate limited, adjust these settings in `.env`:
```env
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```
