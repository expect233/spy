import { nanoid } from 'nanoid';
import {
  Room,
  Player,
  Role,
  Assignment,
  Vote,
  VoteResult,
  GameState,
  Round,
  TimerState,
  GameResult,
  Topic,
  Speak,
} from '../types/game';
// 簡化的錯誤類
class InvalidGameStateError extends Error {
  constructor(currentState: string, expectedState: string) {
    super(`Invalid game state. Current: ${currentState}, Expected: ${expectedState}`);
    this.name = 'InvalidGameStateError';
  }
}

/**
 * 分配角色給玩家
 */
export function assignRoles(
  players: Player[],
  undercoverCount: number,
  blankCount: number = 0,
  topic?: Topic
): Assignment[] {
  if (players.length < 3) {
    throw new Error('至少需要 3 名玩家');
  }

  const totalSpecialRoles = undercoverCount + blankCount;
  if (totalSpecialRoles >= players.length) {
    throw new Error('特殊角色數量不能大於等於玩家總數');
  }

  // 隨機打亂玩家順序
  const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);
  const assignments: Assignment[] = [];

  // 分配臥底
  for (let i = 0; i < undercoverCount; i++) {
    assignments.push({
      playerId: shuffledPlayers[i].id,
      role: 'undercover',
      word: topic?.undercover || '',
    });
  }

  // 分配白板
  for (let i = undercoverCount; i < undercoverCount + blankCount; i++) {
    assignments.push({
      playerId: shuffledPlayers[i].id,
      role: 'blank',
      word: topic?.blank || '',
    });
  }

  // 其餘為平民
  for (let i = undercoverCount + blankCount; i < shuffledPlayers.length; i++) {
    assignments.push({
      playerId: shuffledPlayers[i].id,
      role: 'civilian',
      word: topic?.civilian || '',
    });
  }

  return assignments;
}

/**
 * 統計投票結果
 */
export function tallyVotes(votes: Vote[]): {
  tally: Record<string, number>;
  topCandidates: string[];
  totalVotes: number;
} {
  const tally: Record<string, number> = {};
  let totalVotes = 0;

  // 統計每個候選人的票數
  votes.forEach((vote) => {
    if (vote.targetId) {
      tally[vote.targetId] = (tally[vote.targetId] || 0) + 1;
      totalVotes++;
    }
  });

  // 找出最高票數
  const maxVotes = Math.max(...Object.values(tally), 0);

  // 找出所有最高票的候選人
  const topCandidates = Object.keys(tally).filter(
    (playerId) => tally[playerId] === maxVotes
  );

  return { tally, topCandidates, totalVotes };
}

/**
 * 解決淘汰邏輯
 */
export function resolveElimination(voteResult: {
  topCandidates: string[];
  tally: Record<string, number>;
  hostPick?: string;
}): { eliminatedId?: string; isTie: boolean } {
  const { topCandidates, hostPick } = voteResult;

  // 沒有人得票
  if (topCandidates.length === 0) {
    return { isTie: false };
  }

  // 只有一個最高票候選人
  if (topCandidates.length === 1) {
    return { eliminatedId: topCandidates[0], isTie: false };
  }

  // 同票情況
  if (topCandidates.length > 1) {
    if (hostPick && topCandidates.includes(hostPick)) {
      return { eliminatedId: hostPick, isTie: true };
    }
    return { isTie: true };
  }

  return { isTie: false };
}

/**
 * 判定遊戲勝負
 * @param eliminatedRole 被淘汰者的角色
 * @param remainingAssignments 剩餘玩家的角色分配
 * @returns 勝利方
 */
export function decideWinner(
  eliminatedRole: Role,
  remainingAssignments: Assignment[]
): 'civilian' | 'undercover' {
  // 如果淘汰的是臥底，平民勝利
  if (eliminatedRole === 'undercover') {
    return 'civilian';
  }

  // 如果淘汰的是平民，檢查剩餘的臥底數量
  const remainingUndercover = remainingAssignments.filter(
    assignment => assignment.role === 'undercover'
  ).length;
  
  const remainingCivilian = remainingAssignments.filter(
    assignment => assignment.role === 'civilian'
  ).length;

  // 如果臥底數量大於等於平民數量，臥底勝利
  if (remainingUndercover >= remainingCivilian) {
    return 'undercover';
  }

  // 否則遊戲繼續（在 MVP 中簡化為臥底勝利）
  return 'undercover';
}

/**
 * 獲取玩家的角色分配
 * @param assignments 所有角色分配
 * @param playerId 玩家ID
 * @returns 玩家的角色分配，如果找不到則返回 null
 */
export function getPlayerAssignment(
  assignments: Assignment[], 
  playerId: string
): Assignment | null {
  return assignments.find(assignment => assignment.playerId === playerId) || null;
}

/**
 * 檢查玩家是否已經投票
 * @param votes 投票記錄
 * @param playerId 玩家ID
 * @returns 是否已投票
 */
