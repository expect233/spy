import { Player, Avatar } from '@/types/game';
import { createDefaultAvatar } from './avatar';

export interface PlayerSession {
  playerId: string;
  token: string;
  name: string;
  avatar?: Avatar;
  roomCode?: string;
  isHost: boolean;
  createdAt: number;
}

const STORAGE_KEYS = {
  PLAYER_SESSION: 'undercover-player-session',
  PLAYER_NAME: 'undercover-player-name',
  PLAYER_AVATAR: 'undercover-player-avatar',
} as const;

/**
 * 保存玩家會話
 */
export function savePlayerSession(session: PlayerSession): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PLAYER_SESSION, JSON.stringify(session));
    localStorage.setItem(STORAGE_KEYS.PLAYER_NAME, session.name);
    
    if (session.avatar) {
      localStorage.setItem(STORAGE_KEYS.PLAYER_AVATAR, JSON.stringify(session.avatar));
    }
  } catch (error) {
    console.error('Failed to save player session:', error);
  }
}

/**
 * 獲取玩家會話
 */
export function getPlayerSession(): PlayerSession | null {
  try {
    const sessionData = localStorage.getItem(STORAGE_KEYS.PLAYER_SESSION);
    if (!sessionData) return null;
    
    return JSON.parse(sessionData);
  } catch (error) {
    console.error('Failed to get player session:', error);
    return null;
  }
}

/**
 * 清除玩家會話
 */
export function clearPlayerSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.PLAYER_SESSION);
  } catch (error) {
    console.error('Failed to clear player session:', error);
  }
}

/**
 * 更新玩家會話
 */
export function updatePlayerSession(updates: Partial<PlayerSession>): void {
  const currentSession = getPlayerSession();
  if (!currentSession) return;
  
  const updatedSession = { ...currentSession, ...updates };
  savePlayerSession(updatedSession);
}

/**
 * 獲取保存的玩家名稱
 */
export function getSavedPlayerName(): string {
  try {
    return localStorage.getItem(STORAGE_KEYS.PLAYER_NAME) || '';
  } catch (error) {
    console.error('Failed to get saved player name:', error);
    return '';
  }
}

/**
 * 獲取保存的玩家頭像
 */
export function getSavedPlayerAvatar(): Avatar | undefined {
  try {
    const avatarData = localStorage.getItem(STORAGE_KEYS.PLAYER_AVATAR);
    if (!avatarData) return undefined;

    return JSON.parse(avatarData);
  } catch (error) {
    console.error('Failed to get saved player avatar:', error);
    return undefined;
  }
}

/**
 * 保存玩家頭像
 */
export function savePlayerAvatar(avatar: Avatar): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PLAYER_AVATAR, JSON.stringify(avatar));
    
    // 同時更新會話中的頭像
    updatePlayerSession({ avatar });
  } catch (error) {
    console.error('Failed to save player avatar:', error);
  }
}

/**
 * 創建新的玩家會話
 */
export function createPlayerSession(
  playerId: string,
  token: string,
  name: string,
  isHost: boolean,
  roomCode?: string
): PlayerSession {
  // 獲取或創建頭像
  let avatar = getSavedPlayerAvatar();
  if (!avatar) {
    try {
      avatar = createDefaultAvatar(name);
      savePlayerAvatar(avatar);
    } catch (error) {
      console.warn('創建頭像失敗，使用預設頭像:', error);
      avatar = createDefaultAvatar('Player');
    }
  }
  
  const session: PlayerSession = {
    playerId,
    token,
    name,
    avatar,
    roomCode,
    isHost,
    createdAt: Date.now(),
  };
  
  savePlayerSession(session);
  return session;
}

/**
 * 檢查是否有有效的玩家會話
 */
export function hasValidSession(): boolean {
  const session = getPlayerSession();
  return !!(session?.playerId && session?.token);
}

/**
 * 獲取授權標頭
 */
export function getAuthHeaders(): Record<string, string> {
  const session = getPlayerSession();
  if (!session?.token) {
    throw new Error('No valid session found');
  }
  
  return {
    'Authorization': `Bearer ${session.token}`,
    'Content-Type': 'application/json',
  };
}

/**
 * 驗證會話是否屬於指定房間
 */
export function isSessionForRoom(roomCode: string): boolean {
  const session = getPlayerSession();
  return session?.roomCode === roomCode;
}

/**
 * 檢查是否為房主
 */
export function isHost(): boolean {
  const session = getPlayerSession();
  return session?.isHost || false;
}

/**
 * 獲取當前玩家 ID
 */
export function getCurrentPlayerId(): string | null {
  const session = getPlayerSession();
  return session?.playerId || null;
}

/**
 * 獲取當前玩家名稱
 */
export function getCurrentPlayerName(): string | null {
  const session = getPlayerSession();
  return session?.name || null;
}

/**
 * 獲取當前玩家頭像
 */
export function getCurrentPlayerAvatar(): Avatar | null {
  const session = getPlayerSession();
  return session?.avatar || null;
}

/**
 * 更新房間代碼
 */
export function updateRoomCode(roomCode: string): void {
  updatePlayerSession({ roomCode });
}

/**
 * 清除房間代碼
 */
export function clearRoomCode(): void {
  const session = getPlayerSession();
  if (session) {
    const { roomCode, ...sessionWithoutRoom } = session;
    savePlayerSession(sessionWithoutRoom as PlayerSession);
  }
}

/**
 * 生成訪客會話（用於觀戰）
 */
export function createGuestSession(name: string): PlayerSession {
  const guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const avatar = createDefaultAvatar(name);
  
  const session: PlayerSession = {
    playerId: guestId,
    token: '', // 訪客沒有 token
    name,
    avatar,
    isHost: false,
    createdAt: Date.now(),
  };
  
  savePlayerSession(session);
  return session;
}
