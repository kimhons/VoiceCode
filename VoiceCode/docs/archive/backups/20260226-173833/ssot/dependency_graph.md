# VoiceCode — Dependency Graph

> Version: 1.0.0 | Generated: 2026-02-26 | Blueprint Forge OS™

---

## Module Dependencies

```
MOD-SUPABASE (no deps — foundation)
  ↑
  ├── MOD-WEB (depends on MOD-SUPABASE for auth, data)
  ├── MOD-MOBILE (depends on MOD-SUPABASE for auth, data)
  └── MOD-API (depends on MOD-SUPABASE for data)

MOD-SHARED (no deps — foundation)
  ↑
  ├── MOD-WEB (imports shared types, utils)
  ├── MOD-MOBILE (imports shared types)
  └── MOD-DESKTOP-FE (imports shared types)

MOD-CODE-INTEL (no external deps)
  ↑
  ├── MOD-DESKTOP-BE (uses code intel for voice→code)
  └── MOD-CLI (uses code intel for context)

MOD-STT (no external deps)
  ↑
  └── MOD-STREAMING (uses STT providers)
       ↑
       └── MOD-DESKTOP-BE (exposes streaming commands)
            ↑
            └── MOD-DESKTOP-FE (consumes IPC events)

MOD-VISION (no external deps)
  ↑
  └── MOD-DESKTOP-BE (exposes vision commands)

MOD-AGENT-CORE (independent Python service)
MOD-VSCODE (independent — communicates via VS Code API)
```

## Dependency Matrix

| Module | Depends On | Depended On By |
|--------|-----------|----------------|
| MOD-SUPABASE | (none) | MOD-WEB, MOD-MOBILE, MOD-API |
| MOD-SHARED | (none) | MOD-WEB, MOD-MOBILE, MOD-DESKTOP-FE |
| MOD-CODE-INTEL | (none) | MOD-DESKTOP-BE, MOD-CLI |
| MOD-STT | (none) | MOD-STREAMING |
| MOD-STREAMING | MOD-STT | MOD-DESKTOP-BE |
| MOD-VISION | (none) | MOD-DESKTOP-BE |
| MOD-CLI | MOD-CODE-INTEL | MOD-DESKTOP-BE |
| MOD-DESKTOP-BE | MOD-STREAMING, MOD-CODE-INTEL, MOD-CLI, MOD-VISION | MOD-DESKTOP-FE |
| MOD-DESKTOP-FE | MOD-DESKTOP-BE, MOD-SHARED | (none — leaf) |
| MOD-WEB | MOD-SUPABASE, MOD-SHARED | (none — leaf) |
| MOD-MOBILE | MOD-SUPABASE, MOD-SHARED | (none — leaf) |
| MOD-API | MOD-SUPABASE | (none — leaf) |
| MOD-AGENT-CORE | (none) | (none — independent) |
| MOD-VSCODE | (none) | (none — independent) |

## Build Order (Topological Sort)

1. **Level 0 (no deps):** MOD-SUPABASE, MOD-SHARED, MOD-CODE-INTEL, MOD-STT, MOD-VISION, MOD-AGENT-CORE, MOD-VSCODE
2. **Level 1:** MOD-STREAMING (needs MOD-STT), MOD-CLI (needs MOD-CODE-INTEL)
3. **Level 2:** MOD-DESKTOP-BE (needs MOD-STREAMING, MOD-CLI, MOD-VISION, MOD-CODE-INTEL)
4. **Level 3 (leaves):** MOD-DESKTOP-FE, MOD-WEB, MOD-MOBILE, MOD-API

## Cross-Module Contracts

| From | To | Contract Type | Freeze Point |
|------|----|-------------|-------------|
| MOD-DESKTOP-BE → MOD-DESKTOP-FE | Tauri IPC commands | Command signatures in `main.rs` | Wave 0 (frozen) |
| MOD-SUPABASE → MOD-WEB | Supabase client API | Table schemas + RLS policies | Wave 0 (frozen) |
| MOD-SUPABASE → MOD-MOBILE | Supabase client API | Table schemas + RLS policies | Wave 2 (freeze before mobile) |
| MOD-STT → MOD-STREAMING | Provider trait interface | `SttProvider` trait in `stt/mod.rs` | Wave 0 (frozen) |
| MOD-CODE-INTEL → MOD-CLI | Code context API | Function signatures in code_intelligence/ | Wave 0 (frozen) |

---

*Dependencies verified against import statements and module declarations in source code.*
