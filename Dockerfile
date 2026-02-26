# 階段 1: Builder
# ==========================================
FROM node:22-slim AS builder

RUN apt-get update && \
    apt-get install -y openssl ca-certificates && \
    npm install -g npm@latest && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*


WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/shared/package.json ./packages/shared/

RUN npm ci

COPY . .

WORKDIR /app/apps/backend
RUN npx prisma generate

WORKDIR /app
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=apps/frontend
RUN npm run build --workspace=apps/backend

# 移除開發用的依賴，只保留 production 需要的模組 (取代已棄用的 --production 參數)，並清除 npm 快取
RUN npm prune --omit=dev && npm cache clean --force

# ==========================================
# 階段 2: Runner
# ==========================================
FROM node:22-slim AS runner

RUN apt-get update && \
    apt-get install -y openssl ca-certificates && \
    npm install -g npm@latest && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*


WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY apps/backend/package.json ./apps/backend/

# [修正] 只複製根目錄的 node_modules (因為 Monorepo 依賴都在這)
COPY --from=builder /app/node_modules ./node_modules

# [優化] 手動刪除絕對用不到的資料夾，進一步瘦身
RUN rm -rf node_modules/typescript && rm -rf node_modules/@types

# ❌ 刪除這行 (這行導致報錯，因為該目錄不存在)
# COPY --from=builder /app/apps/backend/node_modules ./apps/backend/node_modules

# 複製編譯好的後端程式碼
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist

# 複製編譯好的前端靜態檔 (搬到後端 public)
COPY --from=builder /app/apps/frontend/dist ./apps/backend/public

# 複製 Prisma Schema 與 Migrations
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma

EXPOSE 3000

# 啟動指令
CMD ["sh", "-c", "cd apps/backend && npx prisma migrate deploy && node dist/app.js"]