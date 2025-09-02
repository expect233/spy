// app/components/VersionBadge.tsx
'use client';
import { useEffect, useRef, useState } from 'react';

type Info = { version: string; commit?: string; builtAt?: number };

export default function VersionBadge() {
  const [initial, setInitial] = useState<Info | null>(null);
  const latestRef = useRef<string>();

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const r = await fetch('/build.json?x=' + Date.now(), { cache: 'no-store' });
      if (!r.ok) return;
      const j: Info = await r.json();
      if (alive) {
        if (!initial) setInitial(j);
        latestRef.current = j.version;
      }
    };
    load();
    const t = setInterval(load, 180000); // 每 3 分鐘檢查一次
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [initial]);

  if (!initial) return null;
  const isNewer = latestRef.current && latestRef.current !== initial.version;

  return (
    <div className="fixed right-3 top-3 z-50 flex flex-col items-end gap-2">
      <span className="rounded-full bg-blue-600 text-white text-xs px-3 py-1 shadow">
        {initial.version}
        {initial.commit ? ` · ${initial.commit}` : ''}
      </span>
      {isNewer && (
        <button
          onClick={() => location.reload()}
          className="rounded bg-amber-500 text-white text-xs px-3 py-1 shadow hover:bg-amber-600"
          title="有新版本可用，點我重新整理"
        >
          有新版本可用，重新整理
        </button>
      )}
    </div>
  );
}
