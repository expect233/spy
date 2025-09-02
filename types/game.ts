// 遊戲角色類型
export type Role = 'civilian' | 'undercover' | 'blank';

// 遊戲狀態
export type GameState = 'lobby' | 'speaking' | 'voting' | 'reveal' | 'ended';

// 語言設定
export type Language = 'zh-TW' | 'en';

// 頭像介面
export interface Avatar {
  type: 'generated' | 'preset' | 'upload';
  url?: string;
  style?: string;
}

// 玩家介面
export interface Player {
  id: string;
  name: string;
  avatar?: Avatar;
  isReady: boolean;
  isHost: boolean;
  connected: boolean;
  role?: Role;
  joinedAt: number;
  createdAt: number;
}

// 觀戰者介面
export interface Spectator {
  id: string;
  name: string;
  joinedAt: number;
}

// 房間配置
export interface RoomConfig {
  undercoverCount: number;
  blankCount: number;
  maxPlayers: number;
  lang: Language;
  timers: {
    lobby: number;    // 準備階段倒數時間（秒）
    speak: number;    // 發言時間限制（秒）
    vote: number;     // 投票時間限制（秒）
  };
  isPrivate: boolean;
  allowSpectators: boolean;
}

// 題目介面
export interface Topic {
  civilian: string;
  undercover: string;
  blank?: string;
}

// 角色分配
export interface Assignment {
  playerId: string;
  role: Role;
  word: string;
}

// 發言記錄
export interface Speak {
  playerId: string;
  round: number;
  text: string;
  at: number;
}

// 投票記錄
export interface Vote {
  voterId: string;
  round: number;
  targetId?: string; // undefined 代表棄權
  at: number;
}

// 遊戲回合
export interface Round {
  index: number;
  speaks: Speak[];
  votes: Vote[];
  eliminatedId?: string;
  startTime: number;
  endTime?: number;
}

// 計時器狀態
export interface TimerState {
  state: GameState;
  remainMs: number;
  totalMs: number;
  isActive: boolean;
}

// 房間介面
export interface Room {
  code: string;
  hostId: string;
  players: Player[];
  spectators: Spectator[];
  config: RoomConfig;
  state: GameState;
  topic?: Topic;
  assignments?: Assignment[];
  rounds: Round[];
  currentRound: number;
  winner?: 'civilian' | 'undercover';
  createdAt: number;
  updatedAt: number;
  timer?: TimerState;
}

// 投票結果
export interface VoteResult {
  round: number;
  votes: Vote[];
  tally: Record<string, number>;
  topCandidates: string[];
  eliminatedId?: string;
  isTie: boolean;
}

// 遊戲結果
export interface GameResult {
  winner: 'civilian' | 'undercover';
  eliminatedHistory: Array<{
    round: number;
    playerId: string;
    role: Role;
    word: string;
  }>;
  finalAssignments: Assignment[];
  totalRounds: number;
  duration: number; // 遊戲總時長（毫秒）
}

// 聊天訊息
export interface Message {
  id: string;
  playerId: string;
  name: string;
  avatar?: Avatar;
  text: string;
  at: number;
}

// API 相關類型
export interface CreateRoomResponse {
  code: string;
  hostToken: string;
}

export interface JoinRoomResponse {
  playerId: string;
  token: string;
}

export interface GameEvent {
  type: 'room.sync' | 'timer.tick' | 'speak.submitted' | 'vote.open' | 'vote.result' | 'game.ended' | 'chat.message';
  data: any;
  timestamp: number;
}

// 錯誤類型
export class GameError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'GameError';
  }
}

// 常數
export const DEFAULT_CONFIG: RoomConfig = {
  undercoverCount: 1,
  blankCount: 0,
  maxPlayers: 8,
  lang: 'zh-TW',
  timers: {
    lobby: 30,
    speak: 60,
    vote: 30,
  },
  isPrivate: false,
  allowSpectators: true,
};

export const TOPICS: Topic[] = [
  { civilian: '蘋果', undercover: '橘子' },
  { civilian: '咖啡', undercover: '茶' },
  { civilian: '貓', undercover: '狗' },
  { civilian: '電影院', undercover: '劇院' },
  { civilian: '醫生', undercover: '護士' },
  { civilian: '手機', undercover: '電話' },
  { civilian: '汽車', undercover: '機車' },
  { civilian: '老師', undercover: '教授' },
];

export const MAX_PLAYERS = 8;
export const MIN_PLAYERS = 3;
export const MAX_MESSAGE_LENGTH = 200;
export const MAX_SPEAK_LENGTH = 120;
export const CHAT_RATE_LIMIT = 5000; // 5 seconds
export const MAX_AVATAR_SIZE = 512 * 1024; // 512KB

// 頭像樣式選項
export const AVATAR_STYLES = [
  'adventurer',
  'avataaars',
  'big-ears',
  'big-smile',
  'croodles',
  'fun-emoji',
  'icons',
  'identicon',
  'initials',
  'lorelei',
  'micah',
  'miniavs',
  'open-peeps',
  'personas',
  'pixel-art',
] as const;

export type AvatarStyle = typeof AVATAR_STYLES[number];
