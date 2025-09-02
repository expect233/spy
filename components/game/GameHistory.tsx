'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  MessageSquare, 
  Vote, 
  Trophy, 
  Skull, 
  Crown,
  Clock,
  Users,
  Target,
  Eye
} from 'lucide-react';
import { Room, Round, VoteResult, GameResult, Player } from '../../types/game';

interface GameHistoryProps {
  room: Room;
  gameResult?: GameResult | null;
  className?: string;
}

export function GameHistory({ room, gameResult, className = '' }: GameHistoryProps) {
  const getPlayerName = (playerId: string) => {
    const player = room.players.find(p => p.id === playerId);
    return player?.name || '未知玩家';
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'civilian': return 'bg-green-600';
      case 'undercover': return 'bg-red-600';
      case 'blank': return 'bg-gray-600';
      default: return 'bg-slate-600';
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'civilian': return '平民';
      case 'undercover': return '臥底';
      case 'blank': return '白板';
      default: return '未知';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 遊戲結果 */}
      {gameResult && (
        <Card className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border-purple-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              遊戲結果
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <Badge 
                variant="default" 
                className={`text-xl px-6 py-2 ${
                  gameResult.winner === 'civilian' ? 'bg-green-600' : 'bg-red-600'
                }`}
              >
                {gameResult.winner === 'civilian' ? '平民勝利！' : '臥底勝利！'}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-slate-300 text-sm">總輪數</p>
                <p className="text-white text-2xl font-bold">{gameResult.totalRounds}</p>
              </div>
              <div>
                <p className="text-slate-300 text-sm">遊戲時長</p>
                <p className="text-white text-2xl font-bold">
                  {Math.floor(gameResult.duration / 60000)}分
                </p>
              </div>
            </div>

            <Separator className="bg-slate-600" />

            <div>
              <h4 className="text-white font-medium mb-3">最終身份揭曉</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {gameResult.finalAssignments.map((assignment) => (
                  <div
                    key={assignment.playerId}
                    className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                  >
                    <span className="text-white">{getPlayerName(assignment.playerId)}</span>
                    <div className="flex items-center gap-2">
                      <Badge className={getRoleColor(assignment.role)}>
                        {getRoleName(assignment.role)}
                      </Badge>
                      <span className="text-slate-300 text-sm">
                        {assignment.word || '無詞語'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {gameResult.eliminatedHistory.length > 0 && (
              <div>
                <h4 className="text-white font-medium mb-3">淘汰歷史</h4>
                <div className="space-y-2">
                  {gameResult.eliminatedHistory.map((elimination, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-red-900/20 border border-red-700 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <Skull className="w-4 h-4 text-red-400" />
                        <span className="text-white">{getPlayerName(elimination.playerId)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-300 text-sm">第{elimination.round}輪</span>
                        <Badge className={getRoleColor(elimination.role)}>
                          {getRoleName(elimination.role)}
                        </Badge>
                        <span className="text-slate-300 text-sm">
                          {elimination.word || '無詞語'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 輪次歷史 */}
      {room.rounds.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Clock className="w-5 h-5" />
              遊戲歷史
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {room.rounds.map((round, index) => (
              <RoundHistory
                key={index}
                round={round}
                roundNumber={index + 1}
                players={room.players}
                isCurrentRound={index + 1 === room.currentRound}
              />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface RoundHistoryProps {
  round: Round;
  roundNumber: number;
  players: Player[];
  isCurrentRound: boolean;
}

function RoundHistory({ round, roundNumber, players, isCurrentRound }: RoundHistoryProps) {
  const getPlayerName = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    return player?.name || '未知玩家';
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className={`border rounded-lg p-4 ${
      isCurrentRound 
        ? 'border-purple-500 bg-purple-900/20' 
        : 'border-slate-600 bg-slate-700/30'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-white font-medium flex items-center gap-2">
          第 {roundNumber} 輪
          {isCurrentRound && (
            <Badge variant="default" className="bg-purple-600">
              進行中
            </Badge>
          )}
        </h4>
        <div className="text-slate-400 text-sm">
          開始時間: {formatTime(round.startTime)}
          {round.endTime && (
            <span className="ml-2">
              結束時間: {formatTime(round.endTime)}
            </span>
          )}
        </div>
      </div>

      {/* 發言記錄 */}
      {round.speaks.length > 0 && (
        <div className="mb-4">
          <h5 className="text-slate-300 text-sm font-medium mb-2 flex items-center gap-1">
            <MessageSquare className="w-4 h-4" />
            發言記錄 ({round.speaks.length})
          </h5>
          <div className="space-y-2">
            {round.speaks.map((speak, index) => (
              <div
                key={index}
                className="p-3 bg-slate-800/50 rounded border border-slate-600"
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-white font-medium">
                    {getPlayerName(speak.playerId)}
                  </span>
                  <span className="text-slate-400 text-xs">
                    {formatTime(speak.timestamp)}
                  </span>
                </div>
                <p className="text-slate-300 text-sm">{speak.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 投票記錄 */}
      {round.votes.length > 0 && (
        <div className="mb-4">
          <h5 className="text-slate-300 text-sm font-medium mb-2 flex items-center gap-1">
            <Vote className="w-4 h-4" />
            投票記錄 ({round.votes.length})
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {round.votes.map((vote, index) => (
              <div
                key={index}
                className="p-2 bg-slate-800/50 rounded border border-slate-600 text-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-white">
                    {getPlayerName(vote.voterId)}
                  </span>
                  <div className="flex items-center gap-1">
                    <Target className="w-3 h-3 text-slate-400" />
                    <span className="text-slate-300">
                      {vote.targetId ? getPlayerName(vote.targetId) : '棄權'}
                    </span>
                  </div>
                </div>
                <div className="text-slate-400 text-xs mt-1">
                  {formatTime(vote.timestamp)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 淘汰結果 */}
      {round.eliminatedId && (
        <div className="p-3 bg-red-900/20 border border-red-700 rounded">
          <div className="flex items-center gap-2">
            <Skull className="w-4 h-4 text-red-400" />
            <span className="text-white font-medium">
              {getPlayerName(round.eliminatedId)} 被淘汰
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

interface VoteResultDisplayProps {
  voteResult: VoteResult;
  players: Player[];
  className?: string;
}

export function VoteResultDisplay({ voteResult, players, className = '' }: VoteResultDisplayProps) {
  const getPlayerName = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    return player?.name || '未知玩家';
  };

  return (
    <Card className={`bg-slate-800/50 border-slate-700 backdrop-blur-sm ${className}`}>
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Vote className="w-5 h-5" />
          第 {voteResult.round} 輪投票結果
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 投票統計 */}
        <div>
          <h4 className="text-white font-medium mb-3">投票統計</h4>
          <div className="space-y-2">
            {Object.entries(voteResult.tally)
              .sort(([,a], [,b]) => b - a)
              .map(([playerId, count]) => (
              <div
                key={playerId}
                className="flex items-center justify-between p-3 bg-slate-700/50 rounded"
              >
                <span className="text-white">
                  {playerId === 'abstain' ? '棄權' : getPlayerName(playerId)}
                </span>
                <Badge variant="secondary">
                  {count} 票
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* 最高票候選人 */}
        {voteResult.topCandidates.length > 0 && (
          <div>
            <h4 className="text-white font-medium mb-3">最高票候選人</h4>
            <div className="flex flex-wrap gap-2">
              {voteResult.topCandidates.map((candidateId) => (
                <Badge key={candidateId} variant="default" className="bg-orange-600">
                  {getPlayerName(candidateId)} ({voteResult.tally[candidateId]} 票)
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* 淘汰結果 */}
        <Separator className="bg-slate-600" />
        
        <div className="text-center">
          {voteResult.eliminatedId ? (
            <div className="p-4 bg-red-900/20 border border-red-700 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Skull className="w-5 h-5 text-red-400" />
                <span className="text-white font-medium text-lg">
                  {getPlayerName(voteResult.eliminatedId)} 被淘汰
                </span>
              </div>
              {voteResult.isTie && (
                <p className="text-slate-300 text-sm">
                  票數相同，由房主決定
                </p>
              )}
            </div>
          ) : (
            <div className="p-4 bg-slate-700/50 rounded-lg">
              <p className="text-slate-300">
                本輪無人被淘汰
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
