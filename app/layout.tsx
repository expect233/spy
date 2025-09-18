import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '屏東示警儀表板',
  description: 'NCDR 生效中示警（屏東／可切換縣市）',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body className="min-h-screen bg-slate-50 text-slate-900">{children}</body>
    </html>
  )
}