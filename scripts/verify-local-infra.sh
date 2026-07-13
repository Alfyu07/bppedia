#!/usr/bin/env bash
set -euo pipefail

docker compose exec -T postgres psql -U bppedia -d bppedia -v ON_ERROR_STOP=1 \
  -c "CREATE EXTENSION IF NOT EXISTS vector" \
  -c "SELECT extname FROM pg_extension WHERE extname = 'vector'" \
  | grep -q vector

DOTENV_CONFIG_PATH=.env.local pnpm exec node --import dotenv/config --input-type=module -e \
  'import { createClient } from "redis"; const client = createClient({ url: process.env.REDIS_URL }); await client.connect(); try { if (await client.ping() !== "PONG") process.exitCode = 1; } finally { await client.quit(); }'

curl -fsS http://127.0.0.1:9200/minio/health/live >/dev/null

docker compose run --rm minio-init >/dev/null

docker compose run --rm --entrypoint /bin/sh minio-init -c \
  'mc alias set local http://minio:9000 bppedia bppedia-local-secret >/dev/null && mc stat local/bppedia >/dev/null'

test "$(curl -sS -o /dev/null -w '%{http_code}' 'http://127.0.0.1:9200/bppedia?list-type=2')" = "403"
test "$(curl -sS -o /dev/null -w '%{http_code}' http://127.0.0.1:9200/bppedia/private-probe)" = "403"

printf '%s\n' "Local infrastructure is healthy"
