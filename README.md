# NCDR Alerts Dashboard (Next.js 14)

以 NCDR 「生效中的示警」 ATOM/CAP 資料為來源的示警網站（含伺服器端解析與 60s 快取）。

<<<<<<< HEAD
## 快速開始
=======
## 🎮 遊戲介紹

「誰是臥底」是一個經典的推理遊戲：
- 每位玩家會收到一個詞語
- 大部分玩家是平民（相同詞語），少數是臥底（相似但不同的詞語）
- 每人輪流發言一句話描述自己的詞語
- 投票選出最可疑的人
- 找出所有臥底即平民勝利，否則臥底勝利

## 🚀 快速開始.

### 環境需求

- Node.js >= 20
- pnpm >= 8（或使用 npm）

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
>>>>>>> de95443501ec69b283a4b1cc11f21b9a8f5d2ef6
```bash
npm i
cp .env.local.example .env.local
# 將 FEED_ACTIVE_URL 設為 NCDR 的「生效中的示警」ATOM 連結
npm run dev
```
打開 http://localhost:3000

## 主要設定
- `FEED_ACTIVE_URL`: NCDR 生效中的示警 ATOM feed URL（可選全台或縣市別）
- `ALERTS_CAP_LIMIT`: 解析 CAP 連結上限（預設 20）
- `FETCH_TIMEOUT_MS`: 抓取逾時（預設 8000ms）

## 部署
### Vercel（建議）
1. 連接 GitHub 專案
2. Project → Environment Variables 設定 `FEED_ACTIVE_URL` 等
3. 點 Deploy

### Docker / 自家主機
```bash
docker build -t ncdr-alerts .
docker run -p 3000:3000   -e FEED_ACTIVE_URL="<你的 ATOM 連結>"   -e ALERTS_CAP_LIMIT=20   -e FETCH_TIMEOUT_MS=8000   ncdr-alerts
```

## 注意
- 不要把 `.env.local` 提交到 Git（已在 `.gitignore`）。
- 若改用 NCDR Web API（需要 API Key），請把 Key 放在伺服器/平台的環境變數中，並修改 `/api/alerts` 取數邏輯。