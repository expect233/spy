import { NextResponse } from 'next/server';
import { customAlphabet } from 'nanoid';

export const runtime = 'nodejs'; // 在 Vercel 使用 Node runtime

const gen = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 6);

export async function POST() {
  const code = gen();
  // TODO: 未來可把 code 寫入 DB；目前先回傳給前端
  return NextResponse.json({ ok: true, data: { code } });
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
