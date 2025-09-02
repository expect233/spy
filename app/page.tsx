'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { usePlayer } from '@/app/lib/player';
import CreateOrJoinCard from './components/CreateOrJoinCard';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-3xl font-semibold text-slate-800">誰是臥底</h1>
        <CreateOrJoinCard />
      </div>
    </main>
  );
}

export default function HomePage() {
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState('');
  const router = useRouter();
  const { setName } = usePlayer?.() ?? { setName: () => {} } as any;

  const createRoom = async () => {
    if (!playerName.trim()) {
      setError('請輸入玩家名稱');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // 免費方案：直接導向示範房間
      const predefinedCodes = ['DEMO01','DEMO02','DEMO03','TEST01','TEST02'];
      const code = predefinedCodes[Math.floor(Math.random()*predefinedCodes.length)];
      try { setName?.(playerName.trim()); } catch {}
      router.push(`/room/${code}`);
    } catch (error) {
      console.error('創建房間失敗:', error);
      setError('這是靜態演示版本');
    } finally {
      setIsLoading(false);
    }
  };

  const joinRoom = async () => {
    if (!playerName.trim()) {
      setError('請輸入玩家名稱');
      return;
    }

    if (!roomCode.trim()) {
      setError('請輸入房間代碼');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const targetCode = roomCode.trim().toUpperCase();
      try { setName?.(playerName.trim()); } catch {}
      router.push(`/room/${targetCode}`);
    } catch (error) {
      console.error('加入房間失敗:', error);
      setError('這是靜態演示版本');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">誰是臥底</h1>
          <p className="text-gray-600">和朋友一起玩經典推理遊戲</p>
          <p className="text-sm text-orange-600 mt-2">⚠️ 這是靜態演示版本</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">開始遊戲</h2>
            <p className="text-gray-600 text-sm mb-4">輸入你的名稱來創建或加入房間</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="playerName" className="block text-sm font-medium text-gray-700 mb-1">
                玩家名稱
              </label>
              <input
                id="playerName"
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="輸入你的名稱"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-3">
              <button
                onClick={createRoom}
                disabled={isLoading}
                className={`w-full py-3 px-4 rounded-md font-medium ${
                  isLoading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {isLoading ? '創建中...' : '創建房間'}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">或</span>
                </div>
              </div>

              <div>
                <label htmlFor="roomCode" className="block text-sm font-medium text-gray-700 mb-1">
                  房間代碼
                </label>
                <input
                  id="roomCode"
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="輸入6位房間代碼"
                  maxLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                />
              </div>

              <button
                onClick={joinRoom}
                disabled={isLoading}
                className={`w-full py-3 px-4 rounded-md font-medium ${
                  isLoading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-500 text-white hover:bg-green-600'
                }`}
              >
                {isLoading ? '加入中...' : '加入房間'}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold mb-2">遊戲規則</h3>
            <ul className="text-sm text-gray-600 space-y-1 text-left">
              <li>• 每位玩家會獲得一個詞語</li>
              <li>• 其中一人是臥底，詞語與其他人不同</li>
              <li>• 輪流描述自己的詞語（不能直說）</li>
              <li>• 投票淘汰可疑的臥底</li>
              <li>• 臥底存活到最後即獲勝</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
