import { describe, it, expect } from 'vitest';
import {
  assignRoles,
  checkStartable,
  tallyVotes,
  decideWinner,
  getPlayerAssignment,
  hasPlayerVoted,
  hasAllPlayersSpoken,
  hasAllPlayersVoted,
  isValidVote
} from '@/lib/engine';
import { Player, Vote, Assignment, Speak } from '@/types';

function mockPlayer(id: string, name: string, isHost: boolean, isReady: boolean): Player {
  return {
    id,
    name,
    isHost,
    isReady,
    connected: true,
    joinedAt: Date.now(),
    createdAt: Date.now(),
  };
}

describe('Engine - assignRoles', () => {
  const mockPlayers: Player[] = [
    mockPlayer('1', 'Player1', true, true),
    mockPlayer('2', 'Player2', false, true),
    mockPlayer('3', 'Player3', false, true),
    mockPlayer('4', 'Player4', false, true),
  ];

  it('應該正確分配角色', () => {
    const assignments = assignRoles(mockPlayers, 1, '蘋果', '梨子');
    
    expect(assignments).toHaveLength(4);
    
    const undercoverCount = assignments.filter(a => a.role === 'undercover').length;
    const civilianCount = assignments.filter(a => a.role === 'civilian').length;
    
    expect(undercoverCount).toBe(1);
    expect(civilianCount).toBe(3);
    
    // 檢查詞語分配
    assignments.forEach(assignment => {
      if (assignment.role === 'undercover') {
        expect(assignment.word).toBe('梨子');
      } else {
        expect(assignment.word).toBe('蘋果');
      }
    });
  });

  it('應該為每個玩家分配唯一的角色', () => {
    const assignments = assignRoles(mockPlayers, 2, '蘋果', '梨子');
    
    const playerIds = assignments.map(a => a.playerId);
    const uniquePlayerIds = new Set(playerIds);
    
    expect(uniquePlayerIds.size).toBe(mockPlayers.length);
  });

  it('應該在玩家數量不足時拋出錯誤', () => {
    const twoPlayers = mockPlayers.slice(0, 2);
    
    expect(() => {
      assignRoles(twoPlayers, 1, '蘋果', '梨子');
    }).toThrow('至少需要 3 名玩家');
  });

  it('應該在臥底數量過多時拋出錯誤', () => {
    expect(() => {
      assignRoles(mockPlayers, 4, '蘋果', '梨子');
    }).toThrow('臥底數量不能大於等於玩家總數');
  });

  it('應該在臥底數量為 0 時拋出錯誤', () => {
    expect(() => {
      assignRoles(mockPlayers, 0, '蘋果', '梨子');
    }).toThrow('至少需要 1 名臥底');
  });
});

describe('Engine - checkStartable', () => {
  it('應該在所有條件滿足時返回 true', () => {
    const players: Player[] = [
      mockPlayer('1', 'Player1', true, true),
      mockPlayer('2', 'Player2', false, true),
      mockPlayer('3', 'Player3', false, true),
    ];
    
    expect(checkStartable(players, 1)).toBe(true);
  });

  it('應該在玩家數量不足時返回 false', () => {
    const players: Player[] = [
      mockPlayer('1', 'Player1', true, true),
      mockPlayer('2', 'Player2', false, true),
    ];
    
    expect(checkStartable(players, 1)).toBe(false);
  });

  it('應該在有玩家未準備時返回 false', () => {
    const players: Player[] = [
      mockPlayer('1', 'Player1', true, true),
      mockPlayer('2', 'Player2', false, false),
      mockPlayer('3', 'Player3', false, true),
    ];
    
    expect(checkStartable(players, 1)).toBe(false);
  });

  it('應該在臥底數量不合理時返回 false', () => {
    const players: Player[] = [
      mockPlayer('1', 'Player1', true, true),
      mockPlayer('2', 'Player2', false, true),
      mockPlayer('3', 'Player3', false, true),
    ];
    
    expect(checkStartable(players, 0)).toBe(false);
    expect(checkStartable(players, 3)).toBe(false);
  });
});

