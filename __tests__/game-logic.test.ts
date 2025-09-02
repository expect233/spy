import { describe, it, expect } from 'vitest';
import {
  assignRoles,
  tallyVotes,
  checkVictory,
  getNextState,
  validateSpeakText,
  validateChatMessage,
} from '@/lib/game-logic';
import type { Player, Vote, Assignment } from '@/types/game';

describe('Game Logic', () => {
  const mockPlayers: Player[] = [
    { id: '1', name: 'Alice', isHost: true, connected: true, createdAt: Date.now() },
    { id: '2', name: 'Bob', isHost: false, connected: true, createdAt: Date.now() },
    { id: '3', name: 'Charlie', isHost: false, connected: true, createdAt: Date.now() },
    { id: '4', name: 'David', isHost: false, connected: true, createdAt: Date.now() },
  ];

  describe('assignRoles', () => {
    it('should assign roles correctly with default settings', () => {
      const { assignments, topic } = assignRoles(mockPlayers, 1, 0);
      
      expect(assignments).toHaveLength(4);
      expect(assignments.filter(a => a.role === 'undercover')).toHaveLength(1);
      expect(assignments.filter(a => a.role === 'civilian')).toHaveLength(3);
      expect(assignments.filter(a => a.role === 'blank')).toHaveLength(0);
      expect(topic).toBeDefined();
      expect(topic.civilian).toBeDefined();
      expect(topic.undercover).toBeDefined();
    });

    it('should assign roles with blank cards', () => {
      const { assignments } = assignRoles(mockPlayers, 1, 1);
      
      expect(assignments).toHaveLength(4);
      expect(assignments.filter(a => a.role === 'undercover')).toHaveLength(1);
      expect(assignments.filter(a => a.role === 'civilian')).toHaveLength(2);
      expect(assignments.filter(a => a.role === 'blank')).toHaveLength(1);
    });

    it('should throw error with insufficient players', () => {
      const twoPlayers = mockPlayers.slice(0, 2);
      expect(() => assignRoles(twoPlayers, 1, 0)).toThrow('至少需要 3 名玩家');
    });

    it('should throw error with too many special roles', () => {
      expect(() => assignRoles(mockPlayers, 2, 2)).toThrow('特殊角色數量不能大於等於玩家總數');
    });
  });

  describe('tallyVotes', () => {
    const mockVotes: Vote[] = [
      { voterId: '1', round: 1, targetId: '2', at: Date.now() },
      { voterId: '2', round: 1, targetId: '3', at: Date.now() },
      { voterId: '3', round: 1, targetId: '2', at: Date.now() },
      { voterId: '4', round: 1, targetId: '2', at: Date.now() },
    ];

    it('should tally votes correctly', () => {
      const result = tallyVotes(mockVotes, mockPlayers);
      
      expect(result.tally['2']).toBe(3);
      expect(result.tally['3']).toBe(1);
      expect(result.eliminatedId).toBe('2');
      expect(result.isTie).toBe(false);
      expect(result.topCandidates).toEqual(['2']);
    });

    it('should detect ties', () => {
      const tieVotes: Vote[] = [
        { voterId: '1', round: 1, targetId: '2', at: Date.now() },
        { voterId: '2', round: 1, targetId: '3', at: Date.now() },
        { voterId: '3', round: 1, targetId: '2', at: Date.now() },
        { voterId: '4', round: 1, targetId: '3', at: Date.now() },
      ];

      const result = tallyVotes(tieVotes, mockPlayers);
      
      expect(result.tally['2']).toBe(2);
      expect(result.tally['3']).toBe(2);
      expect(result.isTie).toBe(true);
      expect(result.eliminatedId).toBeUndefined();
      expect(result.topCandidates).toEqual(['2', '3']);
    });

    it('should handle abstentions', () => {
      const votesWithAbstention: Vote[] = [
        { voterId: '1', round: 1, targetId: '2', at: Date.now() },
        { voterId: '2', round: 1, at: Date.now() }, // abstention
        { voterId: '3', round: 1, targetId: '2', at: Date.now() },
        { voterId: '4', round: 1, targetId: '3', at: Date.now() },
      ];

      const result = tallyVotes(votesWithAbstention, mockPlayers);
      
      expect(result.tally['2']).toBe(2);
      expect(result.tally['3']).toBe(1);
      expect(result.eliminatedId).toBe('2');
    });
  });

  describe('checkVictory', () => {
    const mockAssignments: Assignment[] = [
      { playerId: '1', role: 'civilian', word: 'apple' },
      { playerId: '2', role: 'civilian', word: 'apple' },
      { playerId: '3', role: 'undercover', word: 'orange' },
      { playerId: '4', role: 'civilian', word: 'apple' },
    ];

    it('should detect civilian victory when all undercovers eliminated', () => {
      const result = checkVictory(mockAssignments, ['3']);
      
      expect(result.winner).toBe('civilian');
      expect(result.isGameOver).toBe(true);
    });

    it('should detect undercover victory when they equal or outnumber civilians', () => {
      const result = checkVictory(mockAssignments, ['1', '2', '4']);
      
      expect(result.winner).toBe('undercover');
      expect(result.isGameOver).toBe(true);
    });

    it('should continue game when no victory condition met', () => {
      const result = checkVictory(mockAssignments, ['1']);
      
      expect(result.winner).toBeUndefined();
      expect(result.isGameOver).toBe(false);
    });

    it('should handle blank cards correctly', () => {
      const assignmentsWithBlank: Assignment[] = [
        { playerId: '1', role: 'civilian', word: 'apple' },
        { playerId: '2', role: 'blank', word: 'blank' },
        { playerId: '3', role: 'undercover', word: 'orange' },
        { playerId: '4', role: 'civilian', word: 'apple' },
      ];

      // Undercover should win when they equal civilians (blanks count as civilians for victory)
      const result = checkVictory(assignmentsWithBlank, ['1', '4']);
      
      expect(result.winner).toBe('undercover');
      expect(result.isGameOver).toBe(true);
    });
  });

  describe('getNextState', () => {
    it('should transition from lobby to speaking', () => {
      const nextState = getNextState('lobby', false, false);
      expect(nextState).toBe('speaking');
    });

    it('should stay in speaking until all players spoke', () => {
      const nextState = getNextState('speaking', false, false);
      expect(nextState).toBe('speaking');
    });

    it('should transition from speaking to voting when all spoke', () => {
      const nextState = getNextState('speaking', true, false);
      expect(nextState).toBe('voting');
    });

    it('should transition from voting to reveal when all voted', () => {
      const nextState = getNextState('voting', false, true);
      expect(nextState).toBe('reveal');
    });

    it('should transition from reveal to voting on tie', () => {
      const mockVoteResult = {
        round: 1,
        votes: [],
        tally: {},
        topCandidates: ['1', '2'],
        isTie: true,
      };
      
      const nextState = getNextState('reveal', false, false, mockVoteResult);
      expect(nextState).toBe('voting');
    });

    it('should transition from reveal to speaking for next round', () => {
      const mockVoteResult = {
        round: 1,
        votes: [],
        tally: {},
        topCandidates: ['1'],
        eliminatedId: '1',
        isTie: false,
      };
      
      const nextState = getNextState('reveal', false, false, mockVoteResult);
      expect(nextState).toBe('speaking');
    });
  });

  describe('validateSpeakText', () => {
    it('should accept valid speak text', () => {
      const result = validateSpeakText('This is a valid speak text.');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject empty text', () => {
      const result = validateSpeakText('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('發言內容不能為空');
    });

    it('should reject text that is too long', () => {
      const longText = 'a'.repeat(121);
      const result = validateSpeakText(longText);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('發言內容不能超過 120 字');
    });

    it('should reject text with bad words', () => {
      const result = validateSpeakText('這個遊戲真的很幹');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('發言內容包含不當詞語');
    });

    it('should reject text with repeated characters', () => {
      const result = validateSpeakText('aaaaaa');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('不能包含過多重複字元');
    });
  });

  describe('validateChatMessage', () => {
    it('should accept valid chat message', () => {
      const result = validateChatMessage('Hello everyone!');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject empty message', () => {
      const result = validateChatMessage('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('訊息內容不能為空');
    });

    it('should reject message that is too long', () => {
      const longMessage = 'a'.repeat(201);
      const result = validateChatMessage(longMessage);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('訊息內容不能超過 200 字');
    });

    it('should reject message with bad words', () => {
      const result = validateChatMessage('你這個白痴');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('訊息內容包含不當詞語');
    });
  });
});
