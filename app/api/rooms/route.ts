import { NextResponse } from 'next/server';
import { customAlphabet } from 'nanoid';

// 英數去掉易混淆字元
const gen = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 6);

export async function POST() {
  const code = gen();
  // TODO: 寫入你的資料存放（Firestore/DB）。先回 code 讓前端能進房。
  return NextResponse.json({ ok: true, data: { code } });
}
