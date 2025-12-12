# VPS-Execute-MCP

**MCP Server + REST API for AI Agents to Interact with Remote Hosts via SSH**

Execute commands, manage files, and monitor your remote servers through AI agents like Claude Desktop or via REST API.

## 🚀 Features

### MCP Server (Model Context Protocol)
- ✅ Native integration with Claude Desktop and other MCP clients
- ✅ Structured tool discovery for AI agents
- ✅ Type-safe inputs/outputs with JSON Schema
- ✅ Real-time command execution streaming

### REST API
- ✅ HTTP endpoints for any client
- ✅ API key authentication
- ✅ Rate limiting and security controls
- ✅ Comprehensive audit logging

### Core Capabilities
- 🔧 **Execute Commands** - Run shell commands on remote hosts
- 📁 **File Operations** - Upload, download, and list files via SFTP
- 📊 **System Monitoring** - Get system info, resource usage, and running processes
- 🔐 **Security** - SSH key auth, command whitelisting, rate limiting
- 📝 **Audit Logging** - Complete audit trail of all operations

## 📋 Quick Start

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/VPS-Execute-MCP.git
cd VPS-Execute-MCP

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your SSH credentials

# Build
npm run build
```

### 2. Configuration

Edit `.env` file:

```env
SSH_HOST=your-server.com
SSH_PORT=22
SSH_USERNAME=your-username
SSH_PRIVATE_KEY_PATH=/path/to/your/private/key

API_PORT=3000
API_KEY=your-secure-api-key-change-this
```

### 3. Run the Server

**Option A: MCP Server (for Claude Desktop)**
```bash
npm run mcp
```

**Option B: REST API Server**
```bash
npm run api
```

## 🤖 Using with Claude Desktop

### Configuration

Add to your Claude Desktop config file:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
**Linux:** `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "vps-execute": {
      "command": "node",
      "args": ["/absolute/path/to/VPS-Execute-MCP/dist/mcp-server.js"],
      "env": {
        "SSH_HOST": "your-server.com",
        "SSH_PORT": "22",
        "SSH_USERNAME": "your-username",
        "SSH_PRIVATE_KEY_PATH": "/home/user/.ssh/id_rsa"
      }
    }
  }
}
```

Restart Claude Desktop, then try:

> "Check the disk usage on my remote server"

See [CLAUDE_DESKTOP.md](CLAUDE_DESKTOP.md) for detailed instructions.

## 🌐 Using the REST API

### Execute a Command

```bash
curl -X POST http://localhost:3000/execute \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"command": "df -h"}'
```

### Get System Information

```bash
curl http://localhost:3000/system-info \
  -H "X-API-Key: your-api-key"
```

### Upload a File

```bash
curl -X POST http://localhost:3000/upload \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "localPath": "/tmp/config.json",
    "remotePath": "/etc/app/config.json"
  }'
```

See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for complete API reference.

## 🔐 Security Features

- **SSH Key Authentication** - Secure key-based SSH access
- **API Key Protection** - All REST API endpoints require authentication
- **Command Whitelisting** - Restrict allowed commands (optional)
- **Rate Limiting** - Prevent abuse (100 requests/minute default)
- **Dangerous Pattern Detection** - Block potentially harmful commands
- **Audit Logging** - Complete trail of all operations
- **Timeout Protection** - Prevent runaway commands

### Enable Command Whitelisting

```env
ENABLE_COMMAND_WHITELIST=true
ALLOWED_COMMANDS=ls,pwd,df,free,top,ps,cat,grep
```

## 📖 Documentation

- **[SETUP.md](SETUP.md)** - Detailed setup and installation guide
- **[CLAUDE_DESKTOP.md](CLAUDE_DESKTOP.md)** - Claude Desktop integration guide
- **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** - Complete REST API reference

## 🛠️ Available Tools/Endpoints

| Tool/Endpoint | Description |
|---------------|-------------|
| `execute_command` / `POST /execute` | Execute shell commands |
| `upload_file` / `POST /upload` | Upload files via SFTP |
| `download_file` / `POST /download` | Download files via SFTP |
| `list_directory` / `POST /list` | List directory contents |
| `get_system_info` / `GET /system-info` | Get system information |
| `list_processes` / `GET /processes` | List running processes |

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│    AI Agent (Claude Desktop, etc.)     │
└────────┬────────────────────────┬───────┘
         │ MCP Protocol           │ HTTP/REST
┌────────▼────────┐      ┌────────▼────────┐
│   MCP Server    │      │   API Server    │
│   (stdio)       │      │   (Express)     │
└────────┬────────┘      └────────┬────────┘
         │                        │
         └────────┬───────────────┘
                  │
         ┌────────▼────────┐
         │  SSH Manager    │
         │  (ssh2/sftp)    │
         └────────┬────────┘
                  │ SSH/SFTP
         ┌────────▼────────┐
         │  Remote Host    │
         └─────────────────┘
```

## 🧪 Development

```bash
# Install dependencies
npm install

# Run in development mode with auto-reload
npm run dev

# Type checking
npm run type-check

# Build
npm run build
```

## 📝 Example Use Cases

### Server Monitoring with Claude
> "Claude, check my server's CPU and memory usage, and tell me if anything looks unusual"

### Automated Deployments
> "Upload the new config file to /etc/myapp/ and restart the service"

### Log Analysis
> "Download the last 1000 lines of the nginx error log and summarize the main issues"

### System Maintenance
> "Check which directories are using the most disk space in /var"

### Integration with Custom AI Agents

```python
import requests

def check_server_health(api_key):
    response = requests.get(
        "http://localhost:3000/system-info",
        headers={"X-API-Key": api_key}
    )
    return response.json()
```

## ⚠️ Security Warnings

- Never expose the API server directly to the internet without proper authentication
- Always use SSH key authentication instead of passwords
- Enable command whitelisting in production environments
- Regularly review audit logs
- Use a dedicated SSH user with limited permissions
- Keep your API keys secure and rotate them regularly

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## 📧 Support

- Documentation: See the `docs/` folder
- Issues: [GitHub Issues](https://github.com/yourusername/VPS-Execute-MCP/issues)
- Security: Please report security issues privately

## 🙏 Acknowledgments

- Built with the [Model Context Protocol SDK](https://github.com/anthropics/model-context-protocol)
- Uses [ssh2](https://github.com/mscdex/ssh2) for SSH connections
- Powered by [Express](https://expressjs.com/) for the REST API
