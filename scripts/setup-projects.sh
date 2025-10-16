#!/usr/bin/env bash
set -euo pipefail

REPO="maxrule98/agenai-trader"
NAME="AI-Quant Roadmap"

# Create a repo project (Projects v2)
gh project create --repo "$REPO" --title "$NAME" --format json > /tmp/project.json

echo "Created project:"
cat /tmp/project.json | jq .

# Extract Project number (used by workflows)
PN=$(jq -r '.number' /tmp/project.json)
echo "PROJECT_NUMBER=$PN"