export function hasPlayerVoted(votes: Vote[], playerId: string): boolean {
  return votes.some(vote => vote.voterId === playerId);
}

/**
 * 檢查是否所有玩家都已發言
 * @param speaks 發言記錄
 * @param playerIds 玩家ID列表
 * @returns 是否所有人都已發言
 */
export function hasAllPlayersSpoken(speaks: Speak[], playerIds: string[]): boolean {
  const spokenPlayerIds = new Set(speaks.map(speak => speak.playerId));
  return playerIds.every(playerId => spokenPlayerIds.has(playerId));
}

/**
 * 檢查是否所有玩家都已投票
 * @param votes 投票記錄
 * @param playerIds 玩家ID列表
 * @returns 是否所有人都已投票
 */
export function hasAllPlayersVoted(votes: Vote[], playerIds: string[]): boolean {
  const votedPlayerIds = new Set(votes.map(vote => vote.voterId));
  return playerIds.every(playerId => votedPlayerIds.has(playerId));
}

/**
 * 驗證投票是否有效
 * @param vote 投票記錄
 * @param playerIds 有效的玩家ID列表
 * @returns 投票是否有效
 */
export function isValidVote(vote: Vote, playerIds: string[]): boolean {
  // 棄權票是有效的
  if (!vote.targetId) {
    return playerIds.includes(vote.voterId);
  }

  // 不能投給自己
  if (vote.voterId === vote.targetId) {
    return false;
  }

  // 投票者和被投票者都必須是有效玩家
  return playerIds.includes(vote.voterId) && playerIds.includes(vote.targetId);
}

/**
 * 檢查勝利條件
 */
export function checkVictory(
  assignments: Assignment[],
  eliminatedPlayerIds: string[]
): 'civilian' | 'undercover' | undefined {
  // 過濾出還活著的玩家
  const aliveAssignments = assignments.filter(
    (assignment) => !eliminatedPlayerIds.includes(assignment.playerId)
  );

  const aliveCivilians = aliveAssignments.filter((a) => a.role === 'civilian');
  const aliveUndercovers = aliveAssignments.filter((a) => a.role === 'undercover');
  const aliveBlanks = aliveAssignments.filter((a) => a.role === 'blank');

  // 臥底全部被淘汰，平民勝利
  if (aliveUndercovers.length === 0) {
    return 'civilian';
  }

  // 臥底數量 >= 平民數量（白板算平民方），臥底勝利
  const civilianSideCount = aliveCivilians.length + aliveBlanks.length;
  if (aliveUndercovers.length >= civilianSideCount) {
    return 'undercover';
  }

  // 遊戲繼續
  return undefined;
}

/**
 * 創建計時器
 */
export function createTimer(state: GameState, durationMs: number): TimerState {
  return {
    state,
    remainMs: durationMs,
    totalMs: durationMs,
    isActive: true,
  };
}

/**
 * 更新計時器
 */
export function updateTimer(timer: TimerState, deltaMs: number): TimerState {
  if (!timer.isActive) return timer;

  const newRemainMs = Math.max(0, timer.remainMs - deltaMs);

  return {
    ...timer,
    remainMs: newRemainMs,
    isActive: newRemainMs > 0,
  };
}

/**
 * 開始下一輪
 */
export function startNextRound(room: Room): Room {
  const newRound: Round = {
    index: room.currentRound + 1,
    speaks: [],
    votes: [],
    startTime: Date.now(),
  };

  return {
    ...room,
    currentRound: room.currentRound + 1,
    rounds: [...room.rounds, newRound],
    state: 'speaking',
    timer: createTimer('speaking', room.config.timers.speak * 1000),
    updatedAt: Date.now(),
  };
}

/**
 * 檢查發言階段是否結束
 */
export function shouldEndSpeakingPhase(room: Room): boolean {
  const currentRound = room.rounds[room.currentRound - 1];
  if (!currentRound) return false;

  // 獲取還活著的玩家
  const eliminatedIds = room.rounds
    .slice(0, room.currentRound - 1)
    .map((r) => r.eliminatedId)
    .filter(Boolean) as string[];

  const alivePlayers = room.players.filter(
    (p) => !eliminatedIds.includes(p.id)
  );

  // 所有活著的玩家都已發言，或計時器結束
  const allSpoken = alivePlayers.every((player) =>
    currentRound.speaks.some((speak) => speak.playerId === player.id)
  );

  const timerEnded = room.timer && !room.timer.isActive;

  return allSpoken || !!timerEnded;
}

/**
 * 檢查投票階段是否結束
 */
