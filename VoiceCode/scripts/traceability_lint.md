# VoiceCode — Traceability Lint Rules

> Blueprint Forge OS™ | Generated: 2026-02-26

---

## Rules

### RULE-001: No Orphan Requirements
Every `REQ-*` in SSOT.md MUST have at least one `TASK-*` in MASTER-IMPLEMENTATION-PLAN.md.
**Check:** `grep -oP 'REQ-[A-Z]+-[0-9]+' docs/ssot/SSOT.md | sort -u > /tmp/reqs.txt && grep -oP 'REQ-[A-Z]+-[0-9]+' docs/ssot/traceability_matrix.md | sort -u > /tmp/traced.txt && diff /tmp/reqs.txt /tmp/traced.txt`

### RULE-002: No Orphan Tasks
Every `TASK-*` in MASTER-IMPLEMENTATION-PLAN.md MUST map to at least one `REQ-*`.
**Check:** Verify traceability_matrix.md covers all TASKs.

### RULE-003: No DONE Without Evidence
Every task marked DONE MUST have a file path or verify command in the Evidence column.
**Check:** `grep 'DONE' docs/ssot/MASTER-IMPLEMENTATION-PLAN.md | grep -v 'exists\|pass'` should return 0 lines.

### RULE-004: No Vague Tasks
Forbidden words without quantification: "polish", "finish", "complete remaining", "improve", "enhance", "ensure".
**Check:** `grep -iE 'polish|finish|complete remaining|improve|enhance|ensure' docs/ssot/MASTER-IMPLEMENTATION-PLAN.md` should return 0 lines.

### RULE-005: All Interfaces Mapped
Every SCR-*, API-*, DM-*, EVT-* MUST link to at least one REQ-*.
**Check:** Verify system_blueprint.md and contracts/ files have REQ column populated.

### RULE-006: Stable IDs
IDs are permanent. Never reuse or reassign. Never skip sequential numbers.
**Check:** Manual review on each SSOT update.

### RULE-007: Version History Updated
Every change to docs/ssot/ MUST append an entry to version_history.md.
**Check:** `git diff --name-only docs/ssot/ | head -1` triggers version_history check.

---

## How to Run Lint

```bash
# Check for orphan REQs
grep -oP 'REQ-[A-Z]+-[0-9]+' docs/ssot/SSOT.md | sort -u | wc -l
grep -oP 'REQ-[A-Z]+-[0-9]+' docs/ssot/traceability_matrix.md | sort -u | wc -l
# Both counts should match

# Check for DONE without evidence
grep 'DONE' docs/ssot/MASTER-IMPLEMENTATION-PLAN.md | grep -vc 'exists\|pass'
# Should be 0

# Check for vague words
grep -ciE 'polish|finish|complete remaining|improve|enhance|ensure' docs/ssot/MASTER-IMPLEMENTATION-PLAN.md
# Should be 0
```

---

*These rules enforce Blueprint Forge OS™ traceability guarantees.*
