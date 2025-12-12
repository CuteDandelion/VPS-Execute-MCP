import { Router, Request, Response } from 'express';
import { getSSHManager } from '../services/ssh-manager.js';
import { logger } from '../utils/logger.js';

const router = Router();

// Health check endpoint
router.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Execute command
router.post('/execute', async (req: Request, res: Response) => {
  try {
    const { command, timeout } = req.body;

    if (!command) {
      return res.status(400).json({ error: 'Command is required' });
    }

    const sshManager = getSSHManager();
    const result = await sshManager.executeCommand(command, timeout);

    res.json({
      success: true,
      result,
    });
  } catch (error: any) {
    logger.error('Execute command error', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Upload file
router.post('/upload', async (req: Request, res: Response) => {
  try {
    const { localPath, remotePath } = req.body;

    if (!localPath || !remotePath) {
      return res.status(400).json({ error: 'localPath and remotePath are required' });
    }

    const sshManager = getSSHManager();
    await sshManager.uploadFile(localPath, remotePath);

    res.json({
      success: true,
      message: `File uploaded from ${localPath} to ${remotePath}`,
    });
  } catch (error: any) {
    logger.error('Upload file error', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Download file
router.post('/download', async (req: Request, res: Response) => {
  try {
    const { remotePath, localPath } = req.body;

    if (!remotePath || !localPath) {
      return res.status(400).json({ error: 'remotePath and localPath are required' });
    }

    const sshManager = getSSHManager();
    await sshManager.downloadFile(remotePath, localPath);

    res.json({
      success: true,
      message: `File downloaded from ${remotePath} to ${localPath}`,
    });
  } catch (error: any) {
    logger.error('Download file error', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// List directory
router.post('/list', async (req: Request, res: Response) => {
  try {
    const { remotePath } = req.body;

    if (!remotePath) {
      return res.status(400).json({ error: 'remotePath is required' });
    }

    const sshManager = getSSHManager();
    const files = await sshManager.listDirectory(remotePath);

    res.json({
      success: true,
      files,
    });
  } catch (error: any) {
    logger.error('List directory error', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get system info
router.get('/system-info', async (req: Request, res: Response) => {
  try {
    const sshManager = getSSHManager();
    const info = await sshManager.getSystemInfo();

    res.json({
      success: true,
      info,
    });
  } catch (error: any) {
    logger.error('Get system info error', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// List processes
router.get('/processes', async (req: Request, res: Response) => {
  try {
    const sshManager = getSSHManager();
    const processes = await sshManager.listProcesses();

    res.json({
      success: true,
      processes,
    });
  } catch (error: any) {
    logger.error('List processes error', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
