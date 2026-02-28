# Backend Security Hardening Task List

## 1. Audit & Fix BOLA (IDOR)
- [x] Scan `order.routes.ts` and `order.service.ts` for direct ID references.
- [x] Scan `cart.service.ts` for missing user/item ownership checks.
- [x] Scan `user.service.ts` for potential IDOR in updates.
- [x] Refactor Prisma queries to use `{ where: { id: ..., userId: ... } }` pattern.

## 2. Audit & Fix Excessive Data Exposure
- [x] Review `user.service.ts` to ensure all queries use `select` to exclude sensitive fields.
- [x] Review `auth.controller.ts` for user object leaks in login/register.
- [x] Review any other controllers returning database objects directly.

## 3. Audit & Fix ReDoS
- [x] Scan `src/schemas/*.ts` for complex regex with nested quantifiers.
- [x] Scan `src/utils/*.ts` for regex usage.
- [x] Implement `.max()` length constraints in all Zod schemas as proactive defense.

## 4. Audit & Fix Dependency Supply Chain
- [x] Run `npm audit` in `apps/backend`.
- [x] Fix high/critical vulnerabilities if any.
- [x] Update `deploy.yml` or similar CI/CD to include `npm audit`.

## 5. Audit & Fix Frontend State Injection (SSR/Re-hydration)
- [x] Check for SSR or manual state injection.
- [x] Implement `safeJsonStringify` as defensive utility.
- [x] Add guardrails/comments for future SSR implementation.

## 6. Verification
- [x] Verify changes via existing logic and manual code review.
- [x] Ensure `npm run build` still passes.
