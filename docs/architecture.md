# Architecture Overview

- Event-driven via NATS, subjects versioned v1.\*
- Data: ClickHouse (ticks, bars, fills), Postgres (configs, artifacts), Redis (caches), MinIO (models)
- Services:
  - trader: features → alphas → policy → risk → exec
  - orchestrator: planner, deployer, registry
  - researcher: sim, walk-forward, reports
  - telemetry: attribution, drift, exec quality
  - gateway: REST/GQL/WS for UI & automation
  - ai-core: Python ML (transformers, PPO, SHAP)
- Deterministic replay for every session
- Security: keys encrypted at rest; no secrets in logs; RBAC
