# 🎨 AI ShopMaster

### AI 驅動的電商視覺與文案流水線

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-green.svg?style=flat-square)
![React](https://img.shields.io/badge/frontend-React_19-61DAFB.svg?style=flat-square&logo=react)
![Node](https://img.shields.io/badge/backend-Node.js-339933.svg?style=flat-square&logo=node.js)
![Docker](https://img.shields.io/badge/deploy-Docker-2496ED.svg?style=flat-square&logo=docker)

> **AI ShopMaster** 是一個專為電商賣家與社群小編打造的生產力工具。它整合了 **AI 智能修圖**、**Gemini 文案生成** 與 **Instagram 一鍵發佈** 功能，將原本繁瑣的「修圖 -> 想文案 -> 發文」流程縮減為流暢的單一工作流。

[線上演示](http://localhost:5173) · [回報問題](https://github.com/onlyatuna/shoppingPage/issues) · [功能請求](https://github.com/onlyatuna/shoppingPage/issues)

## ✨ 核心價值 (Core Value Propositions)

我們解決了電商經營中最耗時的三個痛點：**修圖**、**文案** 與 **上架**。

### 🖼️ AI 圖片引擎
不需要專業設計師，也能產出高品質的商品圖。
- **智能去背與裁剪**：自動優化圖片主體，適配 Instagram (1:1) 與 Story (9:16) 尺寸。
- **風格圖框系統**：內建「經典黑」、「優雅金」與「櫻花粉」等行銷專用圖框，一鍵提升質感。
- **即時浮水印**：自動壓上品牌 LOGO，保護您的商品圖權。

### 🧠 Gemini 內容工廠
讓 Google 最新的 Gemini 2.5 Flash 模型成為您的專屬文案小編。
- **視覺分析生成**：AI 能夠「看懂」您的圖片，根據畫面內容生成精準的描述。
- **多種語氣切換**：從「親切小編」到「高冷精品」，想怎麼賣就怎麼寫。
- **自動標籤 (#Hashtags)**：根據商品屬性自動生成高觸及率的 Hashtags。

### ⚡ 全通路一鍵發佈
- **整合 Instagram Graph API**：編輯完成後，直接推送到您的 IG 商業帳號。
- **各版型預覽**：在發佈前預覽貼文在手機上的真實呈現效果。

### 📱 極速行動體驗
專為手機操作優化的 **PWA (Progressive Web App)** 介面。
- **三步驟工作流**：上傳 -> 編輯 -> 發佈，全程不超過 1 分鐘。
- **離線支援**：即使網路不穩也能繼續編輯。
## 🧩 系統架構 (Architecture Overview)

本專案採用 **Monorepo** 架構，統一管理前端、後端與共享套件，確保型別安全與開發效率。

### 📂 目錄結構

| 路徑 | 類型 | 說明 | 技術棧 |
|------|------|------|--------|
| `apps/frontend` | Client | 用戶操作介面 (SPA) | Vite, React, Tailwind, Zustand |
| `apps/backend` | Server | RESTful API 服務 | Express, Prisma, Gemini API |
| `packages/shared` | Package | 前後端共用的型別定義 | TypeScript Interfaces, Zod Schemas |
| `docker-compose.yml` | Infra | 容器化部署配置 | MySQL, Node Services |

### 🔄 數據流向 (Data Flow)

1.  **使用者 (Client)**: 在 React 前端上傳圖片並調整參數。
2.  **API 層 (Backend)**: Express 接收請求，驗證 JWT 並將圖片轉發至 **Cloudinary** 儲存。
3.  **AI 處理 (Intelligence)**: 後端將圖片 URL 與提示詞發送給 **Google Gemini** 進行視覺分析與文案生成。
4.  **持久化 (Database)**: 所有的訂單、風格設定與生成紀錄皆透過 **Prisma** 存入 **MySQL**。
5.  **外部整合 (Integration)**: 最終結果透過 Graph API 發佈至 **Instagram**。

## 🛠️ 技術棧 (Tech Stack)

### 🎨 前端 (Frontend)
- **核心框架**: React 19, TypeScript, Vite
- **樣式與動畫**: TailwindCSS, Framer Motion, Lucide React
- **狀態管理**: Zustand, React Query (TanStack Query)
- **圖片處理**: React Easy Crop, React Dropzone
- **表單與驗證**: React Hook Form, Zod

### ⚙️ 後端 (Backend)
- **核心框架**: Node.js, Express 5
- **資料庫與 ORM**: MySQL 8.0, Prisma ORM
- **AI 服務**: Google Gemini 2.5 Flash-Lite & Flash-Image API
- **圖片存儲**: Cloudinary SDK
- **安全性**: JWT, Bcrypt, Helmet, CORS

### 🏗️ 基礎設施 (Infrastructure)
- **容器化**: Docker, Docker Compose
- **反向代理**: Caddy (自動 HTTPS)
- **CI/CD**: GitHub Actions (Linting & Build Checks)

## 🛡️ 安全性亮點 (Security Highlights)

本專案不僅關注功能達成，更在架構層面實作了多項生產等級的安全防禦措施：

- **🎭 進階權限體系 (RBAC Hierarchy)**：實作數值化角色等級機制（DEVELOPER > ADMIN > USER），嚴格限制高階權限的異動只能由更高等級者執行，有效封殺越權攻擊與權限提升漏洞。
- **🤖 AI 生態系安全 (AI-Native Security)**：
    - **Prompt Injection 隔離**：將 AI 系統指令 (System Instruction) 鎖定於服務端常數，禁止客戶端直接傳入，從根本防止惡意 Prompt 操控模型行為。
    - **SSRF 阻斷與硬路徑驗證**：針對圖片處理服務實作「字面值白名單 (Literal Whitelisting)」，禁止任何內網 IP (127.0.0.1/Localhost) 的探測請求。
- **💎 財務級資料精度 (Financial Integrity)**：全面採用 `Prisma.Decimal` (Decimal.js) 處理所有金額運算，配合資料庫 Transaction 交易機制，杜絕 JavaScript 浮點數誤差導致的金額不符或超賣問題。
- **🛡️ 深層注入防護 (Deep Injection Defense)**：除了標準參數化查詢外，額外針對 `JSON_SEARCH` 等複雜 SQL 函數實作自定義 Pattern Sanitization，防止萬用字元注入引發的邏輯繞過。
- **🔒 防禦性傳輸架構**：
    - **CSRF 雙重驗證**：實作 Double Submit Cookie Pattern，配合前端 credentials 策略確保請求來源合法。
    - **自定義 AppError 封裝**：全域攔截底層 SQL 錯誤，僅對用戶回傳標準化商業錯誤訊息，隱藏內部資料結構。
    - **生產級 CSP 策略**：嚴化 Content Security Policy 指令，移除 `unsafe-*` 授權，最大程度緩解 XSS 風險。

## 🚀 快速開始 (Quick Start)

### 環境要求
- **Node.js**: >= 18.0.0
- **MySQL**: >= 8.0
- **npm**: >= 9.0.0

### 1. 安裝依賴
由根目錄統一安裝所有 Workspaces 依賴：
```bash
npm install
```

### 2. 環境變數設定
請在 `apps/backend` 目錄下建立 `.env` 檔案：

```env
# 資料庫連線 (Prisma)
DATABASE_URL="mysql://root:password@localhost:3306/shop_db"

# Google Gemini API (文案生成)
GEMINI_API_KEY="your_gemini_api_key"

# Cloudinary (圖片儲存)
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# 安全性 (JWT)
JWT_SECRET="super_secret_jwt_key_at_least_32_chars"
FRONTEND_URL="http://localhost:5173"
```

### 3. 資料庫初始化
```bash
# 產生 Prisma Client
npm run db:generate

# 推送 Schema 至資料庫
npm run db:push
```

### 4. 啟動開發伺服器
```bash
# 同時啟動前端與後端
npm run dev
```
- 前端地址: http://localhost:5173
- 後端 API: http://localhost:3000

## 🐳 Docker 部署 (Deployment)

本專案提供準備就緒的 `docker-compose.yml`，支援一鍵即刻部署。

### 1. 準備生產環境變數
在根目錄建立 `.env.production`，內容參考 `.env.example` 但請填入真實的 API Key。

### 2. 啟動服務
```bash
docker-compose up -d --build
```

這將會啟動以下容器：
- `frontend`: Nginx 服務靜態檔案
- `backend`: Node.js API 服務
- `db`: MySQL 資料庫
- `caddy`: 自動 HTTPS 反向代理 (預設監聽 80/443)

### 3. 反向代理設定
`Caddyfile` 已經設定好自動路由：
- `example.com` -> 前端容器
- `example.com/api/*` -> 後端容器

若需修改域名，請編輯 `Caddyfile`：
```caddyfile
your-domain.com {
    reverse_proxy /api/* backend:3000
    reverse_proxy /* frontend:80
}
```

## 🔌 API 概覽 (API Insights)

後端提供標準 RESTful API，所有路由皆以為 `/api/v1` 前綴。

### 🔐 認證 (Auth)
| Method | Endpoint | 描述 |
|--------|----------|------|
| POST   | `/auth/register` | 用戶註冊 |
| POST   | `/auth/login` | 登入 (回傳 JWT) |
| GET    | `/auth/me` | 驗證並獲取當前用戶資訊 |

### 🖼️ 圖像與 AI (Image & AI)
| Method | Endpoint | 描述 |
|--------|----------|------|
| POST   | `/upload` | 上傳圖片至 Cloudinary |
| POST   | `/generate-caption` | **[核心]** 呼叫 Gemini 分析圖片並生成文案 |

### 🎨 風格管理 (Styles)
| Method | Endpoint | 描述 |
|--------|----------|------|
| GET    | `/custom-styles` | 獲取可用圖框與風格 |
| POST   | `/custom-styles` | 建立新的自定義風格 |

### 📸 Instagram 整合
| Method | Endpoint | 描述 |
|--------|----------|------|
| POST   | `/instagram/publish` | **[核心]** 發布圖片與文案至 IG 商業帳號 |

## 🛡️ 開發者規範 (Dev Guidelines)

### 代碼風格
本專案使用 **Prettier** 與 **ESLint** 強制統一風格。提交代碼前請執行：
```bash
npm run lint
```

### Git Commit 規範
請遵循 [Conventional Commits](https://www.conventionalcommits.org/)：
- `feat`: 新功能
- `fix`: 修補 Bug
- `docs`: 文件變更
- `chore`: 建構過程或輔助工具的變動

---

## 📄 授權 (License)
本專案採用 **MIT License** 開源授權。

## 👥 作者
**Evan Chen** - [@onlyatuna](https://github.com/onlyatuna)
