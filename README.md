Shopping Page Project (E-commerce Platform)
這是一個全端電子商務平台專案，採用 Monorepo 架構開發。包含完整的使用者購物流程、購物車管理、LinePay 金流串接以及後台管理系統。

🛠 技術堆疊 (Tech Stack)
核心架構
Monorepo Management: NPM Workspaces

Language: TypeScript

前端 (Frontend) - apps/frontend
Framework: React (Vite)

Styling: Tailwind CSS

State Management: Zustand (useCartStore, authStore)

HTTP Client: Axios

Routing: React Router DOM

後端 (Backend) - apps/backend
Runtime: Node.js

Framework: Express.js

Database ORM: Prisma

Database: PostgreSQL

Payment: LinePay API Integration

Authentication: JWT (JSON Web Tokens)

✨ 功能特色 (Features)
👤 使用者功能
會員系統：註冊、登入 (JWT)、Email 驗證、忘記密碼。

商品瀏覽：商品列表、分類篩選、關鍵字搜尋。

購物車：新增商品、調整數量、移除商品。

結帳流程：訂單建立、整合 LinePay 線上付款。

個人中心：查看個人資料、歷史訂單狀態。

🛡️ 管理員後台 (Admin Dashboard)
商品管理：新增、修改、刪除 (Soft Delete) 商品，上傳圖片。

分類管理：管理商品分類。

訂單管理：查看所有訂單、更新訂單狀態 (Pending, Paid, Shipped, etc.)。

使用者管理：查看會員列表、管理權限。

🚀 快速開始 (Getting Started)
前置需求
Node.js (v18+)

PostgreSQL Database

1. 安裝依賴
在專案根目錄執行：

Bash

npm install
2. 環境變數設定 (.env)
請在 apps/backend 目錄下建立 .env 檔案，並填入以下內容：

程式碼片段

# Server Configuration
PORT=3000
NODE_ENV=development

# Database (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/shopping_db?schema=public"

# JWT Authentication
JWT_SECRET="your_super_secret_key"

# Frontend URL (For CORS & Redirects)
FRONTEND_URL="http://localhost:5173"

# LinePay Configuration
LINE_PAY_CHANNEL_ID="your_channel_id"
LINE_PAY_CHANNEL_SECRET="your_channel_secret"
LINE_PAY_VERSION="v3"
LINE_PAY_SITE_URL="https://sandbox-api-pay.line.me"

# Email Service (Nodemailer - Gmail example)
NODEMAILER_USER="your_email@gmail.com"
NODEMAILER_PASS="your_app_password"
3. 資料庫初始化 (Prisma)
進入後端目錄並執行遷移與種子資料填充：

Bash

cd apps/backend

# 執行資料庫遷移
npx prisma migrate dev

# 填充初始資料 (Seed)
npx prisma db seed
注意：seed.ts 會建立預設的管理員帳號與測試商品。

4. 啟動開發伺服器
建議開啟兩個終端機視窗分別啟動前後端：

Terminal 1 (Backend):

Bash

cd apps/backend
npm run dev
# 伺服器將運行於 http://localhost:3000
Terminal 2 (Frontend):

Bash

cd apps/frontend
npm run dev
# 前端將運行於 http://localhost:5173
📂 專案結構 (Project Structure)
Plaintext

.
├── apps
│   ├── backend         # Express 伺服器、API 邏輯、Prisma Schema
│   │   ├── prisma      # 資料庫模型與遷移檔
│   │   └── src
│   │       ├── controllers  # 處理請求邏輯
│   │       ├── services     # 業務邏輯層
│   │       ├── routes       # API 路由定義
│   │       └── utils        # 工具函式 (LinePay, Prisma client)
│   │
│   └── frontend        # React 應用程式
│       ├── src
│       │   ├── api          # Axios 設定與 API 呼叫
│       │   ├── components   # UI 元件
│       │   ├── pages        # 頁面路由
│       │   └── store        # Zustand 狀態管理
│
└── packages
    └── shared          # 前後端共用的 TypeScript Types
⚠️ 部署注意事項 (Deployment)
API 路徑：前端透過 Proxy (vite.config.ts) 將 /api 請求轉發至後端。在生產環境中，請確保 Nginx 或伺服器配置正確的反向代理。

CORS：生產環境請在 apps/backend/src/app.ts 中嚴格設定 cors 的 origin，避免開放所有來源。

Security：不要將 .env 檔案提交到版本控制系統。

📝 License
This project is licensed under the MIT License.