# 使用 Node 20 Slim
FROM node:20-slim

# 安裝系統依賴
RUN apt-get update -y && apt-get install -y openssl ca-certificates

WORKDIR /app

# 1. 複製所有 package.json (包含 shared!)
COPY package.json package-lock.json ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/
# 👇 [新增] 這一行很重要，複製 shared 的設定檔
COPY packages/shared/package.json ./packages/shared/

# 2. 安裝依賴 (維持上一部修正的 npm install)
RUN rm -f package-lock.json && npm install

# 3. 複製所有原始碼
COPY . .

# 4. 生成 Prisma Client
WORKDIR /app/apps/backend
RUN npx prisma generate

# ---------------------------------------------------
# 👇👇👇 修正重點：依順序編譯 👇👇👇
# ---------------------------------------------------

WORKDIR /app

# 5. 先 Build 共用套件 (Shared)
# 注意：這一步會執行 packages/shared/package.json 裡的 "build" 指令
RUN npm run build --workspace=packages/shared

# 6. 再 Build 前端
RUN npm run build --workspace=apps/frontend

# 7. 最後 Build 後端 (這時候 shared 已經好了，就不會報錯)
RUN npm run build --workspace=apps/backend

# ---------------------------------------------------

# 8. 設定環境
ENV NODE_ENV=production
EXPOSE 3000

# 9. 啟動
CMD ["sh", "-c", "cd apps/backend && npx prisma migrate deploy && node dist/app.js"]