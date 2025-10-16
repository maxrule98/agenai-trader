# Contributing

Thanks for helping build an AI-native, agentic quant platform. This doc covers standards so we ship safe and fast.

## Development setup

1. Install pnpm and Docker
2. `pnpm i`
3. `docker compose -f infra/docker/compose.dev.yml up -d`
4. Build packages: `pnpm -r --filter ./packages/** build`
5. Run apps as needed: `pnpm -r --filter ./apps/gateway run dev`, etc.

## Branching

- main is protected. Use feature branches: `feat/<area>-<short-desc>`
- Conventional commits:
  - feat(trader): add threshold policy with ATR brackets
  - fix(exec): idempotent clientId retry on timeout
  - test(risk): daily loss rule edge cases
  - docs(ui): Strategy Builder schema mapping

## Code standards

- TypeScript strict mode. No any unless justified.
- Zod validation at boundaries. Reject bad inputs with actionable errors.
- Pure functions in math and feature code. No I/O in those modules.
- Exhaustive switch on enums with never checks.
- Prefer hyphens over em dashes in user facing copy.

## Tests

- Vitest for unit and integration
- Golden-file replays for the simulator
- Minimum: happy path + edge cases + failure modes
- Add fixtures under `packages/*/test/fixtures`

## Observability

- Add OpenTelemetry spans for critical paths
- Prometheus metrics for rates, latencies, and errors
- Logs: include symbol, exchange, timestamp, strategyId. Never include secrets.
- Use correlation IDs across the trader pipeline

## Security

- No secrets in code or logs. Use SOPS or Doppler
- Idempotent client order IDs
- Reconciliation on boot for orders and positions
- Circuit breakers on stale data, slippage spikes, and daily loss

## Review checklist

- Types complete and exported
- Zod schemas in place
- Tests pass
- Deterministic replay updated if trading logic changed
- Docs and README updated
- Observability probes added

## Definition of done

- Type safe, validated, tested
- Deterministic replay green
- Metrics and traces in place
- Docs and examples present
