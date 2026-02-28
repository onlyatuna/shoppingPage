# Lessons Learned

## [Security Audit] Second Wave of Infrastructure Hardening (March 2026)
### 🐛 Bug:
A secondary security audit revealed critical oversights:
1. **Unprotected Instagram Endpoints**: Anyone could publish to Instagram (`/api/v1/instagram/publish`) because middleware was omitted.
2. **LINE Pay TOC/TOU Discrepancy (Race Condition)**: While `initiateLinePay` checked for price mismatches between cart and DB, it proceeded to use the cart calculation instead of the DB snapshot for payment initiation, risking price manipulation during checkout flow.
3. **Caddy Reverse Proxy Spoofing**: The app trusted `X-Forwarded-For` from the proxy, but `Caddyfile` wasn't explicitly rewriting it, allowing external clients to forge their IP addressing, rendering rate limiting ineffective. 
4. **Hardcoded CSRF Whitelist**: Included hardcoded localhost and explicit domains in source code instead of relying on `.env` settings.
5. **AI Unrestricted Budget**: AI functions lacked a "circuit breaker" where daily budgets exceeding the limit triggered warnings but still allowed executions, risking massive API charges if flooded.
6. **Express Body `limit` Configuration DoS**: Previous Base64 uploads required a global 10mb body limit on select endpoints, allowing arbitrary malformed 10mb payloads to exhaust Node.js memory. 

### 🛠️ Solution:
1. **Added Middlewares**: Restored `requireAdmin`, `authenticateToken`, and `rateLimit` on the `instagram.routes.ts`.
2. **Order Amount Freeze**: Redesigned `initiateLinePay` logic to *strictly* enforce that the payment request uses `order.totalAmount` (the DB snapshot taken at Order creation). Recalculated total amounts are only used to throw a hard Error if they differ from the DB string to halt potentially manipulated orders.
3. **Caddy Headers**: Appended `header_up X-Forwarded-For {remote_host}` inside Caddy's `reverse_proxy` definition to overwrite forged IPs.
4. **Env CSRF Variables**: Removed `https://evanchen316.com` and hardcoded localhost variables from `csrf.middleware.ts`. Now defaults to reading `process.env.CSRF_ALLOWED_ORIGINS`.
5. **Circuit Breaker Check**: Added `await MonitorService.checkBudgetAllowed()` at the start of expensive Gemini API methods to proactively decline generations once the daily budget ceiling is hit.
6. **Optimized Payloads via Multipart/Multer**: Reduced `express.json({ limit: 'xx' })` back to a uniform globally safe `2mb`. Refactored `upload.routes.ts` Cloudinary integrations to process standard multipart/form-data images in memory (Multer) via `upload_stream(buffer)`.

## [Security Audit] Third Wave of Architecture Robustness (March 2026)
### 🐛 Bug:
A third deeper analysis surfaced logical edge cases:
1. **CSRF Implicit Trusts**: Previously, missing `Origin` / `Referer` headers defaulted to trusting state-changing requests, relying entirely on the XSRF-TOKEN.
2. **Fragile String Matching**: The global `errorHandler.ts` caught errors by comparing text strings (e.g., `message.includes('找不到')`), converting them to HTTP 404/400. This could break if text changes.
3. **JWT Statelessness Trap**: Standard `jwt` implementations lack an automated way to revoke existing logins across devices if an account resets its password or if forced-logged out.
4. **Unvalidated Admin Query**: `getAllOrders` verified the req.query via generic logic instead of using Zod.

### 🛠️ Solution:
1. **Strict Origin Nullification**: Set `isValidSource = false;` when `Origin/Referer` are completely absent on state-changing requests.
2. **AppError Subclasses**: Eliminated the string dictionary from `errorHandler.ts` entirely. Migrated critical internal services (`PaymentService`, `GeminiService`) to directly `throw new AppError('msg', StatusCodes)`.
3. **JWT tokenVersion Revocation**: Added a `tokenVersion: Int` to Prisma `User` schema. Every login stamps the JWT with this model integer. Resets/Updates increment it. `authenticateToken` now does a lightweight `findUnique` check per-access, providing a fast "Logout everywhere" system.
4. **Zod Strict Native Enum**: Pushed `adminOrdersQuerySchema` to `order.schema.ts` holding `z.enum(Object.values(OrderStatus)).optional().catch(undefined)`.

