import { Room } from '../types/game';

/**
 * 房間儲存介面
 */
export interface IRoomStore {
  get(code: string): Promise<Room | null>;
  set(code: string, room: Room): Promise<void>;
  update(code: string, updates: Partial<Room>): Promise<void>;
  delete(code: string): Promise<void>;
  exists(code: string): Promise<boolean>;
  listActive(): Promise<string[]>;
  cleanup(): Promise<void>;
}

/**
 * 記憶體儲存實作
 */
export class InMemoryStore implements IRoomStore {
  private rooms: Map<string, Room> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // 每 10 分鐘清理一次過期房間
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 10 * 60 * 1000);
  }

  async get(code: string): Promise<Room | null> {
    const room = this.rooms.get(code);
    if (!room) return null;

    // 檢查房間是否過期（24小時）
    const now = Date.now();
    const roomAge = now - room.createdAt;
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    if (roomAge > maxAge) {
      this.rooms.delete(code);
      return null;
    }

    return { ...room };
  }

  async set(code: string, room: Room): Promise<void> {
    this.rooms.set(code, { ...room });
  }

  async update(code: string, updates: Partial<Room>): Promise<void> {
    const existingRoom = this.rooms.get(code);
    if (!existingRoom) {
      throw new Error(`Room ${code} not found`);
    }

    const updatedRoom: Room = {
      ...existingRoom,
      ...updates,
      updatedAt: Date.now(),
    };

    this.rooms.set(code, updatedRoom);
  }

  async delete(code: string): Promise<void> {
    this.rooms.delete(code);
  }

  async exists(code: string): Promise<boolean> {
    return this.rooms.has(code);
  }

  async listActive(): Promise<string[]> {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    const activeCodes: string[] = [];

    for (const [code, room] of this.rooms.entries()) {
      const roomAge = now - room.createdAt;
      if (roomAge <= maxAge) {
        activeCodes.push(code);
      }
    }

    return activeCodes;
  }

  async cleanup(): Promise<void> {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    const expiredCodes: string[] = [];

    for (const [code, room] of this.rooms.entries()) {
      const roomAge = now - room.createdAt;
      if (roomAge > maxAge) {
        expiredCodes.push(code);
      }
    }

    for (const code of expiredCodes) {
      this.rooms.delete(code);
    }

    if (expiredCodes.length > 0) {
      console.log(`Cleaned up ${expiredCodes.length} expired rooms`);
    }
  }

  // 清理資源
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.rooms.clear();
  }

  // 獲取統計資訊
  getStats(): { totalRooms: number; activeRooms: number } {
    return {
      totalRooms: this.rooms.size,
      activeRooms: this.rooms.size, // 在記憶體中的都是活躍的
    };
  }

}

/**
 * Redis 儲存實作
 */
export class RedisStore implements IRoomStore {
  private redis: Record<string, unknown>; // ioredis instance
  private keyPrefix = 'undercover:room:';
  private defaultTTL = 24 * 60 * 60; // 24 hours in seconds

  constructor(redisInstance: Record<string, unknown>) {
    this.redis = redisInstance;
  }

  private getKey(code: string): string {
    return `${this.keyPrefix}${code}`;
  }

  async get(code: string): Promise<Room | null> {
    try {
      const data = await this.redis.get(this.getKey(code));
      if (!data) return null;

      return JSON.parse(data);
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async set(code: string, room: Room): Promise<void> {
    try {
      const key = this.getKey(code);
      const data = JSON.stringify(room);
      await this.redis.setex(key, this.defaultTTL, data);
    } catch (error) {
      console.error('Redis set error:', error);
      throw error;
    }
  }

  async update(code: string, updates: Partial<Room>): Promise<void> {
    try {
      const existingRoom = await this.get(code);
      if (!existingRoom) {
        throw new Error(`Room ${code} not found`);
      }

      const updatedRoom: Room = {
        ...existingRoom,
        ...updates,
        updatedAt: Date.now(),
      };

      await this.set(code, updatedRoom);
    } catch (error) {
      console.error('Redis update error:', error);
      throw error;
    }
  }

  async delete(code: string): Promise<void> {
    try {
      await this.redis.del(this.getKey(code));
    } catch (error) {
      console.error('Redis delete error:', error);
      throw error;
    }
  }

  async exists(code: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(this.getKey(code));
      return result === 1;
    } catch (error) {
      console.error('Redis exists error:', error);
      return false;
    }
  }

  async listActive(): Promise<string[]> {
    try {
      const pattern = `${this.keyPrefix}*`;
      const keys = await this.redis.keys(pattern);

      return keys.map((key: string) =>
        key.replace(this.keyPrefix, '')
      );
    } catch (error) {
      console.error('Redis listActive error:', error);
      return [];
    }
  }

  async cleanup(): Promise<void> {
    // Redis 會自動處理 TTL 過期，不需要手動清理
    console.log('Redis cleanup: TTL-based expiration is automatic');
  }
}

/**
 * 儲存工廠
 */
export class StoreFactory {
  private static instance: IRoomStore | null = null;

  static create(): IRoomStore {
    if (this.instance) {
      return this.instance;
    }

    const useRedis = process.env.USE_REDIS === 'true';

    if (useRedis) {
      try {
        // 使用 require 進行同步導入
        const Redis = require('ioredis');
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        const redis = new Redis(redisUrl);

        console.log('Using Redis store');
        this.instance = new RedisStore(redis);
      } catch (error) {
        console.error('Failed to initialize Redis store, falling back to memory store:', error);
        this.instance = new InMemoryStore();
      }
    } else {
      console.log('Using in-memory store');
      this.instance = new InMemoryStore();
    }

    return this.instance;
  }

  static getInstance(): IRoomStore {
    if (!this.instance) {
      return this.create();
    }
    return this.instance;
  }

  static reset(): void {
    if (this.instance && this.instance instanceof InMemoryStore) {
      this.instance.destroy();
    }
    this.instance = null;
  }
}

// 預設匯出
export const roomStore = StoreFactory.create();
