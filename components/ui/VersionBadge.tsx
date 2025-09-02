"use client";

import { useEffect, useRef, useState } from "react";

type BuildInfo = {
  version: string;
  commit?: string;
  builtAt?: number;
};

export default function VersionBadge() {
  const [info, setInfo] = useState<BuildInfo | null>(null);
  const [hasUpdate, setHasUpdate] = useState(false);
  const timerRef = useRef<number | null>(null);

  const fetchInfo = async () => {
    try {
      const res = await fetch(`/build.json?cb=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as BuildInfo;
      const prev = localStorage.getItem("build:version");
      if (prev && data.version && prev !== data.version) {
        setHasUpdate(true);
      }
      if (data.version) localStorage.setItem("build:version", data.version);
      setInfo(data);
    } catch {}
  };

  useEffect(() => {
    fetchInfo();
    timerRef.current = window.setInterval(fetchInfo, 180000); // 3 分鐘
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  if (!info) return null;

  return (
    <div className="fixed right-3 bottom-3 z-50 flex flex-col items-end gap-2">
      {hasUpdate && (
        <div className="rounded-xl shadow-md bg-amber-50 border border-amber-200 text-slate-800 p-3 text-sm">
          有新版本可用
          <button
            onClick={() => window.location.reload()}
            className="ml-3 px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white"
          >
            重新整理
          </button>
        </div>
      )}
      <div className="rounded-full bg-white/90 backdrop-blur px-3 py-1 text-xs shadow border text-slate-700">
        {info.version || 'v0.0.0'}
      </div>
    </div>
  );
}


