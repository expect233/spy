'use client';
import { usePlayer } from '@/app/lib/player';

export default function YouBadge() {
  const { name } = usePlayer();
  return (
    <span className="text-sm text-slate-700">
      你是：<b>{name || '（尚未輸入名稱）'}</b>
    </span>
  );
}