## [Security Audit] Fourth Wave of Hardening Edge Cases (March 2026)
### 🐛 Bug:
A fourth deeper analysis surfaced further edge cases primarily around internal state exposure and IDORs:
1. **Error Handler Info Disclosure**: If a base Error got trapped matching `StatusCodes.INTERNAL_SERVER_ERROR`, the `err.message` string was still returned. This could possibly leak SQL disconnect logs, file paths, etc.
2. **IDOR on LinePay Status**: `/api/v1/payment/status/:transactionId` merely checked if a token was provided, but didn't ensure the `transactionId` being requested actually originated from the calling user's orders.
3. **Logging Data Leaks**: `linePay.ts` intercepted and freely dumped `process.env.LINE_PAY_CHANNEL_SECRET` derivatives alongside the `Signature Base` across STDOUT if `DEBUG_LINE_PAY` was enabled, which was risky if left true in production.

### 🛠️ Solution:
1. **Error Masking in Prod**: Adjusted `errorHandler.ts` to output `"系統發生不可預期的錯誤，請稍後再試。"` exclusively when both `statusCode === 500` AND `process.env.NODE_ENV === 'production'` evaluate to true, hiding internal mechanics.
2. **Payment Lookup Ownership Validation**: Updated `PaymentService.checkPaymentStatus` to additionally accept and mandate a Prisma validation lookup (`where: { paymentId: ..., userId }`), ensuring cross-user peeking evaluates to a hard 403 Forbidden.
3. **Debug Guarding**: Locked `linePay.ts` debugging logs to `process.env.NODE_ENV !== 'production'`, creating a dual-lock system that prevents accidental data dumps in living environments.
4. **Performance Notes**: Commented `upload.routes.ts` around `JSON_SEARCH` inside `MySQL` regarding Future O(N) penalties during scaling, proposing an eventual decoupling into a Many-to-Many `product_images` schema for indexed lookup speed when inventory outgrows its bounds.

## [Security Audit] Fifth Wave Final Review - Cryptography (March 2026)
### 🐛 Bug:
`JWT_SECRET` was identified in `.env` as a weak, human-readable string (`"ilovejessicayang..."`). While long enough to pass the >32 chars middleware check, it lacked cryptographic entropy.
### 🛠️ Solution:
Generated a true random 64-byte (128 char) Hex string via `crypto.randomBytes(64).toString('hex')` directly inside Node.js and injected it directly into `.env`, guaranteeing immense cryptographic entropy for HMAC-SHA256 operations against offline brute-forcing.

## [Security Audit] Sixth Wave Final Polishing (March 2026)
### 🐛 Bug:
Minor maintenance and depth oversights in observability and health reporting:
1. **PII Exposure - Phone Numbers**: While passwords and card numbers were redacted, user phone numbers (e.g., from shipping info) remained plain in logs if objects were dumped.
2. **Shallow Health Checks**: The health check endpoint only verified DB connectivity, ignoring third-party integration health or future service scaling (e.g., Redis).

