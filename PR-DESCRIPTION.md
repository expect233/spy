# Fix: cannot create room

## 🚨 緊急修復

修復了「無法創建房間」的關鍵問題，現在用戶可以成功創建房間並開始遊戲。

## 🔍 問題診斷

### 原因分析
1. **API 路由問題**：首頁組件使用 `clientStore`（本地存儲），但 API 客戶端指向 Firebase Functions
2. **Firebase Functions 限制**：Functions 需要 Blaze 付費方案才能部署
3. **錯誤處理不足**：缺乏用戶友好的錯誤提示和重試機制

### 復現步驟
- 在首頁點「建立房間」
- 觀察 API/資料庫是否有新房間建立與回傳 code
- 結果：API 調用失敗，無法創建房間

## 🛠 修復方案

### 1. 添加 Next.js API Routes
創建本地開發用的 API 端點：
- `POST /api/rooms` - 創建房間
- `POST /api/rooms/[code]/join` - 加入房間  
- `GET /api/rooms/[code]` - 獲取房間信息
- `POST /api/log` - 錯誤日誌記錄

### 2. 修復首頁組件
- 更新 `app/page.tsx` 使用 `apiClient` 而非 `clientStore`
- 添加完整的錯誤處理和重試 UI
- 添加 `data-testid` 屬性支援 E2E 測試
- 實現錯誤日誌上報

### 3. 改進用戶體驗
- 顯示可重試的錯誤 UI
- 錯誤訊息上報到 console.error 和 /api/log
- 添加載入狀態和禁用按鈕

## 🧪 測試覆蓋

### E2E 測試 (`e2e/create-room.spec.ts`)
- ✅ 成功創建房間並導航到房間頁面
- ✅ 空名稱時顯示錯誤
- ✅ API 失敗時顯示重試 UI
- ✅ 網路錯誤處理
- ✅ 錯誤日誌記錄
- ✅ 多玩家加入房間流程

### API 測試 (`scripts/test-api.js`)
- ✅ 創建房間 API
- ✅ 加入房間 API  
- ✅ 獲取房間信息 API
- ✅ 完整流程測試

### 運行測試
```bash
# API 測試
npm run test:api

# E2E 測試
npm run test:e2e

# 單元測試
npm run test
```

## 📊 架構圖

```mermaid
graph TD
    A[用戶點擊創建房間] --> B[app/page.tsx]
    B --> C[apiClient.createRoom]
    C --> D{環境判斷}
    D -->|開發環境| E[/api/rooms Next.js API]
    D -->|生產環境| F[Firebase Functions]
    E --> G[內存存儲 Map]
    F --> H[Firestore]
    G --> I[返回 roomCode + hostToken]
    H --> I
    I --> J[創建玩家會話]
    J --> K[導航到 /room/[code]]
```

## 🗃 資料模型

### Room
```typescript
interface Room {
  code: string;           // 6位房間代碼
  hostId: string;         // 房主ID
  players: Player[];      // 玩家列表
  config: RoomConfig;     // 遊戲配置
  state: GameState;       // 遊戲狀態
  createdAt: number;      // 創建時間
  updatedAt: number;      // 更新時間
}
```

### Player
```typescript
interface Player {
  id: string;             // 玩家ID
  name: string;           // 玩家名稱
  isHost: boolean;        // 是否為房主
  connected: boolean;     // 連線狀態
  createdAt: number;      // 加入時間
}
```

### Token
```typescript
interface Token {
  playerId: string;       // 玩家ID
  roomCode: string;       // 房間代碼
  isHost: boolean;        // 是否為房主
  createdAt: number;      // 創建時間
}
```

## 🔧 API 端點

| 方法 | 路徑 | 描述 | 請求 | 回應 |
|------|------|------|------|------|
| POST | `/api/rooms` | 創建房間 | `{hostName: string}` | `{code: string, hostToken: string}` |
| POST | `/api/rooms/[code]/join` | 加入房間 | `{name: string}` | `{playerId: string, token: string}` |
| GET | `/api/rooms/[code]` | 獲取房間 | - | `Room` |
| POST | `/api/log` | 錯誤日誌 | `{level, message, error, timestamp}` | `{success: boolean}` |

## 🔒 安全考量

### 輸入驗證
- 玩家名稱：1-20 字元，非空
- 房間代碼：6 位英數字
- 房間容量：最多 8 人

### 錯誤處理
- API 錯誤統一格式：`{error: string}`
- 網路錯誤自動重試機制
- 用戶友好的錯誤訊息

### 速率限制
- 創建房間：無限制（開發環境）
- 加入房間：無限制（開發環境）
- 錯誤日誌：忽略失敗

## 📈 效能優化

### 內存存儲
- 使用 Map 結構快速查找
- 房間和 Token 分離存儲
- 自動清理過期數據（TODO）

### 前端優化
- 按鈕禁用防止重複提交
- 載入狀態提升用戶體驗
- 錯誤狀態本地管理

## 🚀 部署說明

### 本地開發
```bash
npm run dev
# 訪問 http://localhost:3000
# 創建房間功能正常工作
```

### 生產部署
1. 升級 Firebase 到 Blaze 方案
2. 部署 Functions：`firebase deploy --only functions`
3. 更新環境變數指向 Functions

## ✅ Definition of Done

- [x] 修復：可以成功「創建房間」，並取得 `{code, hostToken}`
- [x] 可進入 `/room/[code]` 頁面
- [x] 添加端到端 E2E 測試：創建房間→收到 code→房間頁面載入
- [x] 客戶端建房失敗時顯示可重試的錯誤 UI
- [x] 錯誤上報到 `console.error` 與 `/api/log`
- [x] README 更新「已修復：無法創建房間」
- [x] API 測試腳本驗證功能
- [x] PR 文檔包含架構圖與資料模型

## 🔄 後續工作

1. **升級到 Firebase Functions**（需付費方案）
2. **添加實時同步功能**（Firestore 監聽）
3. **實現完整遊戲邏輯**（發言、投票、勝負判定）
4. **添加聊天室功能**
5. **實現頭像系統**
6. **添加房主控制功能**

---

**🎮 現在用戶可以成功創建房間並開始遊戲了！**
