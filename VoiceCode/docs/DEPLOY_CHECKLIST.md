# VoiceCode — Deploy Checklist

**Use before production or release.** Update as tooling and env change.

---

## Environment & secrets

- [ ] All API keys and secrets in env (no hardcoded keys). Optional keys: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `AIML_API_KEY`, `DEEPGRAM_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `STRIPE_SECRET_KEY`.
- [ ] API server: `API_SECRET` set in production if alert endpoints must be protected (then clients send `x-api-key` or `Authorization: Bearer <API_SECRET>`).
- [ ] SMTP: `SMTP_USER`, `SMTP_PASSWORD` (and optional host/port) for email alerts.
- [ ] `.env` files not committed; `.env.example` or docs list required vars.

## Build & tests

- [ ] `cd apps/desktop && npx tsc --noEmit` — 0 errors.
- [ ] `cd apps/desktop/src-tauri && cargo test --release --lib` — 453 tests pass.
- [ ] `cd apps/web && npm run type-check && npm run lint && npm run build && npm test -- --run` — pass.
- [ ] `cd apps/api && npm test` — 22 tests pass.
- [ ] `cd apps/mobile && npx tsc --noEmit && npm test -- --ci --maxWorkers=2` — pass.
- [ ] Web bundle: `index-*.js` ≤ 250KB gzip (CI or `npm run build` in apps/web).
- [ ] `cd apps/web && npx audit-ci --high` — no high/critical vulns.

## Security

- [ ] API auth: if `API_SECRET` is set, alert routes require key; health remains public.
- [ ] Webhook SSRF: private/local URLs rejected (403); tests expect 403 for `127.0.0.1`.
- [ ] Web: raw HTML sanitized with DOMPurify (chat, search, agent panels).
- [ ] No secrets in logs or client bundles.

## CI/CD

- [ ] GitHub Actions: 6 jobs (web, api, desktop-rust, desktop-fe, mobile, docs) green.
- [ ] Web E2E smoke and safety-eval tests run in CI.
- [ ] Branch protection: require CI pass before merge (optional).

## Docs & config

- [ ] README quick start and env table up to date.
- [ ] `docs/ssot/health_metrics.md` and MASTER plan reflect current test counts and GAPs.
- [ ] Package manager: repo uses **npm** (lockfile `package-lock.json`); avoid mixing yarn/pnpm in CI.

## Post-deploy

- [ ] Health: `GET /health` returns 200 (API).
- [ ] Web app loads; auth and critical routes reachable.
- [ ] Desktop/mobile builds install and launch (platform-specific).

---

_Update this checklist when adding new env vars, jobs, or quality gates._
