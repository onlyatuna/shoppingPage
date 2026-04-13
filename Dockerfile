# ==========================================
# 階段 1: Builder
# ==========================================
FROM node:22-slim AS builder

# 安裝編譯時必要的套件
RUN apt-get update && \
    apt-get install -y openssl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 複製依賴定義
COPY package.json package-lock.json ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/shared/package.json ./packages/shared/

# 安裝全部依賴
RUN npm ci

# 複製 Prisma 並生成 Client
COPY apps/backend/prisma ./apps/backend/prisma
RUN cd apps/backend && npx prisma generate

# 複製原始碼並編譯
COPY . .
RUN npm run build --workspace=packages/shared && \
    npm run build --workspace=apps/frontend && \
    npm run build --workspace=apps/backend

# 移除快取，但保留依賴以確保 Prisma 等工具可用
RUN npm cache clean --force

# ==========================================
# 階段 2: Runner
# ==========================================
FROM node:22-slim AS runner

# 1. 基礎環境設定：加入 tini 解決僵屍進程問題
RUN apt-get update && \
    apt-get install -y openssl ca-certificates tini && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV NODE_ENV=production

# 2. 核心優化：使用 --chown 確保權限正確
COPY --from=builder --chown=node:node /app/package.json /app/package-lock.json ./
COPY --from=builder --chown=node:node /app/apps/backend/package.json ./apps/backend/
# 確保我們複製了整個 monorepo 的 node_modules 結構，包含了根目錄的 prisma CLI
COPY --from=builder --chown=node:node /app/node_modules ./node_modules

# 3. 複製編譯產物
COPY --from=builder --chown=node:node /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder --chown=node:node /app/apps/frontend/dist ./apps/backend/public
COPY --from=builder --chown=node:node /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=builder --chown=node:node /app/apps/backend/scripts/entrypoint.sh ./apps/backend/scripts/entrypoint.sh

# 4. [關鍵修復] 確保在生產環境中也能直接找到 prisma 執行檔
# 我們在 runner 階段手動建立連結，或是確保 npx 能找到它
RUN ln -s /app/node_modules/prisma/build/index.js /app/node_modules/prisma/index.js || true

# 5. 確保腳本可執行
RUN chmod +x /app/apps/backend/scripts/entrypoint.sh

USER node
EXPOSE 3000

# 5. 終極解決方案：使用 tini 作為 Entrypoint
# tini 會幫你收屍 (Reap Zombies) 並正確轉發 SIGTERM

ENTRYPOINT ["/usr/bin/tini", "--", "/app/apps/backend/scripts/entrypoint.sh"]
CMD ["node", "apps/backend/dist/app.js"]