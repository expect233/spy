// app/components/CreateOrJoinCard.tsx
'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { usePlayer } from '../lib/player'; // 相對於 app/components

export default function CreateOrJoinCard() {
  const router = useRouter();
  const { name, setName } = usePlayer();
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function createRoom() {
    if (!name.trim()) {
      setError('請輸入玩家名稱');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const r = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostName: name.trim() }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok || !data.code) {
        setError(data.error || '建立房間失敗');
        return;
      }
      router.push(`/room/${data.code}`);
    } catch (e) {
      console.error('創建房間錯誤', e);
      setError('Network error');
    } finally {
      setIsLoading(false);
    }
  }

  function joinRoom() {
    if (!joinCode) return;
    router.push(`/room/${joinCode.trim()}`);
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl bg-white shadow-md p-5 space-y-4">
      {error && (
        <div
          className="rounded-md bg-red-100 p-3 text-sm text-red-700"
          data-testid="error-message"
        >
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm text-slate-700">玩家名稱</label>
        <input
          className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="輸入你的名字"
          value={name}
          onChange={(e) => setName(e.target.value)}
          data-testid="player-name-input"
        />
      </div>

      <button
        onClick={createRoom}
        className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 text-white py-2 font-medium disabled:opacity-50"
        disabled={isLoading}
        data-testid="create-room-btn"
      >
        {isLoading ? '建立中…' : '建立房間'}
      </button>

      {error && (
        <button
          onClick={createRoom}
          className="w-full rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 py-2"
          data-testid="retry-btn"
        >
          重試
        </button>
      )}

      <div className="text-center text-sm text-slate-500">或</div>

      <div className="flex gap-2">
        <input
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="輸入房號"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
          data-testid="room-code-input"
        />
        <button
          onClick={joinRoom}
          className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-4 font-medium"
          disabled={!joinCode}
          data-testid="join-room-btn"
        >
          加入
        </button>
      </div>
    </div>
  );
}
