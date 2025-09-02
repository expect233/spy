import { SSEEvent, SSEEventType } from '../types/api';

/**
 * 即時通訊適配器介面
 */
export interface IRealTimeAdapter {
  broadcast(roomCode: string, event: SSEEvent): Promise<void>;
  send(connectionId: string, event: SSEEvent): Promise<void>;
  addConnection(connectionId: string, roomCode: string, playerId?: string): Promise<void>;
  removeConnection(connectionId: string): Promise<void>;
  getConnections(roomCode: string): Promise<string[]>;
  cleanup(): Promise<void>;
}

/**
 * SSE 連線管理
 */
interface SSEConnection {
  id: string;
  roomCode: string;
  playerId?: string;
  spectatorId?: string;
  response: Response;
  controller: ReadableStreamDefaultController;
  lastPing: number;
}

/**
 * SSE 實作的即時通訊適配器
 */
export class SSEAdapter implements IRealTimeAdapter {
  private connections: Map<string, SSEConnection> = new Map();
  private roomConnections: Map<string, Set<string>> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor() {
    // 每 30 秒發送心跳
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, 30 * 1000);

    // 每 5 分鐘清理斷線連接
    setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  async broadcast(roomCode: string, event: SSEEvent): Promise<void> {
    const connectionIds = this.roomConnections.get(roomCode);
    if (!connectionIds) return;

    const promises: Promise<void>[] = [];
    for (const connectionId of connectionIds) {
      promises.push(this.send(connectionId, event));
    }

    await Promise.allSettled(promises);
  }

  async send(connectionId: string, event: SSEEvent): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    try {
      const data = JSON.stringify(event);
      const message = `data: ${data}\n\n`;
      
      connection.controller.enqueue(new TextEncoder().encode(message));
    } catch (error) {
      console.error(`Failed to send message to connection ${connectionId}:`, error);
      await this.removeConnection(connectionId);
    }
  }

  async addConnection(
    connectionId: string, 
    roomCode: string, 
    playerId?: string,
    spectatorId?: string
  ): Promise<void> {
    // 如果連接已存在，先移除
    if (this.connections.has(connectionId)) {
      await this.removeConnection(connectionId);
    }

    // 創建 SSE 流
    const stream = new ReadableStream({
      start: (controller) => {
        const connection: SSEConnection = {
          id: connectionId,
          roomCode,
          playerId,
          spectatorId,
          response: new Response(stream, {
            headers: {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Headers': 'Cache-Control',
            },
          }),
          controller,
          lastPing: Date.now(),
        };

        this.connections.set(connectionId, connection);

        // 添加到房間連接列表
        if (!this.roomConnections.has(roomCode)) {
          this.roomConnections.set(roomCode, new Set());
        }
        this.roomConnections.get(roomCode)!.add(connectionId);

        // 發送初始連接確認
        this.send(connectionId, {
          type: 'keepalive',
          timestamp: Date.now(),
        });
      },
      cancel: () => {
        this.removeConnection(connectionId);
      },
    });
  }

  async removeConnection(connectionId: string): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    try {
      connection.controller.close();
    } catch (error) {
      // 忽略關閉錯誤
    }

    // 從房間連接列表中移除
    const roomConnections = this.roomConnections.get(connection.roomCode);
    if (roomConnections) {
      roomConnections.delete(connectionId);
      if (roomConnections.size === 0) {
        this.roomConnections.delete(connection.roomCode);
      }
    }

    this.connections.delete(connectionId);
  }

  async getConnections(roomCode: string): Promise<string[]> {
    const connectionIds = this.roomConnections.get(roomCode);
    return connectionIds ? Array.from(connectionIds) : [];
  }

  async cleanup(): Promise<void> {
    const now = Date.now();
    const maxAge = 10 * 60 * 1000; // 10 minutes
    const expiredConnections: string[] = [];

    for (const [connectionId, connection] of this.connections.entries()) {
      if (now - connection.lastPing > maxAge) {
        expiredConnections.push(connectionId);
      }
    }

    for (const connectionId of expiredConnections) {
      await this.removeConnection(connectionId);
    }

    if (expiredConnections.length > 0) {
      console.log(`Cleaned up ${expiredConnections.length} expired SSE connections`);
    }
  }

  private async sendHeartbeat(): Promise<void> {
    const heartbeatEvent: SSEEvent = {
      type: 'keepalive',
      timestamp: Date.now(),
    };

    const promises: Promise<void>[] = [];
    for (const connectionId of this.connections.keys()) {
      promises.push(this.send(connectionId, heartbeatEvent));
    }

    await Promise.allSettled(promises);
  }

  // 獲取統計資訊
  getStats(): {
    totalConnections: number;
    roomCount: number;
    connectionsByRoom: Record<string, number>;
  } {
    const connectionsByRoom: Record<string, number> = {};
    
    for (const [roomCode, connections] of this.roomConnections.entries()) {
      connectionsByRoom[roomCode] = connections.size;
    }

    return {
      totalConnections: this.connections.size,
      roomCount: this.roomConnections.size,
      connectionsByRoom,
    };
  }

  // 創建 SSE 回應
  createSSEResponse(connectionId: string): Response {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      throw new Error(`Connection ${connectionId} not found`);
    }
    return connection.response;
  }

  // 清理資源
  destroy(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // 關閉所有連接
    for (const connectionId of this.connections.keys()) {
      this.removeConnection(connectionId);
    }
  }
}

/**
 * 即時通訊工廠
 */
export class RealTimeFactory {
  private static instance: IRealTimeAdapter | null = null;

  static create(): IRealTimeAdapter {
    if (this.instance) {
      return this.instance;
    }

    // 目前只支援 SSE，未來可以添加 WebSocket 支援
    console.log('Using SSE real-time adapter');
    this.instance = new SSEAdapter();

    return this.instance;
  }

  static getInstance(): IRealTimeAdapter {
    if (!this.instance) {
      return this.create();
    }
    return this.instance;
  }

  static reset(): void {
    if (this.instance && this.instance instanceof SSEAdapter) {
      this.instance.destroy();
    }
    this.instance = null;
  }
}

// 預設匯出
export const realTimeAdapter = RealTimeFactory.create();

/**
 * 事件建構器輔助函數
 */
export function createSSEEvent<T = Record<string, unknown>>(
  type: SSEEventType,
  data?: T
): SSEEvent<T> {
  return {
    type,
    data,
    timestamp: Date.now(),
  };
}

/**
 * 房間同步事件
 */
export function createRoomSyncEvent(room: unknown): SSEEvent {
  return createSSEEvent('room.sync', { room });
}

/**
 * 計時器事件
 */
export function createTimerTickEvent(timerState: unknown): SSEEvent {
  return createSSEEvent('timer.tick', timerState);
}

/**
 * 錯誤事件
 */
export function createErrorEvent(message: string): SSEEvent {
  return createSSEEvent('error', { message });
}
