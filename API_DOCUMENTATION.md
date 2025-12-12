# REST API Documentation

The VPS-Execute MCP server includes a REST API for integration with any HTTP client, including AI agents that don't support MCP protocol.

## Base URL

```
http://localhost:3000
```

## Authentication

All endpoints (except `/health`) require authentication using an API key.

### Authentication Methods

**Method 1: Header (Recommended)**
```bash
-H "X-API-Key: your-api-key-here"
```

**Method 2: Query Parameter**
```bash
?api_key=your-api-key-here
```

## Rate Limiting

- Default: 100 requests per minute per IP
- Headers returned:
  - `X-RateLimit-Limit`: Request limit
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Time when limit resets

## Endpoints

### Health Check

**GET** `/health`

Check if the API server is running.

**Authentication:** Not required

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-12T10:30:00.000Z"
}
```

---

### Execute Command

**POST** `/execute`

Execute a shell command on the remote host.

**Authentication:** Required

**Request Body:**
```json
{
  "command": "ls -la /var/www",
  "timeout": 30000  // Optional, in milliseconds
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "stdout": "total 48\ndrwxr-xr-x 3 www-data www-data 4096...",
    "stderr": "",
    "exitCode": 0,
    "executionTime": 245
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/execute \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"command": "df -h"}'
```

---

### Upload File

**POST** `/upload`

Upload a file from the local system to the remote host.

**Authentication:** Required

**Request Body:**
```json
{
  "localPath": "/path/to/local/file.txt",
  "remotePath": "/path/to/remote/file.txt"
}
```

**Response:**
```json
{
  "success": true,
  "message": "File uploaded from /path/to/local/file.txt to /path/to/remote/file.txt"
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/upload \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "localPath": "/tmp/config.json",
    "remotePath": "/etc/app/config.json"
  }'
```

---

### Download File

**POST** `/download`

Download a file from the remote host to the local system.

**Authentication:** Required

**Request Body:**
```json
{
  "remotePath": "/var/log/app.log",
  "localPath": "/tmp/app.log"
}
```

**Response:**
```json
{
  "success": true,
  "message": "File downloaded from /var/log/app.log to /tmp/app.log"
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/download \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "remotePath": "/var/log/nginx/access.log",
    "localPath": "/tmp/access.log"
  }'
```

---

### List Directory

**POST** `/list`

List contents of a directory on the remote host.

**Authentication:** Required

**Request Body:**
```json
{
  "remotePath": "/var/www"
}
```

**Response:**
```json
{
  "success": true,
  "files": [
    {
      "type": "-",
      "name": "index.html",
      "size": 1234,
      "modifyTime": 1702380000000,
      "accessTime": 1702380000000,
      "rights": {
        "user": "rw",
        "group": "r",
        "other": "r"
      },
      "owner": 1000,
      "group": 1000
    }
  ]
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/list \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"remotePath": "/home"}'
```

---

### Get System Info

**GET** `/system-info`

Get system information from the remote host.

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "info": {
    "hostname": "web-server-01",
    "uptime": "up 45 days, 3:24",
    "loadAverage": "0.15 0.18 0.12",
    "memoryUsage": "              total        used        free...",
    "diskUsage": "Filesystem      Size  Used Avail Use% Mounted on..."
  }
}
```

**Example:**
```bash
curl http://localhost:3000/system-info \
  -H "X-API-Key: your-api-key"
```

---

### List Processes

**GET** `/processes`

List running processes on the remote host, sorted by CPU usage (top 20).

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "processes": "USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND\nroot         1  0.0  0.1  16940  8456 ?        Ss   Nov27   0:04 /sbin/init..."
}
```

**Example:**
```bash
curl http://localhost:3000/processes \
  -H "X-API-Key: your-api-key"
```

---

## Error Responses

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "API key is required. Provide it in X-API-Key header or api_key query parameter."
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "Invalid API key."
}
```

### 429 Too Many Requests
```json
{
  "message": "Too many requests from this IP, please try again later."
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "SSH connection failed: Connection timeout"
}
```

## Security Features

### Command Validation

If command whitelisting is enabled, only approved commands can be executed:

```env
ENABLE_COMMAND_WHITELIST=true
ALLOWED_COMMANDS=ls,pwd,df,free,top,ps,cat,grep
```

### Dangerous Pattern Detection

The following patterns are automatically blocked:
- `rm -rf /` (without additional path)
- Fork bombs
- Filesystem formatting commands

### Audit Logging

All API requests are logged with:
- Timestamp
- IP address
- Action performed
- Success/failure status
- Error messages (if any)

Logs are stored in `./logs/server.log`

## AI Agent Integration

### Using with Python

```python
import requests

API_URL = "http://localhost:3000"
API_KEY = "your-api-key"

headers = {
    "Content-Type": "application/json",
    "X-API-Key": API_KEY
}

# Execute command
response = requests.post(
    f"{API_URL}/execute",
    headers=headers,
    json={"command": "ls -la"}
)

result = response.json()
print(result["result"]["stdout"])
```

### Using with JavaScript/Node.js

```javascript
const axios = require('axios');

const API_URL = 'http://localhost:3000';
const API_KEY = 'your-api-key';

async function executeCommand(command) {
  const response = await axios.post(
    `${API_URL}/execute`,
    { command },
    { headers: { 'X-API-Key': API_KEY } }
  );

  return response.data.result;
}

// Usage
executeCommand('df -h').then(result => {
  console.log(result.stdout);
});
```

### Using with cURL

```bash
# Set variables
API_URL="http://localhost:3000"
API_KEY="your-api-key"

# Execute command
curl -X POST "$API_URL/execute" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{"command": "uptime"}'
```

## Best Practices

1. **API Key Security**
   - Use environment variables to store API keys
   - Rotate API keys regularly
   - Never commit API keys to version control

2. **Error Handling**
   - Always check the `success` field in responses
   - Handle rate limiting with exponential backoff
   - Log errors for debugging

3. **Command Execution**
   - Validate commands before execution
   - Set appropriate timeouts
   - Handle long-running commands appropriately

4. **File Operations**
   - Verify file paths before upload/download
   - Check disk space before large uploads
   - Use absolute paths when possible

5. **Production Deployment**
   - Use HTTPS in production
   - Enable command whitelisting
   - Configure appropriate rate limits
   - Set up monitoring and alerting
   - Review audit logs regularly
