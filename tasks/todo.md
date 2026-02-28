# Docker Compose & Networking Optimization

## 1. Planning
- [x] Analyze current networking in `docker-compose.yml`.
- [x] Identify domain for Caddy configuration.

## 2. Implementation
- [x] Create/Update `Caddyfile`.
- [x] Refactor `docker-compose.yml` to isolate `app` and `db` services.
- [x] Remove public port 3000 mapping.

## 3. Verification
- [x] Update `tasks/lessons.md` with "Networking Isolation" tips.

# Review
Enhanced project security by implementing strict network isolation. The application and database are now hidden from public port scans, with all external traffic being funneled through Caddy via a secure reverse proxy. This significantly shrinks the attack surface.
