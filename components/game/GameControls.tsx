'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Play, 
  MessageSquare, 
  Vote, 
  Settings, 
  Users,
  Clock,
  Eye,
  Crown,
  Send,
  Check,
  X
} from 'lucide-react';
import { GameState, Player, Room } from '../../types/game';

interface GameControlsProps {
  room: Room;
  currentUserId?: string;
  userRole: 'host' | 'player' | 'spectator' | null;
  myRole?: { role: string; word: string } | null;
  onStartGame?: () => void;
  onToggleReady?: () => void;
  onSubmitSpeak?: (text: string) => void;
  onSubmitVote?: (targetId: string | null) => void;
  hasSpoken?: boolean;
  hasVoted?: boolean;
  className?: string;
}

export function GameControls({
  room,
  currentUserId,
  userRole,
  myRole,
  onStartGame,
  onToggleReady,
  onSubmitSpeak,
  onSubmitVote,
  hasSpoken = false,
  hasVoted = false,
  className = ''
}: GameControlsProps) {
  const [speakText, setSpeakText] = useState('');
  const [selectedVoteTarget, setSelectedVoteTarget] = useState<string | null>(null);

  const getCurrentPlayer = () => {
    if (!currentUserId) return null;
    return room.players.find(p => p.id === currentUserId);
  };

  const getAlivePlayers = () => {
    const eliminatedIds = room.rounds
      .map(r => r.eliminatedId)
      .filter(Boolean) as string[];
    return room.players.filter(p => !eliminatedIds.includes(p.id));
  };

  const canStartGame = () => {
    return userRole === 'host' && 
           room.state === 'lobby' && 
           room.players.length >= 3 && 
           room.players.every(p => p.isReady);
  };

  const handleSubmitSpeak = () => {
    if (speakText.trim() && onSubmitSpeak) {
      onSubmitSpeak(speakText.trim());
      setSpeakText('');
    }
  };

  const handleSubmitVote = () => {
    if (onSubmitVote) {
      onSubmitVote(selectedVoteTarget);
      setSelectedVoteTarget(null);
    }
  };

  const getStateDescription = () => {
    switch (room.state) {
      case 'lobby':
        return '等待所有玩家準備就緒';
      case 'speaking':
        return '玩家依序描述自己的詞語，注意不要暴露身份';
      case 'voting':
        return '投票淘汰你認為是臥底的玩家';
      case 'reveal':
        return '投票結果揭曉中...';
      case 'ended':
        return '遊戲已結束';
      default:
        return '';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 遊戲狀態卡片 */}
      <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Settings className="w-5 h-5" />
            遊戲狀態
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-slate-300">當前階段</span>
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {room.state === 'lobby' && '等待開始'}
              {room.state === 'speaking' && '發言階段'}
              {room.state === 'voting' && '投票階段'}
              {room.state === 'reveal' && '結果揭曉'}
              {room.state === 'ended' && '遊戲結束'}
            </Badge>
          </div>
          
          {room.state !== 'lobby' && (
            <div className="flex items-center justify-between">
              <span className="text-slate-300">當前輪次</span>
              <span className="text-white font-medium">第 {room.currentRound} 輪</span>
            </div>
          )}
          
          <p className="text-slate-400 text-sm">
            {getStateDescription()}
          </p>
        </CardContent>
      </Card>

      {/* 角色資訊卡片 */}
      {myRole && (
        <Card className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border-purple-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Eye className="w-5 h-5" />
              你的角色
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">身份</span>
              <Badge 
                variant="default"
                className={
                  myRole.role === 'civilian' ? 'bg-green-600' :
                  myRole.role === 'undercover' ? 'bg-red-600' :
                  'bg-gray-600'
                }
              >
                {myRole.role === 'civilian' && '平民'}
                {myRole.role === 'undercover' && '臥底'}
                {myRole.role === 'blank' && '白板'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-slate-300">你的詞語</span>
              <span className="text-white font-bold text-lg">
                {myRole.word || '無詞語'}
              </span>
            </div>
            
            <div className="text-xs text-slate-400 bg-slate-800/50 p-2 rounded">
              {myRole.role === 'civilian' && '你是平民，描述你的詞語但不要太明顯，找出臥底！'}
              {myRole.role === 'undercover' && '你是臥底，小心不要暴露身份，混入平民中！'}
              {myRole.role === 'blank' && '你是白板，沒有詞語，根據其他人的描述猜測並融入！'}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 大廳階段控制 */}
      {room.state === 'lobby' && (
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="w-5 h-5" />
              大廳控制
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {userRole === 'host' && (
              <Button
                onClick={onStartGame}
                disabled={!canStartGame()}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
              >
                <Play className="w-4 h-4 mr-2" />
                開始遊戲
              </Button>
            )}
            
            {userRole === 'player' && (
              <Button
                onClick={onToggleReady}
                className={`w-full ${
                  getCurrentPlayer()?.isReady
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {getCurrentPlayer()?.isReady ? (
                  <>
                    <X className="w-4 h-4 mr-2" />
                    取消準備
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    準備
                  </>
                )}
              </Button>
            )}
            
            {userRole === 'spectator' && (
              <div className="text-center text-slate-400 py-4">
                <Eye className="w-8 h-8 mx-auto mb-2" />
                <p>你正在觀戰</p>
                <p className="text-sm">等待遊戲開始...</p>
              </div>
            )}
            
            {!canStartGame() && userRole === 'host' && (
              <div className="text-sm text-slate-400 space-y-1">
                {room.players.length < 3 && (
                  <p>• 至少需要 3 名玩家</p>
                )}
                {room.players.some(p => !p.isReady) && (
                  <p>• 等待所有玩家準備就緒</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 發言階段控制 */}
      {room.state === 'speaking' && userRole === 'player' && !hasSpoken && (
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              發言
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              placeholder="描述你的詞語，但不要太明顯..."
              value={speakText}
              onChange={(e) => setSpeakText(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              rows={3}
              maxLength={200}
            />
            
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400">
                {speakText.length}/200 字
              </span>
              <Button
                onClick={handleSubmitSpeak}
                disabled={!speakText.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Send className="w-4 h-4 mr-2" />
                提交發言
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 投票階段控制 */}
      {room.state === 'voting' && userRole === 'player' && !hasVoted && (
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Vote className="w-5 h-5" />
              投票
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-slate-300 text-sm">
              選擇你認為是臥底的玩家：
            </p>
            
            <div className="space-y-2">
              {getAlivePlayers()
                .filter(p => p.id !== currentUserId)
                .map((player) => (
                <label
                  key={player.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-slate-600 hover:bg-slate-700/30 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="vote"
                    value={player.id}
                    checked={selectedVoteTarget === player.id}
                    onChange={(e) => setSelectedVoteTarget(e.target.value)}
                    className="text-purple-600"
                  />
                  <div className="flex items-center gap-2">
                    {player.isHost && <Crown className="w-4 h-4 text-yellow-400" />}
                    <span className="text-white">{player.name}</span>
                  </div>
                </label>
              ))}
              
              <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-600 hover:bg-slate-700/30 cursor-pointer">
                <input
                  type="radio"
                  name="vote"
                  value=""
                  checked={selectedVoteTarget === null}
                  onChange={() => setSelectedVoteTarget(null)}
                  className="text-purple-600"
                />
                <span className="text-slate-300">棄權</span>
              </label>
            </div>
            
            <Button
              onClick={handleSubmitVote}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              <Vote className="w-4 h-4 mr-2" />
              確認投票
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 等待狀態 */}
      {((room.state === 'speaking' && hasSpoken) || 
        (room.state === 'voting' && hasVoted) ||
        room.state === 'reveal') && (
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardContent className="p-6 text-center">
            <Clock className="w-8 h-8 mx-auto mb-3 text-slate-400" />
            <p className="text-slate-300 mb-2">
              {room.state === 'speaking' && hasSpoken && '已提交發言，等待其他玩家...'}
              {room.state === 'voting' && hasVoted && '已提交投票，等待其他玩家...'}
              {room.state === 'reveal' && '投票結果揭曉中...'}
            </p>
            <p className="text-slate-400 text-sm">
              請耐心等待
            </p>
          </CardContent>
        </Card>
      )}

      {/* 觀戰者提示 */}
      {userRole === 'spectator' && room.state !== 'lobby' && (
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardContent className="p-6 text-center">
            <Eye className="w-8 h-8 mx-auto mb-3 text-slate-400" />
            <p className="text-slate-300 mb-2">觀戰模式</p>
            <p className="text-slate-400 text-sm">
              你正在觀看遊戲進行
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
