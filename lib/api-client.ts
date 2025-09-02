import { 
  Room, 
  CreateRoomResponse, 
  JoinRoomResponse, 
  GameError,
  RoomConfig 
} from '@/types/game';
import { getAuthHeaders, getPlayerSession } from './auth';

const API_BASE = process.env.NODE_ENV === 'development'
  ? '/api'  // Use Next.js API routes in development
  : 'https://us-central1-black-test-b5e1a.cloudfunctions.net/api';

class ApiClient {
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new GameError(
          errorData.error || `HTTP ${response.status}`,
          'API_ERROR',
          response.status
        );
      }
      
      return await response.json();
    } catch (error) {
      if (error instanceof GameError) {
        throw error;
      }
      
      console.error('API request failed:', error);
      throw new GameError(
        'Network error occurred',
        'NETWORK_ERROR',
        500
      );
    }
  }
  
  private async authenticatedRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const authHeaders = getAuthHeaders();
      return await this.request<T>(endpoint, {
        ...options,
        headers: {
          ...authHeaders,
          ...options.headers,
        },
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'No valid session found') {
        throw new GameError('Authentication required', 'AUTH_REQUIRED', 401);
      }
      throw error;
    }
  }
  
  // 房間管理
  async createRoom(hostName: string): Promise<CreateRoomResponse> {
    return this.request<CreateRoomResponse>('/rooms', {
      method: 'POST',
      body: JSON.stringify({ hostName }),
    });
  }
  
  async joinRoom(code: string, name: string): Promise<JoinRoomResponse> {
    return this.request<JoinRoomResponse>(`/rooms/${code}/join`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }
  
  async getRoom(code: string): Promise<Room> {
    return this.request<Room>(`/rooms/${code}`);
  }
  
  // 遊戲控制（需要認證）
  async updateConfig(code: string, config: Partial<RoomConfig>): Promise<void> {
    await this.authenticatedRequest(`/rooms/${code}/config`, {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }
  
  async startGame(code: string): Promise<void> {
    await this.authenticatedRequest(`/rooms/${code}/start`, {
      method: 'POST',
    });
  }
  
  async speak(code: string, text: string): Promise<void> {
    await this.authenticatedRequest(`/rooms/${code}/speak`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  }
  
  async vote(code: string, targetId?: string): Promise<void> {
    await this.authenticatedRequest(`/rooms/${code}/vote`, {
      method: 'POST',
      body: JSON.stringify({ targetId }),
    });
  }
  
  async tiebreak(code: string, targetId: string): Promise<void> {
    await this.authenticatedRequest(`/rooms/${code}/tiebreak`, {
      method: 'POST',
      body: JSON.stringify({ targetId }),
    });
  }
  
  async kickPlayer(code: string, targetId: string): Promise<void> {
    await this.authenticatedRequest(`/rooms/${code}/kick`, {
      method: 'POST',
      body: JSON.stringify({ targetId }),
    });
  }
  
  async transferHost(code: string, toPlayerId: string): Promise<void> {
    await this.authenticatedRequest(`/rooms/${code}/transfer-host`, {
      method: 'POST',
      body: JSON.stringify({ toPlayerId }),
    });
  }
  
  // 聊天
  async sendChatMessage(code: string, text: string): Promise<void> {
    await this.authenticatedRequest(`/rooms/${code}/chat`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  }
  
  async getChatMessages(code: string, limit: number = 100): Promise<any[]> {
    return this.request<any[]>(`/rooms/${code}/messages?limit=${limit}`);
  }
  
  // 頭像上傳
  async uploadAvatar(file: File): Promise<{ url: string }> {
    const session = getPlayerSession();
    if (!session) {
      throw new GameError('Authentication required', 'AUTH_REQUIRED', 401);
    }
    
    const formData = new FormData();
    formData.append('avatar', file);
    formData.append('playerId', session.playerId);
    
    return this.authenticatedRequest<{ url: string }>('/upload-avatar', {
      method: 'POST',
      body: formData,
      headers: {}, // 讓瀏覽器設置 Content-Type
    });
  }
}

export const apiClient = new ApiClient();

// SSE 事件監聽
export class EventSource {
  private eventSource: globalThis.EventSource | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  
  connect(roomCode: string): void {
    if (this.eventSource) {
      this.disconnect();
    }
    
    const session = getPlayerSession();
    if (!session?.token) {
      throw new GameError('Authentication required', 'AUTH_REQUIRED', 401);
    }
    
    const url = `${API_BASE}/rooms/${roomCode}/events?token=${encodeURIComponent(session.token)}`;
    this.eventSource = new globalThis.EventSource(url);
    
    this.eventSource.onopen = () => {
      console.log('SSE connected');
    };
    
    this.eventSource.onerror = (error) => {
      console.error('SSE error:', error);
    };
    
    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.emit(data.type, data.data);
      } catch (error) {
        console.error('Failed to parse SSE message:', error);
      }
    };
  }
  
  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
  
  on(eventType: string, callback: (data: any) => void): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);
  }
  
  off(eventType: string, callback: (data: any) => void): void {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.delete(callback);
    }
  }
  
  private emit(eventType: string, data: any): void {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }
}

export const eventSource = new EventSource();
