FROM node:20-alpine AS base
WORKDIR /app

# 先複製 package 檔並安裝依賴（可利用層快取）
COPY package.json package-lock.json* ./
RUN npm ci

# 複製原始碼並建置
COPY . .
RUN npm run build

# 運行階段
ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "start"]