describe('Engine - tallyVotes', () => {
  it('應該正確統計投票', () => {
    const votes: Vote[] = [
      { voterId: '1', targetId: 'A', round: 1, at: 0 },
      { voterId: '2', targetId: 'B', round: 1, at: 0 },
      { voterId: '3', targetId: 'A', round: 1, at: 0 },
      { voterId: '4', targetId: 'C', round: 1, at: 0 },
    ];
    
    const result = tallyVotes(votes);
    
    expect(result.countMap).toEqual({
      'A': 2,
      'B': 1,
      'C': 1
    });
    expect(result.topIds).toEqual(['A']);
  });

  it('應該處理同票情況', () => {
    const votes: Vote[] = [
      { voterId: '1', targetId: 'A', round: 1, at: 0 },
      { voterId: '2', targetId: 'B', round: 1, at: 0 },
      { voterId: '3', targetId: 'A', round: 1, at: 0 },
      { voterId: '4', targetId: 'B', round: 1, at: 0 },
    ];
    
    const result = tallyVotes(votes);
    
    expect(result.countMap).toEqual({
      'A': 2,
      'B': 2
    });
    expect(result.topIds).toHaveLength(2);
    expect(result.topIds).toContain('A');
    expect(result.topIds).toContain('B');
  });

  it('應該處理空投票', () => {
    const votes: Vote[] = [];
    
    const result = tallyVotes(votes);
    
    expect(result.countMap).toEqual({});
    expect(result.topIds).toEqual([]);
  });
});

describe('Engine - decideWinner', () => {
  const mockAssignments: Assignment[] = [
    { playerId: '1', role: 'civilian', word: '蘋果' },
    { playerId: '2', role: 'civilian', word: '蘋果' },
    { playerId: '3', role: 'undercover', word: '梨子' },
  ];

  it('應該在淘汰臥底時判定平民勝利', () => {
    const result = decideWinner('undercover', mockAssignments);
    expect(result).toBe('civilian');
  });

  it('應該在淘汰平民時判定臥底勝利', () => {
    const result = decideWinner('civilian', mockAssignments);
    expect(result).toBe('undercover');
  });
});

describe('Engine - Utility Functions', () => {
  const mockAssignments: Assignment[] = [
    { playerId: '1', role: 'civilian', word: '蘋果' },
    { playerId: '2', role: 'undercover', word: '梨子' },
  ];

  const mockVotes: Vote[] = [
    { voterId: '1', targetId: '2', round: 1, at: 0 },
  ];

  const mockSpeaks: Speak[] = [
    { playerId: '1', text: 'Test speak', round: 1, at: 0 },
  ];

  it('getPlayerAssignment 應該正確獲取玩家角色', () => {
    const assignment = getPlayerAssignment(mockAssignments, '1');
    expect(assignment).toEqual({ playerId: '1', role: 'civilian', word: '蘋果' });
    
    const notFound = getPlayerAssignment(mockAssignments, '999');
    expect(notFound).toBeNull();
  });

  it('hasPlayerVoted 應該正確檢查投票狀態', () => {
    expect(hasPlayerVoted(mockVotes, '1')).toBe(true);
    expect(hasPlayerVoted(mockVotes, '2')).toBe(false);
  });

  it('hasAllPlayersSpoken 應該正確檢查發言狀態', () => {
    expect(hasAllPlayersSpoken(mockSpeaks, ['1'])).toBe(true);
    expect(hasAllPlayersSpoken(mockSpeaks, ['1', '2'])).toBe(false);
  });

  it('hasAllPlayersVoted 應該正確檢查投票狀態', () => {
    expect(hasAllPlayersVoted(mockVotes, ['1'])).toBe(true);
    expect(hasAllPlayersVoted(mockVotes, ['1', '2'])).toBe(false);
  });

  it('isValidVote 應該正確驗證投票', () => {
    const validVote: Vote = { voterId: '1', targetId: '2', round: 1, at: 0 };
    const selfVote: Vote = { voterId: '1', targetId: '1', round: 1, at: 0 };
    const invalidPlayerVote: Vote = { voterId: '999', targetId: '2', round: 1, at: 0 };
    
    expect(isValidVote(validVote, ['1', '2'])).toBe(true);
    expect(isValidVote(selfVote, ['1', '2'])).toBe(false);
    expect(isValidVote(invalidPlayerVote, ['1', '2'])).toBe(false);
  });
});
