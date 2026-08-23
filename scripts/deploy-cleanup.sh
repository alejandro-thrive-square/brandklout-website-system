#!/usr/bin/env bash
set -euo pipefail

# Retired VPS-only paths that Git cannot remove because they may contain ignored files.
# Add entries only after their contents are migrated or intentionally discarded.
retired_paths=(
)

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

for path in "${retired_paths[@]}"; do
  case "$path" in
    ""|"/"|"."|".."|"../"*|"/"*)
      printf 'Refusing unsafe cleanup path: %s\n' "$path" >&2
      exit 1
      ;;
  esac

  if [[ -e "$path" ]]; then
    printf 'Removing retired path: %s\n' "$path"
    rm -rf -- "$path"
  else
    printf 'Retired path already absent: %s\n' "$path"
  fi
done
