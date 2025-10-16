# Incident Response Runbook

1. Identify: verify alarm (DD breach, stale feed, slippage spike)
2. Halt: use UI or POST /api/control/halt with strategyId
3. Stabilize: reconcile orders/positions; ensure safety stops active
4. Diagnose: check logs (Loki), metrics (Grafana), traces (Tempo)
5. Rollback: deploy previous artifact via Deployer
6. RCA: file a report with timeline, metrics, corrective actions
   SLOs: MTTD <1 min; MTTR <15 min for halt and reconcile
