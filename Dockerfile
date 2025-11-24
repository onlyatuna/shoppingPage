# 使用 Node 20 (Slim 版本體積小且相容性好)
FROM node:20-slim

# 安裝 OpenSSL (Prisma 需要)
RUN apt-get update -y && apt-get install -y openssl ca-certificates

WORKDIR /app

# 1. 複製設定檔
COPY package.json package-lock.json ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/
# 如果有 packages/shared 也要加
# COPY packages/shared/package.json ./packages/shared/

# 2. 安裝所有依賴
RUN rm -f package-lock.json && npm install

# 3. 複製所有原始碼
COPY . .

# 4. 生成 Prisma Client (後端資料庫型別)
WORKDIR /app/apps/backend
RUN npx prisma generate

# ---------------------------------------------------
# 👇👇👇 修正重點：明確執行前端與後端的 Build 👇👇👇
# ---------------------------------------------------

WORKDIR /app

# 5. 強制 Build 前端
# 這會執行 apps/frontend/package.json 裡的 "build" 指令
# 如果這裡記憶體不足(Killed)，請參考下方的記憶體解法
RUN npm run build --workspace=apps/frontend

# 6. 強制 Build 後端
RUN npm run build --workspace=apps/backend

# ---------------------------------------------------

# 7. 設定環境變數
ENV NODE_ENV=production
EXPOSE 3000

# 8. 啟動 (先 Migrate DB 再啟動 Server)
CMD ["sh", "-c", "cd apps/backend && npx prisma migrate deploy && node dist/app.js"]