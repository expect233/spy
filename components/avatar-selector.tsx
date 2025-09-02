'use client';

import { useState } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Upload, User, Check } from 'lucide-react';
import { 
  getAvailableAvatarStyles, 
  createPresetAvatar,
  validateAvatarFile,
  resizeAndCropAvatar,
  getAvatarDisplayUrl 
} from '@/lib/avatar';
import { apiClient } from '@/lib/api-client';
import type { Avatar as AvatarType, AvatarStyle } from '@/types/game';

interface AvatarSelectorProps {
  playerName: string;
  currentAvatar?: AvatarType;
  onAvatarChange: (avatar: AvatarType) => void;
  trigger?: React.ReactNode;
}

export function AvatarSelector({ 
  playerName, 
  currentAvatar, 
  onAvatarChange, 
  trigger 
}: AvatarSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarType | undefined>(currentAvatar);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const avatarStyles = getAvailableAvatarStyles();

  const handleStyleSelect = (style: AvatarStyle) => {
    const newAvatar = createPresetAvatar(playerName, style);
    setSelectedAvatar(newAvatar);
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

      // 設置新頭像
      const newAvatar: AvatarType = {
        type: 'upload',
        url,
      };

      setSelectedAvatar(newAvatar);
    } catch (error) {
      console.error('Avatar upload failed:', error);
      setUploadError(error instanceof Error ? error.message : '上傳失敗');
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirm = () => {
    if (selectedAvatar) {
      onAvatarChange(selectedAvatar);
      setIsOpen(false);
    }
  };

  const isSelected = (style: AvatarStyle) => {
    return selectedAvatar?.type === 'preset' && selectedAvatar?.style === style;
  };

  const isUploadSelected = selectedAvatar?.type === 'upload';

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            選擇頭像
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>選擇頭像</DialogTitle>
          <DialogDescription>
            選擇一個預設樣式或上傳自己的圖片
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* 當前選擇預覽 */}
          <div className="flex justify-center">
            <div className="text-center space-y-2">
              <Avatar className="h-20 w-20 mx-auto">
                <AvatarImage 
                  src={getAvatarDisplayUrl(selectedAvatar, playerName)} 
                  alt="預覽" 
                />
                <AvatarFallback>
                  <User className="h-10 w-10" />
                </AvatarFallback>
              </Avatar>
              <p className="text-sm text-muted-foreground">預覽</p>
            </div>
          </div>

          {/* 預設樣式 */}
          <div className="space-y-3">
            <Label className="text-base font-medium">預設樣式</Label>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
              {avatarStyles.map((style) => (
                <div
                  key={style.value}
                  className={`relative cursor-pointer rounded-lg border-2 p-2 transition-colors hover:bg-muted ${
                    isSelected(style.value) 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border'
                  }`}
                  onClick={() => handleStyleSelect(style.value)}
                >
                  <Avatar className="h-12 w-12 mx-auto">
                    <AvatarImage src={style.preview} alt={style.label} />
                    <AvatarFallback>
                      <User className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-xs text-center mt-1 truncate">
                    {style.label}
                  </p>
                  {isSelected(style.value) && (
                    <div className="absolute -top-1 -right-1">
                      <Badge variant="default" className="h-5 w-5 p-0 rounded-full">
                        <Check className="h-3 w-3" />
                      </Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 自訂上傳 */}
          <div className="space-y-3">
            <Label className="text-base font-medium">自訂頭像</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleUpload}
                  disabled={isUploading}
                  className="hidden"
                  id="avatar-upload-selector"
                />
                <Label
                  htmlFor="avatar-upload-selector"
                  className="flex-1 cursor-pointer"
                >
                  <div className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors hover:bg-muted ${
                    isUploadSelected ? 'border-primary bg-primary/10' : 'border-border'
                  }`}>
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium">
                      {isUploading ? '上傳中...' : '點擊上傳圖片'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      JPG、PNG、WebP，最大 512KB
                    </p>
                    {isUploadSelected && (
                      <Badge variant="default" className="mt-2">
                        <Check className="h-3 w-3 mr-1" />
                        已選擇
                      </Badge>
                    )}
                  </div>
                </Label>
              </div>
              {uploadError && (
                <p className="text-sm text-destructive">{uploadError}</p>
              )}
            </div>
          </div>

          {/* 確認按鈕 */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              取消
            </Button>
            <Button 
              onClick={handleConfirm}
              disabled={!selectedAvatar || isUploading}
            >
              確認選擇
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
