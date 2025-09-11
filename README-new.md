# 誰是臥底 - 線上多人遊戲

一個功能完整的線上「誰是臥底」遊戲，支援多人實時對戰、語音聊天、頭像自定義等豐富功能。

## 🎮 功能特色

### 核心遊戲功能
- 🎯 **多人實時遊戲** - 支援 3-8 人同時遊戲
- 🏠 **房間系統** - 創建/加入房間，房間代碼分享
- 👥 **角色分配** - 自動分配平民、臥底、白板角色
- 💬 **發言系統** - 每輪限時發言，內容過濾
- 🗳️ **投票淘汰** - 實時投票，同票房主裁決
- 🏆 **勝負判定** - 智能判斷遊戲結果

### 社交功能
- 💬 **即時聊天** - 房間聊天室，狀態控制
- 🎨 **頭像系統** - 預設樣式 + 自定義上傳
- 👤 **個人資料** - 持久化玩家身份
- 🔗 **好友系統** - 玩家連接狀態顯示

### 房主控制
- ⚙️ **遊戲設定** - 臥底數量、白板數量、計時器
- 👑 **房主權限** - 開始/結束遊戲、踢人、轉移房主
- ⚖️ **同票裁決** - 投票平局時房主最終決定
- 📊 **遊戲統計** - 實時顯示遊戲進度

### 技術特色
- 📱 **響應式設計** - 完美適配手機、平板、電腦
- ⚡ **實時同步** - Firebase 實時資料庫
- 🔒 **安全防護** - 內容過濾、速率限制、權限控制
- 🎨 **現代 UI** - shadcn/ui 組件庫，精美界面

## 🛠 技術棧

- **前端框架**: Next.js 15 + TypeScript
- **UI 組件**: shadcn/ui + Tailwind CSS
- **狀態管理**: Zustand
- **後端服務**: Firebase Functions
- **資料庫**: Firestore
- **檔案存儲**: Firebase Storage
- **實時通信**: Firestore 實時監聽
- **部署平台**: Firebase Hosting
- **測試框架**: Vitest + Playwright

## 🚀 快速開始

### 環境要求

- Node.js >= 20
- npm 或 yarn
- Firebase CLI

### 本地開發

1. **克隆專案**
```bash
git clone <repository-url>
cd undercover-game
```

2. **安裝依賴**
```bash
npm install
cd functions && npm install && cd ..
```

3. **Firebase 設置**
```bash
# 登入 Firebase
firebase login

# 選擇 Firebase 專案
firebase use --add

# 初始化 Firebase 配置
firebase init
```

4. **環境配置**
```bash
# 複製環境變數範本
cp .env.example .env.local

# 編輯環境變數
# NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
# NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
# ...
```

5. **啟動開發環境**
```bash
# 啟動 Firebase 模擬器
npm run emulators

# 新終端啟動 Next.js 開發服務器
npm run dev
```

6. **訪問應用**
- 前端: http://localhost:3000
- Firebase 模擬器 UI: http://localhost:4000

### 生產部署

```bash
# 建構專案
npm run build

# 部署到 Firebase
firebase deploy

# 或分別部署
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
```

## 🎯 遊戲規則

### 基本流程
1. **房間創建** - 房主創建遊戲房間，獲得 6 位數房間代碼
2. **玩家加入** - 其他玩家輸入房間代碼加入遊戲
3. **遊戲設定** - 房主調整臥底數量、白板數量、計時器等
4. **開始遊戲** - 系統隨機分配角色和詞語
5. **發言階段** - 每位玩家依次描述自己的詞語（限時 60 秒）
6. **投票階段** - 所有玩家投票選出疑似臥底（限時 30 秒）
7. **結果揭曉** - 公布投票結果和被淘汰玩家身份
8. **勝負判定** - 檢查是否達成勝利條件，否則進入下一輪

### 角色說明
- **平民** - 獲得平民詞語，目標是找出所有臥底
- **臥底** - 獲得臥底詞語，目標是隱藏身份存活到最後
- **白板** - 不知道任何詞語，需要通過其他人的描述猜測

### 勝利條件
- **平民勝利** - 成功淘汰所有臥底
- **臥底勝利** - 臥底人數 ≥ 平民人數，或存活到最後

## 📁 專案結構

```
undercover-game/
├── app/                    # Next.js App Router
│   ├── page.tsx           # 首頁
│   ├── room/              # 房間相關頁面
│   └── layout.tsx         # 根佈局
├── components/            # React 組件
│   ├── ui/               # 基礎 UI 組件
│   ├── player-avatar.tsx # 玩家頭像組件
│   ├── chat-panel.tsx    # 聊天面板
│   ├── speak-panel.tsx   # 發言面板
│   ├── vote-panel.tsx    # 投票面板
│   └── host-panel.tsx    # 房主控制面板
├── lib/                   # 工具函數
│   ├── firebase.ts       # Firebase 配置
│   ├── game-logic.ts     # 遊戲邏輯
│   ├── auth.ts           # 身份認證
│   ├── avatar.ts         # 頭像處理
│   └── api-client.ts     # API 客戶端
├── types/                 # TypeScript 類型
│   └── game.ts           # 遊戲相關類型
├── functions/             # Firebase Functions
│   └── src/
│       └── index.ts      # Cloud Functions
├── __tests__/             # 單元測試
├── e2e/                   # E2E 測試
├── firestore.rules       # Firestore 安全規則
├── storage.rules         # Storage 安全規則
└── firebase.json         # Firebase 配置
```

