#!/usr/bin/env bash
set -euo pipefail

# VoiceCode Quality Gate Runner
# Blueprint Forge OS™ | Generated: 2026-02-26

PASS=0
FAIL=0
WARN=0

gate() {
  local name="$1"
  local cmd="$2"
  echo "━━━ GATE: $name ━━━"
  if eval "$cmd"; then
    echo "✅ PASS: $name"
    ((PASS++))
  else
    echo "❌ FAIL: $name"
    ((FAIL++))
  fi
  echo ""
}

warn_gate() {
  local name="$1"
  local cmd="$2"
  echo "━━━ GATE (warn): $name ━━━"
  if eval "$cmd"; then
    echo "✅ PASS: $name"
    ((PASS++))
  else
    echo "⚠️  WARN: $name"
    ((WARN++))
  fi
  echo ""
}

echo "╔══════════════════════════════════════╗"
echo "║   VoiceCode Quality Gates            ║"
echo "╚══════════════════════════════════════╝"
echo ""

# Web App Gates
echo "── Web App ──"
gate "Web: Type Check" "cd apps/web && npx tsc --noEmit"
gate "Web: Lint" "cd apps/web && npm run lint"
gate "Web: Build" "cd apps/web && npm run build"
gate "Web: Unit Tests" "cd apps/web && npm test -- --run"
gate "Web: Security Audit" "cd apps/web && npx audit-ci --high"

# Desktop Rust Gates
echo "── Desktop (Rust) ──"
gate "Rust: Cargo Check" "cd apps/desktop/src-tauri && cargo check --lib"
gate "Rust: Clippy" "cd apps/desktop/src-tauri && cargo clippy --lib -- -D clippy::correctness -D clippy::suspicious -A dead_code -A unused"
gate "Rust: Unit Tests" "cd apps/desktop/src-tauri && cargo test --release --lib"
gate "Rust: Integration Tests" "cd apps/desktop/src-tauri && cargo test --release --test integration_tests"

# Desktop Frontend Gates
echo "── Desktop (Frontend) ──"
warn_gate "Desktop FE: Type Check" "cd apps/desktop && npx tsc --noEmit"

# Mobile Gates
echo "── Mobile ──"
gate "Mobile: Type Check" "cd apps/mobile && npx tsc --noEmit"
gate "Mobile: Lint" "cd apps/mobile && npx eslint . --ext .ts,.tsx --max-warnings 0"
gate "Mobile: Tests" "cd apps/mobile && npm test -- --ci --coverage --maxWorkers=2"

# Traceability Gate
echo "── Documentation ──"
gate "SSOT exists" "test -f docs/ssot/SSOT.md"
gate "Traceability exists" "test -f docs/ssot/traceability_matrix.md"

echo "╔══════════════════════════════════════╗"
echo "║   RESULTS                            ║"
echo "╠══════════════════════════════════════╣"
echo "║   PASS: $PASS                        "
echo "║   FAIL: $FAIL                        "
echo "║   WARN: $WARN                        "
echo "╚══════════════════════════════════════╝"

if [ "$FAIL" -gt 0 ]; then
  echo "❌ QUALITY GATES FAILED"
  exit 1
else
  echo "✅ ALL QUALITY GATES PASSED"
  exit 0
fi
