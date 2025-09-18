<<<<<<< HEAD
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '屏東示警儀表板',
  description: 'NCDR 生效中示警（屏東／可切換縣市）',
=======
// app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import { PlayerProvider } from './lib/player';
import VersionBadge from './components/VersionBadge';

export const metadata: Metadata = {
  title: '誰是臥底 - Undercover Game',
  description: '一個基於 Next.js 14 的即時多人「誰是臥底」推理遊戲',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant">
      <body>
        <PlayerProvider>
          {children}
          <VersionBadge />
        </PlayerProvider>
      </body>
    </html>
  );
>>>>>>> de95443501ec69b283a4b1cc11f21b9a8f5d2ef6
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body className="min-h-screen bg-slate-50 text-slate-900">{children}</body>
    </html>
  )
}