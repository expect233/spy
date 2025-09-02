import { z } from 'zod';
import { Room, Player, Spectator, RoomConfig, Language } from './game';

// 通用 API 回應格式
export interface ApiResponse<T = any> {
  ok: boolean;
  data?: T;
  error?: string;
}

// Token 類型
export interface TokenPayload {
  roomCode: string;
  playerId?: string;
  spectatorId?: string;
  isHost?: boolean;
  type: 'player' | 'spectator' | 'host';
  iat: number;
  exp: number;
}

// 建立房間回應
export interface CreateRoomResponse {
  code: string;
  hostToken: string;
  hostId: string;
}

// 加入房間回應
export interface JoinRoomResponse {
  playerId?: string;
  spectatorId?: string;
  token: string;
  room: Room;
}

// SSE 事件類型
export type SSEEventType = 
  | 'room.sync'
  | 'room.updated'
  | 'timer.tick'
  | 'game.started'
  | 'role.private'
  | 'speak.submitted'
  | 'vote.open'
  | 'vote.result'
  | 'game.roundEnd'
  | 'game.ended'
  | 'player.kicked'
  | 'host.transferred'
  | 'error'
  | 'keepalive';

// SSE 事件資料
export interface SSEEvent<T = any> {
  type: SSEEventType;
  data?: T;
  timestamp: number;
}

// Zod 驗證 schemas
export const CreateRoomSchema = z.object({
  config: z.object({
    undercoverCount: z.number().min(1).max(5).default(1),
    blankCount: z.number().min(0).max(2).default(0),
    maxPlayers: z.number().min(3).max(12).default(8),
    lang: z.enum(['zh-TW', 'en']).default('zh-TW'),
    isPrivate: z.boolean().default(false),
    allowSpectators: z.boolean().default(true),
    timers: z.object({
      lobby: z.number().min(30).max(300).default(120),
      speak: z.number().min(15).max(120).default(30),
      vote: z.number().min(15).max(120).default(45),
    }).optional(),
  }).optional(),
});

export const JoinRoomSchema = z.object({
  name: z.string().min(1).max(20),
  asSpectator: z.boolean().optional().default(false),
});

export const ReadySchema = z.object({
  ready: z.boolean(),
});

export const ConfigUpdateSchema = z.object({
  undercoverCount: z.number().min(1).max(5).optional(),
  blankCount: z.number().min(0).max(2).optional(),
  maxPlayers: z.number().min(3).max(12).optional(),
  lang: z.enum(['zh-TW', 'en']).optional(),
  isPrivate: z.boolean().optional(),
  allowSpectators: z.boolean().optional(),
  timers: z.object({
    lobby: z.number().min(30).max(300),
    speak: z.number().min(15).max(120),
    vote: z.number().min(15).max(120),
  }).optional(),
});

export const SpeakSchema = z.object({
  text: z.string().min(1).max(200),
});

export const VoteSchema = z.object({
  targetId: z.string().optional(), // undefined 代表棄權
});

export const TiebreakSchema = z.object({
  targetId: z.string(),
});

export const KickPlayerSchema = z.object({
  targetId: z.string(),
});

export const TransferHostSchema = z.object({
  toPlayerId: z.string(),
});

export const CustomTopicsSchema = z.object({
  pairs: z.array(z.object({
    civilian: z.string().min(1).max(50),
    undercover: z.string().min(1).max(50),
  })).min(1).max(20),
});

export const ChatMessageSchema = z.object({
  text: z.string().min(1).max(200),
});

// 請求類型推導
export type CreateRoomRequest = z.infer<typeof CreateRoomSchema>;
export type JoinRoomRequest = z.infer<typeof JoinRoomSchema>;
export type ReadyRequest = z.infer<typeof ReadySchema>;
export type ConfigUpdateRequest = z.infer<typeof ConfigUpdateSchema>;
export type SpeakRequest = z.infer<typeof SpeakSchema>;
export type VoteRequest = z.infer<typeof VoteSchema>;
export type TiebreakRequest = z.infer<typeof TiebreakSchema>;
export type KickPlayerRequest = z.infer<typeof KickPlayerSchema>;
export type TransferHostRequest = z.infer<typeof TransferHostSchema>;
export type CustomTopicsRequest = z.infer<typeof CustomTopicsSchema>;
export type ChatMessageRequest = z.infer<typeof ChatMessageSchema>;
