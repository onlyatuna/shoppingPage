# ==========================================
# 階段 1: Builder (負責編譯與安裝所有依賴)
# ==========================================
FROM node:20-slim AS builder

# 安裝系統依賴 (Prisma 需要 OpenSSL)
RUN apt-get update -y && apt-get install -y openssl ca-certificates

WORKDIR /app

# 1. 先複製設定檔 (利用 Docker Layer Caching)
COPY package.json package-lock.json ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/shared/package.json ./packages/shared/

# 2. 安裝所有依賴 (包含 devDependencies)
RUN npm ci

# 3. 複製原始碼
COPY . .

# 4. 生成 Prisma Client
WORKDIR /app/apps/backend
RUN npx prisma generate

# 5. 開始編譯 (Shared -> Frontend -> Backend)
WORKDIR /app
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=apps/frontend
RUN npm run build --workspace=apps/backend

# ==========================================
# 階段 2: Runner (最終的輕量化 Image)
# ==========================================
FROM node:20-slim AS runner

# 安裝執行時必要的系統庫
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production

# 6. 只複製「執行需要」的檔案，丟棄原始碼與開發工具
# 複製 package.json (為了 npm scripts)
COPY package.json package-lock.json ./
COPY apps/backend/package.json ./apps/backend/

# 複製 node_modules (這裡選擇直接複製 builder 的，比較簡單穩健)
# 進階優化可以再做 npm prune，但怕誤刪 Prisma CLI 導致無法 migrate，先保留
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/backend/node_modules ./apps/backend/node_modules

# 複製編譯好的後端程式碼
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist

# 複製編譯好的前端靜態檔 (搬到後端 public)
# 這裡直接在 COPY 時完成搬移，不需要再 mkdir
COPY --from=builder /app/apps/frontend/dist ./apps/backend/public

# 複製 Prisma Schema 與 Migrations (為了執行 npx prisma migrate deploy)
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma

# 7. 設定權限與埠口
EXPOSE 3000

# 8. 啟動指令
# 注意：路徑依舊是 dist/app.js
CMD ["sh", "-c", "cd apps/backend && npx prisma migrate deploy && node dist/app.js"]