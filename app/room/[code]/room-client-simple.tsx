'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
const FirestoreChat = dynamic(() => import('@/components/room/FirestoreChat'), { ssr: false });
import { usePlayer } from '@/app/lib/player';
import { useParams, useRouter } from 'next/navigation';

export default function RoomClient() {
  const params = useParams();
  const router = useRouter();
  const roomCode = params.code as string;
  const { name } = usePlayer();

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 模擬房間數據（靜態演示版本）
  const mockRoom = {
    code: roomCode,
    state: 'lobby' as const,
    players: [
      { id: '1', name: '玩家1', isHost: true },
      { id: '2', name: '玩家2', isHost: false },
      { id: '3', name: '玩家3', isHost: false }
    ],
    rounds: []
  };

  const mockCurrentPlayer = { id: '1', name: '玩家1', isHost: true };
  const mockAssignment = null; // 遊戲未開始

  useEffect(() => {
    // 靜態版本不需要載入數據
    console.log('房間代碼:', roomCode);
  }, [roomCode]);

  const startGame = async () => {
    setIsLoading(true);
    try {
      // 模擬開始遊戲
      alert('這是靜態演示版本，遊戲功能需要後端支持');
    } catch (error) {
      console.error('開始遊戲錯誤:', error);
      setError('開始遊戲失敗');
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
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => router.push('/')}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            返回首頁
          </button>
        </div>
      </div>
    );
  }

  const alivePlayers = mockRoom.players.filter(p =>
    !mockRoom.rounds?.some(r => r.eliminatedId === p.id)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 房間資訊 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold" data-testid="room-code">房間 {roomCode}</h1>
            <button 
              onClick={copyRoomCode}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              複製代碼
            </button>
          </div>
          <div className="text-sm text-slate-700">你是：<b>{name || '（尚未輸入名稱）'}</b></div>
          {mockCurrentPlayer && (
            <div className="mt-2" data-testid="player-profile">
              <p className="text-sm text-gray-600">
                你是：<span className="font-medium">{mockCurrentPlayer.name}</span>
                {mockCurrentPlayer.isHost && (
                  <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">房主</span>
                )}
              </p>
            </div>
          )}
        </div>

        {/* 角色資訊 */}
        {mockAssignment && (
          <div className="bg-white rounded-lg shadow-md p-6" data-testid="private-card">
            <h2 className="text-xl font-semibold mb-4">你的角色</h2>
            <div className="text-center">
              <span className={`text-lg px-4 py-2 rounded ${
                mockAssignment.role === 'undercover'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-green-100 text-green-800'
              }`}>
                {mockAssignment.role === 'undercover' ? '臥底' : '平民'}
              </span>
              <p className="mt-2 text-xl font-bold">{mockAssignment.word}</p>
            </div>
          </div>
        )}

        {/* 玩家列表 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">玩家列表 ({alivePlayers.length})</h2>
            <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded" data-testid="game-state">
              {mockRoom.state === 'lobby' ? '等待中' :
               mockRoom.state === 'speaking' ? '發言階段' :
               mockRoom.state === 'voting' ? '投票階段' :
               mockRoom.state === 'reveal' ? '結果揭曉' :
               mockRoom.state === 'ended' ? '遊戲結束' : mockRoom.state}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2" data-testid="player-list">
            {alivePlayers.map((player) => (
              <div key={player.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span>{player.name}</span>
                {player.isHost && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">房主</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 房主控制面板 */}
        {mockRoom.state === 'lobby' && mockCurrentPlayer.isHost && (
          <div className="bg-white rounded-lg shadow-md p-6" data-testid="host-panel">
            <h2 className="text-xl font-semibold mb-4">遊戲控制</h2>
            <button
              onClick={startGame}
              disabled={isLoading || mockRoom.players.length < 3}
              className={`w-full py-3 px-4 rounded font-medium ${
                isLoading || mockRoom.players.length < 3
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
              data-testid="start-game-btn"
            >
              {isLoading ? '開始中...' : '開始遊戲'}
            </button>
            {mockRoom.players.length < 3 && (
              <p className="text-sm text-gray-500 mt-2">至少需要3名玩家才能開始遊戲</p>
            )}
          </div>
        )}

        {/* 聊天室 */}
        <FirestoreChat roomCode={roomCode} />

        {/* 返回首頁按鈕 */}
        <div className="text-center">
          <button 
            onClick={() => router.push('/')}
            className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
          >
            返回首頁
          </button>
        </div>
      </div>
    </div>
  );
}
