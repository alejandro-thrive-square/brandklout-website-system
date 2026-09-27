#!/usr/bin/env bash
# Step 1 of the pediatricdentistkatytx.com recovery: look, touch nothing.
#
# This is READ-ONLY on the server by design. Nothing is created, moved or
# deleted; the site is a live (if redirected) production install on a host we do
# not control, and the first thing we need is a map, not a change.
#
# It answers: where is the docroot, is WordPress still on disk, how big is it,
# what theme and plugins built the pages, which database does it use, and where
# is the redirect that swallows every URL coming from.
#
#   bash 01-inventory.sh            # prints, and saves to inventory.txt
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Everything below runs on the server in one round trip. Quoted heredoc: nothing
# is expanded locally, which matters because Git Bash mangles unquoted ones.
bash "$HERE/sg.sh" 'bash -s' <<'REMOTE' | tee "$HERE/inventory.txt"
set -u
echo "=================== WHOAMI / HOST ==================="
id 2>/dev/null || true
hostname 2>/dev/null || true
pwd
echo
echo "=================== DISK ==================="
df -h . 2>/dev/null || true
echo
echo "=================== HOME LAYOUT ==================="
ls -la ~ 2>/dev/null || true
echo
echo "=================== SITE DIRECTORIES ==================="
# SiteGround lays sites out as ~/www/<domain>/public_html
for d in ~/www/*/ ; do
  [ -d "$d" ] || continue
  echo "--- $d"
  ls -la "$d" 2>/dev/null | head -20
done
echo
echo "=================== DOCROOTS FOUND ==================="
find ~/www -maxdepth 3 -name public_html -type d 2>/dev/null || true
echo
echo "=================== WORDPRESS INSTALLS ==================="
find ~/www -maxdepth 4 -name wp-config.php 2>/dev/null || true
echo
echo "=================== PER-DOCROOT DETAIL ==================="
for ROOT in $(find ~/www -maxdepth 3 -name public_html -type d 2>/dev/null); do
  echo "############ $ROOT"
  echo "-- size:"
  du -sh "$ROOT" 2>/dev/null || true
  echo "-- top level:"
  ls -la "$ROOT" 2>/dev/null | head -40
  echo "-- WP version:"
  grep -h "wp_version =" "$ROOT/wp-includes/version.php" 2>/dev/null || echo "   (no wp-includes/version.php)"
  echo "-- themes:"
  ls -1 "$ROOT/wp-content/themes" 2>/dev/null || echo "   (none)"
  echo "-- active theme + siteurl/home (from DB config, not the DB itself):"
  grep -hE "DB_NAME|DB_USER|DB_HOST|table_prefix" "$ROOT/wp-config.php" 2>/dev/null | sed 's/DB_PASSWORD.*/DB_PASSWORD <redacted>/' || true
  echo "-- plugins:"
  ls -1 "$ROOT/wp-content/plugins" 2>/dev/null || echo "   (none)"
  echo "-- uploads size + year folders:"
  du -sh "$ROOT/wp-content/uploads" 2>/dev/null || true
  ls -1 "$ROOT/wp-content/uploads" 2>/dev/null | head -20
  echo "-- uploads file count:"
  find "$ROOT/wp-content/uploads" -type f 2>/dev/null | wc -l
  echo "-- .htaccess (this is where a blanket redirect usually lives):"
  cat "$ROOT/.htaccess" 2>/dev/null | head -60 || echo "   (no .htaccess)"
  echo "-- redirect-ish plugins/mu-plugins:"
  ls -1 "$ROOT/wp-content/mu-plugins" 2>/dev/null || echo "   (no mu-plugins)"
  echo
done
echo "=================== NGINX / SG CONFIG VISIBLE TO US ==================="
ls -la ~/nginx.conf ~/www/*/nginx.conf 2>/dev/null || echo "(none readable)"
echo
echo "=================== TOOLING AVAILABLE ==================="
for c in wp mysql mysqldump php tar gzip zip rsync; do
  printf "%-10s " "$c"; command -v "$c" 2>/dev/null || echo "(missing)"
done
php -v 2>/dev/null | head -1 || true
echo
echo "=================== DONE ==================="
REMOTE
