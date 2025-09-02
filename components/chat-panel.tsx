'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageCircle, 
  Send, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle,
  Clock 
} from 'lucide-react';
import { PlayerAvatar } from './player-avatar';
import { apiClient } from '@/lib/api-client';
import { validateChatMessage } from '@/lib/game-logic';
import { getCurrentPlayerId, getCurrentPlayerName } from '@/lib/auth';
import type { Message, Player, GameState } from '@/types/game';

interface ChatPanelProps {
  roomCode: string;
  gameState: GameState;
  players: Player[];
  messages: Message[];
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onNewMessage?: (message: Message) => void;
  className?: string;
}

export function ChatPanel({
  roomCode,
  gameState,
  players,
  messages,
  isCollapsed = false,
  onToggleCollapse,
  onNewMessage,
  className = '',
}: ChatPanelProps) {
  const [inputText, setInputText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [lastSentTime, setLastSentTime] = useState(0);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentPlayerId = getCurrentPlayerId();
  const currentPlayerName = getCurrentPlayerName();

  // 檢查是否可以發送聊天
  const canChat = gameState === 'lobby' || gameState === 'reveal' || gameState === 'ended';
  const RATE_LIMIT = 5000; // 5 seconds

  useEffect(() => {
    // 自動滾動到最新消息
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // 冷卻計時器
    if (cooldownRemaining > 0) {
      const timer = setInterval(() => {
        setCooldownRemaining(prev => Math.max(0, prev - 1000));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cooldownRemaining]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || !canChat || isSubmitting) return;

    // 檢查速率限制
    const now = Date.now();
    const timeSinceLastSent = now - lastSentTime;
    if (timeSinceLastSent < RATE_LIMIT) {
      const remaining = RATE_LIMIT - timeSinceLastSent;
      setCooldownRemaining(remaining);
      setError(`請等待 ${Math.ceil(remaining / 1000)} 秒後再發送`);
      return;
    }

    // 驗證消息內容
    const validation = validateChatMessage(inputText.trim());
    if (!validation.isValid) {
      setError(validation.error || '消息內容無效');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await apiClient.sendChatMessage(roomCode, inputText.trim());
      setInputText('');
      setLastSentTime(now);
      
      // 創建本地消息預覽（實際消息會通過 SSE 接收）
      if (currentPlayerId && currentPlayerName) {
        const currentPlayer = players.find(p => p.id === currentPlayerId);
        const previewMessage: Message = {
          id: `preview-${Date.now()}`,
          playerId: currentPlayerId,
          name: currentPlayerName,
          avatar: currentPlayer?.avatar,
          text: inputText.trim(),
          at: Date.now(),
        };
        onNewMessage?.(previewMessage);
      }
    } catch (error) {
      console.error('Send message failed:', error);
      setError(error instanceof Error ? error.message : '發送失敗');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getStateMessage = (state: GameState): string => {
    switch (state) {
      case 'speaking':
        return '發言階段 - 聊天已禁用';
      case 'voting':
        return '投票階段 - 聊天已禁用';
      default:
        return '';
    }
  };

  const stateMessage = getStateMessage(gameState);
  const canSendMessage = canChat && inputText.trim().length > 0 && !isSubmitting && cooldownRemaining === 0;

  if (isCollapsed) {
    return (
      <Card className={`w-80 ${className}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2 text-sm">
              <MessageCircle className="h-4 w-4" />
              <span>聊天室</span>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={`w-80 h-96 flex flex-col ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2 text-sm">
            <MessageCircle className="h-4 w-4" />
            <span>聊天室</span>
            {messages.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {messages.length}
              </Badge>
            )}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
        
        {stateMessage && (
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <AlertCircle className="h-3 w-3" />
            <span>{stateMessage}</span>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-3 space-y-3">
        {/* 消息列表 */}
        <ScrollArea className="flex-1 pr-3">
          <div className="space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-8">
                還沒有聊天消息
              </div>
            ) : (
              messages.map((message) => {
                const player = players.find(p => p.id === message.playerId);
                const isCurrentPlayer = message.playerId === currentPlayerId;
                
                return (
                  <div
                    key={message.id}
                    className={`flex space-x-2 ${
                      isCurrentPlayer ? 'flex-row-reverse space-x-reverse' : ''
                    }`}
                  >
                    <div className="flex-shrink-0">
                      {player ? (
                        <PlayerAvatar player={player} size="sm" />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                          <span className="text-xs">{message.name[0]}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className={`flex-1 min-w-0 ${isCurrentPlayer ? 'text-right' : ''}`}>
                      <div className="flex items-center space-x-1 mb-1">
                        <span className="text-xs font-medium truncate">
                          {isCurrentPlayer ? '你' : message.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(message.at).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                      <div className={`inline-block max-w-full p-2 rounded-lg text-sm ${
                        isCurrentPlayer 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                      }`}>
                        <p className="break-words">{message.text}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* 輸入區域 */}
        <div className="space-y-2">
          {error && (
            <div className="flex items-center space-x-2 text-xs text-destructive">
              <AlertCircle className="h-3 w-3" />
              <span>{error}</span>
            </div>
          )}
          
          {cooldownRemaining > 0 && (
            <div className="flex items-center space-x-2 text-xs text-orange-600">
              <Clock className="h-3 w-3" />
              <span>冷卻中 {Math.ceil(cooldownRemaining / 1000)}s</span>
            </div>
          )}
          
          <div className="flex space-x-2">
            <Input
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={canChat ? "輸入消息..." : "聊天已禁用"}
              disabled={!canChat || isSubmitting}
              maxLength={200}
              className="text-sm"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!canSendMessage}
              size="sm"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
              ) : (
                <Send className="h-3 w-3" />
              )}
            </Button>
          </div>
          
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{inputText.length}/200</span>
            {canChat && <span>Enter 發送</span>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ChatToggleProps {
  hasNewMessages?: boolean;
  messageCount?: number;
  onClick?: () => void;
  className?: string;
}

export function ChatToggle({ 
  hasNewMessages = false, 
  messageCount = 0, 
  onClick,
  className = '' 
}: ChatToggleProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className={`relative ${className}`}
    >
      <MessageCircle className="h-4 w-4 mr-2" />
      聊天
      {messageCount > 0 && (
        <Badge variant="secondary" className="ml-2 text-xs">
          {messageCount > 99 ? '99+' : messageCount}
        </Badge>
      )}
      {hasNewMessages && (
        <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse" />
      )}
    </Button>
  );
}
