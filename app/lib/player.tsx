'use client';
import { createContext, useContext, useEffect, useState } from 'react';

type PlayerCtx = { name: string; setName: (v:string)=>void };
const Ctx = createContext<PlayerCtx>({ name:'', setName: () => {} });

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [name, _setName] = useState('');
  useEffect(() => {
    const v = typeof window !== 'undefined' ? localStorage.getItem('player:name') || '' : '';
    if (v) _setName(v);
  }, []);
  const setName = (v: string) => {
    _setName(v);
    if (typeof window !== 'undefined') localStorage.setItem('player:name', v);
  };
  return <Ctx.Provider value={{ name, setName }}>{children}</Ctx.Provider>;
}
export const usePlayer = () => useContext(Ctx);
