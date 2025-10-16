# Change Management

## Versioning

- SemVer across the repo: `1.major.minor`
- Strategy schemas and models versioned separately in Postgres artifacts table
- `packages/core` changes that alter schemas → bump minor; breaking → major

## Promotion Process

1. Researcher produces new model/strategy → artifact stage `research`
2. Shadow test (read-only) → artifact stage `shadow`
3. Pass promotion gates (MAR, MaxDD, tail) → promote to `live`
4. Rollback uses previous artifact SHA

## Approval

- Code reviewed by at least one peer before merge to main
- Risk changes require dual approval (dev + risk officer)
- All merges squash into clean commit chain
