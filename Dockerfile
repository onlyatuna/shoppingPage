# 階段 1: Builder
# ==========================================
FROM node:22-slim AS builder

RUN apt-get update && \
    apt-get install -y openssl ca-certificates tini && \
    npm install -g npm@latest && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*


WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/shared/package.json ./packages/shared/

RUN npm ci

# 複製 Prisma schema 並生成 Client (在 COPY . . 之前，利用 Cache)
COPY apps/backend/prisma ./apps/backend/prisma
WORKDIR /app/apps/backend
RUN npx prisma generate

WORKDIR /app
COPY . .

RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=apps/frontend
RUN npm run build --workspace=apps/backend

# 移除開發用的依賴，並清除 npm 快取
RUN npm prune --omit=dev && npm cache clean --force

# ==========================================
# 階段 2: Runner
# ==========================================
FROM node:22-slim AS runner

# 安裝 runtime 必要套件 (openssl 是 Prisma 二進位檔需要的)
# 並移除 npm 與 npx 以縮減體積並降低資安風險 (Production 不應有套件管理器)
RUN apt-get update && \
    apt-get install -y openssl ca-certificates tini && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    rm -f /usr/local/bin/npm /usr/local/bin/npx && \
    rm -rf /usr/local/lib/node_modules/npm

WORKDIR /app

ENV NODE_ENV=production

# 複製必要的 package 定義
COPY package.json package-lock.json ./
COPY apps/backend/package.json ./apps/backend/

# [修正] 只複製根目錄的 node_modules (確保包含了 .prisma)
COPY --from=builder /app/node_modules ./node_modules

# [優化] 手動刪除絕對用不到的開發工具，進一步瘦身
RUN rm -rf node_modules/typescript node_modules/@types

# 複製編譯好的產物
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/frontend/dist ./apps/backend/public
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma
# 複製 entrypoint 腳本
COPY --from=builder /app/apps/backend/scripts/entrypoint.sh ./apps/backend/scripts/entrypoint.sh

# [SECURITY] 權限與啟動設定
USER root
RUN chmod +x /app/apps/backend/scripts/entrypoint.sh && \
    chown -R node:node /app
USER node

EXPOSE 3000

# 啟動指令 (ENTRYPOINT 會先執行 entrypoint.sh，再執行 CMD)
ENTRYPOINT ["/usr/bin/tini", "--", "/app/apps/backend/scripts/entrypoint.sh"]
CMD ["node", "apps/backend/dist/app.js"]
