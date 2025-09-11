"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getFirebase } from "@/lib/firebase";
import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

interface FirestoreChatProps {
  roomCode: string;
  className?: string;
}

type ChatMsg = {
  id: string;
  uid: string;
  name: string;
  text: string;
  at: number;
};

export default function FirestoreChat({ roomCode, className = "" }: FirestoreChatProps) {
  // 延後初始化，避免在 SSR/SSG 階段觸發 Firebase 初始化
  const [dbRef, setDbRef] = useState<ReturnType<typeof getFirebase> | null>(null);
  const [name, setName] = useState<string>(
    () => localStorage.getItem("nickname") || "訪客"
  );
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string>("");
  const [cooldownUntil, setCooldownUntil] = useState<number>(0);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  const colRef = useMemo(() => {
    if (!dbRef?.db) return null;
    return collection(dbRef.db, `rooms/${roomCode}/messages`);
  }, [dbRef, roomCode]);

  useEffect(() => {
    // 僅在瀏覽器端初始化 Firebase
    if (typeof window === 'undefined') return;
    try {
      setDbRef(getFirebase());
    } catch {}
  }, []);

  useEffect(() => {
    if (!colRef) return;
    const q = query(colRef, orderBy("at", "asc"), limit(100));
    const unsub = onSnapshot(q, (snap) => {
      const arr: ChatMsg[] = [];
      snap.forEach((doc) => {
        const d = doc.data() as any;
        const atTs: Timestamp | null = d.at || null;
        arr.push({
          id: doc.id,
          uid: d.uid || "",
          name: d.name || "訪客",
          text: d.text || "",
          at: atTs ? atTs.toMillis() : Date.now(),
        });
      });
      setMessages(arr);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 0);
    });
    return () => unsub();
  }, [colRef]);

  const canSend = () => {
    if (!dbRef?.auth?.currentUser) return false;
    if (!text.trim()) return false;
    if (Date.now() < cooldownUntil) return false;
    return true;
  };

  const send = async () => {
    if (!canSend()) return;
    setSending(true);
    setError("");
    try {
      if (!dbRef) return;
      const uid = dbRef.auth!.currentUser!.uid;
      const trimmed = text.trim();
      if (trimmed.length < 1 || trimmed.length > 200) {
        setError("內容需為 1~200 字");
        return;
      }
      localStorage.setItem("nickname", name || "訪客");
      if (!colRef) return;
      await addDoc(colRef, {
        roomCode,
        uid,
        name: name || "訪客",
        text: trimmed,
        at: serverTimestamp(),
      });
      setText("");
      setCooldownUntil(Date.now() + 5000);
    } catch (e: any) {
      setError(e?.message || "發送失敗");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={`bg-white rounded-2xl shadow-md p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base md:text-lg font-semibold text-slate-800">聊天室</h3>
        <div className="text-xs text-slate-600">{messages.length} 則</div>
      </div>
      <div className="h-64 overflow-y-auto space-y-2 border rounded-lg p-3 bg-slate-50">
        {messages.map((m) => (
          <div key={m.id} className="text-sm">
            <span className="font-medium text-slate-800">{m.name}</span>
            <span className="mx-2 text-slate-500">·</span>
            <span className="text-slate-500">
              {new Date(m.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
            <div className="mt-1 text-slate-800">{m.text}</div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="暱稱"
          className="w-28 px-3 py-2 border rounded-lg text-slate-800"
        />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="輸入訊息..."
          maxLength={200}
          className="flex-1 px-3 py-2 border rounded-lg text-slate-800"
          onKeyDown={(e) => {
            if (e.key === 'Enter') send();
          }}
        />
        <button
          onClick={send}
          disabled={!canSend() || sending}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
        >
          發送
        </button>
      </div>
      {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
    </div>
  );
}


