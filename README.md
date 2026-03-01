# 🎨 AI ShopMaster

### AI 驅動的電商視覺與文案生產力流水線
> **AI ShopMaster** 是一個專為現代電商賣家打造的生產力工具。它整合了 **Gemini 2.5 多模態 AI**、**雲端圖像處理** 與 **Instagram 自動化發佈**，將繁瑣的「拍圖 -> 修圖 -> 撰稿 -> 上架」流程縮減為單一工作流。

[![Version](https://img.shields.io/badge/version-1.1.0-blue.svg?style=flat-square)](https://github.com/onlyatuna/shoppingPage)
[![React](https://img.shields.io/badge/frontend-React_19-61DAFB?logo=react&style=flat-square)](https://reactjs.org/)
[![Node](https://img.shields.io/badge/backend-Express_5-339933?logo=node.js&style=flat-square)](https://expressjs.com/)
[![Security](https://img.shields.io/badge/security-Production_Grade-success?style=flat-square)](https://github.com/onlyatuna/shoppingPage#security)

---

## ✨ 核心價值 (Core Features)

### 🖼️ 次世代 AI 圖片編輯引擎
*   **智能背景生成**：利用 `gemini-2.5-flash-lite` 自動分析商品美學，推薦最合適的背景配色與風格標籤。
*   **遮罩局部重繪 (Masked Editing)**：透過 `gemini-2.5-flash-image` 實現精準的局部修圖，保留商品主體 (Protect Area) 並重繪背景或添加裝飾元素。
*   **風格化圖框系統**：內建「經典黑」、「優雅金」等行銷專用預設，並支援使用者透過自然語言自定義專屬風格提示詞 (Style Prompts)。

### 🧠 Gemini 2.5 內容工廠
*   **視覺分析系統**：AI 能夠「看懂」上傳的圖片內容，自動撰寫具有吸引力的 Instagram 文案。
*   **多語系自動翻譯**：整合高品質翻譯服務，支援一鍵將文案轉換為目標市場語言。
*   **智能標籤生成**：根據畫面內容與商品屬性，自動配對高觸及率的 #Hashtags。

### 💳 企業級交易與物流整合
*   **LINE Pay 深度對接**：完整實作從 Initiate -> Confirm -> Refund 的交易閉環，支援訂單金額凍結 (Price Freeze) 防範詐欺。
*   **即時預覽與發佈**：編輯完成後，直接透過 Instagram Graph API 推送到商業帳號，並在發佈前預覽貼文在手機端的真實呈現。

---

## 🏗️ 系統架構 (Architecture)

本專案採用 **Monorepo** 架構，確保型別安全 (Type Safety) 與極高的開發效率。

### 技術棧 (Tech Stack)
*   **前端**: React 19, Vite, TailwindCSS, Zustand (狀態管理), TanStack Query (快取).
*   **後端**: Node.js, Express 5, Prisma ORM, MySQL 8.
*   **AI 服務**: Google Gemini API (2.5 Flash / Image), Cloudinary (圖片託管).
*   **支付整合**: LINE Pay API SDK.
*   **基礎設施**: Docker Compose, Caddy (自帶 SSL 反向代理), GitHub Actions.

### 🛡️ 安全性亮點 (Security Highlights)
作為一個面向生意的工具，安全是我們的底線。本專案實作了多項生產等級的防護：
-   **數字化 RBAC 體系**：精確區分 `DEVELOPER`, `ADMIN`, `USER` 等級，嚴格限制越權操作。
-   **SSRF 硬路徑攔截**：針對外部圖片 URL 採取「字面值白名單 (Literal Whitelist)」檢驗，杜絕伺服器端請求偽造攻擊。
-   **AI Prompt Injection 隔離**：內建 Prompt 清洗器 (Sanitizer)，防止使用者惡意指令繞過系統預設行為。
-   **AI Circuit Breaker**：即時計算 AI API 消耗成本，超過每日預算上限時自動啟動熔斷保護。
-   **金融級精準計算**：全站涉及金額運算皆採用 `Decimal.js`，避免 JavaScript 浮點數導致的財務誤差。
-   **安全性 Cookie 體制**：使用 Signed Cookies 搭配 `tokenVersion` 版本管理，支援遠端登出與 JWT 即時撤銷。

---

## 🚀 快速開始 (Quick Start)

### 1. 複製專案與安裝
```bash
git clone https://github.com/onlyatuna/shoppingPage.git
cd shoppingPage
npm install
```

### 2. 環境變數配置
在 `apps/backend` 建立 `.env` 檔案並填入以下關鍵資訊：
```env
# Database
DATABASE_URL="mysql://root:password@localhost:3306/shop_db"

# AI & Media
GEMINI_API_KEY="your_api_token"
CLOUDINARY_URL="cloudinary://api_key:api_secret@cloud_name"

# Social & Pay
IG_ACCESS_TOKEN="your_ig_token"
LINE_PAY_CHANNEL_ID="your_channel_id"
LINE_PAY_CHANNEL_SECRET="your_channel_secret"

# Security
JWT_SECRET="generate_a_secure_long_string"
CSRF_ALLOWED_ORIGINS="http://localhost:5173"
```

### 3. 資料庫與啟動
```bash
# 同步資料庫結構
npm run db:push

# 啟動開發伺服器 (Frontend + Backend)
npm run dev
```

---

## 🐳 生產環境部署 (Deployment)

利用專案內建的 Docker 環境，您可以一鍵完成具有 HTTPS 保護的部署。

1.  **調整 `Caddyfile`**：將 `example.com` 更換為您的實際域名。
2.  **執行部署**：
```bash
docker-compose up -d --build
```
*這將自動啟動 MySQL, Backend, Frontend 容器，並透過 Caddy 處理反向代理與自動 SSL 證書申請。*

---

## 📜 開發者規範 (Guidelines)

*   **Commits**: 遵循 [Conventional Commits](https://www.conventionalcommits.org/) (例如: `feat: add ai mask support`).
*   **Linting**: 提交程式碼前請務必執行 `npm run lint` 以維持程式碼品質。
*   **Security First**: 任何涉及外部存取或使用者輸入的功能，必須經過 `securityUtils.ts` 中的過濾器。

---

## 📄 授權與社群 (Community)
*   **License**: MIT License
*   **Author**: Evan Chen - [@onlyatuna](https://github.com/onlyatuna)
*   **Maintenance**: 感謝廣大開發夥伴對本 AI 生態系安全性的貢獻。

---
*Powered by Google Gemini 2.5 and Modern Web Stack.*
