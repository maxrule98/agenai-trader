# AI Core Guidelines

## Architecture

- Python 3.11 service using gRPC with protobuf
- Endpoints:
  - `Infer(OrderbookTransformerRequest)` → score, conf, horizon
  - `TrainPPO(PolicyTrainRequest)` → model artifact path
  - `OptBayes(HyperOptRequest)` → param set, metrics
  - `ExplainSHAP(ExplainRequest)` → shap_values

## Model Registry

- S3/MinIO layout:
  - `/models/{name}/{semver}/model.bin`
  - `/reports/{name}/{semver}/metrics.json`
- PG artifacts table records SHA + stage

## Inference Rules

- Return quickly (<50ms preferred)
- Always include `version` and `confidence`
- Log latency metrics for each call
- Fallback gracefully to baseline alpha

## Training Rules

- Deterministic seeds
- Store training metadata (dataset hashes, params, metrics)
- Validate outputs using hold-out sets
- Export minimal, dependency-free inference package
