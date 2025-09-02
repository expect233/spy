'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Play, 
  Square, 
  UserMinus, 
  Crown, 
  Gavel,
  Users,
  Clock,
  AlertTriangle 
} from 'lucide-react';
import { PlayerAvatar } from './player-avatar';
import { apiClient } from '@/lib/api-client';
import { isHost, getCurrentPlayerId } from '@/lib/auth';
import type { Room, Player, RoomConfig, VoteResult } from '@/types/game';

interface HostPanelProps {
  room: Room;
  onConfigUpdate?: (config: Partial<RoomConfig>) => void;
  onGameStart?: () => void;
  onGameEnd?: () => void;
  onPlayerKick?: (playerId: string) => void;
  onHostTransfer?: (playerId: string) => void;
  onTiebreak?: (playerId: string) => void;
}

export function HostPanel({
  room,
  onConfigUpdate,
  onGameStart,
  onGameEnd,
  onPlayerKick,
  onHostTransfer,
  onTiebreak,
}: HostPanelProps) {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isTiebreakOpen, setIsTiebreakOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const currentPlayerId = getCurrentPlayerId();
  const isCurrentPlayerHost = isHost() && room.hostId === currentPlayerId;

  // 配置狀態
  const [undercoverCount, setUndercoverCount] = useState(room.config.undercoverCount);
  const [blankCount, setBlankCount] = useState(room.config.blankCount);
  const [speakTime, setSpeakTime] = useState(room.config.timers.speak);
  const [voteTime, setVoteTime] = useState(room.config.timers.vote);

  if (!isCurrentPlayerHost) {
    return null;
  }

  const handleConfigSave = async () => {
    setIsLoading(true);
    setError('');

    try {
      const newConfig = {
        undercoverCount,
        blankCount,
        timers: {
          ...room.config.timers,
          speak: speakTime,
          vote: voteTime,
        },
      };

      await apiClient.updateConfig(room.code, newConfig);
      onConfigUpdate?.(newConfig);
      setIsConfigOpen(false);
    } catch (error) {
      console.error('Config update failed:', error);
      setError(error instanceof Error ? error.message : '設定更新失敗');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGameStart = async () => {
    if (room.players.length < 3) {
      setError('至少需要 3 名玩家才能開始遊戲');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await apiClient.startGame(room.code);
      onGameStart?.();
    } catch (error) {
      console.error('Game start failed:', error);
      setError(error instanceof Error ? error.message : '開始遊戲失敗');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayerKick = async (playerId: string) => {
    setIsLoading(true);
    setError('');

    try {
      await apiClient.kickPlayer(room.code, playerId);
      onPlayerKick?.(playerId);
    } catch (error) {
      console.error('Kick player failed:', error);
      setError(error instanceof Error ? error.message : '踢出玩家失敗');
    } finally {
      setIsLoading(false);
    }
  };

  const handleHostTransfer = async (playerId: string) => {
    setIsLoading(true);
    setError('');

    try {
      await apiClient.transferHost(room.code, playerId);
      onHostTransfer?.(playerId);
      setIsTransferOpen(false);
    } catch (error) {
      console.error('Host transfer failed:', error);
      setError(error instanceof Error ? error.message : '轉移房主失敗');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTiebreak = async (playerId: string) => {
    setIsLoading(true);
    setError('');

    try {
      await apiClient.tiebreak(room.code, playerId);
      onTiebreak?.(playerId);
      setIsTiebreakOpen(false);
    } catch (error) {
      console.error('Tiebreak failed:', error);
      setError(error instanceof Error ? error.message : '裁決失敗');
    } finally {
      setIsLoading(false);
    }
  };

  const otherPlayers = room.players.filter(p => p.id !== currentPlayerId);
  const canStartGame = room.state === 'lobby' && room.players.length >= 3;
  const canEndGame = room.state !== 'lobby' && room.state !== 'ended';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Crown className="h-5 w-5 text-yellow-500" />
          <span>房主控制</span>
        </CardTitle>
        <CardDescription>
          管理房間設定和遊戲進行
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-center space-x-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <span className="text-sm text-destructive">{error}</span>
          </div>
        )}

        {/* 遊戲控制 */}
        <div className="space-y-2">
          <Label className="text-base font-medium">遊戲控制</Label>
          <div className="flex space-x-2">
            {canStartGame && (
              <Button
                onClick={handleGameStart}
                disabled={isLoading}
                className="flex-1"
              >
                <Play className="h-4 w-4 mr-2" />
                開始遊戲
              </Button>
            )}
            
            {canEndGame && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={isLoading}>
                    <Square className="h-4 w-4 mr-2" />
                    結束遊戲
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>確認結束遊戲</AlertDialogTitle>
                    <AlertDialogDescription>
                      這將立即結束當前遊戲並返回大廳。此操作無法撤銷。
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>取消</AlertDialogCancel>
                    <AlertDialogAction onClick={onGameEnd}>
                      確認結束
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        {/* 房間設定 */}
        <div className="space-y-2">
          <Label className="text-base font-medium">房間設定</Label>
          <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <Settings className="h-4 w-4 mr-2" />
                遊戲設定
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>遊戲設定</DialogTitle>
                <DialogDescription>
                  調整遊戲參數和計時器設定
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* 角色數量 */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">角色數量</Label>
                  
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>臥底數量</Label>
                        <Badge variant="outline">{undercoverCount}</Badge>
                      </div>
                      <Slider
                        value={[undercoverCount]}
                        onValueChange={([value]) => setUndercoverCount(value)}
                        max={Math.min(3, Math.floor(room.players.length / 2))}
                        min={1}
                        step={1}
                        className="w-full"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>白板數量</Label>
                        <Badge variant="outline">{blankCount}</Badge>
                      </div>
                      <Slider
                        value={[blankCount]}
                        onValueChange={([value]) => setBlankCount(value)}
                        max={2}
                        min={0}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* 計時器設定 */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">計時器設定</Label>
                  
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>發言時間 (秒)</Label>
                      <Input
                        type="number"
                        value={speakTime}
                        onChange={(e) => setSpeakTime(Number(e.target.value))}
                        min={30}
                        max={300}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>投票時間 (秒)</Label>
                      <Input
                        type="number"
                        value={voteTime}
                        onChange={(e) => setVoteTime(Number(e.target.value))}
                        min={15}
                        max={120}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsConfigOpen(false)}>
                    取消
                  </Button>
                  <Button onClick={handleConfigSave} disabled={isLoading}>
                    {isLoading ? '保存中...' : '保存設定'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* 玩家管理 */}
        {otherPlayers.length > 0 && (
          <div className="space-y-2">
            <Label className="text-base font-medium">玩家管理</Label>
            <div className="space-y-2">
              {otherPlayers.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-2 border rounded"
                >
                  <PlayerAvatar player={player} size="sm" showName />
                  
                  <div className="flex space-x-1">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <UserMinus className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>確認踢出玩家</AlertDialogTitle>
                          <AlertDialogDescription>
                            確定要踢出 {player.name} 嗎？被踢出的玩家需要重新加入房間。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>取消</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handlePlayerKick(player.id)}
                          >
                            確認踢出
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 轉移房主 */}
        {otherPlayers.length > 0 && (
          <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <Crown className="h-4 w-4 mr-2" />
                轉移房主
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>轉移房主權限</DialogTitle>
                <DialogDescription>
                  選擇要轉移房主權限的玩家
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                {otherPlayers.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-3 border rounded cursor-pointer hover:bg-muted"
                    onClick={() => handleHostTransfer(player.id)}
                  >
                    <PlayerAvatar player={player} size="sm" showName />
                    <Button variant="outline" size="sm">
                      選擇
                    </Button>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}
