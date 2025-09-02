"use client";

import { createContext, useContext, useEffect, useState } from 'react';

type PlayerCtx = { name: string; setName: (v: string) => void };
const Ctx = createContext<PlayerCtx>({ name: '', setName: () => {} });

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [name, setNameState] = useState('');
  useEffect(() => {
    const v = typeof window !== 'undefined' ? localStorage.getItem('player:name') || '' : '';
    if (v) setNameState(v);
  }, []);
  const setName = (v: string) => {
    setNameState(v);
    if (typeof window !== 'undefined') localStorage.setItem('player:name', v);
  };
  return <Ctx.Provider value={{ name, setName }}>{children}</Ctx.Provider>;
}

export const usePlayer = () => useContext(Ctx);
