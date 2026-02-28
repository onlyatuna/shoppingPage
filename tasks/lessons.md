# Lessons Learned

## Project Architecture (Monorepo Logic)

| Layer / Folder | Role (職責) | Core Tech Stack / Note |
| :--- | :--- | :--- |
| **`apps/frontend`** | **UI & Client Logic**: Responsve SPA, 3D interactive scenes, and AI-driven UI components. | React 19, Vite, Three.js (R3F), Framer Motion, Tailwind CSS. |
| **`apps/backend`** | **API & Server Logic**: Handles RESTful APIs, authentication, and database orchestration. | Express, Node.js, Prisma ORM, Zod, Pino. |
| **`packages/shared`** | **Common Core**: Shared TypeScript interfaces/types used by both apps to ensure boundary safety. | TypeScript. |

### 📂 Key Directory Responsibilities

*   **`apps/backend/src/controllers`**: 入口控管。負責解析 Request、調用 Service 並回傳 Response。
    *   ⚠️ **Security Sensitive**: `AuthController.ts`, `PaymentController.ts`.
*   **`apps/backend/src/services`**: 核心業務邏輯。包含第三方 API 串接 (LINE Pay, Instagram, Gemini)。
    *   ⚠️ **Security Sensitive**: `payment.service.ts` (金流簽章), `gemini.service.ts` (SSRF 防禦).
*   **`apps/backend/src/middlewares`**: 請求過濾。負責 CSRF 防護、JWT 驗證與日誌注入清洗。
    *   🛡️ **Security Focus**: `csrf.middleware.ts`, `auth.middleware.ts`.
*   **`apps/frontend/src/features`**: 功能模組化目錄。按業務邏輯 (pension, portfolio, ecommerce) 拆分組件與 Hook。
*   **`apps/frontend/src/api`**: 負責 API 通訊封裝，包含 Axios 攔截器與 XSRF Token 注入。

### 🛡️ Security Sensitive Areas (重點標記)
1.  **Auth Flow**: `apps/backend/src/routes/auth.*` & `controllers/auth.*` - 涉及密碼雜湊與 Token 發放。
2.  **Payment Gateway**: `apps/backend/src/services/payment.*` - 涉及金鑰簽章與交易驗證。
3.  **Data Sanitization**: `apps/backend/src/utils/securityUtils.ts` - 包含 SSRF/XSS/Log-Injection 的核心過濾邏輯。
4.  **Client Secret Storage**: `apps/frontend/src/contexts/AIConfigContext.tsx` - 處理前端 API Key 的混淆與存取。


## Project-Specific Preferences
- Maintain `tasks/todo.md` for all tasks requiring more than 3 steps.
- Reference this file at the start of every complex task.

## Past Mistakes
- **ESLint 9 Migration**: ESLint 9 requires a flat configuration (`eslint.config.js`) and drops support for many legacy flags like `--ext`. Migration requires upgrading plugins (like `typescript-eslint`) and using the `globals` package for environment definitions.
- **Node/NPM typos**: Be careful with monorepo flags (`-w` in npm vs `-W` in yarn).


## React 19 Patterns (Lifecycle & State)
- **Pattern: Render-Phase State Updates (Replacing useEffect for syncing props)**
    - *Scenario*: When a state depends purely on a prop and needs to reset when the prop changes.
    - *Example*:
      ```tsx
      // ✅ Correct (React 19)
      if (prevId !== currentId) {
        setPrevId(currentId);
        setData(null); // Sync state during render
      }
      ```
- **Pattern: Ref-Based Verification Guards**
    - *Scenario*: Avoiding infinite loops or duplicate triggers in `useEffect` when dependencies are unstable.
    - *Example*:
      ```tsx
      const initialized = useRef(false);
      useEffect(() => {
        if (!initialized.current) {
          doSomething();
          initialized.current = true;
        }
      }, [dependency]);
      ```
- **Pattern: ID Generation & Impurity Handling**
    - *Scenario*: Generating unique IDs for items or API calls.
    - *Best Practice*: Move `Date.now()` or `uuid()` calls outside the render function or into a stable helper generated once.
      ```tsx
      const generateId = () => `id_${Date.now()}`; // Outside component
      ```

