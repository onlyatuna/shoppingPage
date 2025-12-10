# 使用 Node 20 Slim (對應您之前的 OpenSSL 3.0 設定)
FROM node:20-slim

# 安裝系統依賴 (OpenSSL 是 Prisma 必備)
RUN apt-get update -y && apt-get install -y openssl ca-certificates

WORKDIR /app

# 1. 複製所有 package.json 設定檔
# (利用 Docker Layer Caching 加速)
COPY package.json package-lock.json ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/shared/package.json ./packages/shared/

# 2. 安裝依賴
# 建議：如果 package-lock.json 是正常的，使用 'npm ci' 會比 'npm install' 更快更穩
# 如果 lock 檔有衝突，才使用 'npm install'
RUN npm install

# 3. 複製所有原始碼
COPY . .

# 4. 生成 Prisma Client
# (這一步必須在 Build Backend 之前)
WORKDIR /app/apps/backend
RUN npx prisma generate

# ---------------------------------------------------
# 🚀 建置流程 (依賴順序)
# ---------------------------------------------------

WORKDIR /app

# 5. Build Shared (共用型別/邏輯)
RUN npm run build --workspace=packages/shared

# 6. Build Frontend (React/Vite)
RUN npm run build --workspace=apps/frontend

# 7. [關鍵] 將前端 Build 好的檔案搬移到後端 Public 目錄
# 假設後端程式碼是寫 app.use(express.static(path.join(__dirname, '../public')))
# 或是 app.use(express.static('public'))
# 請根據您 index.ts 的設定調整這裡的目標路徑
RUN mkdir -p apps/backend/public && \
    cp -r apps/frontend/dist/* apps/backend/public/

# 8. Build Backend (TypeScript)
RUN npm run build --workspace=apps/backend

# ---------------------------------------------------

# 9. 設定執行環境
ENV NODE_ENV=production
EXPOSE 3000

# 10. 啟動指令
# 注意：Prisma Migrate Deploy 建議在 CD 流程做，但在這裡做也行 (方便)
CMD ["sh", "-c", "cd apps/backend && npx prisma migrate deploy && node dist/app.js"]
# 注意：請確認您的後端入口是 dist/index.js 還是 dist/app.js