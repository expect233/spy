import { SSEEvent } from '../types/api';

// SSE 連線管理
export interface SSEConnection {
  playerId: string;
  roomCode: string;
  controller: ReadableStreamDefaultController;
  lastPing: number;
}

// SSE 事件管理器
class SSEEventManager {
  private connections: Map<string, SSEConnection> = new Map();
  private pingInterval: NodeJS.Timeout | null = null;

  constructor() {
    // 每 30 秒發送心跳包
    this.pingInterval = setInterval(() => {
      this.sendPingToAll();
    }, 30000);

    // 清理過期連線
    setInterval(() => {
      this.cleanupStaleConnections();
    }, 60000);
  }

  /**
   * 建立新的 SSE 連線
   */
  createConnection(playerId: string, roomCode: string): ReadableStream {
    const connectionId = `${roomCode}:${playerId}`;

    return new ReadableStream({
      start: (controller) => {
        // 儲存連線
        this.connections.set(connectionId, {
          playerId,
          roomCode,
          controller,
          lastPing: Date.now()
        });

        // 發送初始連線確認
        this.sendToConnection(connectionId, {
          type: 'room.sync',
          data: { message: '連線已建立' },
          timestamp: Date.now()
        });

        console.log(`SSE 連線建立: ${connectionId}`);
      },
      cancel: () => {
        // 清理連線
        this.connections.delete(connectionId);
        console.log(`SSE 連線關閉: ${connectionId}`);
      }
    });
  }

  /**
   * 發送事件到特定連線
   */
  sendToConnection(connectionId: string, event: SSEEvent): boolean {
    const connection = this.connections.get(connectionId);
    if (!connection) return false;

    try {
      const data = `data: ${JSON.stringify(event)}\n\n`;
      connection.controller.enqueue(new TextEncoder().encode(data));
      connection.lastPing = Date.now();
      return true;
    } catch (error) {
      console.error(`發送 SSE 事件失敗 (${connectionId}):`, error);
      this.connections.delete(connectionId);
      return false;
    }
  }

  /**
   * 發送事件到房間內所有玩家
   */
  broadcastToRoom(roomCode: string, event: SSEEvent, excludePlayerId?: string): number {
    let sentCount = 0;
    
    for (const [connectionId, connection] of this.connections.entries()) {
      if (connection.roomCode === roomCode) {
        // 如果指定排除某個玩家
        if (excludePlayerId && connection.playerId === excludePlayerId) {
          continue;
        }
        
        if (this.sendToConnection(connectionId, event)) {
          sentCount++;
        }
      }
    }
    
    return sentCount;
  }

  /**
   * 發送私訊事件到特定玩家
   */
  sendToPlayer(roomCode: string, playerId: string, event: SSEEvent): boolean {
    const connectionId = `${roomCode}:${playerId}`;
    return this.sendToConnection(connectionId, event);
  }

  /**
   * 發送心跳包到所有連線
   */
  private sendPingToAll(): void {
    const pingEvent: SSEEvent = {
      type: 'room.sync',
      data: { ping: Date.now() },
      timestamp: Date.now()
    };

    for (const connectionId of this.connections.keys()) {
      this.sendToConnection(connectionId, pingEvent);
    }
  }

  /**
   * 清理過期連線
   */
  private cleanupStaleConnections(): void {
    const now = Date.now();
    const staleThreshold = 2 * 60 * 1000; // 2 分鐘

    for (const [connectionId, connection] of this.connections.entries()) {
      if (now - connection.lastPing > staleThreshold) {
        console.log(`清理過期 SSE 連線: ${connectionId}`);
        try {
          connection.controller.close();
        } catch (error) {
          // 忽略關閉錯誤
        }
        this.connections.delete(connectionId);
      }
    }
  }

  /**
   * 獲取房間內的連線數量
   */
  getRoomConnectionCount(roomCode: string): number {
    let count = 0;
    for (const connection of this.connections.values()) {
      if (connection.roomCode === roomCode) {
        count++;
      }
    }
    return count;
  }

  /**
   * 獲取特定玩家是否在線
   */
  isPlayerOnline(roomCode: string, playerId: string): boolean {
    const connectionId = `${roomCode}:${playerId}`;
    return this.connections.has(connectionId);
  }

  /**
   * 關閉房間內所有連線
   */
  closeRoomConnections(roomCode: string): void {
    for (const [connectionId, connection] of this.connections.entries()) {
      if (connection.roomCode === roomCode) {
        try {
          connection.controller.close();
        } catch (error) {
          // 忽略關閉錯誤
        }
        this.connections.delete(connectionId);
      }
    }
  }

  /**
   * 清理所有連線（用於應用程式關閉）
   */
  cleanup(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    for (const [, connection] of this.connections.entries()) {
      try {
        connection.controller.close();
      } catch (error) {
        // 忽略關閉錯誤
      }
    }
    
    this.connections.clear();
  }
}

// 單例實例
export const sseManager = new SSEEventManager();

// 便利函式：建立 SSE 回應
export function createSSEResponse(stream: ReadableStream): Response {
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}

// 便利函式：發送房間同步事件
export function broadcastRoomSync(roomCode: string, roomData: unknown): void {
  sseManager.broadcastToRoom(roomCode, {
    type: 'room.sync',
    data: roomData,
    timestamp: Date.now()
  });
}

// 便利函式：發送房間更新事件
export function broadcastRoomUpdate(roomCode: string, updateData: unknown): void {
  sseManager.broadcastToRoom(roomCode, {
    type: 'room.updated',
    data: updateData,
    timestamp: Date.now()
  });
}

// 便利函式：發送遊戲開始事件
export function broadcastGameStarted(roomCode: string, gameData: unknown): void {
  sseManager.broadcastToRoom(roomCode, {
    type: 'game.started',
    data: gameData,
    timestamp: Date.now()
  });
}

// 便利函式：發送私訊角色資訊
export function sendRolePrivate(roomCode: string, playerId: string, roleData: unknown): void {
  sseManager.sendToPlayer(roomCode, playerId, {
    type: 'role.private',
    data: roleData,
    timestamp: Date.now()
  });
}

// 便利函式：發送發言事件
export function broadcastSpeakSubmitted(roomCode: string, speakData: unknown): void {
  sseManager.broadcastToRoom(roomCode, {
    type: 'speak.submitted',
    data: speakData,
    timestamp: Date.now()
  });
}

// 便利函式：發送投票開始事件
export function broadcastVoteOpen(roomCode: string): void {
  sseManager.broadcastToRoom(roomCode, {
    type: 'vote.open',
    data: {},
    timestamp: Date.now()
  });
}

// 便利函式：發送投票結果事件
export function broadcastVoteResult(roomCode: string, resultData: unknown): void {
  sseManager.broadcastToRoom(roomCode, {
    type: 'vote.result',
    data: resultData,
    timestamp: Date.now()
  });
}

// 便利函式：發送錯誤事件
export function sendError(roomCode: string, playerId: string, errorMessage: string): void {
  sseManager.sendToPlayer(roomCode, playerId, {
    type: 'error',
    data: { message: errorMessage },
    timestamp: Date.now()
  });
}

// 程序退出時清理
process.on('SIGINT', () => {
  console.log('正在清理 SSE 連線...');
  sseManager.cleanup();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('正在清理 SSE 連線...');
  sseManager.cleanup();
  process.exit(0);
});
