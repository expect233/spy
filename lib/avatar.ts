import { Avatar, AvatarStyle, AVATAR_STYLES } from '@/types/game';

/**
 * 生成基於名稱的頭像 URL
 */
export function generateAvatarUrl(name: string, style: AvatarStyle = 'identicon'): string {
  const seed = encodeURIComponent(name);
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}

/**
 * 創建預設頭像
 */
export function createDefaultAvatar(name: string, style?: AvatarStyle): Avatar {
  const avatarStyle = style || AVATAR_STYLES[Math.floor(Math.random() * AVATAR_STYLES.length)];
  
  return {
    type: 'generated',
    url: generateAvatarUrl(name, avatarStyle),
    style: avatarStyle,
  };
}

/**
 * 創建預設樣式頭像
 */
export function createPresetAvatar(name: string, style: AvatarStyle): Avatar {
  return {
    type: 'preset',
    url: generateAvatarUrl(name, style),
    style,
  };
}

/**
 * 創建上傳頭像
 */
export function createUploadAvatar(url: string): Avatar {
  return {
    type: 'upload',
    url,
  };
}

/**
 * 驗證頭像檔案
 */
export function validateAvatarFile(file: File): { isValid: boolean; error?: string } {
  // 檢查檔案大小 (512KB)
  if (file.size > 512 * 1024) {
    return { isValid: false, error: '檔案大小不能超過 512KB' };
  }
  
  // 檢查檔案類型
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: '只支援 JPG、PNG、WebP 格式' };
  }
  
  return { isValid: true };
}

/**
 * 調整圖片大小並轉為圓形
 */
export function resizeAndCropAvatar(file: File, size: number = 128): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    if (!ctx) {
      reject(new Error('無法創建 Canvas 上下文'));
      return;
    }
    
    img.onload = () => {
      canvas.width = size;
      canvas.height = size;
      
      // 計算裁剪區域（正方形）
      const minDimension = Math.min(img.width, img.height);
      const sx = (img.width - minDimension) / 2;
      const sy = (img.height - minDimension) / 2;
      
      // 創建圓形遮罩
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.clip();
      
      // 繪製圖片
      ctx.drawImage(img, sx, sy, minDimension, minDimension, 0, 0, size, size);
      
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('無法生成圖片'));
        }
      }, 'image/png');
    };
    
    img.onerror = () => {
      reject(new Error('無法載入圖片'));
    };
    
    img.src = URL.createObjectURL(file);
  });
}

/**
 * 獲取頭像顯示 URL
 */
export function getAvatarDisplayUrl(avatar?: Avatar, fallbackName?: string): string {
  if (!avatar) {
    return fallbackName ? generateAvatarUrl(fallbackName) : generateAvatarUrl('Anonymous');
  }
  
  if (avatar.url) {
    return avatar.url;
  }
  
  // 如果沒有 URL，根據類型生成
  if (avatar.type === 'generated' || avatar.type === 'preset') {
    const style = avatar.style || 'identicon';
    return generateAvatarUrl(fallbackName || 'Anonymous', style as AvatarStyle);
  }
  
  return generateAvatarUrl(fallbackName || 'Anonymous');
}

/**
 * 獲取所有可用的頭像樣式
 */
export function getAvailableAvatarStyles(): Array<{ value: AvatarStyle; label: string; preview: string }> {
  return AVATAR_STYLES.map(style => ({
    value: style,
    label: getStyleDisplayName(style),
    preview: generateAvatarUrl('Preview', style),
  }));
}

/**
 * 獲取樣式顯示名稱
 */
function getStyleDisplayName(style: AvatarStyle): string {
  const styleNames: Record<AvatarStyle, string> = {
    'adventurer': '冒險者',
    'avataaars': '卡通風',
    'big-ears': '大耳朵',
    'big-smile': '大笑臉',
    'croodles': '塗鴉風',
    'fun-emoji': '趣味表情',
    'icons': '圖標風',
    'identicon': '幾何圖形',
    'initials': '姓名縮寫',
    'lorelei': '女性風格',
    'micah': '簡約風',
    'miniavs': '迷你頭像',
    'open-peeps': '開放風格',
    'personas': '人物風格',
    'pixel-art': '像素風',
  };
  
  return styleNames[style] || style;
}
