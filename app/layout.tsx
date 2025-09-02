import type { Metadata } from "next";
import "./globals.css";
import ClientBootstrap from "@/components/ClientBootstrap";
import { PlayerProvider } from '@/app/lib/player';
import VersionBadge from './components/VersionBadge';

export const metadata: Metadata = {
  title: "誰是臥底 - Undercover Game",
  description: "一個基於 Next.js 14 的即時多人「誰是臥底」推理遊戲",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body className="antialiased">
        <PlayerProvider>
          {children}
        </PlayerProvider>
        <ClientBootstrap />
      </body>
    </html>
  );
}
