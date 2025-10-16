#!/usr/bin/env bash
set -euo pipefail

# Sprints
gh label create sprint-3 --color F9D0C4 --description "Sprint 3 — Risk & Execution v1" || true
gh label create sprint-4 --color C4E1F9 --description "Sprint 4 — Backtester & Walk-Forward" || true
gh label create sprint-5 --color E2C4F9 --description "Sprint 5 — UI: Strategy & Live" || true
gh label create sprint-6 --color C4F9E1 --description "Sprint 6 — Agentic AI & Ensemble" || true
gh label create sprint-7 --color F9E1C4 --description "Sprint 7 — Post-Trade & Planner" || true
gh label create sprint-8 --color D4F9C4 --description "Sprint 8 — Multi-Venue SOR & L2 Sim" || true

# Areas
for L in \
  "area:exec" "area:bybit" "area:sor" "area:risk" "area:researcher" "area:telemetry" \
  "area:orchestrator" "area:gateway" "area:ui" "area:ai-core" "area:storage" \
  "area:analytics" "area:planner" "area:sim"
do
  gh label create "$L" --color 0B5FFF || true
done

# Types / priority
gh label create type:feature --color 0052cc || true
gh label create type:test --color fbca04 || true
gh label create type:docs --color 5319e7 || true
gh label create type:chore --color 1d76db || true
gh label create prio:high --color e11d21 || true

echo "✅ Labels ensured."