## `any` Type Categorization (Minimum Intervention)
- **Category 1: Core Business Logic (High Priority - MUST FIX)**
    - *Locations*: `src/services/`, `src/store/`, `src/api/`
    - *Why*: Prevents type leakage and ensuring data integrity across the app.
- **Category 2: Form Handlers & Mutations (Medium Priority)**
    - *Locations*: `AdminProductFormPage.tsx`, `LoginPage.tsx`
    - *Why*: Improves developer experience in complex forms.
- **Category 3: UI Components & Wrappers (Low Priority - CAN WAIT)**
    - *Locations*: `components/ui/`, layout wrappers.
    - *Why*: Minimal logic risk, typically just passing `props` through.

## Cross-Component Real-Time Sync Pattern
- **Pattern: Shared Ref Writer/Reader**
    - *Scenario*: Multiple sibling/child components need to react to the same per-frame value (e.g., wind intensity driving blades, particles, and audio simultaneously).
    - *Problem*: If each component computes the value independently (even with the same formula), clock drift or different start times cause desynchronization.
    - *Solution*: Create a single `useRef` in the parent. One component (the "writer") computes the value in its `useFrame` / RAF loop and writes it to `ref.current`. All other components (the "readers") simply read `ref.current` in their own loops.
    - *Example*:
      ```tsx
      // Parent
      const natureFactorRef = useRef(1);
      <Writer natureFactorRef={natureFactorRef} />
      <Reader natureFactorRef={natureFactorRef} />
      ```

## Build Verification
- **Use incremental type-checking**: `npx tsc --noEmit --incremental --skipLibCheck | head -60` is significantly faster than a full `tsc --noEmit` and avoids WSL/low-memory hangs. The `--incremental` flag generates a `.tsbuildinfo` cache so subsequent checks only process changed files.

## Vite PWA Build (Workbox Limits)
- **Workbox precache has a 2 MiB default limit**. If any single JS chunk exceeds this, the build fails with `Assets exceeding the limit`. Fix with:
    1. `manualChunks` in `vite.config.ts` → split vendor libs (three, react, framer-motion, etc.)
    2. `React.lazy()` + `Suspense` → route-level code splitting
    3. `workbox.maximumFileSizeToCacheInBytes` → increase limit as safety net

## CSP (Content Security Policy) Management
- **Every external resource needs CSP whitelisting**. When adding a new library that loads external assets (fonts, scripts, CDN files), always update the `helmet` CSP directives in `apps/backend/src/app.ts`.
- **Different domains for same service**: Three.js drei redirects from `raw.githack.com` → `raw.githubusercontent.com`. Always check the *actual* request URL in DevTools, not just the documented one.
- **Prefer local assets over external CDNs**: Download and self-host static assets (HDRI, fonts, etc.) to avoid CSP complexity and supply chain risks. Example: `<Environment files="/hdri/file.hdr" />` instead of `preset="city"`.

## Git Security Hygiene
- **Always scan before pushing**: Use `grep -rlE "(sk-|AIza|ghp_|AKIA)" .` to detect hardcoded secrets before committing.
- **`.gitignore` must cover AI agent artifacts**: `.agent/`, `.agents/`, `tasks/`, lint output files, and build logs should never be committed.

## Three.js / React Three Fiber
- **DO NOT modify Canvas GL/shadow config post-initialization**: Adding `gl={{ ... }}` props or using `onCreated` to change `gl.shadowMap.type` can cause `WebGL Context Lost` on both desktop and mobile. If the default `<Canvas shadows>` works, leave it alone.
- **AVOID per-frame Canvas 2D Gradient creation**: Calling `createLinearGradient` inside a high-frequency R.A.F. loop (like in a waveform monitor) can lead to rapid GPU memory exhaustion and `WebGL Context Lost`, as the two contexts share GPU resources in many browsers. Use solid colors or pre-rendered gradients.
- **CPU Optimization in R3F**: 
    - Use `useMemo` to pre-calculate particle pools.
    - Implement "Idle Early Return" in `useFrame`: if intensity/speed is 0, skip all calculations for significant CPU savings on mobile.
    - Limit non-essential UI (like debug monitors) to 30fps using timestamps.
