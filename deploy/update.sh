#!/bin/sh
set -eu

docker compose pull app scheduler
docker compose up -d --remove-orphans
docker compose ps
docker image prune -f >/dev/null

