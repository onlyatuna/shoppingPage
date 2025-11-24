# 🛒 Shopping Mall Monorepo

## 1. 核心設計哲學
- **前後端分離 (Separation of Concerns)**：API 僅負責數據交換 (JSON)，不負責渲染 HTML。  
- **分層架構 (Layered Architecture)**：後端邏輯嚴格分層（Controller → Service → Repository）。  
- **型別安全 (Type Safety)**：前後端共用 TypeScript 型別 (Types/Interfaces)，減少 API 對接錯誤。  
- **單一數據源 (Single Source of Truth)**：前端使用 React Query (TanStack Query) 管理伺服器狀態，全域 Store (如 Zustand) 僅管理 UI 狀態（如購物車開關）。  

---

## 2. 專案結構 (Monorepo 推薦)
建議使用 Monorepo 結構（npm workspaces 或 Turborepo），方便前後端共用型別定義。

root/
├── packages/
│   ├── shared/           # 前後端共用的型別 (DTOs, Enums)
│   │   ├── src/
│   │   │   ├── types/
│   │   │   └── constants.ts
│   │   └── package.json
│
├── apps/
│   ├── backend/          # Express Server
│   │   ├── src/
│   │   │   ├── config/   # DB連線, Env變數
│   │   │   ├── controllers/ # 處理 Request/Response
│   │   │   ├── services/    # 商業邏輯 (計算價格, 檢查庫存)
│   │   │   ├── repositories/# 資料庫操作 (SQL/ORM)
│   │   │   ├── middlewares/ # Auth, Error Handling
│   │   │   ├── routes/      # API路徑定義
│   │   │   ├── utils/       # 工具函式
│   │   │   └── app.ts
│   │   └── package.json
│
│   ├── frontend/         # Vite App
│   │   ├── src/
│   │   │   ├── api/      # Axios/Fetch 封裝
│   │   │   ├── components/# UI 元件 (Button, Input)
│   │   │   ├── features/ # 按功能分類 (Auth, Product, Cart)
│   │   │   │   ├── ProductList/
│   │   │   │   ├── ProductDetail/
│   │   │   │   └── hooks/
│   │   │   ├── layouts/  # 頁面佈局
│   │   │   ├── pages/    # 路由頁面
│   │   │   ├── store/    # Global State (Zustand)
│   │   │   └── utils/
│   │   └── package.json
│
├── package.json
└── tsconfig.json

---

## 3. 後端架構詳解 (Express + MySQL)

### A. 技術選型
- **ORM**：Prisma 或 Drizzle ORM  
- **驗證**：Zod  

### B. 分層邏輯
- **Routes**：定義路徑與 HTTP Method。  
- **Controllers**：解析 `req.body`，使用 Zod 驗證，呼叫 Service，回傳 JSON。  
- **Services**：處理商業邏輯（結帳、庫存檢查、扣款、產生訂單號碼）。  
- **Repositories (DAO)**：專注於資料庫 CRUD。  

### C. 範例流程（下訂單）
1. **Controller**：接收 `{ productId, quantity }`，驗證數量。  
2. **Service**：開啟 Transaction → 檢查庫存 → 扣除庫存 → 建立訂單 → Commit。  
3. **Repository**：執行 `INSERT INTO orders ...`  

---

## 4. 前端架構詳解 (Vite + React)

### A. 功能驅動目錄 (Feature-based)
- `src/features/product/` → 商品卡片、商品列表邏輯  
- `src/features/cart/` → 購物車下拉選單、結帳邏輯  
- `src/features/auth/` → 登入/註冊表單  

### B. 狀態管理策略
- **Server State**：商品列表、訂單記錄 → 使用 React Query  
- **Client State**：UI 狀態、購物車暫存 → 使用 Zustand/Context API  

### C. API 封裝
- 建立 `apiClient`，使用 Axios Interceptors 處理 JWT Token 與刷新機制。  

---

## 5. 資料庫設計重點 (MySQL)

### A. 正規化
- `users`  
- `products`  
- `orders`（訂單主檔：總金額、狀態、收件資訊）  
- `order_items`（訂單明細：記錄當下購買價格 `price_at_purchase`）  

### B. 索引
- `product_name` → Full-text index  
- `category_id`, `user_id` → index  

### C. 併發控制
- **超賣問題**：同時購買最後一個商品  
- **解法**：Optimistic Locking 或 SQL 條件更新：  
  ```sql
  UPDATE products SET stock = stock - 1 WHERE id = ? AND stock > 0;
## 6. 安全性與效能優化

### 圖片處理
- 不要將用戶上傳的圖片存在 Express 的 `public` 資料夾，這樣無法擴展。  
- 建議使用 **AWS S3**、**Cloudinary** 或 **Firebase Storage** 儲存圖片，資料庫只存 URL。  

### 金流整合
- 串接 **綠界 (ECPay)**、**LinePay** 或 **Stripe**。  

### Webhook
- 後端必須處理金流回傳的 Webhook。  
- 當金流方扣款成功回傳時，後端要驗證簽章並更新訂單狀態。  

### JWT Authentication
- 使用 **Access Token (短效期)** + **Refresh Token (長效期, HttpOnly Cookie)** 的機制。  

---

## 7. 建議的重構步驟

1. **環境建置**  
   - 設定 Monorepo，安裝 TypeScript、Express、Vite。  

2. **DB Schema 設計**  
   - 使用 Prisma 定義 Schema 並遷移到 MySQL。  

3. **後端基礎建設**  
   - 設定 Express、Error Handler、Logger (如 Winston/Morgan)。  

4. **開發核心 API**  
   - User Auth (Register/Login)  
   - Product CRUD  

5. **前端基礎建設**  
   - 設定 Router、Axios 封裝、React Query。  

6. **串接首頁與商品頁**  
   - 確保讀取資料流暢。  

7. **開發購物車 (Cart)**  
   - 這是邏輯最複雜的地方 (前端 LocalStorage 同步 vs 後端 DB 同步)。  

8. **訂單與結帳**  
   - 實作 Transaction 與庫存扣減。  

9. **部署 (DevOps)**  
   - 使用 Docker 容器化，部署到 Railway / AWS / Render。  