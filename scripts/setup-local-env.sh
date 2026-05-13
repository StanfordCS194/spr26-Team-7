#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
MOBILE_DIR="$ROOT_DIR/mobile"
SERVER_DIR="$ROOT_DIR/server"
MOBILE_ENV="$MOBILE_DIR/.env"
MOBILE_SHARED="$MOBILE_DIR/.env.shared"
MOBILE_EXAMPLE="$MOBILE_DIR/.env.example"
SERVER_ENV="$SERVER_DIR/.env"
SERVER_EXAMPLE="$SERVER_DIR/.env.example"

copy_if_missing() {
  local target="$1"
  local source="$2"

  if [[ -f "$target" ]]; then
    echo "Keeping existing $(basename "$target")"
    return
  fi

  if [[ ! -f "$source" ]]; then
    echo "Missing template: $source"
    return
  fi

  cp "$source" "$target"
  echo "Created $(basename "$target") from $(basename "$source")"
}

copy_if_missing "$MOBILE_ENV" "$MOBILE_SHARED"
if [[ ! -f "$MOBILE_ENV" ]]; then
  copy_if_missing "$MOBILE_ENV" "$MOBILE_EXAMPLE"
fi

copy_if_missing "$SERVER_ENV" "$SERVER_EXAMPLE"

if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
  repo="$(gh repo view --json nameWithOwner --jq .nameWithOwner 2>/dev/null || true)"
  if [[ -n "$repo" ]]; then
    tmp="$(mktemp)"
    {
      url="$(gh variable get EXPO_PUBLIC_SUPABASE_URL --repo "$repo" 2>/dev/null || true)"
      key="$(gh variable get EXPO_PUBLIC_SUPABASE_ANON_KEY --repo "$repo" 2>/dev/null || true)"
      api="$(gh variable get EXPO_PUBLIC_REPORT_API_URL --repo "$repo" 2>/dev/null || true)"
      if [[ -n "$url" ]]; then
        echo "EXPO_PUBLIC_SUPABASE_URL=$url"
      fi
      if [[ -n "$key" ]]; then
        echo "EXPO_PUBLIC_SUPABASE_ANON_KEY=$key"
      fi
      if [[ -n "$api" ]]; then
        echo "EXPO_PUBLIC_REPORT_API_URL=$api"
      fi
    } >"$tmp"

    if [[ -s "$tmp" ]]; then
      if [[ ! -f "$MOBILE_ENV" ]]; then
        cat "$tmp" >"$MOBILE_ENV"
        echo "Created mobile/.env from GitHub Actions variables"
      else
        echo "GitHub Actions variables are available, but mobile/.env already exists"
      fi
    fi
    rm -f "$tmp"
  fi
fi

cat <<EOF

Local env setup is ready.

Next steps:
  cd mobile
  npm install
  npx expo start --clear

If you test on a physical phone, set EXPO_PUBLIC_REPORT_API_URL in mobile/.env to your computer's LAN IP and port 3001.
For report email, fill in server/.env from server/.env.example and run the server separately.

EOF
