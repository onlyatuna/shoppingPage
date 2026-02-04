# 🎨 AI 商品圖片編輯器

一個功能強大的 AI 驅動圖片編輯平台，專為社交媒體和電商設計，提供智能文案生成、風格化處理和一鍵發佈功能。

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## ✨ 核心功能

### 🖼️ 智能圖片編輯
- **拖放上傳**：支持本地圖片拖放上傳
- **圖片裁剪**：內建裁剪工具，支持自定義比例
- **圖框疊加**：提供多種精美圖框選擇
- **實時預覽**：即時查看編輯效果

### 🤖 AI 文案助手
- **自動生成**：基於 Google Gemini 2.0 Flash 自動生成吸引人的社交媒體文案
- **圖片分析**：AI 自動分析圖片內容，生成相關文案
- **自定義提示**：可自定義文案風格和重點
- **一鍵複製**：快速複製生成的文案

### 🎨 風格預設系統
- **內建風格**：提供多種預設風格（經典灰、深夜黑、清新綠、熱情紅等）
- **自定義風格**：創建、編輯和保存個人風格
- **顏色主題**：豐富的顏色主題選擇
- **圖示系統**：多種圖示可供選擇

### 📱 響應式設計
- **桌面端**：完整功能的專業編輯介面
- **移動端**：三步驟向導流程（編輯 → 文案 → 發布）
- **自適應布局**：完美適配各種屏幕尺寸
- **深色模式**：支持明暗主題切換

### 🚀 一鍵發佈
- **Instagram 集成**：直接發佈到 Instagram
- **圖片下載**：導出高質量 JPG 圖片
- **商品上架**：將編輯好的圖片上架為商品

## 🛠️ 技術棧

### 前端
- **React 18** - 現代化 UI 框架
- **TypeScript** - 類型安全
- **Vite** - 快速開發構建工具
- **TailwindCSS** - 原子化 CSS 框架
- **Framer Motion** - 流暢動畫效果
- **React Query** - 數據狀態管理
- **Zustand** - 輕量級狀態管理
- **React Hook Form** - 表單處理
- **Zod** - Schema 驗證
- **Axios** - HTTP 客戶端
- **React Easy Crop** - 圖片裁剪
- **React Dropzone** - 文件上傳
- **Lucide React** - 圖標庫
- **Sonner** - Toast 通知

### 後端
- **Node.js** - 運行環境
- **Express 5** - Web 框架
- **TypeScript** - 類型安全
- **Prisma** - ORM 數據庫工具
- **MySQL** - 關係型數據庫
- **Google Gemini AI** - AI 文案生成
- **Cloudinary** - 圖片存儲和處理
- **JWT** - 身份驗證
- **bcryptjs** - 密碼加密
- **Helmet** - 安全中間件
- **CORS** - 跨域資源共享
- **Multer** - 文件上傳處理

### 開發工具
- **Docker** - 容器化部署
- **GitHub Actions** - CI/CD 自動化
- **ESLint** - 代碼規範
- **Prettier** - 代碼格式化

## 📦 項目結構

```
shopPage/
├── apps/
│   ├── backend/          # 後端 API 服務
│   │   ├── prisma/       # 數據庫 Schema
│   │   └── src/
│   │       ├── controllers/  # 控制器
│   │       ├── routes/       # 路由
│   │       ├── services/     # 業務邏輯
│   │       └── app.ts        # 入口文件
│   └── frontend/         # 前端應用
│       └── src/
│           ├── components/   # 組件
│           │   ├── editor/   # 編輯器組件
│           │   └── mobile/   # 移動端組件
│           ├── pages/        # 頁面
│           ├── hooks/        # 自定義 Hooks
│           ├── lib/          # 工具函數
│           └── types/        # TypeScript 類型
├── packages/
│   └── shared/           # 共享代碼
└── docker-compose.yml    # Docker 配置
```

## 🚀 快速開始

### 環境要求
- Node.js >= 18
- MySQL >= 8.0
- npm 或 yarn

