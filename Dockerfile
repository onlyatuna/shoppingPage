# ==========================================
# 階段 1: Builder
# ==========================================
FROM node:20-slim AS builder

RUN apt-get update -y && apt-get install -y openssl ca-certificates

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

# ==========================================
# 階段 2: Runner
# ==========================================
FROM node:20-slim AS runner

RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY apps/backend/package.json ./apps/backend/

# [修正] 只複製根目錄的 node_modules (因為 Monorepo 依賴都在這)
COPY --from=builder /app/node_modules ./node_modules

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