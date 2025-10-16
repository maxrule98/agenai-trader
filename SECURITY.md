# Security Policy

- Secrets: use SOPS/Doppler; never commit. Rotate quarterly.
- Keys stored encrypted; decrypted at runtime only.
- RBAC enforced at gateway; scoped API keys per venue.
- Logs: PII-free, secrets redacted.
- Supply chain: lockfile updates weekly; SBOM; vulnerability scans in CI.
- Incident disclosure: within 24h internally; 72h for external stakeholders if applicable.
