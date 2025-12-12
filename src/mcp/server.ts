import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { getSSHManager } from '../services/ssh-manager.js';
import { logger } from '../utils/logger.js';
import { config, validateConfig } from '../utils/config.js';
import { z } from 'zod';

// Tool input schemas
const ExecuteCommandSchema = z.object({
  command: z.string().describe('The shell command to execute on the remote host'),
  timeout: z.number().optional().describe('Command timeout in milliseconds (default: 300000)'),
});

const UploadFileSchema = z.object({
  localPath: z.string().describe('Local file path to upload'),
  remotePath: z.string().describe('Remote destination path'),
});

const DownloadFileSchema = z.object({
  remotePath: z.string().describe('Remote file path to download'),
  localPath: z.string().describe('Local destination path'),
});

const ListDirectorySchema = z.object({
  remotePath: z.string().describe('Remote directory path to list'),
});

// Define available tools
const tools: Tool[] = [
  {
    name: 'execute_command',
    description: 'Execute a shell command on the remote host via SSH. Returns stdout, stderr, exit code, and execution time.',
    inputSchema: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'The shell command to execute on the remote host',
        },
        timeout: {
          type: 'number',
          description: 'Command timeout in milliseconds (default: 300000)',
        },
      },
      required: ['command'],
    },
  },
  {
    name: 'upload_file',
    description: 'Upload a file from the local system to the remote host via SFTP.',
    inputSchema: {
      type: 'object',
      properties: {
        localPath: {
          type: 'string',
          description: 'Local file path to upload',
        },
        remotePath: {
          type: 'string',
          description: 'Remote destination path',
        },
      },
      required: ['localPath', 'remotePath'],
    },
  },
  {
    name: 'download_file',
    description: 'Download a file from the remote host to the local system via SFTP.',
    inputSchema: {
      type: 'object',
      properties: {
        remotePath: {
          type: 'string',
          description: 'Remote file path to download',
        },
        localPath: {
          type: 'string',
          description: 'Local destination path',
        },
      },
      required: ['remotePath', 'localPath'],
    },
  },
  {
    name: 'list_directory',
    description: 'List contents of a directory on the remote host.',
    inputSchema: {
      type: 'object',
      properties: {
        remotePath: {
          type: 'string',
          description: 'Remote directory path to list',
        },
      },
      required: ['remotePath'],
    },
  },
  {
    name: 'get_system_info',
    description: 'Get system information from the remote host including hostname, uptime, load average, memory usage, and disk usage.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'list_processes',
    description: 'List running processes on the remote host, sorted by CPU usage (top 20).',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

export async function startMCPServer() {
  // Validate configuration
  try {
    validateConfig();
  } catch (error: any) {
    logger.error('Configuration validation failed', { error: error.message });
    process.exit(1);
  }

  const server = new Server(
    {
      name: config.mcp.serverName,
      version: config.mcp.serverVersion,
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Initialize SSH connection
  const sshManager = getSSHManager();

  try {
    await sshManager.connect();
    logger.info('SSH connection established for MCP server');
  } catch (error: any) {
    logger.error('Failed to establish SSH connection', { error: error.message });
    process.exit(1);
  }

  // Handle tool listing
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools };
  });

  // Handle tool execution
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case 'execute_command': {
          const { command, timeout } = ExecuteCommandSchema.parse(args);
          const result = await sshManager.executeCommand(command, timeout);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case 'upload_file': {
          const { localPath, remotePath } = UploadFileSchema.parse(args);
          await sshManager.uploadFile(localPath, remotePath);
          return {
            content: [
              {
                type: 'text',
                text: `File uploaded successfully from ${localPath} to ${remotePath}`,
              },
            ],
          };
        }

        case 'download_file': {
          const { remotePath, localPath } = DownloadFileSchema.parse(args);
          await sshManager.downloadFile(remotePath, localPath);
          return {
            content: [
              {
                type: 'text',
                text: `File downloaded successfully from ${remotePath} to ${localPath}`,
              },
            ],
          };
        }

        case 'list_directory': {
          const { remotePath } = ListDirectorySchema.parse(args);
          const files = await sshManager.listDirectory(remotePath);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(files, null, 2),
              },
            ],
          };
        }

        case 'get_system_info': {
          const info = await sshManager.getSystemInfo();
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(info, null, 2),
              },
            ],
          };
        }

        case 'list_processes': {
          const processes = await sshManager.listProcesses();
          return {
            content: [
              {
                type: 'text',
                text: processes,
              },
            ],
          };
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error: any) {
      logger.error('Tool execution error', { tool: name, error: error.message });
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  });

  // Start the server with stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  logger.info('MCP server started successfully', {
    serverName: config.mcp.serverName,
    version: config.mcp.serverVersion,
  });

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    logger.info('Shutting down MCP server...');
    await sshManager.disconnect();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    logger.info('Shutting down MCP server...');
    await sshManager.disconnect();
    process.exit(0);
  });
}