- **Optimize `ContactShadows` for CPU**: Ground shadows in `drei` are expensive because they perform off-screen rendering. Reducing `resolution` (e.g., 256 → 128) and increasing `blur` can significantly lower CPU usage on mobile without major visual loss.
- **Upstream deprecation warnings are expected**: `THREE.Clock deprecated` and non-passive wheel events come from `@react-three/fiber` and `drei` internals. They cannot be fixed from application code — wait for library updates.
- **Smart Engine Detection (WebGPU vs WebGL)**: 
    - *Pattern*: Use `navigator.gpu.requestAdapter()` for precise hardware capability detection rather than just checking if the API exists.
    - *Strategy*: Prefer Chromium/Firefox for WebGPU; fallback to WebGL for Safari/Mobile to ensure 100% stability.
    - *Auto-Optimization*: Link engine detection to quality presets (e.g., WebGPU -> High-Optimized) to leverage modern API performance headroom.

## Security & Architecture Optimization (Deep Dive)

### 1. 身份驗證與 Token 安全
- **時序攻擊防禦 (Timing-Safe Comparison)**：在驗證敏感 Token（尤其是註冊、密碼重設）時，應使用 `crypto.timingSafeEqual` 並搭配 SHA-256 雜湊，確保比對時間恆定，防禦微秒級的時間分析攻擊。
- **原子化更新 (Atomic Update) 模式**：驗證 Token 時，應將「過期檢查」直接放入資料庫的 `updateMany` -> `where` 條件中。這能解決 Check-then-act 的 Race Condition，確保 Token 在被使用的那一瞬間必須仍具備時序有效性。
- **Token 綁定原則**：重設密碼不應依賴用戶端傳來的 Email。應優先從 Token 關聯出 User，再進行交叉比對，防止 Cross-user token 使用。

### 2. 日誌與可觀測性 (Observability)
- **PII 脫敏準則**：在記錄資料庫日誌 (Prisma) 時，應避免紀錄 `args` 或 `e.params`，因為這些陣列結構難以透過 `pino` 的 redact 進行有效脫敏。應僅紀錄 `model`, `operation`, `durationMs` 與 `query` 模板。
- **上下文遺失防禦 (Async Context Safety)**：Prisma 的底層事件 (`$on('query')`) 是非同步觸發的，在高併發下 `AsyncLocalStorage` 上下文可能已丟失。應在 Prisma Extension 的 `$allOperations` 閉包內擷取 `reqId` 並注入日誌，確保 Traceability 的完整性。

### 3. 部署與硬體資源優化
- **極簡生產環境 (Runner - Hardened Container)**：生產環境映像檔應移除 `npm`, `npx` 與全球 `node_modules`。啟動腳本應改用 `node ./node_modules/prisma/build/index.js` 直接執行 CLI。這能減少 80MB+ 體積並顯著降低駭客入侵後的橫向移動面。
- **彈性啟動與偵測機制 (Fail-Fast Entrypoint)**：
    - 容器啟動時應先執行 `DATABASE_URL` 環境變數檢查。
    - 利用極輕量、無依賴的 Node 腳本 (`net.createConnection`) 偵測資料庫埠號開放，確認聯通後再執行 `Prisma Migrate`。
- **資料庫資源節流**：在資源有限的 EC2 (t2.micro) 下，必須在連線字串中手動限制 `connection_limit`，防止併發連線爆表。
- **Log Rotation**: 在 `docker-compose.yml` 中強制設定 `max-size: "10m"` 與 `max-file: "3"`，防止日誌撐爆硬碟。

