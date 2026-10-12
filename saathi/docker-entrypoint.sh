#!/bin/sh
set -eu
echo "Saathi: running prisma migrate deploy..."
npx prisma migrate deploy
echo "Saathi: starting Next.js on PORT=${PORT:-8080}"
exec npx next start -H 0.0.0.0 -p "${PORT:-8080}"
