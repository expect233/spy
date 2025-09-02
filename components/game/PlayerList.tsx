'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  Crown, 
  Eye, 
  Wifi, 
  WifiOff, 
  Check, 
  X,
  MessageSquare,
  Vote,
  Skull
} from 'lucide-react';
import { Player, Spectator, GameState } from '../../types/game';

interface PlayerListProps {
  players: Player[];
  spectators?: Spectator[];
  currentUserId?: string;
  gameState: GameState;
  maxPlayers: number;
  onPlayerClick?: (playerId: string) => void;
  onKickPlayer?: (playerId: string) => void;
  isHost?: boolean;
  eliminatedPlayerIds?: string[];
  currentRoundSpeaks?: Array<{ playerId: string; text: string; timestamp: number }>;
  currentRoundVotes?: Array<{ voterId: string; targetId: string | null; timestamp: number }>;
  className?: string;
}

export function PlayerList({
  players,
  spectators = [],
  currentUserId,
  gameState,
  maxPlayers,
  onPlayerClick,
  onKickPlayer,
  isHost = false,
  eliminatedPlayerIds = [],
  currentRoundSpeaks = [],
  currentRoundVotes = [],
  className = ''
}: PlayerListProps) {
  
  const getPlayerStatus = (player: Player) => {
    const isEliminated = eliminatedPlayerIds.includes(player.id);
    const hasSpoken = currentRoundSpeaks.some(speak => speak.playerId === player.id);
    const hasVoted = currentRoundVotes.some(vote => vote.voterId === player.id);
    
    return {
      isEliminated,
      hasSpoken,
      hasVoted,
      isCurrentUser: player.id === currentUserId,
      isHost: player.isHost,
      isReady: player.isReady,
      isConnected: player.connected
    };
  };

  const getPlayerBadges = (player: Player) => {
    const status = getPlayerStatus(player);
    const badges = [];

    if (status.isHost) {
      badges.push(
        <Badge key="host" variant="default" className="bg-yellow-600 text-white">
          <Crown className="w-3 h-3 mr-1" />
          房主
        </Badge>
      );
    }

    if (status.isEliminated) {
      badges.push(
        <Badge key="eliminated" variant="destructive">
          <Skull className="w-3 h-3 mr-1" />
          已淘汰
        </Badge>
      );
    } else {
      // 只有活著的玩家才顯示這些狀態
      if (gameState === 'lobby') {
        badges.push(
          <Badge 
            key="ready" 
            variant={status.isReady ? "default" : "secondary"}
            className={status.isReady ? "bg-green-600" : ""}
          >
            {status.isReady ? <Check className="w-3 h-3 mr-1" /> : <X className="w-3 h-3 mr-1" />}
            {status.isReady ? '準備' : '未準備'}
          </Badge>
        );
      }

      if (gameState === 'speaking') {
        badges.push(
          <Badge 
            key="speak" 
            variant={status.hasSpoken ? "default" : "outline"}
            className={status.hasSpoken ? "bg-blue-600" : ""}
          >
            <MessageSquare className="w-3 h-3 mr-1" />
            {status.hasSpoken ? '已發言' : '未發言'}
          </Badge>
        );
      }

      if (gameState === 'voting') {
        badges.push(
          <Badge 
            key="vote" 
            variant={status.hasVoted ? "default" : "outline"}
            className={status.hasVoted ? "bg-purple-600" : ""}
          >
            <Vote className="w-3 h-3 mr-1" />
            {status.hasVoted ? '已投票' : '未投票'}
          </Badge>
        );
      }
    }

    badges.push(
      <Badge 
        key="connection" 
        variant={status.isConnected ? "default" : "destructive"}
        className={status.isConnected ? "bg-green-500" : ""}
      >
        {status.isConnected ? <Wifi className="w-3 h-3 mr-1" /> : <WifiOff className="w-3 h-3 mr-1" />}
        {status.isConnected ? '在線' : '離線'}
      </Badge>
    );

    return badges;
  };

  return (
    <div className={className}>
      {/* 玩家列表 */}
      <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            玩家 ({players.length}/{maxPlayers})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {players.map((player) => {
              const status = getPlayerStatus(player);
              return (
                <div
                  key={player.id}
                  className={`p-4 rounded-lg border transition-all cursor-pointer hover:bg-slate-700/30 ${
                    status.isCurrentUser
                      ? 'bg-purple-600/20 border-purple-500'
                      : status.isEliminated
                      ? 'bg-red-900/20 border-red-700 opacity-60'
                      : 'bg-slate-700/50 border-slate-600'
                  }`}
                  onClick={() => onPlayerClick?.(player.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-medium truncate">
                        {player.name}
                        {status.isCurrentUser && (
                          <span className="text-purple-400 ml-1">(你)</span>
                        )}
                      </h3>
                      <p className="text-slate-400 text-xs">
                        加入時間: {new Date(player.joinedAt).toLocaleTimeString()}
                      </p>
                    </div>
                    
                    {isHost && !status.isHost && !status.isCurrentUser && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onKickPlayer?.(player.id);
                        }}
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {getPlayerBadges(player)}
                  </div>
                </div>
              );
            })}
          </div>
          
          {players.length === 0 && (
            <div className="text-center text-slate-400 py-8">
              還沒有玩家加入房間
            </div>
          )}
        </CardContent>
      </Card>

      {/* 觀戰者列表 */}
      {spectators.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm mt-4">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Eye className="w-5 h-5" />
              觀戰者 ({spectators.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {spectators.map((spectator) => (
                <div
                  key={spectator.id}
                  className={`p-3 rounded-lg border ${
                    spectator.id === currentUserId
                      ? 'bg-purple-600/20 border-purple-500'
                      : 'bg-slate-700/50 border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-slate-400" />
                    <span className="text-white text-sm truncate">
                      {spectator.name}
                      {spectator.id === currentUserId && (
                        <span className="text-purple-400 ml-1">(你)</span>
                      )}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs mt-1">
                    {new Date(spectator.joinedAt).toLocaleTimeString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface PlayerCardProps {
  player: Player;
  isCurrentUser?: boolean;
  isHost?: boolean;
  canKick?: boolean;
  gameState: GameState;
  hasSpoken?: boolean;
  hasVoted?: boolean;
  isEliminated?: boolean;
  onClick?: () => void;
  onKick?: () => void;
  className?: string;
}

export function PlayerCard({
  player,
  isCurrentUser = false,
  isHost = false,
  canKick = false,
  gameState,
  hasSpoken = false,
  hasVoted = false,
  isEliminated = false,
  onClick,
  onKick,
  className = ''
}: PlayerCardProps) {
  return (
    <div
      className={`p-4 rounded-lg border transition-all cursor-pointer hover:bg-slate-700/30 ${
        isCurrentUser
          ? 'bg-purple-600/20 border-purple-500'
          : isEliminated
          ? 'bg-red-900/20 border-red-700 opacity-60'
          : 'bg-slate-700/50 border-slate-600'
      } ${className}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-medium truncate">
            {player.name}
            {isCurrentUser && (
              <span className="text-purple-400 ml-1">(你)</span>
            )}
          </h3>
          {player.isHost && (
            <div className="flex items-center gap-1 mt-1">
              <Crown className="w-3 h-3 text-yellow-400" />
              <span className="text-yellow-400 text-xs">房主</span>
            </div>
          )}
        </div>
        
        {canKick && !player.isHost && !isCurrentUser && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onKick?.();
            }}
            className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
      
      <div className="flex flex-wrap gap-1">
        {isEliminated && (
          <Badge variant="destructive">
            <Skull className="w-3 h-3 mr-1" />
            已淘汰
          </Badge>
        )}
        
        {!isEliminated && gameState === 'lobby' && (
          <Badge 
            variant={player.isReady ? "default" : "secondary"}
            className={player.isReady ? "bg-green-600" : ""}
          >
            {player.isReady ? <Check className="w-3 h-3 mr-1" /> : <X className="w-3 h-3 mr-1" />}
            {player.isReady ? '準備' : '未準備'}
          </Badge>
        )}
        
        {!isEliminated && gameState === 'speaking' && (
          <Badge 
            variant={hasSpoken ? "default" : "outline"}
            className={hasSpoken ? "bg-blue-600" : ""}
          >
            <MessageSquare className="w-3 h-3 mr-1" />
            {hasSpoken ? '已發言' : '未發言'}
          </Badge>
        )}
        
        {!isEliminated && gameState === 'voting' && (
          <Badge 
            variant={hasVoted ? "default" : "outline"}
            className={hasVoted ? "bg-purple-600" : ""}
          >
            <Vote className="w-3 h-3 mr-1" />
            {hasVoted ? '已投票' : '未投票'}
          </Badge>
        )}
        
        <Badge 
          variant={player.connected ? "default" : "destructive"}
          className={player.connected ? "bg-green-500" : ""}
        >
          {player.connected ? <Wifi className="w-3 h-3 mr-1" /> : <WifiOff className="w-3 h-3 mr-1" />}
          {player.connected ? '在線' : '離線'}
        </Badge>
      </div>
    </div>
  );
}
