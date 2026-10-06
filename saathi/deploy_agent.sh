#!/usr/bin/env bash
# Creates the Saathi agent in project saathi-510820 on Agent Runtime.
# Requires: gcloud auth application-default login as mundrayagya1@gmail.com
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"
export PATH="${HOME}/google-cloud-sdk/bin:${PATH}"
export GOOGLE_CLOUD_PROJECT=saathi-510820
export GOOGLE_CLOUD_LOCATION=us-central1
export GOOGLE_GENAI_USE_VERTEXAI=TRUE
exec adk deploy agent_engine \
  --project=saathi-510820 \
  --region=us-central1 \
  --display_name="Saathi" \
  --description="Shop front door for English and Hindi. Cataloguer, Photo coach, and Scribe." \
  agents/saathi
