import { Client, ConnectConfig } from 'ssh2';
import SftpClient from 'ssh2-sftp-client';
import fs from 'fs';
import { SSHConfig, CommandResult } from '../types/index.js';
import { logger, logAudit } from '../utils/logger.js';
import { config } from '../utils/config.js';

export class SSHManager {
  private config: SSHConfig;
  private client: Client | null = null;
  private sftpClient: SftpClient | null = null;

  constructor(sshConfig: SSHConfig) {
    this.config = sshConfig;
  }

  private async getConnectConfig(): Promise<ConnectConfig> {
    const connectConfig: ConnectConfig = {
      host: this.config.host,
      port: this.config.port,
      username: this.config.username,
    };

    if (this.config.privateKeyPath) {
      try {
        connectConfig.privateKey = await fs.promises.readFile(this.config.privateKeyPath);

        // Add passphrase if provided
        if (this.config.privateKeyPassphrase) {
          connectConfig.passphrase = this.config.privateKeyPassphrase;
          logger.info('Using SSH private key authentication with passphrase');
        } else {
          logger.info('Using SSH private key authentication');
        }
      } catch (error) {
        logger.error('Failed to read private key', { error });
        throw new Error(`Failed to read private key: ${error}`);
      }
    } else if (this.config.password) {
      connectConfig.password = this.config.password;
      logger.info('Using SSH password authentication');
    }

    return connectConfig;
  }

  async connect(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      this.client = new Client();
      const connectConfig = await this.getConnectConfig();

      this.client
        .on('ready', () => {
          logger.info('SSH connection established', { host: this.config.host });
          logAudit('ssh_connect', { host: this.config.host }, true);
          resolve();
        })
        .on('error', (err) => {
          logger.error('SSH connection error', { error: err.message });
          logAudit('ssh_connect', { host: this.config.host }, false, err.message);
          reject(err);
        })
        .connect(connectConfig);
    });
  }

  async disconnect(): Promise<void> {
    if (this.sftpClient) {
      await this.sftpClient.end();
      this.sftpClient = null;
    }
    if (this.client) {
      this.client.end();
      this.client = null;
      logger.info('SSH connection closed');
    }
  }

  private validateCommand(command: string): void {
    if (config.security.enableCommandWhitelist) {
      const baseCommand = command.trim().split(' ')[0];
      if (!config.security.allowedCommands.includes(baseCommand)) {
        throw new Error(`Command '${baseCommand}' is not in the whitelist`);
      }
    }

    // Basic security checks
    const dangerousPatterns = [
      /rm\s+-rf\s+\/(?!\S)/,  // rm -rf / (not followed by path)
      /:\(\)\{\s*:\|:&\s*\};:/,  // fork bomb
      /mkfs/,  // filesystem formatting
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(command)) {
        throw new Error('Command contains potentially dangerous patterns');
      }
    }
  }

  async executeCommand(command: string, timeout?: number): Promise<CommandResult> {
    if (!this.client) {
      throw new Error('SSH client not connected');
    }

    this.validateCommand(command);

    const startTime = Date.now();
    const maxTimeout = timeout || config.security.maxCommandTimeout;

    return new Promise((resolve, reject) => {
      let stdout = '';
      let stderr = '';
      let timedOut = false;

      const timer = setTimeout(() => {
        timedOut = true;
        reject(new Error(`Command timeout after ${maxTimeout}ms`));
      }, maxTimeout);

      this.client!.exec(command, (err, stream) => {
        if (err) {
          clearTimeout(timer);
          logAudit('execute_command', { command }, false, err.message);
          reject(err);
          return;
        }

        stream
          .on('close', (code: number) => {
            clearTimeout(timer);
            if (!timedOut) {
              const result: CommandResult = {
                stdout: stdout.trim(),
                stderr: stderr.trim(),
                exitCode: code,
                executionTime: Date.now() - startTime,
              };
              logAudit('execute_command', { command, exitCode: code }, code === 0);
              resolve(result);
            }
          })
          .on('data', (data: Buffer) => {
            stdout += data.toString();
          })
          .stderr.on('data', (data: Buffer) => {
            stderr += data.toString();
          });
      });
    });
  }

  async uploadFile(localPath: string, remotePath: string): Promise<void> {
    if (!this.sftpClient) {
      this.sftpClient = new SftpClient();
      await this.sftpClient.connect(await this.getConnectConfig());
    }

    try {
      await this.sftpClient.put(localPath, remotePath);
      logger.info('File uploaded', { localPath, remotePath });
      logAudit('upload_file', { localPath, remotePath }, true);
    } catch (error: any) {
      logger.error('File upload failed', { error: error.message });
      logAudit('upload_file', { localPath, remotePath }, false, error.message);
      throw error;
    }
  }

  async downloadFile(remotePath: string, localPath: string): Promise<void> {
    if (!this.sftpClient) {
      this.sftpClient = new SftpClient();
      await this.sftpClient.connect(await this.getConnectConfig());
    }

    try {
      await this.sftpClient.get(remotePath, localPath);
      logger.info('File downloaded', { remotePath, localPath });
      logAudit('download_file', { remotePath, localPath }, true);
    } catch (error: any) {
      logger.error('File download failed', { error: error.message });
      logAudit('download_file', { remotePath, localPath }, false, error.message);
      throw error;
    }
  }

  async listDirectory(remotePath: string): Promise<any[]> {
    if (!this.sftpClient) {
      this.sftpClient = new SftpClient();
      await this.sftpClient.connect(await this.getConnectConfig());
    }

    try {
      const list = await this.sftpClient.list(remotePath);
      logger.info('Directory listed', { remotePath, count: list.length });
      return list;
    } catch (error: any) {
      logger.error('Directory listing failed', { error: error.message });
      throw error;
    }
  }

  async getSystemInfo(): Promise<any> {
    const commands = {
      hostname: 'hostname',
      uptime: 'uptime',
      loadAverage: 'cat /proc/loadavg',
      memoryUsage: 'free -h',
      diskUsage: 'df -h',
    };

    const results: any = {};

    for (const [key, cmd] of Object.entries(commands)) {
      try {
        const result = await this.executeCommand(cmd);
        results[key] = result.stdout;
      } catch (error: any) {
        results[key] = `Error: ${error.message}`;
      }
    }

    return results;
  }

  async listProcesses(): Promise<string> {
    const result = await this.executeCommand('ps aux --sort=-%cpu | head -20');
    return result.stdout;
  }
}

// Singleton instance
let sshManagerInstance: SSHManager | null = null;

export function getSSHManager(): SSHManager {
  if (!sshManagerInstance) {
    sshManagerInstance = new SSHManager(config.ssh);
  }
  return sshManagerInstance;
}