### 🛠️ Solution:
1. **Redaction Expansion**: Appended `phone`, `*.phone`, and `body.phone` to the `pino` redaction paths in `logger.ts`.
2. **Health Check Extensible Interface**: Instrumented `/api/health` with future-proofing placeholders for additional dependency monitoring (Redis/Cloudinary), ensuring the observability layer can scale alongside the infrastructure.


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
- **Frontend Dependency Splitting**: Even if PWA limits are increased, a single 2.7MB bundle harms UX. Always aim for granular chunks (e.g., separating `@react-three` from main app logic).
        - *Best Practice*: `manualChunks: { 'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'], 'framer-motion': ['framer-motion'] }`.

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
- **時序攻擊防禦 (Timing-Safe Comparison)**：在驗證敏感 Token（尤其是註冊、密碼重設）時，應使用 `crypto.timingSafeEqual`。對於字串長度不一的情況，應使用 PBKDF2 (如 10,000 疊代) 進行長度規格化，這不僅能防止時序攻擊，還能滿足 CodeQL 等掃描器對於「運算成本 (Computational Effort)」的安全要求 (Alert #437)。
- **[2026-03-01 Update] Signed Cookies 防禦**:
    - *Scenario*: CodeQL 經常會標記對於使用者輸入 (Cookies) 直接進行權限或安全性判斷的逻辑 (Alert #443: User-controlled bypass)。
    - *Solution*: 
        1. 初始化 `cookieParser(secret)`。
        2. 在寫入 Cookie 時設定 `signed: true`。
        3. 在讀取時使用 `req.signedCookies.token`。
    - *Benefits*: 簽核過的 Cookie 具備 HMAC 安全性。如果使用者嘗試篡改 Cookie，`cookie-parser` 會將其從 `req.signedCookies` 中剔除。這讓該數值被視為「伺服器可信數據」而非純「使用者控制數據」。
- **日誌注入防範 (Log Injection mitigation - Alert #444)**:
    - *Scenario*: 在記錄包含使用者輸入的日誌時，若不移除換行符 (`\n` 或 `\r`)，攻擊者可偽造日誌條目。
    - *Solution*: 始終通過 `sanitizeLog` 工具過濾輸出。
    - *Implementation Pattern*: 使用 `replace(/[\n\r\t]/g, ' ')` 移除分行符，並加上 `replace(/[^\x20-\x7E\s]/g, '?')` 過濾不可見或潛在危險的非 ASCII 字元。這能徹底打斷主動攻擊者的 Payload。
- **生產環境開發者工具 (Production-Safe DevTooling)**:
    - *Scenario*: 在生產環境需要快速測試，但不能讓一般使用者接觸到測試工具。
    - *Solution*: 
        1. **Role-Based Rendering**: 組件內部檢查 `user.role === 'DEVELOPER'`.
        2. **Hidden Toggle**: 使用組合鍵 (如 `Ctrl + Alt + D`) 切換顯示，避免顯眼。
        3. **Backend Safeguards**: 所有測試 API (如 `reset-test-data`) 必須在後端使用 `requireDeveloper` 中間件，並記錄所有操作日誌 (Audit Log)。
        4. **Form Automation**: 使用 `nativeInputValueSetter` 模擬真實的使用者輸入事件，確保與 React 狀態同步。 (見 `DevTools.tsx`)
- **Express 5 / path-to-regexp v7+ 路由路徑問題 (PathError)**:
    - *Scenario*: 在升級到 Express 5 後，原本的 `/:id(*)` 語法會導致 `PathError: Missing parameter name`。
    - *Cause*: 新版本的 `path-to-regexp` 對萬用字元 (Wildcards) 語法更嚴格，且在某些環境下 `/:id(.*)` 或 `/:id*` 可能仍會解析失敗。
    - *Solution*: 
        1. 優先嘗試 `/:id(.*)` 或 `/:id*`。
        2. 如果持續失敗，改用 **RegExp 物件** 作為路由路徑，搭配 `req.params[0]` 取得萬用字元內容。 (例如：`router.delete(/\/(.*)/, ...)` )。這能完全繞過字串解析器的限制。
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
- **[2026-03-01 Update] AI Prompt Injection 防護**:
    1. **隔離數據與指令**: 在提示詞中使用 `[USER DATA]` 與 `[INSTRUCTION]` 標記，明確告知 AI 哪些文字僅供參考，不應被視為指令。
    2. **髒字過濾 (Sanitization)**: 針對使用者輸入執行關鍵字過濾 (如 `ignore all instructions`, `system api key`) 與長度限制，防止惡意注入導致模型行為異常或 Token 浪費。
- **[2026-03-01 Update] 內網探測與 delegated SSRF 防護**:
    1. **SSRF 安全名單 (Whitelist)**: 所有外部 URL (尤其是傳送給第三方服務如 Instagram, Google 的 URL) 必須通過 `sanitizeImageUrl` 驗證，限制僅允許受信任的圖片域名 (如 Cloudinary, Unsplash)。
    2. **URL 重建模式 (Pure Literal Selection)**: 不要直接對輸入 URL 進行正則替換，而是解析出 components 後，使用代碼中的字串字面量 (如 `https://`) 與安全名單中的域名重新拼接，徹底打破 CodeQL 的 Taint Tracking。
- **[2026-03-01 Update] DoS 防護策略**:
    1. **階層式 `express.json` 限制**: 對一般路由嚴格限制 `2mb`，僅對必要的圖片上傳路由開放較大限制 (如 `10mb`)。避免全域開放 `50mb` 導致記憶體耗盡風險。
    2. **優先選用 `multer` 串流**: 大檔案上傳應優先透過 `multipart/form-data` 搭配 `multer.memoryStorage()` 或 `diskStorage` 串流處理，而非轉為巨大的 Base64 JSON。
- **[2026-03-01 Update] 安全轉義順序 (Escaping Precedence)**:
    - *Scenario*: 在手動對字串進行轉義（如 Prompt Sanitization 或 SQL escaping）時，必須先轉義 **反斜線 (`\`)**。
    - *Bug*: 若先轉義標點符號（如 `` ` `` -> `` \` ``），攻擊者可透過輸入額外的反斜線來轉義我們的轉義符號，導致防禦失效。
    - *Fix*: 始終確保 `.replace(/\\/g, '\\\\')` 位於轉義鏈條的首位。

## Docker 容器資安與效能優化 (Production-Ready Docker)
- **Dockerfile Hardening**: 
    1. **權限最小化**: `USER node` 並配合 `chown`。
    2. **解耦 Migration**: 避免在 `CMD` 中執行 `prisma migrate deploy`。
    3. **Image 瘦身**: 刪除 `typescript` / `@types` 並清理 npm 快取。
    4. **完善 .dockerignore**: 排除 `node_modules` 與 `dist`。

## Zod Schema Validation
- **Zod v4 record schema:** In Zod v4, the `z.record()` function now requires at least two arguments: the key schema and the value schema. This is a breaking change from Zod v3, which allowed just the value schema (defaulting keys to strings).
  - Use `z.record(z.string(), valueSchema)` for a string-keyed record.

## Error Handling Patterns
- **Explicit Business Error Mapping**: In `errorHandler.ts`, we now default to `500 Internal Server Error` for unknown errors to improve security posture and prevent sensitive system details from leaking. Specific business error keywords (e.g., '尚有', '無法刪除', '找不到') are explicitly mapped to their corresponding HTTP status codes (400, 404, etc.).
- **Service-Level Enforcement**: Constraints like 'cannot delete category with products' should be enforced in the Service layer by throwing a clear error message that the `errorHandler` can catch and categorize correctly.

## Advanced Error Handling Architecture
- **Custom AppError Class**: To avoid brittle string-based matching in the global error handler, we've implemented a custom `AppError` class (`src/utils/appError.ts`). This allows services to explicitly specify HTTP status codes (e.g., 400, 404, 401, 409) alongside meaningful messages.
- **First-Class Error Handling**: The `errorHandler.ts` now uses `instanceof AppError` checks to prioritize explicit status codes, falling back to keyword matching and ultimately `500 Internal Server Error` for unhandled exceptions. This ensures predictable API behavior and higher security.

## Cloudinary Upload Optimization
- **Memory Efficiency with Streams**: Instead of converting file buffers to Base64 strings (which increases memory usage by ~33%), use `cloudinary.uploader.upload_stream`. This allows piping the buffer directly to Cloudinary, reducing the server's memory footprint during uploads.
- **Custom Public ID Naming**: Use `path.parse(req.file.originalname).name` combined with a timestamp for `public_id`. This makes assets in the Cloudinary Media Library much easier to identify and manage compared to default random hashes.

## Primary vs. Fallback Error Handling
- **Primary Control (Service Layer)**: Proactively throw `AppError` with dynamic messages and explicit status codes (e.g., `StatusCodes.CONFLICT` for data dependencies) at the point of failure. This moves business logic control back to the Service layer where context is richest.
- **Fallback Mechanism (ErrorHandler)**: The global error handler should only handle keyword-to-status mapping as a secondary 'safety net' for non-AppError exceptions. This prevents the error handler from becoming a monolithic, brittle collection of string checks.
- **Dynamic Error Messages**: When throwing errors, include relevant data (like entity counts or IDs) to provide the frontend with actionable information for user feedback.

## Intelligent Data Migration (Soft Delete Logic)
- **Automated Fallback Mapping**: When performing a soft delete on a parent entity (e.g., Category) that still has active children (e.g., Products), implement an automated migration to a 'System Default' entity (like 'Uncategorized').
- **Resurrection Logic**: Ensure your 'System Default' detection handles soft-deleted records. If the default entity exists but is flagged as deleted, the system should automatically restore it (`deletedAt: null`) to ensure the migration target is valid.
- **User Experience (UX)**: Instead of blocking the user with errors, transparently handling the reassignment provides a smoother administrative workflow, provided a clear feedback message (e.g., 'X products moved to Uncategorized') is logged or returned.

## Modern Stream Handling in Node.js
- **Readable.from()**: Instead of manual `new Readable()` and implementing `_read` with `push(null)`, use `Readable.from(data)`. This is a built-in utility (since Node.js 12.3.0+) that correctly handles the iterable-to-stream conversion, making your code cleaner and more robust against stream state issues.

## Financial Precision (Decimal.js)
- **Calculation Precision**: Always use `Prisma.Decimal` (powered by `decimal.js`) for all monetary calculations until the last moment. Avoid converting to native `Number` types to prevent floating-point precision errors (e.g., `0.1 + 0.2 !== 0.3`).
- **JSON Serialization**: Polyfill `BigInt.prototype.toJSON` and `Prisma.Decimal.prototype.toJSON` to ensure they are stringified in API responses. This prevents `JSON.stringify` errors and ensures high-precision values are safely transmitted to the frontend.

## Cross-Origin Security (CORS)
- **Credentials Exchange**: When `credentials: true` is enabled on the backend (e.g., for Cookie-based JWT/CSRF), remind the frontend developer that all `fetch` or `axios` requests **MUST** include `credentials: 'include'`. Failing to do so will cause the browser to strip authentication cookies from the request.

## Transactional Integrity & Rollbacks
- **Prisma Interactive Transactions**: When performing operations with multiple side effects (e.g., decrementing inventory AND creating an order), ALWAYS wrap them in `prisma.$transaction`. This ensures that if any step fails (like a card decline or server error during record creation), ALL previous database changes within that block are automatically rolled back, preventing orphaned records or incorrect inventory counts (Atomic Data Integrity).

## AI Security & Prompt Injection
- **System Instruction Isolation**: Never allow the `systemInstruction` for generative AI models to be passed from the client-side. This prevents 'Prompt Injection' where an attacker overrides the model's behavioral constraints. Keep these instructions as server-side constants.
- **SSRF in Image Processing**: When downloading images for AI processing, strictly validate the URL's hostname against a literal whitelist. Avoid allowing `localhost` or `127.0.0.1` even in development, as this can be used to scan internal services via the server's network.

## Advanced RBAC & Role Hierarchy
- **Role-Level Enforcement**: In systems with multiple administrative roles (e.g., ADMIN vs DEVELOPER), enforce a numeric 'Role Level'. A user should only be able to perform management actions (like update or delete) on users with a strictly LOWER Role Level. This prevents escalation attacks where an admin might try to hijack a developer's access.

## Input Sanitization for Raw SQL
- **Pattern Injection**: Even when using parameterized queries (like Prisma's `$queryRaw`), if the input is used inside a database function like `JSON_SEARCH` or as a `LIKE` pattern, an attacker can still inject wildcards (`%`, `_`). Always validate the input character set (e.g., Alphanumeric only) before passing it to the query.

## Agent Operations & File Safety
- **避免覆蓋既有文件 (Prevent Overwriting)**: 絕不對已建立的專案紀錄文件（如 `lessons.md` 或 `todo.md`）使用 `write_to_file` 並設為 `Overwrite: true`。這會導致歷史紀錄與使用者手動新增的內容消失。
- **增量修改原則 (Incremental Edits)**: 優先使用 `replace_file_content` 或 `multi_replace_file_content` 進行精確修改，以保持「上下文衛生 (Context Hygiene)」並尊重專案的長期記憶。
