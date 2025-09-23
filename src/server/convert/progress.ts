import type { Response } from 'express';
import type { JobStatus } from './types';

export interface ProgressUpdate {
  jobId: string;
  progress: number; // 0-100
  status: JobStatus;
  message?: string;
  fileName?: string;
}

// 存储SSE连接
const sseConnections = new Map<string, Response[]>();

/**
 * 添加SSE连接
 */
export function addSSEConnection(jobId: string, res: Response): void {
  if (!sseConnections.has(jobId)) {
    sseConnections.set(jobId, []);
  }

  const connections = sseConnections.get(jobId)!;
  connections.push(res);

  // 设置SSE头
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // 发送连接建立消息
  sendSSEMessage(res, {
    type: 'connected',
    data: { jobId, message: 'SSE connection established' }
  });

  // 清理断开的连接
  res.on('close', () => {
    removeSSEConnection(jobId, res);
  });
}

/**
 * 移除SSE连接
 */
export function removeSSEConnection(jobId: string, res: Response): void {
  const connections = sseConnections.get(jobId);
  if (!connections) return;

  const index = connections.indexOf(res);
  if (index !== -1) {
    connections.splice(index, 1);
  }

  // 如果没有连接了，删除该job的记录
  if (connections.length === 0) {
    sseConnections.delete(jobId);
  }
}

/**
 * 发送SSE消息
 */
function sendSSEMessage(
  res: Response,
  message: { type: string; data: any }
): void {
  try {
    const data = JSON.stringify(message);
    res.write(`event: ${message.type}\n`);
    res.write(`data: ${data}\n\n`);
  } catch (error) {
    console.error('Error sending SSE message:', error);
  }
}

/**
 * 广播进度更新到所有相关的SSE连接
 */
export function broadcastProgress(update: ProgressUpdate): void {
  const connections = sseConnections.get(update.jobId);
  if (!connections || connections.length === 0) return;

  const message = {
    type: 'progress',
    data: update
  };

  // 向所有连接发送进度更新
  connections.forEach((res) => {
    sendSSEMessage(res, message);
  });

  // 如果任务完成或出错，关闭连接
  if (update.status === 'done' || update.status === 'error') {
    setTimeout(() => {
      connections.forEach((res) => {
        try {
          res.end();
        } catch (error) {
          console.error('Error closing SSE connection:', error);
        }
      });
      sseConnections.delete(update.jobId);
    }, 1000); // 延迟1秒关闭，确保客户端收到最终状态
  }
}

/**
 * 发送进度更新的便捷函数
 */
export function updateProgress(
  jobId: string,
  progress: number,
  status: JobStatus,
  message?: string,
  fileName?: string
): void {
  broadcastProgress({
    jobId,
    progress,
    status,
    message,
    fileName
  });
}

/**
 * 清理所有SSE连接
 */
export function cleanupAllSSEConnections(): void {
  sseConnections.forEach((connections) => {
    connections.forEach((res) => {
      try {
        res.end();
      } catch (error) {
        console.error('Error closing SSE connection during cleanup:', error);
      }
    });
  });
  sseConnections.clear();
}

/**
 * 获取当前连接数（用于调试）
 */
export function getConnectionCount(): number {
  let total = 0;
  sseConnections.forEach((connections) => {
    total += connections.length;
  });
  return total;
}
