'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User, Crown, Wifi, WifiOff } from 'lucide-react';
import { getAvatarDisplayUrl } from '@/lib/avatar';
import type { Player } from '@/types/game';

interface PlayerAvatarProps {
  player: Player;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showName?: boolean;
  showStatus?: boolean;
  showConnection?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
};

const iconSizes = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
  xl: 'h-8 w-8',
};

export function PlayerAvatar({ 
  player, 
  size = 'md', 
  showName = false, 
  showStatus = false,
  showConnection = false,
  className = '' 
}: PlayerAvatarProps) {
  const avatarUrl = getAvatarDisplayUrl(player.avatar, player.name);
  const sizeClass = sizeClasses[size];
  const iconSize = iconSizes[size];

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="relative">
        <Avatar className={sizeClass}>
          <AvatarImage src={avatarUrl} alt={player.name} />
          <AvatarFallback>
            <User className={iconSize} />
          </AvatarFallback>
        </Avatar>
        
        {/* 連線狀態指示器 */}
        {showConnection && (
          <div className="absolute -bottom-1 -right-1">
            <div className={`rounded-full p-1 ${
              player.connected 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-400 text-white'
            }`}>
              {player.connected ? (
                <Wifi className="h-2 w-2" />
              ) : (
                <WifiOff className="h-2 w-2" />
              )}
            </div>
          </div>
        )}
      </div>
      
      {showName && (
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-1">
            <span className="font-medium truncate">{player.name}</span>
            {player.isHost && (
              <Crown className="h-4 w-4 text-yellow-500 flex-shrink-0" />
            )}
          </div>
          
          {showStatus && (
            <div className="flex items-center space-x-1 mt-1">
              {player.isHost && (
                <Badge variant="outline" className="text-xs">
                  房主
                </Badge>
              )}
              {player.isReady && (
                <Badge variant="default" className="text-xs">
                  準備
                </Badge>
              )}
              {showConnection && (
                <Badge 
                  variant={player.connected ? "default" : "secondary"} 
                  className="text-xs"
                >
                  {player.connected ? '在線' : '離線'}
                </Badge>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface PlayerListProps {
  players: Player[];
  currentPlayerId?: string;
  showConnection?: boolean;
  onPlayerClick?: (player: Player) => void;
  className?: string;
}

export function PlayerList({ 
  players, 
  currentPlayerId, 
  showConnection = false,
  onPlayerClick,
  className = '' 
}: PlayerListProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {players.map((player) => (
        <div
          key={player.id}
          className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
            player.id === currentPlayerId 
              ? 'bg-primary/10 border-primary' 
              : 'bg-card hover:bg-muted'
          } ${onPlayerClick ? 'cursor-pointer' : ''}`}
          onClick={() => onPlayerClick?.(player)}
        >
          <PlayerAvatar
            player={player}
            size="md"
            showName
            showStatus
            showConnection={showConnection}
          />
          
          {player.id === currentPlayerId && (
            <Badge variant="outline" className="text-xs">
              你
            </Badge>
          )}
        </div>
      ))}
    </div>
  );
}

interface CompactPlayerListProps {
  players: Player[];
  maxVisible?: number;
  size?: 'sm' | 'md';
  className?: string;
}

export function CompactPlayerList({ 
  players, 
  maxVisible = 5, 
  size = 'sm',
  className = '' 
}: CompactPlayerListProps) {
  const visiblePlayers = players.slice(0, maxVisible);
  const remainingCount = players.length - maxVisible;

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {visiblePlayers.map((player) => (
        <div key={player.id} className="relative group">
          <PlayerAvatar
            player={player}
            size={size}
            showConnection
          />
          
          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
            {player.name}
            {player.isHost && ' (房主)'}
          </div>
        </div>
      ))}
      
      {remainingCount > 0 && (
        <div className={`${sizeClasses[size]} rounded-full bg-muted flex items-center justify-center text-xs font-medium`}>
          +{remainingCount}
        </div>
      )}
    </div>
  );
}
