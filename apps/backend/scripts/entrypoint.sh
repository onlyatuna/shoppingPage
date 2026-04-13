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
const { URL } = require('url');
const net = require('net');
try {
    const dbUrl = new URL(process.env.DATABASE_URL);
    const host = dbUrl.hostname;
    const port = dbUrl.port || 3306;
    const client = net.createConnection({ host, port, timeout: 2000 }, () => {
        client.end();
        process.exit(0);
    });
    client.on('error', () => process.exit(1));
} catch (e) {
    console.error('URL Parsing Error:', e.message);
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

# 4. 資料庫 Port 已開，執行 Prisma Migration
echo "Database port is open. Running Prisma migrations..."
# [FIX] 使用 npx 確保能正確定位到 prisma 執行檔
if ! npx prisma migrate deploy --schema=./apps/backend/prisma/schema.prisma; then
    echo "Error: Prisma migration failed."
    exit 1
fi

echo "Migrations completed successfully. Starting application..."

# 5. 啟動應用程式 (傳遞 CMD 指令)
exec "$@"
