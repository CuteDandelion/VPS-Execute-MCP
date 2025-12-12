# Using with Claude Desktop

This guide shows you how to integrate the VPS-Execute MCP server with Claude Desktop, enabling Claude to interact with your remote servers.

## What is MCP?

Model Context Protocol (MCP) is a standard protocol that allows AI applications like Claude Desktop to interact with external tools and data sources. This MCP server gives Claude the ability to execute commands and manage files on remote hosts via SSH.

## Configuration

### Step 1: Build the Project

```bash
npm install
npm run build
```

### Step 2: Configure Claude Desktop

1. **Locate the Claude Desktop config file:**

   - **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
   - **Linux:** `~/.config/Claude/claude_desktop_config.json`

2. **Edit the config file** and add your MCP server:

```json
{
  "mcpServers": {
    "vps-execute": {
      "command": "node",
      "args": [
        "/absolute/path/to/VPS-Execute-MCP/dist/mcp-server.js"
      ],
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

**Important:** Replace `/absolute/path/to/VPS-Execute-MCP` with the actual absolute path to your project.

### Step 3: Restart Claude Desktop

Completely quit and restart Claude Desktop for the changes to take effect.

## Verifying the Connection

Once Claude Desktop restarts, you should see the MCP server tools available. You can test by asking Claude:

> "Can you execute 'ls -la' on my remote server?"

Or:

> "What's the system information for my remote host?"

## Available Tools

Claude can now use these tools to interact with your remote server:

### 1. execute_command
Execute any shell command on the remote host.

**Example prompt:**
> "Check the disk usage on my server"

### 2. upload_file
Upload a file from your local machine to the remote host.

**Example prompt:**
> "Upload the file /local/path/config.json to /remote/path/config.json"

### 3. download_file
Download a file from the remote host to your local machine.

**Example prompt:**
> "Download /var/log/app.log from the server to my desktop"

### 4. list_directory
List contents of a directory on the remote host.

**Example prompt:**
> "Show me what's in the /var/www directory"

### 5. get_system_info
Get comprehensive system information including hostname, uptime, memory, and disk usage.

**Example prompt:**
> "Give me a summary of my server's status"

### 6. list_processes
List running processes sorted by CPU usage.

**Example prompt:**
> "What are the top processes running on my server?"

## Security Considerations

### 1. SSH Key Authentication

Always use SSH key authentication instead of passwords:

```json
{
  "env": {
    "SSH_PRIVATE_KEY_PATH": "/home/user/.ssh/id_rsa"
  }
}
```

### 2. Command Whitelisting

For additional security, enable command whitelisting:

```json
{
  "env": {
    "ENABLE_COMMAND_WHITELIST": "true",
    "ALLOWED_COMMANDS": "ls,pwd,df,free,top,ps,cat,grep"
  }
}
```

### 3. Timeout Configuration

Set appropriate command timeouts:

```json
{
  "env": {
    "MAX_COMMAND_TIMEOUT": "300000"
  }
}
```

## Example Use Cases

### Server Monitoring

> "Claude, check if my web server is running and show me the top 5 processes by CPU usage"

### Log Analysis

> "Download the nginx access logs from /var/log/nginx/access.log and analyze the recent traffic patterns"

### Deployment Tasks

> "Upload my new application config to /etc/myapp/config.json and restart the service"

### System Maintenance

> "Check the disk usage and show me which directories are taking up the most space"

## Troubleshooting

### MCP Server Not Appearing in Claude Desktop

1. Check that the path to `mcp-server.js` is absolute, not relative
2. Verify the build completed successfully (`npm run build`)
3. Check Claude Desktop's developer console for errors (Help → Developer Tools)
4. Ensure all environment variables are set correctly

### SSH Connection Errors

1. Test SSH connection manually: `ssh -i /path/to/key user@host`
2. Verify the private key path is correct and the file exists
3. Check the private key permissions: `chmod 600 /path/to/key`
4. Ensure the remote host is reachable from your network

### Permission Denied Errors

- The user specified in SSH_USERNAME must have appropriate permissions on the remote host
- Some commands may require sudo access (consider using a dedicated user with limited sudo rights)

## Advanced Configuration

### Multiple Remote Hosts

You can configure multiple MCP servers for different hosts:

```json
{
  "mcpServers": {
    "production-server": {
      "command": "node",
      "args": ["/path/to/VPS-Execute-MCP/dist/mcp-server.js"],
      "env": {
        "SSH_HOST": "prod.example.com",
        "SSH_USERNAME": "deploy",
        "SSH_PRIVATE_KEY_PATH": "/home/user/.ssh/prod_key"
      }
    },
    "staging-server": {
      "command": "node",
      "args": ["/path/to/VPS-Execute-MCP/dist/mcp-server.js"],
      "env": {
        "SSH_HOST": "staging.example.com",
        "SSH_USERNAME": "deploy",
        "SSH_PRIVATE_KEY_PATH": "/home/user/.ssh/staging_key"
      }
    }
  }
}
```

### Custom Logging

Configure logging level and location:

```json
{
  "env": {
    "LOG_LEVEL": "debug",
    "LOG_FILE": "/var/log/vps-execute-mcp.log"
  }
}
```

## Next Steps

- Review the audit logs regularly: `tail -f logs/server.log`
- Set up command whitelisting for production use
- Consider using a dedicated SSH user with limited permissions
- Explore automation possibilities by combining multiple tools
