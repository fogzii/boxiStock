#!/usr/bin/env bash
# Starts local Supabase for `npm run dev` when needed, then applies pending
# migrations. Avoids hanging/crashing WSL when Docker Desktop's engine is wedged.

set -euo pipefail

red() { printf '\033[31m%s\033[0m\n' "$*"; }
green() { printf '\033[32m%s\033[0m\n' "$*"; }
yellow() { printf '\033[33m%s\033[0m\n' "$*"; }

# Kong serves the local API on 54321 (see supabase/config.toml).
api_already_up() {
  curl -sf -o /dev/null --max-time 2 "http://127.0.0.1:54321/auth/v1/health" \
    || curl -sf -o /dev/null --max-time 2 "http://127.0.0.1:54321/"
}

resolve_docker_host() {
  local sock
  for sock in /var/run/docker.sock /run/docker.sock; do
    if [[ -S "$sock" ]]; then
      echo "unix://${sock}"
      return 0
    fi
  done
  return 1
}

# GNU `timeout` is not on stock macOS. Prefer it on Linux/WSL, then Homebrew
# `gtimeout`, then perl's alarm (always present on macOS).
run_with_timeout() {
  local seconds=$1
  shift
  if command -v timeout >/dev/null 2>&1; then
    timeout "$seconds" "$@"
  elif command -v gtimeout >/dev/null 2>&1; then
    gtimeout "$seconds" "$@"
  else
    perl -e 'alarm shift; exec @ARGV' "$seconds" "$@"
  fi
}

ensure_docker() {
  if ! command -v docker >/dev/null 2>&1; then
    red "Docker CLI not found in this WSL distro."
    yellow "Enable Docker Desktop → Settings → Resources → WSL Integration → Ubuntu, then Apply & Restart."
    exit 1
  fi

  if ! DOCKER_HOST="$(resolve_docker_host)"; then
    red "Docker engine socket missing (/var/run/docker.sock) and local Supabase is not up."
    yellow "WSL integration looks broken even if Docker Desktop is running."
    yellow "Fix: Docker Desktop → Settings → Resources → WSL Integration → toggle Ubuntu off/on → Apply & Restart."
    yellow "Or: Quit Docker Desktop → in PowerShell run: wsl --shutdown → start Docker Desktop again."
    exit 1
  fi
  export DOCKER_HOST

  if ! run_with_timeout 8 docker info >/dev/null 2>&1; then
    red "Docker engine is not responding (timed out or unhealthy)."
    yellow "Do not run supabase start until \`docker ps\` works. Restart Docker Desktop / WSL if needed."
    exit 1
  fi
}

# npm 7+ `npx supabase` prompts "Ok to proceed?" when the CLI is not a
# project dependency. That prompt is invisible when stdout/stderr are
# redirected, so `npm run dev` looks hung. --yes skips the prompt.
supabase_cli() {
  npx --yes supabase "$@"
}

apply_pending_migrations() {
  yellow "Applying pending local migrations (supabase migration up)..."
  if supabase_cli migration up; then
    green "Local migrations up to date."
  else
    red "Failed to apply local migrations."
    yellow "Fix the SQL or run \`npm run db:reset\` for a clean local DB (wipes data + reseeds)."
    exit 1
  fi
}

if api_already_up; then
  green "Local Supabase already reachable on :54321 - skipping start."
  # Stack is healthy enough to migrate even if `docker info` is flaky.
  if host="$(resolve_docker_host 2>/dev/null)"; then
    export DOCKER_HOST="$host"
  fi
  apply_pending_migrations
  exit 0
fi

ensure_docker

if supabase_cli status >/dev/null 2>&1; then
  green "Local Supabase already running - skipping start."
  apply_pending_migrations
  exit 0
fi

green "Docker healthy - starting local Supabase..."
yellow "First start can take several minutes while Docker images are pulled."
supabase_cli start
apply_pending_migrations
