import RoomClient from './room-client-simple';
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
        {/* TODO: 這裡接你的遊戲面板/聊天室 */}
      </div>
    </main>
  );
}

// 為靜態導出生成參數 - 生成一些示例房間代碼
export async function generateStaticParams() {
  // 為靜態導出生成一些示例房間代碼
  // 實際的房間將通過客戶端路由處理
  const codes = [];

  // 生成一些常見的房間代碼格式
  for (let i = 0; i < 10; i++) {
    codes.push({ code: `DEMO${i.toString().padStart(2, '0')}` });
    codes.push({ code: `TEST${i.toString().padStart(2, '0')}` });
  }

  // 添加一些隨機代碼
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  for (let i = 0; i < 20; i++) {
    let code = '';
    for (let j = 0; j < 6; j++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    codes.push({ code });
  }

  return codes;
}

export default function RoomPage() {
  return <RoomClient />;
}
