// app/room/[code]/page.tsx
import YouBadge from './you-badge';

export default function RoomPage({ params }: { params: { code: string } }) {
  const code = params.code;
  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-slate-800">房間：{code}</h2>
          <YouBadge />
        </div>

        {/* TODO: 在這裡接遊戲面板/聊天室 */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">
          遊戲面板／聊天室（待接）
        </div>
      </div>
    </main>
  );
}
