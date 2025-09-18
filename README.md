# NCDR Alerts Dashboard (Next.js 14)

以 NCDR 「生效中的示警」 ATOM/CAP 資料為來源的示警網站（含伺服器端解析與 60s 快取）。

## 快速開始
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