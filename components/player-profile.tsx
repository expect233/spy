'use client';

import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Settings, Upload, User } from 'lucide-react';
import { 
  getCurrentPlayerName, 
  getCurrentPlayerAvatar, 
  getCurrentPlayerId,
  savePlayerAvatar,
  updatePlayerSession,
  isHost 
} from '@/lib/auth';
import { 
  getAvatarDisplayUrl, 
  getAvailableAvatarStyles, 
  createPresetAvatar,
  validateAvatarFile,
  resizeAndCropAvatar 
} from '@/lib/avatar';
import { apiClient } from '@/lib/api-client';
import type { Avatar as AvatarType, AvatarStyle } from '@/types/game';

interface PlayerProfileProps {
  className?: string;
}

export function PlayerProfile({ className }: PlayerProfileProps) {
  const [playerName, setPlayerName] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [playerAvatar, setPlayerAvatar] = useState<AvatarType | null>(null);
  const [isPlayerHost, setIsPlayerHost] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    // 載入玩家資料
    const name = getCurrentPlayerName();
    const id = getCurrentPlayerId();
    const avatar = getCurrentPlayerAvatar();
    const hostStatus = isHost();

    if (name) setPlayerName(name);
    if (id) setPlayerId(id);
    if (avatar) setPlayerAvatar(avatar);
    setIsPlayerHost(hostStatus);
  }, []);

  const handleNameChange = (newName: string) => {
    if (newName.trim() && newName !== playerName) {
      setPlayerName(newName);
      updatePlayerSession({ name: newName.trim() });
    }
  };

  const handleAvatarStyleChange = (style: AvatarStyle) => {
    if (playerName) {
      const newAvatar = createPresetAvatar(playerName, style);
      setPlayerAvatar(newAvatar);
      savePlayerAvatar(newAvatar);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadError('');
    setIsUploading(true);

    try {
      // 驗證檔案
      const validation = validateAvatarFile(file);
      if (!validation.isValid) {
        setUploadError(validation.error || '檔案無效');
        return;
      }

      // 調整圖片大小
      const resizedBlob = await resizeAndCropAvatar(file);
      const resizedFile = new File([resizedBlob], file.name, { type: 'image/png' });

      // 上傳到服務器
      const { url } = await apiClient.uploadAvatar(resizedFile);

      // 更新頭像
      const newAvatar: AvatarType = {
        type: 'upload',
        url,
      };

      setPlayerAvatar(newAvatar);
      savePlayerAvatar(newAvatar);
    } catch (error) {
      console.error('Avatar upload failed:', error);
      setUploadError(error instanceof Error ? error.message : '上傳失敗');
    } finally {
      setIsUploading(false);
    }
  };

  const avatarStyles = getAvailableAvatarStyles();
  const displayUrl = getAvatarDisplayUrl(playerAvatar ?? undefined, playerName);

  if (!playerName || !playerId) {
    return null;
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <Avatar className="h-10 w-10">
        <AvatarImage src={displayUrl} alt={playerName} />
        <AvatarFallback>
          <User className="h-5 w-5" />
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <span className="font-medium text-sm truncate">你是：{playerName}</span>
          {isPlayerHost && (
            <Badge variant="outline" className="text-xs">
              房主
            </Badge>
          )}
        </div>
        <div className="text-xs text-muted-foreground truncate">
          ID: {playerId.slice(0, 8)}...
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>個人資料設定</DialogTitle>
            <DialogDescription>
              修改你的名稱和頭像
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* 當前頭像 */}
            <div className="flex justify-center">
              <Avatar className="h-20 w-20">
                <AvatarImage src={displayUrl} alt={playerName} />
                <AvatarFallback>
                  <User className="h-10 w-10" />
                </AvatarFallback>
              </Avatar>
            </div>

            {/* 名稱設定 */}
            <div className="space-y-2">
              <Label htmlFor="player-name">玩家名稱</Label>
              <Input
                id="player-name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onBlur={(e) => handleNameChange(e.target.value)}
                maxLength={20}
                placeholder="輸入你的名稱"
              />
            </div>

            {/* 頭像樣式選擇 */}
            <div className="space-y-2">
              <Label>頭像樣式</Label>
              <Select
                value={playerAvatar?.style || 'identicon'}
                onValueChange={handleAvatarStyleChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="選擇頭像樣式" />
                </SelectTrigger>
                <SelectContent>
                  {avatarStyles.map((style) => (
                    <SelectItem key={style.value} value={style.value}>
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={style.preview} alt={style.label} />
                        </Avatar>
                        <span>{style.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 頭像上傳 */}
            <div className="space-y-2">
              <Label>自訂頭像</Label>
              <div className="flex items-center space-x-2">
                <Input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleAvatarUpload}
                  disabled={isUploading}
                  className="hidden"
                  id="avatar-upload"
                />
                <Label
                  htmlFor="avatar-upload"
                  className="flex-1 cursor-pointer"
                >
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={isUploading}
                    asChild
                  >
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      {isUploading ? '上傳中...' : '上傳圖片'}
                    </span>
                  </Button>
                </Label>
              </div>
              {uploadError && (
                <p className="text-sm text-destructive">{uploadError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                支援 JPG、PNG、WebP 格式，最大 512KB
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
