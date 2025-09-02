# 誰是臥底 (Undercover Game)

一個基於 Next.js 14 的即時多人「誰是臥底」推理遊戲。

## 🎮 遊戲介紹

「誰是臥底」是一個經典的推理遊戲：
- 每位玩家會收到一個詞語
- 大部分玩家是平民（相同詞語），少數是臥底（相似但不同的詞語）
- 每人輪流發言一句話描述自己的詞語
- 投票選出最可疑的人
- 找出所有臥底即平民勝利，否則臥底勝利

## 🚀 快速開始

### 環境需求

- Node.js >= 20
- npm 或 pnpm

### 安裝與啟動

1. **克隆專案**
   ```bash
   git clone <repository-url>
   cd undercover-game
   ```

2. **安裝依賴**
   ```bash
   npm install
   # 或
   pnpm install
   ```

3. **設定環境變數（可選）**
   ```bash
   cp .env.example .env.local
   ```

   編輯 `.env.local` 文件：
   - `OPENAI_API_KEY`: OpenAI API 金鑰（可選，用於 AI 產生題目）
   - 如果未設定，將使用內建的 50+ 組中文題庫

4. **啟動開發伺服器**
   ```bash
   npm run dev
   # 或
   pnpm dev
   ```

5. **開啟瀏覽器**

   訪問 [http://localhost:3000](http://localhost:3000)

## 🎯 如何遊玩

### 建立房間
1. 在首頁點擊「建立房間」
2. 系統會產生 6 位數房間號碼
3. 分享房間號碼給朋友

### 加入房間
1. 在首頁輸入房間號碼和暱稱
2. 點擊「加入房間」

### 遊戲流程
1. **大廳階段**：
   - 等待玩家加入（至少 3 人）
   - 房主可調整臥底數量（1-3 人）
   - 所有玩家點擊「準備就緒」
   - 房主點擊「開始遊戲」

2. **發言階段**：
   - 每位玩家收到私訊詞語和身分
   - 輪流發言一句話描述詞語（不能直接說出）
   - 限制 100 字以內

3. **投票階段**：
   - 所有人發言完畢後進入投票
   - 每人投票選出最可疑的玩家
   - 不能投給自己

4. **結果階段**：
   - 公布被淘汰者身分
   - 顯示遊戲結果和所有玩家角色
   - 可選擇再來一局或返回首頁

## 🧪 多人測試

### 本地測試
1. 啟動開發伺服器
2. 開啟多個瀏覽器視窗或分頁
3. 一個視窗建立房間，其他視窗加入房間
4. 使用不同的暱稱模擬多個玩家

### 網路測試
1. 部署到 Vercel 或其他平台
2. 分享網址給朋友
3. 每人使用自己的裝置加入遊戲

## 🛠 技術架構

### 前端技術
- **Next.js 14**: React 框架（App Router）
- **TypeScript**: 型別安全
- **Tailwind CSS**: 樣式框架
- **shadcn/ui**: UI 元件庫

### 後端技術
- **Next.js API Routes**: RESTful API
- **Server-Sent Events (SSE)**: 即時事件推播
- **記憶體儲存**: 房間狀態管理
- **zod**: 資料驗證
- **nanoid**: ID 產生

### AI 整合
- **OpenAI API**: 智能題目產生（可選）
- **內建題庫**: 50+ 組中文相近詞對

## 📁 專案結構

```
├── app/                    # Next.js App Router
│   ├── api/               # API 路由
│   │   └── rooms/         # 房間相關 API
│   ├── room/[code]/       # 房間頁面
│   └── page.tsx           # 首頁
├── components/            # React 元件
│   └── ui/               # UI 基礎元件
├── lib/                  # 核心邏輯
│   ├── engine.ts         # 遊戲引擎
│   ├── store.ts          # 狀態管理
│   ├── topic.ts          # 題目產生
│   ├── sse.ts            # SSE 事件系統
│   └── utils.ts          # 工具函式
├── types/                # TypeScript 型別定義
├── tests/                # 單元測試
└── README.md
```

## 🧪 測試

### 執行測試
```bash
npm run test
# 或
pnpm test
```

### 測試覆蓋
- 遊戲邏輯引擎（角色分配、投票計算、勝負判定）
- 題目產生器（OpenAI API 與內建題庫）
- 邊界條件和錯誤處理

## 📦 部署

### Vercel 部署
1. 推送程式碼到 GitHub
2. 連接 Vercel 帳號
3. 匯入專案並部署
4. 設定環境變數（如需要 OpenAI API）

### 其他平台
專案支援任何支援 Node.js 的部署平台：
- Netlify
- Railway
- Render
- 自架伺服器

## 🔧 開發指令

```bash
# 開發模式
npm run dev

# 建置專案
npm run build

# 啟動正式版
npm run start

# 執行測試
npm run test

# 測試監聽模式
npm run test:watch

# 測試 UI 介面
npm run test:ui

# 程式碼檢查
npm run lint

# 自動修復程式碼
npm run lint:fix
```

## 🚀 未來擴充

### 已規劃功能
- [ ] 多輪遊戲模式
- [ ] 觀戰者模式
- [ ] 房間密碼保護
- [ ] 玩家頭像系統
- [ ] 遊戲歷史記錄
- [ ] 排行榜系統

### 技術改進
- [ ] Redis 狀態儲存
- [ ] WebSocket 即時通訊
- [ ] 多伺服器支援
- [ ] 手機 App 版本
- [ ] 語音聊天整合

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

## 📄 授權

MIT License

## 🎉 致謝

感謝所有參與測試和回饋的朋友們！
