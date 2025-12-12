export interface SSHConfig {
  host: string;
  port: number;
  username: string;
  privateKeyPath?: string;
  privateKeyPassphrase?: string;
  password?: string;
}

export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTime: number;
}

export interface FileUploadParams {
  localPath: string;
  remotePath: string;
}

export interface FileDownloadParams {
  remotePath: string;
  localPath: string;
}

export interface SystemInfo {
  hostname: string;
  uptime: string;
  loadAverage: string;
  memoryUsage: string;
  diskUsage: string;
}

export interface ProcessInfo {
  pid: string;
  user: string;
  cpu: string;
  mem: string;
  command: string;
}

export interface AuditLog {
  timestamp: Date;
  action: string;
  user?: string;
  command?: string;
  success: boolean;
  error?: string;
}
