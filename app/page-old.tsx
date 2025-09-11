'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api-client';
import { createPlayerSession } from '@/lib/auth';

export default function HomePage() {
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRetry, setShowRetry] = useState(false);
  const router = useRouter();

  const createRoom = async () => {
    if (!playerName.trim()) {
      setError('請輸入玩家名稱');
      return;
    }

    console.log('開始創建房間，玩家名稱:', playerName.trim());
    setIsLoading(true);
    setError('');
    setShowRetry(false);

    try {
      console.log('調用 API 創建房間...');
      const { code, hostToken } = await apiClient.createRoom(playerName.trim());
      console.log('API 回應成功:', { code, hostToken: hostToken.substring(0, 8) + '...' });

      // 創建玩家會話
      try {
        createPlayerSession(
          'host_' + Date.now(), // 臨時 ID，後端會返回真實 ID
          hostToken,
          playerName.trim(),
          true,
          code
        );
        console.log('玩家會話創建成功');
      } catch (sessionError) {
        console.error('創建玩家會話錯誤:', sessionError);
        // 即使會話創建失敗，也嘗試跳轉
      }

      console.log('準備跳轉到房間:', `/room/${code}`);
      router.push(`/room/${code}`);
    } catch (error) {
      console.error('創建房間錯誤:', error);
      const errorMessage = error instanceof Error ? error.message : '創建房間失敗';
      setError(errorMessage);
      setShowRetry(true);

      // Report to logging endpoint (optional)
      try {
        fetch('/api/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            level: 'error',
            message: '創建房間失敗',
            error: errorMessage,
            timestamp: Date.now(),
          }),
        }).catch(() => {}); // Ignore logging errors
      } catch (logError) {
        // Ignore logging errors
      }
    } finally {
      setIsLoading(false);
    }
  };

  const joinRoom = async () => {
    if (!playerName.trim()) {
      setError('請輸入玩家名稱');
      return;
    }

    if (!roomCode.trim()) {
      setError('請輸入房間代碼');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { playerId, token } = await apiClient.joinRoom(roomCode.trim().toUpperCase(), playerName.trim());

      // 創建玩家會話
      createPlayerSession(
        playerId,
        token,
        playerName.trim(),
        false,
        roomCode.trim().toUpperCase()
      );

      router.push(`/room/${roomCode.trim().toUpperCase()}`);
    } catch (error) {
      console.error('加入房間錯誤:', error);
      const errorMessage = error instanceof Error ? error.message : '加入房間失敗';
      setError(errorMessage);
      setShowRetry(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">誰是臥底</h1>
          <p className="text-gray-600">和朋友一起玩經典推理遊戲</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>開始遊戲</CardTitle>
            <CardDescription>輸入你的名稱來創建或加入房間</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="輸入玩家名稱"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={20}
                data-testid="player-name-input"
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center space-y-2">
                <div data-testid="error-message">{error}</div>
                {showRetry && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setError('');
                      setShowRetry(false);
                    }}
                    data-testid="retry-btn"
                  >
                    重試
                  </Button>
                )}
              </div>
            )}

            <div className="space-y-3">
              <Button
                onClick={createRoom}
                disabled={isLoading}
                className="w-full"
                size="lg"
                data-testid="create-room-btn"
              >
                {isLoading ? '創建中...' : '創建房間'}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">或</span>
                </div>
              </div>

              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="輸入房間代碼"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  data-testid="room-code-input"
                />
                <Button
                  onClick={joinRoom}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full"
                  size="lg"
                  data-testid="join-room-btn"
                >
                  {isLoading ? '加入中...' : '加入房間'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-gray-500">
          <p>遊戲規則：找出隱藏在人群中的臥底</p>
          <p className="mt-1 text-xs">靜態版本 - 數據存儲在本地</p>
        </div>
      </div>
    </div>
  );
}