## 🧪 測試

### 單元測試
```bash
# 運行所有單元測試
npm run test

# 監聽模式
npm run test:watch

# 生成覆蓋率報告
npm run test:coverage
```

### E2E 測試
```bash
# 安裝 Playwright
npx playwright install

# 運行 E2E 測試
npm run test:e2e

# 互動模式
npm run test:e2e:ui
```

### 測試覆蓋範圍
- ✅ 遊戲邏輯核心函數
- ✅ 角色分配算法
- ✅ 投票計算邏輯
- ✅ 勝負判定規則
- ✅ 內容驗證函數
- ✅ 完整遊戲流程 E2E
- ✅ 房主控制功能
- ✅ 聊天系統
- ✅ 頭像功能

## 🔧 API 文檔

### REST API

#### 房間管理
```typescript
POST /api/rooms
// 創建房間
Body: { hostName: string }
Response: { code: string, hostToken: string }

POST /api/rooms/:code/join
// 加入房間
Body: { name: string }
Response: { playerId: string, token: string }

GET /api/rooms/:code
// 獲取房間信息
Response: Room
```

#### 遊戲控制
```typescript
POST /api/rooms/:code/config
// 更新房間配置（房主）
Headers: { Authorization: "Bearer <hostToken>" }
Body: Partial<RoomConfig>

POST /api/rooms/:code/start
// 開始遊戲（房主）
Headers: { Authorization: "Bearer <hostToken>" }

POST /api/rooms/:code/speak
// 發言
Headers: { Authorization: "Bearer <token>" }
Body: { text: string }

POST /api/rooms/:code/vote
// 投票
Headers: { Authorization: "Bearer <token>" }
Body: { targetId?: string }
```

#### 房主操作
```typescript
POST /api/rooms/:code/kick
// 踢出玩家（房主）
Headers: { Authorization: "Bearer <hostToken>" }
Body: { targetId: string }

POST /api/rooms/:code/transfer-host
// 轉移房主（房主）
Headers: { Authorization: "Bearer <hostToken>" }
Body: { toPlayerId: string }

POST /api/rooms/:code/tiebreak
// 同票裁決（房主）
Headers: { Authorization: "Bearer <hostToken>" }
Body: { targetId: string }
```

#### 聊天系統
```typescript
POST /api/rooms/:code/chat
// 發送聊天訊息
Headers: { Authorization: "Bearer <token>" }
Body: { text: string }

GET /api/rooms/:code/messages?limit=100
// 獲取聊天記錄
Response: Message[]
```

### 實時事件 (SSE)

```typescript
GET /api/rooms/:code/events?token=<token>
// 訂閱房間事件

Events:
- room.sync: 房間狀態同步
- timer.tick: 計時器更新
- speak.submitted: 有人發言
- vote.open: 投票開始
- vote.result: 投票結果
- game.ended: 遊戲結束
- chat.message: 新聊天訊息
```

## 🔒 安全特性

### 內容安全
- 發言內容長度限制（120 字）
- 聊天訊息長度限制（200 字）
- 不雅詞語過濾
- 重複字元檢測（防刷屏）

### 速率限制
- 聊天訊息：每 5 秒 1 則
- API 請求：基於 IP 和 Token 限制
- 頭像上傳：512KB 大小限制

### 權限控制
- 房主專屬操作驗證
- Token 身份認證
- Firestore 安全規則
- Storage 訪問控制

## 🐛 已知問題

### ✅ 已修復：無法創建房間
- **問題**：首頁點擊「建立房間」無法創建房間
- **原因**：API 客戶端指向 Firebase Functions，但 Functions 需要付費方案
- **修復**：
  - 添加 Next.js API Routes 作為本地開發後端
  - 修復首頁組件使用正確的 API 客戶端
  - 添加錯誤處理和重試 UI
  - 添加 E2E 測試驗證創建房間流程

### 🔧 本地開發設置

由於 Firebase Functions 需要付費方案，本地開發使用 Next.js API Routes：

```bash
# 啟動本地開發服務器
npm run dev

# 訪問 http://localhost:3000
# 創建房間功能現在可以正常工作
```

### 🚀 生產部署

要在生產環境啟用完整功能：

1. 升級 Firebase 到 Blaze 方案
2. 部署 Cloud Functions：`firebase deploy --only functions`
3. 更新 API_BASE 配置指向 Functions

## 📄 授權

MIT License - 詳見 [LICENSE](LICENSE) 文件

---

**🎮 開始你的臥底之旅吧！**