### 1. 克隆項目
```bash
git clone https://github.com/onlyatuna/shoppingPage.git
cd shoppingPage
```

### 2. 安裝依賴
```bash
# 安裝根目錄依賴
npm install

# 安裝前端依賴
cd apps/frontend
npm install

# 安裝後端依賴
cd ../backend
npm install
```

### 3. 環境配置

在 `apps/backend` 創建 `.env` 文件：

```env
# 數據庫配置
DATABASE_URL="mysql://user:password@localhost:3306/shopdb"

# JWT 密鑰
JWT_SECRET="your-secret-key"

# Google Gemini API
GEMINI_API_KEY="your-gemini-api-key"

# Cloudinary 配置
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# 前端 URL
FRONTEND_URL="http://localhost:5173"

# Instagram API (可選)
INSTAGRAM_APP_ID="your-app-id"
INSTAGRAM_APP_SECRET="your-app-secret"
```

### 4. 數據庫設置
```bash
cd apps/backend

# 生成 Prisma Client
npm run prisma:generate

# 推送數據庫 Schema
npm run prisma:push

# (可選) 運行種子數據
npm run prisma:seed
```

### 5. 啟動開發服務器

**後端：**
```bash
cd apps/backend
npm run dev
# 服務運行在 http://localhost:3000
```

**前端：**
```bash
cd apps/frontend
npm run dev
# 應用運行在 http://localhost:5173
```

## 🐳 Docker 部署

使用 Docker Compose 一鍵部署：

```bash
# 構建和啟動所有服務
docker-compose up -d

# 查看日誌
docker-compose logs -f

# 停止服務
docker-compose down
```

服務訪問地址：
- 前端：http://localhost
- 後端 API：http://localhost/api
- Prisma Studio：http://localhost:5555

## 📝 API 文檔

### 認證
- `POST /api/v1/auth/register` - 用戶註冊
- `POST /api/v1/auth/login` - 用戶登錄
- `GET /api/v1/auth/me` - 獲取當前用戶
- `POST /api/v1/auth/logout` - 登出

### 圖片處理
- `POST /api/v1/upload` - 上傳圖片
- `POST /api/v1/generate-caption` - AI 生成文案

### 自定義風格
- `GET /api/v1/custom-styles` - 獲取所有風格
- `POST /api/v1/custom-styles` - 創建風格
- `PUT /api/v1/custom-styles/:id` - 更新風格
- `DELETE /api/v1/custom-styles/:id` - 刪除風格

### Instagram
- `POST /api/v1/instagram/publish` - 發布到 Instagram

## 🎯 主要特性

### 移動端優化
- 三步驟編輯流程
- 底部浮動工具欄
- 側滑導航
- Touch 手勢支持

### 性能優化
- 圖片懶加載
- 代碼分割
- 響應式圖片
- 瀏覽器緩存策略

### 安全性
- JWT 身份驗證
- 密碼加密存儲
- CORS 保護
- 速率限制
- XSS 防護

### 無障礙性
- ARIA 標籤
- 鍵盤導航支持
- 語義化 HTML
- 對比度符合 WCAG 標準

## 🤝 貢獻指南

歡迎提交 Pull Request！在開始之前，請：

1. Fork 本倉庫
2. 創建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

## 📄 許可證

本項目採用 MIT 許可證 - 查看 [LICENSE](LICENSE) 文件了解詳情

## 👥 作者

**Evan Chen** - [@onlyatuna](https://github.com/onlyatuna)

## 🙏 致謝

- [Google Gemini](https://ai.google.dev/) - AI 文案生成
- [Cloudinary](https://cloudinary.com/) - 圖片存儲
- [Tailwind CSS](https://tailwindcss.com/) - UI 框架
- [Lucide](https://lucide.dev/) - 圖標庫

## 📮 聯繫方式

- Website: [evanchen316.com](https://evanchen316.com)
- Email: your.email@example.com
- GitHub: [@onlyatuna](https://github.com/onlyatuna)

---

⭐ 如果這個項目對您有幫助，請給它一個星標！