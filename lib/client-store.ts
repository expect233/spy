// 客戶端存儲實現，使用 localStorage 和 WebSocket 模擬
import { Room, Player, Assignment, Vote } from '../types/game';
import { nanoid } from 'nanoid';

export class ClientStore {
  private static instance: ClientStore | null = null;
  private rooms: Map<string, Room> = new Map();
  private listeners: Map<string, Set<(room: Room) => void>> = new Map();

  static getInstance(): ClientStore {
    if (!this.instance) {
      this.instance = new ClientStore();
    }
    return this.instance;
  }

  // 創建房間
  async createRoom(hostName: string): Promise<{ code: string; room: Room }> {
    const code = nanoid(6).toUpperCase();
    const hostId = nanoid();
    
    const room: Room = {
      code,
      hostId,
      players: [{
        id: hostId,
        name: hostName,
        isHost: true,
        isReady: false
      }],
      state: 'waiting',
      settings: {
        maxPlayers: 8,
        timeLimit: 300,
        topics: ['動物', '食物', '電影']
      },
      assignments: [],
      rounds: [],
      createdAt: Date.now()
    };

    this.rooms.set(code, room);
    this.saveToStorage();
    return { code, room };
  }

  // 加入房間
  async joinRoom(code: string, playerName: string): Promise<{ playerId: string; room: Room }> {
    const room = this.rooms.get(code);
    if (!room) {
      throw new Error('房間不存在');
    }

    if (room.state !== 'waiting') {
      throw new Error('遊戲已開始');
    }

    if (room.players.length >= room.settings.maxPlayers) {
      throw new Error('房間已滿');
    }

    const playerId = nanoid();
    const player: Player = {
      id: playerId,
      name: playerName,
      isHost: false,
      isReady: false
    };

    room.players.push(player);
    this.rooms.set(code, room);
    this.saveToStorage();
    this.notifyListeners(code, room);

    return { playerId, room };
  }

  // 獲取房間
  async getRoom(code: string): Promise<Room | null> {
    return this.rooms.get(code) || null;
  }

  // 更新房間
  async updateRoom(code: string, updates: Partial<Room>): Promise<void> {
    const room = this.rooms.get(code);
    if (!room) {
      throw new Error('房間不存在');
    }

    Object.assign(room, updates);
    this.rooms.set(code, room);
    this.saveToStorage();
    this.notifyListeners(code, room);
  }

  // 開始遊戲
  async startGame(code: string): Promise<Assignment[]> {
    const room = this.rooms.get(code);
    if (!room) {
      throw new Error('房間不存在');
    }

    // 分配角色
    const assignments: Assignment[] = [];
    const playerIds = room.players.map(p => p.id);
    const undercoverCount = Math.max(1, Math.floor(playerIds.length / 4));
    
    // 隨機選擇臥底
    const shuffled = [...playerIds].sort(() => Math.random() - 0.5);
    const undercoverIds = shuffled.slice(0, undercoverCount);
    
    // 選擇主題
    const topics = ['蘋果', '橘子']; // 簡化的主題
    const civilianWord = topics[0];
    const undercoverWord = topics[1];

    playerIds.forEach(playerId => {
      const isUndercover = undercoverIds.includes(playerId);
      assignments.push({
        playerId,
        role: isUndercover ? 'undercover' : 'civilian',
        word: isUndercover ? undercoverWord : civilianWord
      });
    });

    // 更新房間狀態
    await this.updateRoom(code, {
      state: 'playing',
      assignments,
      rounds: [{
        roundNumber: 1,
        votes: [],
        eliminatedPlayerId: null
      }]
    });

    return assignments;
  }

  // 投票
  async vote(code: string, voterId: string, targetId: string): Promise<void> {
    const room = this.rooms.get(code);
    if (!room) {
      throw new Error('房間不存在');
    }

    const currentRound = room.rounds[room.rounds.length - 1];
    if (!currentRound) {
      throw new Error('沒有進行中的回合');
    }

    // 移除之前的投票
    currentRound.votes = currentRound.votes.filter(v => v.voterId !== voterId);
    
    // 添加新投票
    currentRound.votes.push({
      voterId,
      targetId,
      timestamp: Date.now()
    });

    this.rooms.set(code, room);
    this.saveToStorage();
    this.notifyListeners(code, room);
  }

  // 監聽房間變化
  subscribe(code: string, callback: (room: Room) => void): () => void {
    if (!this.listeners.has(code)) {
      this.listeners.set(code, new Set());
    }
    this.listeners.get(code)!.add(callback);

    return () => {
      const listeners = this.listeners.get(code);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.listeners.delete(code);
        }
      }
    };
  }

  private notifyListeners(code: string, room: Room): void {
    const listeners = this.listeners.get(code);
    if (listeners) {
      listeners.forEach(callback => callback(room));
    }
  }

  private saveToStorage(): void {
    try {
      const data = Array.from(this.rooms.entries());
      localStorage.setItem('undercover-rooms', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem('undercover-rooms');
      if (data) {
        const entries = JSON.parse(data);
        this.rooms = new Map(entries);
      }
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
    }
  }

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadFromStorage();
    }
  }
}

export const clientStore = ClientStore.getInstance();
