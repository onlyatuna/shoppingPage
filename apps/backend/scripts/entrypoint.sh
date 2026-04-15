#!/bin/sh
# apps/backend/scripts/entrypoint.sh
set -e

# 1. 檢查必要的環境變數
if [ -z "$DATABASE_URL" ]; then
    echo "Error: DATABASE_URL is not set."
    exit 1
fi

echo "Starting Entrypoint Script..."

# 2. 定義偵測函數 (執行極小 Node 腳本，避免 prisma migrate 開銷)
# 邏輯：嘗試建立 TCP 連線到 DATABASE_URL 指定的 Host/Port
check_db_ready() {
    node -e "
const net = require('net');
try {
    // 捨棄複雜的 URL 解析，直接以 Docker Compose 的 host 與 port 為主
    const host = process.env.DB_HOST || 'db';
    const port = parseInt(process.env.DB_PORT || '3306', 10);
    const client = net.createConnection({ host, port, timeout: 2000 }, () => {
        client.end();
        process.exit(0);
    });
    client.on('error', () => process.exit(1));
} catch (e) {
    console.error('Connection Check Error:', e.message);
    process.exit(1);
}
"
}

# 3. 等待資料庫 Port 開放 (Retry Loop)
MAX_RETRIES=15
COUNT=0
echo "Waiting for database port to be open..."

until check_db_ready || [ $COUNT -eq $MAX_RETRIES ]; do
  echo "Database port is not reachable... retrying in 3 seconds ($COUNT/$MAX_RETRIES)"
  COUNT=$((COUNT + 1))
  sleep 3
done

if [ $COUNT -eq $MAX_RETRIES ]; then
  echo "Error: Database connection timeout (Port not open)."
  exit 1
fi

# 4. 資料庫 Port 已開，執行診斷與 Prisma Migration
echo "Database port is open. Verifying environment..."

# 嘗試定位 Prisma 執行檔 (根目錄 node_modules 或當前目錄)
PRISMA_BIN="./node_modules/.bin/prisma"
if [ ! -f "$PRISMA_BIN" ]; then
    PRISMA_BIN="npx prisma"
fi

echo "Using Prisma binary: $PRISMA_BIN"
$PRISMA_BIN -v

echo "Running Prisma migrations..."
if ! $PRISMA_BIN migrate deploy --schema=./apps/backend/prisma/schema.prisma; then
    echo "Error: Prisma migration failed."
    exit 1
fi

echo "Migrations completed successfully. Starting application..."

# 5. 啟動應用程式 (傳遞 CMD 指令)
exec "$@"
