// app/room/[code]/you-badge.tsx
'use client';
import { usePlayer } from '../../lib/player';

export default function YouBadge() {
  const { name } = usePlayer();
  return (
    <span className="text-sm text-slate-700">
      你是：<b>{name || '（尚未輸入名稱）'}</b>
    </span>
  );
}
