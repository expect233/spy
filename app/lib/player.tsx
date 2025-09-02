// app/lib/player.tsx
'use client';
import { createContext, useContext, useEffect, useState } from 'react';

type PlayerCtx = { name: string; setName: (v: string) => void };
const PlayerContext = createContext<PlayerCtx>({ name: '', setName: () => {} });

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [name, setNameState] = useState('');

  useEffect(() => {
    try {
      const v = localStorage.getItem('player:name');
      if (v) setNameState(v);
    } catch {}
  }, []);

  const setName = (v: string) => {
    setNameState(v);
    try {
      localStorage.setItem('player:name', v);
    } catch {}
  };

  return (
    <PlayerContext.Provider value={{ name, setName }}>
      {children}
    </PlayerContext.Provider>
  );
}

export const usePlayer = () => useContext(PlayerContext);
