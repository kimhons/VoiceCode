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
| `contextual_insights` (own) | — | READ | ALL |
| `push_subscriptions` (own) | — | CRUD | ALL |
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
- Edge functions validate JWT before processing
- Desktop app requires no auth for local-only features
- Web app uses ProtectedRoute component for auth-gated pages

---

*RBAC derived from Supabase migration RLS policies and web route protection.*
