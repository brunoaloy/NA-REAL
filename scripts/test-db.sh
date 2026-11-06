#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
container="na-real-rls-$$"
docker_args=(--host=unix:///var/run/docker.sock)
trap 'docker "${docker_args[@]}" rm -f "$container" >/dev/null' EXIT
docker "${docker_args[@]}" run -d --name "$container" -e POSTGRES_HOST_AUTH_METHOD=trust postgis/postgis:17-3.5 >/dev/null
for attempt in $(seq 1 30); do
 if docker "${docker_args[@]}" exec "$container" pg_isready -h 127.0.0.1 -U postgres >/dev/null 2>&1; then break; fi
 sleep 1
done
docker "${docker_args[@]}" exec "$container" createdb -U postgres -T template0 nareal
for file in tests/sql/bootstrap.sql supabase/migrations/*.sql tests/sql/rls.sql tests/sql/safe.sql; do
 docker "${docker_args[@]}" exec -i "$container" psql -U postgres -d nareal -v ON_ERROR_STOP=1 < "$file"
done
