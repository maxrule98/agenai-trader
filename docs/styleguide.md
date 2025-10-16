# Code Style Guide

## General

- Language: TypeScript (Node 20), ES modules, strict mode enabled
- Naming: `camelCase` for vars/functions, `PascalCase` for types/classes, `kebab-case` for file names
- Imports: absolute via `@ai-quant/*` paths from tsconfig baseUrl
- Prefer pure functions and explicit returns

## Types & Validation

- Every external-facing interface mirrored by a Zod schema
- Use `z.strictObject` to avoid excess property leaks
- Export both the Zod schema and the inferred type
- Use `satisfies` operator where helpful for literal validation

## Error Handling

- Throw custom typed errors (`ValidationError`, `ExchangeError`, etc.)
- Include `context` (symbol, exch, t, strategyId)
- Never throw raw strings

## Logging

- Use a central logger util with correlation IDs
- Log format: JSON lines `{ level, ts, module, symbol, exch, strategyId, msg }`
- Never include secrets or PII

## Comments

- Explain "why", not "what"
- Use `TODO:` only for temporary gaps with owner + expected resolution date

## Documentation

- Each package → README.md with purpose, exports, usage example
- Public APIs documented in `docs/api-contracts.md`
- Keep changelog up to date

## Testing

- Vitest unit tests co-located under `__tests__` or `/test`
- Golden replays for trading/session logic
- Aim for 80% coverage but focus on risk-critical branches

## Commits

- Conventional commits: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`
- Scope optional but preferred (e.g., `feat(risk): add daily loss rule`)

## UI Style

- Tailwind + shadcn/ui; consistent spacing (4/8/12/16 px multiples)
- Use hyphens (-) not em dashes — in visible text
- Keep color palette neutral; avoid hard-coded exchange colors
