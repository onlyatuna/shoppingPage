# Security Remediation Tasks (March 2026)

## Phase 1: Immediate Critical Fixes
- [x] **Fix Payment Bypass**: Restrict `PATCH /api/v1/orders/:id/pay` to Admin only. <!-- id: 101 -->
- [x] **Protect Translation API**: Add `authenticateToken` and Rate Limiting to `translate.routes.ts`. <!-- id: 102 -->

## Phase 2: Enhanced Defenses
- [x] **Harden Instagram SSRF**: Add `sanitizeImageUrl` validation in `InstagramService.publishPost`. <!-- id: 103 -->
- [x] **Optimize Request Body Limits**: Lower global JSON limit (50mb -> 10mb) in `app.ts`. <!-- id: 104 -->
- [x] **Mitigate AI Prompt Injection**: Sanitize user inputs in AI services (`InstagramService`, `GeminiService`). <!-- id: 105 -->

## Phase 3: Infrastructure & Configuration
- [x] **Harden Trust Proxy**: Review and secure `trust proxy` configuration in `app.ts`. <!-- id: 106 -->
- [x] **Frontend Security Enhancement**: Secure CSRF token and audit for XSS vulnerabilities (verified safe). <!-- id: 107 -->

## Phase 4: Second Security Audit Fixes
- [x] **Protect Instagram API**: Add `authenticateToken` and `requireAdmin` to `instagram.routes.ts`. <!-- id: 110 -->
- [x] **Financial Logic consistency**: Freeze Order Amount during LINE Pay confirm by referencing DB `order.totalAmount`. <!-- id: 111 -->
- [x] **IP Spoofing fix**: Configure Caddy to rewrite `X-Forwarded-For`. <!-- id: 112 -->
- [x] **Refactor CSRF configuration**: Extracted whitelisted Origins to environment `CSRF_ALLOWED_ORIGINS`. <!-- id: 113 -->

## Phase 5: Verification & Documentation
- [x] Verify all fixes with manual audit and linting. <!-- id: 108 -->
- [x] Update `tasks/lessons.md` with new findings. <!-- id: 109 -->

## Phase 6: AI Quota & Memory Constraints
- [x] **AI Circuit Breaker**: Enhance `MonitorService.checkBudgetAllowed()` to return a boolean that halts any new Gemini AI integrations when daily budget exceeds limits. <!-- id: 114 -->
- [x] **Stream Large Files**: Refactor Express Memory Limits down to `2mb`. Transition `upload.routes.ts` Cloudinary integrations to use `multer` and `upload_stream` via `Buffer`. <!-- id: 115 -->

## Phase 7: Robustness & Refactoring (3rd Audit)
- [x] **CSRF Strictness**: Change `isValidSource` fallback to `false` for mutating requests missing Origin/Referer in `csrf.middleware.ts`. <!-- id: 116 -->
- [x] **Error Handler Fragility**: Refactor `errorHandler.ts` to rely on robust Error Codes or specific subclasses rather than string matching. <!-- id: 117 -->
- [x] **Token Revocation (JWT)**: Add `tokenVersion` to `User` schema. Increment on password changes/logout to invalidate old JWTs. Ensure `authenticateToken` checks this version. <!-- id: 118 -->
- [x] **Admin Route Input Validation**: Apply Zod validation on `src/controllers/order.controller.ts` `getAllOrders` req.query instead of manual parsing. <!-- id: 119 -->

## Phase 8: Hardening Edge Cases (4th Audit)
- [x] **Error Handler Info Disclosure**: Change standard error message masking when status code is 500 in Prod. <!-- id: 120 -->
- [x] **IDOR Fix for LinePay Check**: Add User ID query validation to `checkPaymentStatus` in `PaymentService`. <!-- id: 121 -->
- [x] **Performance Note**: Document that JSON_SEARCH for images should be eventually decoupled into a relational table. <!-- id: 122 -->
- [x] **Logging Leak Mitigation**: Ensure `DEBUG_LINE_PAY` logging restricts sensitive config leaks. <!-- id: 123 -->

