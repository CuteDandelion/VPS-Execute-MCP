# Usage Examples

This directory contains example scripts demonstrating how to use the VPS-Execute-MCP server.

## Python Client (`python-client.py`)

Full-featured Python client using the `requests` library.

### Installation

```bash
pip install requests
```

### Usage

```bash
# Edit the script to set your API_URL and API_KEY
python examples/python-client.py
```

### Features

- Execute commands
- Upload/download files
- List directories
- Get system information
- List processes

---

## Node.js Client (`nodejs-client.js`)

JavaScript/Node.js client using `axios`.

### Installation

```bash
npm install axios
```

### Usage

```bash
# Edit the script to set your API_URL and API_KEY
node examples/nodejs-client.js
```

### Importing as Module

```javascript
const { VPSExecuteClient } = require('./examples/nodejs-client.js');

const client = new VPSExecuteClient('http://localhost:3000', 'your-api-key');
const result = await client.executeCommand('ls -la');
console.log(result);
```

---

## Monitoring Script (`monitoring-script.sh`)

Bash script for basic server health monitoring.

### Usage

```bash
# Make it executable
chmod +x examples/monitoring-script.sh

# Edit the script to set your API_URL and API_KEY
./examples/monitoring-script.sh
```

### What It Checks

- API server connectivity
- System information (hostname, uptime)
- Disk usage
- Memory usage
- Top CPU-consuming processes

### Cron Job Example

Run health checks every hour:

```bash
0 * * * * /path/to/examples/monitoring-script.sh >> /var/log/server-health.log 2>&1
```

---

## More Examples

### Quick Command Execution

**Bash:**
```bash
curl -X POST http://localhost:3000/execute \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"command": "whoami"}'
```

**Python:**
```python
import requests

response = requests.post(
    'http://localhost:3000/execute',
    headers={'X-API-Key': 'your-api-key'},
    json={'command': 'whoami'}
)
print(response.json()['result']['stdout'])
```

**JavaScript:**
```javascript
const axios = require('axios');

axios.post('http://localhost:3000/execute',
  { command: 'whoami' },
  { headers: { 'X-API-Key': 'your-api-key' } }
).then(res => console.log(res.data.result.stdout));
```

### File Upload Example

**Bash:**
```bash
curl -X POST http://localhost:3000/upload \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "localPath": "/tmp/local-file.txt",
    "remotePath": "/tmp/remote-file.txt"
  }'
```

**Python:**
```python
response = requests.post(
    'http://localhost:3000/upload',
    headers={'X-API-Key': 'your-api-key'},
    json={
        'localPath': '/tmp/local-file.txt',
        'remotePath': '/tmp/remote-file.txt'
    }
)
```

### System Monitoring

**Bash:**
```bash
# Get system info
curl http://localhost:3000/system-info \
  -H "X-API-Key: your-api-key" | jq '.info'

# List processes
curl http://localhost:3000/processes \
  -H "X-API-Key: your-api-key" | jq -r '.processes'
```

---

## Integration with AI Agents

### Claude Desktop

When using the MCP server with Claude Desktop, you can simply ask:

> "Check the disk usage on my server and tell me if I need to free up space"

> "Show me what processes are consuming the most CPU"

> "Upload my local config.json to /etc/myapp/ on the server"

### Custom AI Agent (Python)

```python
class ServerMonitoringAgent:
    def __init__(self, api_client):
        self.client = api_client

    def analyze_health(self):
        # Get system info
        sys_info = self.client.get_system_info()

        # Check disk usage
        disk = self.client.execute_command("df -h / | tail -1")
        disk_usage = int(disk['result']['stdout'].split()[4].rstrip('%'))

        # Analyze and alert
        if disk_usage > 80:
            return f"⚠️  Warning: Disk usage at {disk_usage}%"
        else:
            return f"✓ System healthy. Disk usage: {disk_usage}%"
```

---

## Best Practices

1. **Error Handling**: Always check for `success: true` in API responses
2. **Timeouts**: Set appropriate timeouts for long-running commands
3. **Rate Limiting**: Respect rate limits (default: 100 requests/minute)
4. **Security**: Store API keys in environment variables, never in code
5. **Logging**: Log all operations for audit purposes

## Environment Variables

For security, use environment variables:

```bash
export VPS_API_URL="http://localhost:3000"
export VPS_API_KEY="your-secure-api-key"
```

Then in your scripts:

```python
import os
API_URL = os.getenv('VPS_API_URL')
API_KEY = os.getenv('VPS_API_KEY')
```
