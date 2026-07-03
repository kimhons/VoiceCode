# VoiceCode — RBAC Matrix

> Version: 1.0.0 | Generated: 2026-02-26 | Blueprint Forge OS™

---

## Roles

| Role | Description | Source |
|------|-------------|--------|
| anonymous | Unauthenticated user | Supabase default |
| authenticated | Logged-in user | Supabase auth |
| service_role | Backend service | Supabase service key |

## Permissions Matrix

| Resource | anonymous | authenticated | service_role |
|----------|-----------|---------------|-------------|
| `profiles` (own) | — | READ, UPDATE | ALL |
| `profiles` (others) | — | — | READ |
| `subscriptions` (own) | — | READ | ALL |
| `payments` (own) | — | READ | ALL |
| `transcripts` (own) | — | CRUD | ALL |
| `real_time_sessions` (own) | — | CRUD | ALL |
| `streaming_transcripts` (own) | — | CRUD | ALL |
| `live_suggestions` (own) | — | CRUD | ALL |
| `action_items` (own) | — | CRUD | ALL |
| `contextual_insights` (own) | — | CRUD | ALL |
| `context_analyses` (own) | — | CRUD | ALL |
| `push_subscriptions` (own) | — | CRUD | ALL (+ service_role ALL) |
| Web landing page | READ | READ | — |
| Web dashboard | — | READ | — |
| Web settings | — | READ, UPDATE | — |
| Desktop app (all panels) | — | ALL | — |
| Stripe checkout | — | CREATE | — |
| Stripe portal | — | CREATE | — |

## Supabase RLS Policy Pattern

```sql
-- Example: transcripts table
CREATE POLICY "Users can CRUD own transcripts"
  ON transcripts
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

## Notes
- All Supabase tables use RLS with `auth.uid() = user_id` pattern
- Session-scoped tables (`contextual_insights`, `context_analyses`, `action_items`, etc.) use a JOIN to `real_time_sessions` to verify ownership
- `context_analyses` allows access to standalone analyses (where `session_id IS NULL`) for any authenticated user
- Edge functions validate JWT before processing
- Desktop app requires no auth for local-only features
- Web app uses ProtectedRoute component for auth-gated pages
- All foreign keys reference `auth.users(id)`, not `profiles(id)` — `profiles.id` itself is an FK to `auth.users(id)`

---

## Application Roles

Defined in `UserProfile.role` (`apps/web/src/services/supabase.service.ts`):

| Role | Description | Assignment |
|------|-------------|------------|
| `user` | Default role for all new users | Set on profile creation |
| `admin` | Administrative access | Manual assignment |
| `superuser` | Full access | Hardcoded for `khonour@yahoo.com` in `createUserProfile()` |

> **⚠️ Client-side only.** These roles exist in the TypeScript type and profile data but are **not enforced** by any RLS policy, database constraint, or server-side middleware. Any user can read/write within their own RLS boundary regardless of role.

---

## Subscription Tiers

Defined in `profiles.subscription_tier` and `apps/mobile/src/config/constants.ts`:

| Tier | Monthly Minutes | Max Recording | Storage |
|------|----------------|---------------|---------|
| `free` | 60 min | 5 min | 1 GB |
| `pro` | 600 min | 30 min | 10 GB |
| `enterprise` | Unlimited | 2 hours | 100 GB |

> **⚠️ Not enforced.** These limits are defined in mobile `constants.ts` (`SUBSCRIPTION_LIMITS`) but are **not enforced** by any database constraint, RLS policy, Edge Function, or API middleware. A `free` user faces no server-side restriction on usage.

---

## Known Gaps & Risks

| # | Gap | Impact | Location |
|---|-----|--------|----------|
| 1 | Application roles (`user`/`admin`/`superuser`) are client-side only — no RLS or middleware enforcement | Any authenticated user has the same DB-level permissions regardless of role | `apps/web/src/services/supabase.service.ts` |
| 2 | Subscription tier limits are defined but never enforced server-side | Free-tier users are not restricted from exceeding usage limits | `apps/mobile/src/config/constants.ts` |
| 3 | Alert API (`apps/api/server.ts`) has zero authentication | Any caller can hit the alert endpoints without a JWT or API key | `apps/api/server.ts` |
| 4 | Agent core service has zero authentication | `user_id` is hardcoded; no caller identity verification | `services/agent-core/` |
| 5 | `ProtectedRoute` checks only `isAuthenticated`, never checks role or tier | Admin/superuser pages (if any) are not gated by role | `apps/web/` |
| 6 | VSCode extension defines additional tiers (`BASIC`, `STANDARD`) not in the database schema | Tier mismatch between extension and DB could cause access control bugs | `extensions/voiceflow-vscode/src/utils/ServiceLoader.ts` |

---

*RBAC derived from Supabase migration RLS policies, web route protection, and security audit findings.*