## Phase 9: Final Touches (5th Audit)
- [x] **JWT Secret Strength**: Generate a cryptographically secure 128-char JWT Secret and replace the weak default in `.env`. <!-- id: 124 -->

## Phase 10: Final Polishing (6th Audit)
- [x] **PII Masking Expansion**: Added `phone` to redacted log paths in `logger.ts`. <!-- id: 125 -->
- [x] **Health Check Extensibility**: Added documentation for future external service integration (Redis/Cloudinary) in the health check endpoint. <!-- id: 126 -->
- [x] **Performance Documentation**: Verified SQL performance warnings regarding JSON_SEARCH are clearly documented in relevant files. <!-- id: 127 -->

## Phase 11: Frontend Build Optimization (March 2026)
- [x] **Reproduce Build Failure**: Run `npm run build` in the frontend workspace and confirm the error. <!-- id: 201 -->
- [x] **Optimize Manual Chunks**: Add `react-vendor` and `framer-motion` to `manualChunks` in `vite.config.ts` to reduce `index.js` size. <!-- id: 202 -->
- [x] **Audit Workbox Config**: Double-check the `VitePWA` configuration and ensure `maximumFileSizeToCacheInBytes` is correctly positioned. <!-- id: 203 -->
- [x] **Verify Build Correctness**: Ensure the build succeeds and all chunks are within reasonable limits. <!-- id: 204 -->

## Phase 12: CodeQL Remediation (March 2026)
- [x] **Escape Character Completeness**: Fixed Alert #442 by adding backslash escaping to `sanitizePrompt` BEFORE backtick/dollar-sign escaping. <!-- id: 205 -->
- [x] **Harden Timing-Safe Comparison**: Fixed Alert #437 by implementing PBKDF2 length normalization in `timingSafeCompare` to satisfy computational effort requirements. <!-- id: 207 -->
- [x] **Signed Cookie Transition**: Fixed Alert #443 (User-controlled bypass) by implementing `cookieParser` secret, `signed: true` for auth token, and reading from `req.signedCookies`. <!-- id: 208 -->
- [x] **Log Injection Resilience**: Fixed Alert #444 by hardening `sanitizeLog` with explicit newline and non-ASCII character removal regex. <!-- id: 209 -->
- [x] **Clean Local Assignments**: Fixed Alert #445 by removing useless initial assignment to `targetUrl` in `instagram.service.ts`. <!-- id: 210 -->
- [x] **Remove Unused Imports**: Fixed Alert #447 by removing unused `SafeUrlComponents` import in `gemini.service.ts`. <!-- id: 211 -->

## Phase 13: Developer Tools & Testing Utilities (Production Hardening)
- [x] **Backend: Test Data Reset Endpoint**: Implement `POST /api/v1/admin/reset-test-data` (Developer Only). <!-- id: 212 -->
- [x] **Frontend: DevTools Component**: Create `DevTools.tsx` with role-based rendering. <!-- id: 213 -->
- [x] **Frontend: Quick-Fill Scripts**: Implement address and profile auto-fill for testing checkout flows. <!-- id: 214 -->
- [x] **Frontend: Global Shortcut**: Register `Ctrl + Alt + D` to toggle the Dev Panel. <!-- id: 215 -->
- [x] **Frontend: AI Quota & Style Display**: Add dev-only visibility for AI internal state in `EditorPage`. <!-- id: 216 -->
- [x] **Verification**: Ensure zero-impact on `USER`/`ADMIN` roles and successful build. <!-- id: 217 -->

## Phase 14: Emergency Backend Recovery (March 2026)
- [x] **Fix PathError (Express 5 Compatibility)**: Resolved `ECONNREFUSED` by fixing a backend crash caused by incompatible greedy parameter syntax in `upload.routes.ts`. Implemented a `RegExp` object as a workaround for `path-to-regexp` v7+ string parsing issues. <!-- id: 218 -->

## Phase 15: CSP Inline Scripts (March 2026)
- [x] **Fix Script Execution Block**: Re-enable `'unsafe-inline'` in `script-src` to prevent Vite/React injection breakage in DEV/Demo environments. <!-- id: 301 -->
