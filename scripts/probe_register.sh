#!/usr/bin/env bash
set -euo pipefail
email="probe-$(date +%s)@example.com"
curl --max-time 18 -sS -w '\nHTTP:%{http_code}\n' \
  -X POST http://127.0.0.1:3000/api/auth/register \
  -H 'content-type: application/json' \
  --data "{\"name\":\"Probe User\",\"email\":\"${email}\",\"password\":\"TaskFlow-Probe-2026\"}"
