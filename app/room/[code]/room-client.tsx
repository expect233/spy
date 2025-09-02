'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { getPlayerSession, getCurrentPlayerId, isHost } from '@/lib/auth';
import { Room, Player, Assignment } from '@/types/game';

export default function RoomClient() {
  const params = useParams();
  const router = useRouter();
  const roomCode = params.code as string;
  
  const [room, setRoom] = useState<Room | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [myAssignment, setMyAssignment] = useState<Assignment | null>(null);
  const [selectedVote, setSelectedVote] = useState<string>('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadRoom = async () => {
      try {
        // Check if user has a valid session
        const session = getPlayerSession();
        if (!session) {
          setError('請先加入房間');
          router.push('/');
          return;
        }

        // Load room data
        const roomData = await apiClient.getRoom(roomCode);
        setRoom(roomData);

        // Find current player
        const player = roomData.players.find(p => p.id === session.playerId);
        setCurrentPlayer(player || null);

        // Get assignment if game started
        const assignment = roomData.assignments?.find(a => a.playerId === session.playerId);
        setMyAssignment(assignment || null);
      } catch (error) {
        console.error('載入房間錯誤:', error);
        setError('載入房間失敗');
      }
    };

    loadRoom();

    // TODO: Add real-time subscription when Firebase is available
    // const unsubscribe = eventSource.subscribe(roomCode, (updatedRoom) => {
    //   setRoom(updatedRoom);
    //
    //   const session = getPlayerSession();
    //   if (session) {
    //     const player = updatedRoom.players.find(p => p.id === session.playerId);
    //     setCurrentPlayer(player || null);
    //
    //     const assignment = updatedRoom.assignments?.find(a => a.playerId === session.playerId);
    //     setMyAssignment(assignment || null);
    //   }
    // });
    //
    // return unsubscribe;
  }, [roomCode, router]);

  const startGame = async () => {
    if (!room || !isHost()) return;

    setIsLoading(true);
    try {
      await apiClient.startGame(roomCode);
      // Reload room data after starting
      const updatedRoom = await apiClient.getRoom(roomCode);
      setRoom(updatedRoom);
    } catch (error) {
      console.error('開始遊戲錯誤:', error);
      setError('開始遊戲失敗');
    } finally {
      setIsLoading(false);
    }
  };

  const submitVote = async () => {
    if (!selectedVote || !currentPlayer) return;

    setIsLoading(true);
    try {
      // TODO: Implement voting with API client
      // await apiClient.vote(roomCode, currentPlayer.id, selectedVote);
      setSelectedVote('');
    } catch (error) {
      console.error('投票錯誤:', error);
      setError('投票失敗');
    } finally {
      setIsLoading(false);
    }
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    alert('房間代碼已複製');
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <Card>
          <CardContent className="text-center p-6">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => router.push('/')}>返回首頁</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div>載入中...</div>
      </div>
    );
  }

  const currentRound = room.rounds[room.rounds.length - 1];
  const hasVoted = currentRound?.votes.some(v => v.voterId === currentPlayer?.id);
  const alivePlayers = room.players.filter(p =>
    !room.rounds.some(r => r.eliminatedId === p.id)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle data-testid="room-code">房間 {roomCode}</CardTitle>
              <Button variant="outline" onClick={copyRoomCode}>
                複製代碼
              </Button>
            </div>
            {currentPlayer && (
              <div className="mt-2" data-testid="player-profile">
                <p className="text-sm text-muted-foreground">
                  你是：<span className="font-medium">{currentPlayer.name}</span>
                  {currentPlayer.isHost && <Badge variant="outline" className="ml-2">房主</Badge>}
                </p>
              </div>
            )}
          </CardHeader>
        </Card>

        {myAssignment && (
          <Card data-testid="private-card">
            <CardHeader>
              <CardTitle>你的角色</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <Badge variant={myAssignment.role === 'undercover' ? 'destructive' : 'default'} className="text-lg px-4 py-2">
                  {myAssignment.role === 'undercover' ? '臥底' : '平民'}
                </Badge>
                <p className="mt-2 text-xl font-bold">{myAssignment.word}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>玩家列表 ({alivePlayers.length})</CardTitle>
              <Badge variant="outline" data-testid="game-state">
                {room.state === 'lobby' ? '等待中' :
                 room.state === 'speaking' ? '發言階段' :
                 room.state === 'voting' ? '投票階段' :
                 room.state === 'reveal' ? '結果揭曉' :
                 room.state === 'ended' ? '遊戲結束' : room.state}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2" data-testid="player-list">
              {alivePlayers.map((player) => (
                <div key={player.id} className="flex items-center justify-between p-2 bg-white rounded">
                  <span>{player.name}</span>
                  {player.isHost && <Badge variant="outline">房主</Badge>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {room.state === 'lobby' && isHost() && (
          <Card data-testid="host-panel">
            <CardHeader>
              <CardTitle>遊戲控制</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={startGame}
                disabled={isLoading || room.players.length < 3}
                className="w-full"
                data-testid="start-game-btn"
              >
                {isLoading ? '開始中...' : '開始遊戲'}
              </Button>
              {room.players.length < 3 && (
                <p className="text-sm text-gray-500 mt-2">至少需要3名玩家才能開始遊戲</p>
              )}
            </CardContent>
          </Card>
        )}

        {room.state === 'speaking' && currentRound && !hasVoted && (
          <Card>
            <CardHeader>
              <CardTitle>投票淘汰</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-2">
                {alivePlayers.filter(p => p.id !== currentPlayer?.id).map((player) => (
                  <label key={player.id} className="flex items-center space-x-2 p-2 border rounded cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="vote"
                      value={player.id}
                      checked={selectedVote === player.id}
                      onChange={(e) => setSelectedVote(e.target.value)}
                    />
                    <span>{player.name}</span>
                  </label>
                ))}
              </div>
              <Button
                onClick={submitVote}
                disabled={!selectedVote || isLoading}
                className="w-full"
              >
                {isLoading ? '投票中...' : '確認投票'}
              </Button>
            </CardContent>
          </Card>
        )}

        {room.state === 'voting' && currentRound && (
          <Card>
            <CardHeader>
              <CardTitle>投票狀態</CardTitle>
            </CardHeader>
            <CardContent>
              <p>已投票: {currentRound.votes.length} / {alivePlayers.length}</p>
              {hasVoted && <p className="text-green-600">你已投票</p>}
            </CardContent>
          </Card>
        )}

        <div className="text-center">
          <Button variant="outline" onClick={() => router.push('/')}>
            返回首頁
          </Button>
        </div>
      </div>
    </div>
  );
}
