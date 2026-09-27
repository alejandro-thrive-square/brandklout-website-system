#!/usr/bin/env bash
# Step 2: where does the blanket redirect come from, what tooling do we have, and
# what is on this disk that should not be. Still READ-ONLY — nothing is created,
# moved or deleted.
#
# Three questions, in the order they matter for the recovery:
#
#   1. TOOLING  — is mysqldump/wp-cli/tar there? That decides how we pull content.
#   2. REDIRECT — the whole site collapses onto the Railway URL. If that rule is in
#      .htaccess or wp_options, lifting it briefly would let us crawl the real site
#      with the workflow-09 harness, which is far better fidelity than anything we
#      can reconstruct from Elementor JSON.
#   3. INTEGRITY — this host shared a server with the compromised main site, and the
#      plugin list has names with random hex suffixes, which is a known malware
#      pattern. We need to know what we are about to download.
#
#   bash 02-triage.sh          # prints, and saves to triage.txt
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

bash "$HERE/sg.sh" 'bash -s' <<'REMOTE' | tee "$HERE/triage.txt"
set -u
ROOT=~/www/pediatricdentistkatytx.com/public_html
cd "$ROOT" || exit 1

echo "=================== 1. TOOLING ==================="
for c in wp mysql mysqldump php tar gzip zip rsync curl; do
  printf "%-10s " "$c"; command -v "$c" 2>/dev/null || echo "(missing)"
done
php -v 2>/dev/null | head -1 || true
echo

echo "=================== 2a. REDIRECT RULES IN .htaccess ==================="
grep -nEi "redirect|rewriterule|rewritecond|railway" .htaccess 2>/dev/null || echo "(no redirect directives in .htaccess)"
echo
echo "--- .htaccess.bk (the pre-change backup) ---"
grep -nEi "redirect|rewriterule|railway" .htaccess.bk 2>/dev/null || echo "(none)"
echo

echo "=================== 2b. siteurl / home IN THE DATABASE ==================="
# wp-cli is the clean read; fall back to mysql with creds pulled from wp-config.
if command -v wp >/dev/null 2>&1; then
  wp option get siteurl --skip-plugins --skip-themes 2>/dev/null || echo "(wp option get siteurl failed)"
  wp option get home    --skip-plugins --skip-themes 2>/dev/null || echo "(wp option get home failed)"
  echo "--- active theme ---"
  wp option get template --skip-plugins --skip-themes 2>/dev/null || true
  wp option get stylesheet --skip-plugins --skip-themes 2>/dev/null || true
  echo "--- counts ---"
  wp post list --post_type=page   --post_status=publish --format=count --skip-plugins --skip-themes 2>/dev/null || true
  wp post list --post_type=post   --post_status=publish --format=count --skip-plugins --skip-themes 2>/dev/null || true
  wp post list --post_type=attachment --format=count --skip-plugins --skip-themes 2>/dev/null || true
else
  echo "(no wp-cli; reading with mysql)"
  DBN=$(sed -n "s/.*DB_NAME'[^']*'\([^']*\)'.*/\1/p" wp-config.php)
  DBU=$(sed -n "s/.*DB_USER'[^']*'\([^']*\)'.*/\1/p" wp-config.php)
  DBP=$(sed -n "s/.*DB_PASSWORD'[^']*'\([^']*\)'.*/\1/p" wp-config.php)
  mysql -u"$DBU" -p"$DBP" "$DBN" -N -e \
    "SELECT option_name, LEFT(option_value,120) FROM wp_options WHERE option_name IN ('siteurl','home','template','stylesheet');" 2>/dev/null \
    || echo "(mysql read failed)"
fi
echo

echo "=================== 2c. REDIRECT PLUGINS, ACTIVE LIST ==================="
if command -v wp >/dev/null 2>&1; then
  wp plugin list --status=active --field=name --skip-plugins --skip-themes 2>/dev/null || echo "(wp plugin list failed)"
fi
echo
echo "--- all-404-redirect-to-homepage settings, if present ---"
ls -la wp-content/plugins/ | grep -i "404\|redirect" || echo "(no 404/redirect plugin dirs)"
echo

echo "=================== 3a. mu-plugins (auto-loaded, no activation needed) ==================="
for f in wp-content/mu-plugins/*.php; do
  [ -f "$f" ] || continue
  echo "--- $f  ($(stat -c '%s bytes, mtime %y' "$f" 2>/dev/null))"
  head -25 "$f"
  echo
done

echo "=================== 3b. PLUGINS WITH RANDOM-HEX SUFFIXES ==================="
# A trailing -<4 hex> on a plugin slug is not how the WordPress.org repo names things.
ls -1 wp-content/plugins | grep -E -- "-[0-9a-f]{4}(-[0-9a-f]{4})?$" || echo "(none)"
echo
for d in advanced-content-toolkit-d163 advanced-health-scanner-a415-e8c7 cloud-image-engine-c72e wp-health-engine-a96e; do
  [ -d "wp-content/plugins/$d" ] || continue
  echo "--- $d"
  ls -la "wp-content/plugins/$d" | head -12
  MAIN=$(ls -1 "wp-content/plugins/$d"/*.php 2>/dev/null | head -1)
  [ -n "$MAIN" ] && sed -n '1,20p' "$MAIN"
  echo
done

echo "=================== 3c. SUSPICIOUS FILES AT DOCROOT ==================="
echo "--- wp_auto_login_*.php (SiteGround makes these, but check the mtime) ---"
ls -la wp_auto_login_*.php 2>/dev/null || echo "(none)"
head -12 wp_auto_login_*.php 2>/dev/null || true
echo
echo "--- health-check drop-in inside uploads (uploads should hold no PHP at all) ---"
find wp-content/uploads -name "*.php" -type f 2>/dev/null | head -30
echo "--- total PHP files under uploads:"
find wp-content/uploads -name "*.php" -type f 2>/dev/null | wc -l
echo
echo "--- files changed in the last 3 days, outside uploads and cache ---"
find . -type f -mtime -3 -not -path "./wp-content/uploads/*" -not -path "./wp-content/cache/*" -not -path "./.tmb/*" 2>/dev/null | head -40
echo

echo "=================== 3d. php_errorlog TAIL (what is running right now) ==================="
tail -25 php_errorlog 2>/dev/null || echo "(no php_errorlog)"
echo

echo "=================== 4. BACKUPS ALREADY ON DISK ==================="
du -sh wp-content/uploads/backup 2>/dev/null || echo "(no uploads/backup)"
ls -la wp-content/uploads/backup 2>/dev/null | head -20
find . -maxdepth 3 -name "*.wpress" -o -maxdepth 3 -name "*.sql" -o -maxdepth 3 -name "*.sql.gz" 2>/dev/null | head -20
echo
echo "=================== DONE ==================="
REMOTE
