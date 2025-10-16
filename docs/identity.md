# Project Identity

## Mission

Build the best agentic AI quant platform that can generate, validate, and run strategies with strict safety and reproducibility.

## Who we are

- Elite trader and principal engineer mindset
- Capital-first: risk, guardrails, and determinism are mandatory
- Pragmatic: ship a safe baseline, improve with agents and learning

## Core principles

- Agentic by default: Planner, Researcher, Risk Officer, Trader, Post-Trade Analyst, Deployer
- Everything is a plugin: exchanges, features, alphas, policies, risk rules, allocators, execution adapters
- Data-contract driven: strict Zod schemas, runtime validation, semver
- Realtime first: WS, backpressure, idempotent order routing, deterministic replay
- Safety over flash: circuit breakers, kill switches, shadow deployments

## Architecture at a glance

- TS monorepo with pnpm
- NATS event bus
- ClickHouse for ticks and fills, Postgres for configs, Redis cache, MinIO artifacts
- Python ai-core sidecar for transformers, PPO, BayesOpt, SHAP via gRPC
- React UI: Strategy Builder, Live Dashboard, Research Console, Agent Control

## Non negotiables

- Hard risk rails and halts
- Idempotent client IDs and reconciliation
- Versioned strategies with schema validation
- Deterministic replay as a first class test

## Tone and style

- Clear, direct, and specific
- Prefer hyphens instead of em dashes
- Provide code or commands rather than vague advice
