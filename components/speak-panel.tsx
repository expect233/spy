'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Send, Check, AlertCircle } from 'lucide-react';
import { PlayerAvatar } from './player-avatar';
import { apiClient } from '@/lib/api-client';
import { validateSpeakText } from '@/lib/game-logic';
import { getCurrentPlayerId } from '@/lib/auth';
import type { Player, Speak, Round } from '@/types/game';

interface SpeakPanelProps {
  roomCode: string;
  currentRound: Round;
  players: Player[];
  timeRemaining: number;
  totalTime: number;
  isActive: boolean;
  onSpeak?: (text: string) => void;
}

export function SpeakPanel({
  roomCode,
  currentRound,
  players,
  timeRemaining,
  totalTime,
  isActive,
  onSpeak,
}: SpeakPanelProps) {
  const [speakText, setSpeakText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [hasSpoken, setHasSpoken] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentPlayerId = getCurrentPlayerId();
  const currentPlayerSpeak = currentRound.speaks.find(s => s.playerId === currentPlayerId);

  useEffect(() => {
    setHasSpoken(!!currentPlayerSpeak);
  }, [currentPlayerSpeak]);

  useEffect(() => {
    // 自動聚焦到輸入框
    if (isActive && !hasSpoken && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isActive, hasSpoken]);

  const handleSubmit = async () => {
    if (!speakText.trim() || hasSpoken || !isActive) return;

    const validation = validateSpeakText(speakText.trim());
    if (!validation.isValid) {
      setError(validation.error || '發言內容無效');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await apiClient.speak(roomCode, speakText.trim());
      setSpeakText('');
      setHasSpoken(true);
      onSpeak?.(speakText.trim());
    } catch (error) {
      console.error('Speak failed:', error);
      setError(error instanceof Error ? error.message : '發言失敗');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const progressPercentage = totalTime > 0 ? ((totalTime - timeRemaining) / totalTime) * 100 : 0;
  const isTimeUp = timeRemaining <= 0;
  const canSubmit = speakText.trim().length > 0 && !hasSpoken && !isSubmitting && isActive && !isTimeUp;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>發言階段</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant={isActive ? "default" : "secondary"}>
              第 {currentRound.index} 輪
            </Badge>
            {isActive && (
              <Badge variant={timeRemaining > 10 ? "outline" : "destructive"}>
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
        {/* 發言輸入區 */}
        {!hasSpoken && isActive && !isTimeUp ? (
          <div className="space-y-3">
            <div className="space-y-2">
              <Textarea
                ref={textareaRef}
                value={speakText}
                onChange={(e) => setSpeakText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="輸入你的發言內容..."
                maxLength={120}
                rows={3}
                disabled={isSubmitting}
                className="resize-none"
              />
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>{speakText.length}/120</span>
                <span>Ctrl+Enter 快速發送</span>
              </div>
            </div>
            
            {error && (
              <div className="flex items-center space-x-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}
            
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  發言中...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  確認發言
                </>
              )}
            </Button>
          </div>
        ) : hasSpoken ? (
          <div className="text-center py-4">
            <div className="flex items-center justify-center space-x-2 text-green-600 mb-2">
              <Check className="h-5 w-5" />
              <span className="font-medium">你已完成發言</span>
            </div>
            <p className="text-sm text-muted-foreground">
              等待其他玩家完成發言...
            </p>
          </div>
        ) : isTimeUp ? (
          <div className="text-center py-4">
            <div className="flex items-center justify-center space-x-2 text-orange-600 mb-2">
              <Clock className="h-5 w-5" />
              <span className="font-medium">發言時間已結束</span>
            </div>
            <p className="text-sm text-muted-foreground">
              進入投票階段...
            </p>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              等待發言階段開始...
            </p>
          </div>
        )}

        {/* 發言狀態列表 */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">發言狀態</h4>
          <div className="grid grid-cols-1 gap-2">
            {players.map((player) => {
              const playerSpeak = currentRound.speaks.find(s => s.playerId === player.id);
              const hasPlayerSpoken = !!playerSpeak;
              
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
                    {hasPlayerSpoken ? (
                      <Badge variant="default" className="text-xs">
                        <Check className="h-3 w-3 mr-1" />
                        已發言
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
      </CardContent>
    </Card>
  );
}

interface SpeakDisplayProps {
  speaks: Speak[];
  players: Player[];
  currentPlayerId?: string;
  showPlayerSpeaks?: boolean;
}

export function SpeakDisplay({ 
  speaks, 
  players, 
  currentPlayerId,
  showPlayerSpeaks = true 
}: SpeakDisplayProps) {
  if (speaks.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">還沒有人發言</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>本輪發言</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {speaks.map((speak) => {
            const player = players.find(p => p.id === speak.playerId);
            if (!player) return null;

            const isCurrentPlayer = speak.playerId === currentPlayerId;
            const shouldShowSpeak = showPlayerSpeaks || isCurrentPlayer;

            return (
              <div
                key={`${speak.playerId}-${speak.round}`}
                className={`p-3 rounded-lg border ${
                  isCurrentPlayer ? 'bg-primary/5 border-primary/20' : 'bg-card'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <PlayerAvatar player={player} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-sm">{player.name}</span>
                      {isCurrentPlayer && (
                        <Badge variant="outline" className="text-xs">你</Badge>
                      )}
                    </div>
                    {shouldShowSpeak ? (
                      <p className="text-sm">{speak.text}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        [其他玩家的發言內容]
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(speak.at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