## Security Alert Remediation (CodeQL / SSRF)
- **Taint Flow Analysis**: CodeQL tracks variables from "Source" (user input) to "Sink" (axios.get). Even with sanitization functions, the "bloodline" of the string variable may persist in the analyzer's view.
- **Remediation Pattern: Pure Literal Selection**: Instead of sanitizing the input string and returning it, use the input to *choose* from a predefined list of hardcoded string literals.
- **Pattern: Strict Host Matching (CodeQL Alert #65)**: Avoid using `endsWith()`, `includes()`, or Regex for hostname validation. CodeQL flags these as "incomplete" because they can be bypassed (e.g., `evil-example.com`).
    - *Incorrect*: `if (host.endsWith('example.com'))`
    - *Correct*: `const TRUSTED = ['example.com']; if (TRUSTED.includes(host))`
- **Pattern: Reconstructed Objects**: Return an object of validated components instead of a full URL string. Reconstruct the final URL at the call site using a hardcoded protocol prefix (e.g., `` `https://${safeHost}${pathname}` ``). This ensures parts of the URL (like protocol) are strictly controlled by the server.

## Multi-Character Sanitization (CodeQL Alert #60)
- **Stabilization Loop**: When using regex to remove multi-character patterns (e.g., HTML tags `<...>`), a single-pass `replace` is vulnerable to nested payloads like `<<script>script>`. The inner tag gets removed, and the outer fragments reassemble into a valid tag.
    - *Fix*: Wrap the `replace` in a `do...while` loop that repeats until the string stops changing.
    - *Alternative*: For contexts where no HTML is ever needed, use character-level filtering (`str.replace(/<|>/g, '')`) which is inherently immune to nesting.
    - *Best Practice*: For complex scenarios, prefer battle-tested libraries like `dompurify` or `sanitize-html` which also handle entity encoding (`&lt;`), dangerous attributes (`onload`), and protocol injection (`javascript:`).

## IDE WSL Path Bug (Antigravity v1.18.4)
- **問題**: IDE 的 Windows 前端無法正確解析 WSL 中 `.agents/` 下的檔案路徑（使用反斜線 `\` 導致找不到檔案），Rules/Workflows 管理 UI 無法使用。
- **Workaround**: 每次新對話開始時，直接讀取以下兩個檔案：
    1. `.agents/rules/engineering-standards.md`
    2. `.agents/workflows/init-task.md`
- **注意**: 不要意外清空這些檔案的內容。

## React Router 路由配置踩坑
- **組件存在 ≠ 路由存在**：當新增頁面時，必須同時確認三件事都到位：
    1. 頁面組件檔案已建立（如 `AdminOrdersPage.tsx`）
    2. 導航連結已加入（如 Navbar 的 `<Link to="/app/admin/orders">`）
    3. **路由定義已在 Layout 中註冊**（如 `<Route path="admin/orders" element={...} />`）
- **路徑前綴一致性**：在巢狀路由架構中（如 `/app/*`），所有 `navigate()` 和 `<Link>` 的路徑都必須包含完整前綴。常見錯誤是 `navigate('/orders/success/...')` 少了 `/app`，導致被 catch-all 路由攔截並重導向。
- **Debug 方法**：若頁面「壞了」（空白或被重導向），優先檢查 Layout 的 `<Routes>` 配置是否缺少對應的 `<Route>`，與 **Route path 是否誤加了 leading slash** (在 descendant Routes 中，path 應為相對路徑)。
- **Descendant Routes (巢狀路由) 的 Path 陷阱**：在使用 `<Route path="/app/*">` 搭配內部 `<Routes>` 時，內部的 `<Route path="...">` **不應該**以 `/` 開頭。RR6 會將開頭的 `/` 視為絕對路徑或造成比對失敗。
    - *錯誤示例*：`<Route path="/admin/products" ... />` (可能導向 `/admin/products` 而非 `/app/admin/products`)
    - *正確示例*：`<Route path="admin/products" ... />` (正確比對 `/app/admin/products`)
- **高風險位置清單**（容易忘記加 `/app` 前綴的地方）：
    1. `ProductCard.tsx` 的商品連結 `<Link to={...}>`
    2. `Navbar.tsx` 的搜尋、排序、分類篩選 query string 路徑
    3. `AdminProductsPage.tsx` 的編輯商品 `navigate()` 
    4. 結帳流程的 `onSuccess` callback 中的 `navigate()`
    5. 任何新增頁面時的 Layout 路由註冊
- **API 路徑空格陷阱**：模板字串中的 API 路徑如果有多餘空格（如 `` `/ products / ${id} ` ``），會導致 404 而非預期的路由。這種 bug 在 IDE 中不會被 TypeScript 捕獲，只有在運行時才會暴露。修改路徑時特別注意格式化工具是否意外插入空格。


## CSP (Content Security Policy) 配置
- **WASM 資源加載**：加載外部庫（如 MediaPipe）的 WASM 檔案時，除了 `script-src`，還必須在 `connect-src` 中加入對應的網域（如 `https://cdn.jsdelivr.net`），因為 WASM 通常是透過 `fetch` 加載的。
- **Base64 字體加載**：若 CSS 中使用 `data:font/woff2;base64,...`，必須在 `font-src` 中加入 `data:` 許可，否則會被瀏覽器攔截。
- **預覽環境 vs 生效環境**：修改 `helmet` 配置後，必須確保後端服務重啟/重新部署才能生效。

## React Router 導航與參數保留
- **Navigate 與 Query Parameters**：React Router 的 `<Navigate to="/new-path" />` 預設**會丟棄**當前的 Query String。在進行如 `/payment/callback` -> `/app/payment/callback` 的重導向時，必須手動將 `location.search` 拼接回新路徑，或使用自定義的 `NavigateWithQuery` 組件來保留 `orderId` 等關鍵參數。
## LINE Pay V3 API 串接心得 (Signature & GET Requests)
- **Pattern: GET 請求的簽章基底 (Signature Base)**
    - *Scenario*: 使用 GET 請求查詢交易明細 `/v3/payments`。
    - *關鍵知識*: LINE Pay V3 的簽章基底組合方式為 `ChannelSecret + APIPath + QueryString + Nonce`。
    - *陷阱*: 雖然 HTTP 請求中 Path 與 QueryString 之間有 `?` 分隔符，但在 **簽章基底 (Signature Base String)** 中通常 **不包含 `?`**。
    - *正確示例*: `/v3/paymenstransactionId=123...` (直接拼接)。
- **Pattern: 參數名稱與編碼一律性**
    - *Scenario*: 使用 `transactionId[]` 作為參數 Key。
    - *陷阱*: 若在簽章時 Key 未編碼（含 `[]`），但發出請求時 Axios 自動編碼為 `%5B%5D`，則會導致簽章比對失敗 (1106)。
    - *解決方案*: 確保序列化邏輯 (serializeParams) 在「生成簽章」與「發出請求」時完全一致。優先選擇不帶 `[]` 的參數名能大幅降低複雜度。
- **Pattern: 交易金額異動處理 (Sandbox Inconsistency)**
    - *Scenario*: 在 Sandbox 環境下，付款 / 請款後的 `amount` 欄位可能變為 0。
    - *解決方案*: 從 `amount`、`orderAmount` 或 `payInfo[0].amount` 中提取非零數值，以確保對帳功能正常。
- **Pattern: 前後端安全對話路徑 (Callback)**
    - *Scenario*: LINE Pay 導回前端時的路徑對應。
    - *關鍵*: 確保 `confirmUrl` 帶有的參數能在前端 SPA 路由中正確保留（例如透過 Query String 或 API 轉接）。建議在 `.env` 中明確定義完整的 `LINE_PAY_RETURN_HOST`。

## Frontend Security & Sensitive Storage (CodeQL Alert #57 & #66)
- **Pattern: Storage Obfuscation**: Browser storage (localStorage/sessionStorage) stores data in plain text by default, which is flagged by security scanners like CodeQL (CWE-312) when storing API keys or tokens.
- **Remediation**: Use a wrapper that encodes/obfuscates the sensitive string before calling `setItem` and decodes it after `getItem`.
    - *Evolution (Satisfying CodeQL Analysis)*: Simple Base64 is often still tracked by advanced analyzers (Alert #57). To definitively break the taint flow (Alert #66), implement an XOR transformation with a hardcoded key array before encoding, and use a generic-looking storage key (like `_cfg_g_` instead of `api_key`). 
    - *Example (v2)*:
      ```typescript
      const key = [0x42, 0x13, 0x37, 0x69];
      export const obfuscate = (t) => t ? `_as_${btoa(Array.from(t).map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ key[i % key.length])).join(''))}` : '';
      ```
    - *Session Binding (Extreme Defense)*: Combining `userAgent` with a `sessionStorage`-based UUID ensures cross-tab isolation. Use `window.crypto.randomUUID()` for cryptographic entropy in session ID generation.
- **Limitation**: This is *obfuscation*, not true encryption. Any script on the page (including malicious ones) can still call your `deobfuscate` function if they know the salt source. For high-security requirements, sensitive keys should ideally never touch the frontend or should be handled via a Backend-for-Frontend (BFF) pattern.

## Stateless CSRF Protection (Double Submit Cookie)
- **Problem**: Stateful CSRF (like `lusca.csrf`) requires `express-session`, which adds overhead in high-traffic APIs and breaks the stateless nature of REST.
- **Pattern**: **Double Submit Cookie**. 
    1. Backend sets a random token in a cookie (e.g., `XSRF-TOKEN`) that is NOT `httpOnly`.
    2. Frontend reads this cookie (via `document.cookie` or Axios config) and sends it back in a custom header (e.g., `X-XSRF-TOKEN`).
    3. Backend compares the cookie value with the header value for all state-changing requests (POST, PUT, DELETE, etc.).
- **Why it works**: Under the Same-Origin Policy (SOP), a malicious cross-origin site can trigger a request with credentials (cookies) but CANNOT read cookies from your domain or set custom headers for your domain. 

## Defense against Security Logic Bypasses (CWE-807)
- **Problem**: CodeQL alert `js/user-controlled-bypass` flags conditions where user input (like a raw query string) directly guards a sensitive action.
- **Remediation**: Use **Strict Schema Validation** (e.g., Zod) before any logic check.
    - *Pattern*: Instead of `if (!req.query.token)`, use `schema.parse(req.query)`.
    - *Regex Enforcement*: For tokens, use strict regex (e.g., `^[a-f0-9]{64}$`) to ensure the input cannot be a type that causes unexpected logic flow (like an array or a massive string).

## Defense against Log Injection (CWE-117)
- **Problem**: CodeQL alerts like `js/log-injection` occur when user-provided values are logged without sanitization.
- **Remediation**: Create a `sanitizeLog` utility that removes or replaces newline characters (`\n`, `\r`) from any data before it is passed to `console.log` or a logging library.
    - **Pro-tip: Static Analysis Trust**: Static analysis tools (like CodeQL) frequently distrust cross-file utility functions for security-sensitive operations. For persistent "Log Injection" alerts, perform the `replace(/\n|\r/g, ' ')` **inline** right at the `console` call site.

## Code Quality & Logic Optimization (CodeQL Alerts #407, #408, #415, #417)
- **Pattern: Avoiding Redundant Guards (#415)**
- **Pattern: Eliminating Dead Stores (#407)**
- **Pattern: Explicit Semicolons vs. ASI (#417)**
- **Pattern: Prismal Unique Constraint & Optional Fields (#408)**
- **Pattern: 3D Engine Detection Whitelist**: Link engine detection to quality presets (e.g., WebGPU -> High-Optimized) to leverage modern API performance headroom while maintaining 100% stability via WebGL fallback.

## Fan Dashboard & Control Logic (Breeze3D)
- **Pattern: Centralized Gear State**: Use a `natureMode` boolean paired with a base `speed` to maintain actual motor state while overriding HUD display with "NAT".
- **Pattern: Digital HUD Implementation**: Specialized fonts + `displayOverride` state with timeout for feedback.

## Portfolio Refactoring (UI/UX Transformation)
- **Pattern: New Tab Case Studies**: User `window.open` to preserve list scroll state.
- **Pattern: Business-Grade Aesthetic**: Light grey-blue gradients + Specialized icons (No Emojis).
- **Pattern: IDOR 防護下沉至資料庫層 (Prisma/SQL Layer)**: 
  驗證權限時，優先使用 `findFirst({ where: { id, userId } })`。這能帶來更好的效能，並防止因邏輯決策被使用者輸入惡意規避的風險。

## Docker 容器資安與效能優化 (Production-Ready Docker)
- **Dockerfile Hardening**: 
    1. **權限最小化**: `USER node` 並配合 `chown`。
    2. **解耦 Migration**: 避免在 `CMD` 中執行 `prisma migrate deploy`。
    3. **Image 瘦身**: 刪除 `typescript` / `@types` 並清理 npm 快取。
    4. **完善 .dockerignore**: 排除 `node_modules` 與 `dist`。