export function shouldEndVotingPhase(room: Room): boolean {
  const currentRound = room.rounds[room.currentRound - 1];
  if (!currentRound) return false;

  // 獲取還活著的玩家
  const eliminatedIds = room.rounds
    .slice(0, room.currentRound - 1)
    .map((r) => r.eliminatedId)
    .filter(Boolean) as string[];

  const alivePlayers = room.players.filter(
    (p) => !eliminatedIds.includes(p.id)
  );

  // 所有活著的玩家都已投票，或計時器結束
  const allVoted = alivePlayers.every((player) =>
    currentRound.votes.some((vote) => vote.voterId === player.id)
  );

  const timerEnded = room.timer && !room.timer.isActive;

  return allVoted || !!timerEnded;
}

/**
 * 轉換到投票階段
 */
export function transitionToVoting(room: Room): Room {
  if (room.state !== 'speaking') {
    throw new InvalidGameStateError(room.state, 'speaking');
  }

  return {
    ...room,
    state: 'voting',
    timer: createTimer('voting', room.config.timers.vote * 1000),
    updatedAt: Date.now(),
  };
}

/**
 * 處理投票結果並轉換狀態
 */
export function processVoteResult(room: Room, hostPick?: string): {
  room: Room;
  voteResult: VoteResult;
  gameResult?: GameResult;
} {
  if (room.state !== 'voting') {
    throw new InvalidGameStateError(room.state, 'voting');
  }

  const currentRound = room.rounds[room.currentRound - 1];
  if (!currentRound) {
    throw new Error('當前回合不存在');
  }

  // 統計投票
  const { tally, topCandidates } = tallyVotes(currentRound.votes);

  // 解決淘汰
  const { eliminatedId, isTie } = resolveElimination({
    topCandidates,
    tally,
    hostPick,
  });

  // 創建投票結果
  const voteResult: VoteResult = {
    round: room.currentRound,
    votes: currentRound.votes,
    tally,
    topCandidates,
    eliminatedId,
    isTie,
  };

  // 更新回合
  const updatedRound: Round = {
    ...currentRound,
    eliminatedId,
    endTime: Date.now(),
  };

  const updatedRounds = [...room.rounds];
  updatedRounds[room.currentRound - 1] = updatedRound;

  // 檢查勝利條件
  const eliminatedIds = updatedRounds
    .map((r) => r.eliminatedId)
    .filter(Boolean) as string[];

  const winner = room.assignments
    ? checkVictory(room.assignments, eliminatedIds)
    : undefined;

  let updatedRoom: Room;
  let gameResult: GameResult | undefined;

  if (winner) {
    // 遊戲結束
    gameResult = {
      winner,
      eliminatedHistory: updatedRounds
        .map((round, index) => {
          if (!round.eliminatedId || !room.assignments) return null;
          const assignment = room.assignments.find(
            (a) => a.playerId === round.eliminatedId
          );
          return assignment
            ? {
                round: index + 1,
                playerId: round.eliminatedId,
                role: assignment.role,
                word: assignment.word,
              }
            : null;
        })
        .filter(Boolean) as GameResult['eliminatedHistory'],
      finalAssignments: room.assignments || [],
      totalRounds: room.currentRound,
      duration: Date.now() - room.createdAt,
    };

    updatedRoom = {
      ...room,
      rounds: updatedRounds,
      state: 'ended',
      winner,
      timer: undefined,
      updatedAt: Date.now(),
    };
  } else {
    // 進入下一輪
    updatedRoom = startNextRound({
      ...room,
      rounds: updatedRounds,
    });
  }

  return { room: updatedRoom, voteResult, gameResult };
}

/**
 * 獲取還活著的玩家
 */
export function getAlivePlayers(room: Room): Player[] {
  const eliminatedIds = room.rounds
    .map((r) => r.eliminatedId)
    .filter(Boolean) as string[];

  return room.players.filter((p) => !eliminatedIds.includes(p.id));
}

/**
 * 檢查玩家是否可以發言
 */
export function canPlayerSpeak(room: Room, playerId: string): boolean {
  if (room.state !== 'speaking') return false;

  const currentRound = room.rounds[room.currentRound - 1];
  if (!currentRound) return false;

  // 檢查玩家是否還活著
  const alivePlayers = getAlivePlayers(room);
  const isAlive = alivePlayers.some((p) => p.id === playerId);
  if (!isAlive) return false;

  // 檢查是否已經發言過
  const hasSpoken = currentRound.speaks.some((s) => s.playerId === playerId);
  return !hasSpoken;
}

/**
 * 檢查玩家是否可以投票
 */
export function canPlayerVote(room: Room, playerId: string): boolean {
  if (room.state !== 'voting') return false;

  const currentRound = room.rounds[room.currentRound - 1];
  if (!currentRound) return false;

  // 檢查玩家是否還活著
  const alivePlayers = getAlivePlayers(room);
  const isAlive = alivePlayers.some((p) => p.id === playerId);
  if (!isAlive) return false;

  // 檢查是否已經投票過
  const hasVoted = currentRound.votes.some((v) => v.voterId === playerId);
  return !hasVoted;
}
