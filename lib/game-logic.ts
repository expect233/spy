import { 
  Room, 
  Player, 
  Assignment, 
  Role, 
  Topic, 
  Vote, 
  VoteResult, 
  GameState,
  TOPICS,
  MIN_PLAYERS,
  MAX_PLAYERS 
} from '@/types/game';

/**
 * 分配角色給玩家
 */
export function assignRoles(
  players: Player[], 
  undercoverCount: number, 
  blankCount: number = 0
): { assignments: Assignment[]; topic: Topic } {
  if (players.length < MIN_PLAYERS) {
    throw new Error(`至少需要 ${MIN_PLAYERS} 名玩家`);
  }

  if (players.length > MAX_PLAYERS) {
    throw new Error(`最多只能有 ${MAX_PLAYERS} 名玩家`);
  }

  const totalSpecialRoles = undercoverCount + blankCount;
  if (totalSpecialRoles >= players.length) {
    throw new Error('特殊角色數量不能大於等於玩家總數');
  }

  // 隨機選擇題目
  const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
  
  // 隨機打亂玩家順序
  const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);
  
  const assignments: Assignment[] = [];
  
  // 分配臥底
  for (let i = 0; i < undercoverCount; i++) {
    assignments.push({
      playerId: shuffledPlayers[i].id,
      role: 'undercover',
      word: topic.undercover,
    });
  }
  
  // 分配白板（如果有）
  for (let i = undercoverCount; i < undercoverCount + blankCount; i++) {
    assignments.push({
      playerId: shuffledPlayers[i].id,
      role: 'blank',
      word: topic.blank || '白板',
    });
  }
  
  // 分配平民
  for (let i = undercoverCount + blankCount; i < shuffledPlayers.length; i++) {
    assignments.push({
      playerId: shuffledPlayers[i].id,
      role: 'civilian',
      word: topic.civilian,
    });
  }

  return { assignments, topic };
}

/**
 * 計算投票結果
 */
export function tallyVotes(votes: Vote[], alivePlayers: Player[]): VoteResult {
  const tally: Record<string, number> = {};
  const round = votes[0]?.round || 0;
  
  // 統計票數
  votes.forEach(vote => {
    if (vote.targetId) {
      tally[vote.targetId] = (tally[vote.targetId] || 0) + 1;
    }
  });
  
  // 找出最高票數
  const maxVotes = Math.max(...Object.values(tally), 0);
  const topCandidates = Object.keys(tally).filter(id => tally[id] === maxVotes);
  
  const isTie = topCandidates.length > 1 && maxVotes > 0;
  const eliminatedId = !isTie && topCandidates.length === 1 ? topCandidates[0] : undefined;
  
  return {
    round,
    votes,
    tally,
    topCandidates,
    eliminatedId,
    isTie,
  };
}

/**
 * 檢查遊戲勝負
 */
export function checkVictory(
  assignments: Assignment[], 
  eliminatedPlayerIds: string[]
): { winner?: 'civilian' | 'undercover'; isGameOver: boolean } {
  const aliveAssignments = assignments.filter(
    a => !eliminatedPlayerIds.includes(a.playerId)
  );
  
  const aliveCivilians = aliveAssignments.filter(a => a.role === 'civilian').length;
  const aliveUndercovers = aliveAssignments.filter(a => a.role === 'undercover').length;
  const aliveBlanks = aliveAssignments.filter(a => a.role === 'blank').length;
  
  // 臥底全部被淘汰，平民勝利
  if (aliveUndercovers === 0) {
    return { winner: 'civilian', isGameOver: true };
  }
  
  // 臥底數量 >= 平民數量（包含白板），臥底勝利
  if (aliveUndercovers >= aliveCivilians + aliveBlanks) {
    return { winner: 'undercover', isGameOver: true };
  }
  
  return { isGameOver: false };
}

/**
 * 獲取下一個遊戲狀態
 */
export function getNextState(
  currentState: GameState,
  allPlayersSpoke: boolean,
  allPlayersVoted: boolean,
  voteResult?: VoteResult
): GameState {
  switch (currentState) {
    case 'lobby':
      return 'speaking';
      
    case 'speaking':
      if (allPlayersSpoke) {
        return 'voting';
      }
      return 'speaking';
      
    case 'voting':
      if (allPlayersVoted) {
        return 'reveal';
      }
      return 'voting';
      
    case 'reveal':
      // 檢查是否需要同票加賽
      if (voteResult?.isTie) {
        return 'voting'; // 進入加賽投票
      }
      return 'speaking'; // 下一輪發言
      
    case 'ended':
      return 'ended';
      
    default:
      return currentState;
  }
}

/**
 * 驗證發言內容
 */
export function validateSpeakText(text: string): { isValid: boolean; error?: string } {
  if (!text || text.trim().length === 0) {
    return { isValid: false, error: '發言內容不能為空' };
  }
  
  if (text.length > 120) {
    return { isValid: false, error: '發言內容不能超過 120 字' };
  }
  
  // 基本不雅詞過濾
  const badWords = ['幹', '靠', '操', '媽的', '白痴', '智障'];
  const hasBadWords = badWords.some(word => text.includes(word));
  
  if (hasBadWords) {
    return { isValid: false, error: '發言內容包含不當詞語' };
  }
  
  // 檢查重複字元（防刷屏）
  const repeatedChar = /(.)\1{4,}/.test(text);
  if (repeatedChar) {
    return { isValid: false, error: '不能包含過多重複字元' };
  }
  
  return { isValid: true };
}

/**
 * 驗證聊天訊息
 */
export function validateChatMessage(text: string): { isValid: boolean; error?: string } {
  if (!text || text.trim().length === 0) {
    return { isValid: false, error: '訊息內容不能為空' };
  }
  
  if (text.length > 200) {
    return { isValid: false, error: '訊息內容不能超過 200 字' };
  }
  
  // 基本不雅詞過濾
  const badWords = ['幹', '靠', '操', '媽的', '白痴', '智障'];
  const hasBadWords = badWords.some(word => text.includes(word));
  
  if (hasBadWords) {
    return { isValid: false, error: '訊息內容包含不當詞語' };
  }
  
  return { isValid: true };
}

/**
 * 生成房間代碼
 */
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 生成玩家 ID
 */
export function generatePlayerId(): string {
  return Math.random().toString(36).substr(2, 9);
}

/**
 * 生成 Token
 */
export function generateToken(): string {
  return Math.random().toString(36).substr(2, 15) + Date.now().toString(36);
}
