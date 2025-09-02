'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { usePlayer } from '@/app/lib/player';

export default function CreateOrJoinCard() {
  const router = useRouter();
  const { name, setName } = usePlayer();
  const [joinCode, setJoinCode] = useState('');

  async function createRoom() {
    const r = await fetch('/api/rooms', { method: 'POST' });
    const j = await r.json();
    if (!r.ok || !j?.data?.code) { alert(j?.error || '建立房間失敗'); return; }
    router.push(`/room/${j.data.code}`);
  }

  function joinRoom() {
    if (!joinCode) return;
    router.push(`/room/${joinCode.trim()}`);
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl bg-white shadow-md p-5 space-y-4">
      <div className="space-y-2">
        <label className="text-sm text-slate-700">玩家名稱</label>
        <input
          className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="輸入你的名字"
          value={name}
          onChange={e=>setName(e.target.value)}
        />
      </div>

      <button
        onClick={createRoom}
        className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 text-white py-2 font-medium disabled:opacity-50"
        disabled={!name}
      >
        建立房間
      </button>

      <div className="text-center text-sm text-slate-500">或</div>

      <div className="flex gap-2">
        <input
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="輸入房號"
          value={joinCode}
          onChange={e=>setJoinCode(e.target.value.toUpperCase())}
        />
        <button
          onClick={joinRoom}
          className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-4 font-medium"
          disabled={!joinCode}
        >
          加入
        </button>
      </div>
    </div>
  );
}
