'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Vote, Check, AlertCircle, Users } from 'lucide-react';
import { PlayerAvatar } from './player-avatar';
import { apiClient } from '@/lib/api-client';
import { getCurrentPlayerId } from '@/lib/auth';
import type { Player, Vote as VoteType, Round, VoteResult } from '@/types/game';

interface VotePanelProps {
  roomCode: string;
  currentRound: Round;
  players: Player[];
  timeRemaining: number;
  totalTime: number;
  isActive: boolean;
  voteResult?: VoteResult;
  onVote?: (targetId?: string) => void;
}

export function VotePanel({
  roomCode,
  currentRound,
  players,
  timeRemaining,
  totalTime,
  isActive,
  voteResult,
  onVote,
}: VotePanelProps) {
  const [selectedTarget, setSelectedTarget] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [hasVoted, setHasVoted] = useState(false);

  const currentPlayerId = getCurrentPlayerId();
  const currentPlayerVote = currentRound.votes.find(v => v.voterId === currentPlayerId);

  useEffect(() => {
    setHasVoted(!!currentPlayerVote);
    if (currentPlayerVote?.targetId) {
      setSelectedTarget(currentPlayerVote.targetId);
    }
  }, [currentPlayerVote]);

  const handleVote = async () => {
    if (hasVoted || !isActive) return;

    setIsSubmitting(true);
    setError('');

    try {
      await apiClient.vote(roomCode, selectedTarget || undefined);
      setHasVoted(true);
      onVote?.(selectedTarget || undefined);
    } catch (error) {
      console.error('Vote failed:', error);
      setError(error instanceof Error ? error.message : '投票失敗');
    } finally {
      setIsSubmitting(false);
    }
  };

  const progressPercentage = totalTime > 0 ? ((totalTime - timeRemaining) / totalTime) * 100 : 0;
  const isTimeUp = timeRemaining <= 0;
  const canVote = !hasVoted && !isSubmitting && isActive && !isTimeUp;

  // 獲取可投票的玩家（排除自己和已淘汰的玩家）
  const votablePlayers = players.filter(p => {
    if (p.id === currentPlayerId) return false;
    // 檢查是否已被淘汰
    const isEliminated = currentRound.eliminatedId === p.id;
    return !isEliminated;
  });

  const votedCount = currentRound.votes.length;
  const totalVoters = players.filter(p => {
    // 排除已淘汰的玩家
    return currentRound.eliminatedId !== p.id;
  }).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Vote className="h-5 w-5" />
            <span>投票淘汰</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant={isActive ? "default" : "secondary"}>
              第 {currentRound.index} 輪
            </Badge>
            {isActive && (
              <Badge variant={timeRemaining > 10000 ? "outline" : "destructive"}>
                {Math.max(0, Math.floor(timeRemaining / 1000))}s
              </Badge>
            )}
          </div>
        </div>
        
        {isActive && (
          <Progress value={progressPercentage} className="h-2" />
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 投票狀態 */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span className="text-sm font-medium">投票進度</span>
          </div>
          <Badge variant="outline">
            {votedCount} / {totalVoters}
          </Badge>
        </div>

        {/* 投票選項 */}
        {!hasVoted && isActive && !isTimeUp ? (
          <div className="space-y-3">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">選擇要淘汰的玩家</h4>
              <div className="space-y-2">
                {votablePlayers.map((player) => (
                  <label
                    key={player.id}
                    className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedTarget === player.id
                        ? 'border-primary bg-primary/10'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="vote-target"
                        value={player.id}
                        checked={selectedTarget === player.id}
                        onChange={(e) => setSelectedTarget(e.target.value)}
                        className="sr-only"
                      />
                      <PlayerAvatar player={player} size="sm" showName />
                    </div>
                    {selectedTarget === player.id && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </label>
                ))}
                
                {/* 棄權選項 */}
                <label
                  className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedTarget === ''
                      ? 'border-primary bg-primary/10'
                      : 'hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="vote-target"
                      value=""
                      checked={selectedTarget === ''}
                      onChange={(e) => setSelectedTarget(e.target.value)}
                      className="sr-only"
                    />
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-xs">棄</span>
                      </div>
                      <span className="font-medium">棄權</span>
                    </div>
                  </div>
                  {selectedTarget === '' && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </label>
              </div>
            </div>
            
            {error && (
              <div className="flex items-center space-x-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}
            
            <Button
              onClick={handleVote}
              disabled={!canVote}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  投票中...
                </>
              ) : (
                <>
                  <Vote className="h-4 w-4 mr-2" />
                  確認投票
                </>
              )}
            </Button>
          </div>
        ) : hasVoted ? (
          <div className="text-center py-4">
            <div className="flex items-center justify-center space-x-2 text-green-600 mb-2">
              <Check className="h-5 w-5" />
              <span className="font-medium">你已完成投票</span>
            </div>
            {currentPlayerVote?.targetId ? (
              <p className="text-sm text-muted-foreground">
                你投票淘汰：{players.find(p => p.id === currentPlayerVote.targetId)?.name}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                你選擇了棄權
              </p>
            )}
          </div>
        ) : isTimeUp ? (
          <div className="text-center py-4">
            <div className="flex items-center justify-center space-x-2 text-orange-600 mb-2">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">投票時間已結束</span>
            </div>
            <p className="text-sm text-muted-foreground">
              等待結果揭曉...
            </p>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              等待投票階段開始...
            </p>
          </div>
        )}

        {/* 投票狀態列表 */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">投票狀態</h4>
          <div className="grid grid-cols-1 gap-2">
            {players
              .filter(p => currentRound.eliminatedId !== p.id)
              .map((player) => {
                const playerVote = currentRound.votes.find(v => v.voterId === player.id);
                const hasPlayerVoted = !!playerVote;
                
                return (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-2 rounded border"
                  >
                    <PlayerAvatar
                      player={player}
                      size="sm"
                      showName
                    />
                    
                    <div className="flex items-center space-x-2">
                      {hasPlayerVoted ? (
                        <Badge variant="default" className="text-xs">
                          <Check className="h-3 w-3 mr-1" />
                          已投票
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          等待中
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* 投票結果 */}
        {voteResult && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">投票結果</h4>
            <div className="space-y-2">
              {Object.entries(voteResult.tally)
                .sort(([, a], [, b]) => b - a)
                .map(([playerId, votes]) => {
                  const player = players.find(p => p.id === playerId);
                  if (!player) return null;
                  
                  return (
                    <div
                      key={playerId}
                      className="flex items-center justify-between p-2 rounded border"
                    >
                      <PlayerAvatar player={player} size="sm" showName />
                      <Badge variant="outline">
                        {votes} 票
                      </Badge>
                    </div>
                  );
                })}
            </div>
            
            {voteResult.isTie && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center space-x-2 text-orange-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">同票！需要房主裁決</span>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
