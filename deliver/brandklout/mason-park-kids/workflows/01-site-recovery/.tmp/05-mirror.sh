#!/usr/bin/env bash
# Step 5: fetch an offline copy of the site, ON the server.
#
# WHY NOT A TUNNEL
# ----------------
# The first plan was `ssh -L` into a loopback `wp server` and drive Chrome
# through it. SiteGround refuses: every forwarded channel comes back
# "administratively prohibited" (AllowTcpForwarding is off). So the render and
# the fetch both happen on the box and only finished files travel back.
#
# HOW THE URLs ARE MADE LOCAL WITHOUT TOUCHING THE SITE
# -----------------------------------------------------
# WordPress emits absolute https://pediatricdentistkatytx.com URLs everywhere,
# which would send wget out to the public internet and straight into the
# SiteGround redirect. WP_HOME and WP_SITEURL fix that: WordPress only falls
# back to the database options when those constants are undefined, and
# wp-config.php does not define them. They are set in an auto_prepend_file
# reached through PHP_INI_SCAN_DIR — an environment variable, so it applies to
# this one php process and the live site never sees it. The site's files and
# database are never modified and nothing is written outside ~/recovery-tmp.
#
# WHAT IS DELIBERATELY *NOT* DONE HERE
# ------------------------------------
# An earlier version also registered an ob_start() filter to rewrite the
# leftover hardcoded URLs into root-relative ones. Do not put it back. It fires
# only while a page-cache drop-in happens to be flushing the buffer chain, so
# the moment WP_CACHE was set to false it silently stopped running — and the
# symptom was not "URLs unrewritten", it was 39 of 40 pages screenshotting as
# blank 749px stubs, because Chrome blocks parsing on a <script src> it cannot
# fetch. URL rewriting now happens locally in 06-sanitize.mjs, where it is
# deterministic and inspectable. This script's job is to fetch bytes.
#
#   bash 05-mirror.sh [--posts]      # --posts also mirrors the 157 blog posts
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WANT_POSTS="no"
[ "${1:-}" = "--posts" ] && WANT_POSTS="yes"

bash "$HERE/sg.sh" "WANT_POSTS=$WANT_POSTS bash -s" <<'REMOTE' | tee "$HERE/mirror.log"
set -u
# A FRESH PORT EVERY RUN, deliberately. SiteGround's SSH jail restricts ps, so a
# wp server left over from a previous run is invisible to both `ps` and `pkill`
# yet still holds its port. The new server then silently fails to bind while
# curl happily talks to the OLD one, still carrying the OLD configuration —
# which produced two identical, entirely misleading verification readings.
PORT=$(( 19000 + (RANDOM % 2000) ))
BASE="http://127.0.0.1:$PORT"
echo "using port $PORT"
R=~/www/pediatricdentistkatytx.com/public_html
T=~/recovery-tmp
mkdir -p "$T/ini" "$T/mirror"

# ---------------------------------------------------------------- the override
cat > "$T/ini/override.php" <<'PHP'
<?php
// Scoped to the recovery web server only, via PHP_INI_SCAN_DIR. Never loaded by
// the live site.
define('WP_HOME',    '__BASE__');
define('WP_SITEURL', '__BASE__');

// Cache off. WP Rocket and LiteSpeed are both active, and a cached page is
// written to disk before any of this applies, then replayed verbatim on every
// later request — so pages fetched during an earlier run come back unchanged no
// matter what is fixed in between. WP_CACHE=false is the one that matters:
// wp-settings.php only loads the advanced-cache.php drop-in when it is true, so
// this bypasses the page cache rather than trying to invalidate it. PHP keeps
// the FIRST definition of a constant and this file is prepended before
// wp-config.php, so ours wins.
define('WP_CACHE', false);
define('DONOTCACHEPAGE', true);
define('DONOTCACHEOBJECT', true);
define('DONOTCACHEDB', true);
define('LSCWP_DISABLE_ALL', true);
PHP

sed -i "s#__BASE__#$BASE#g" "$T/ini/override.php"

printf 'memory_limit=1536M\nmax_execution_time=180\nauto_prepend_file=%s/recovery-tmp/ini/override.php\n' \
  "$HOME" > "$T/ini/zz-recovery.ini"

# ------------------------------------------------------------------ the server
# memory_limit: the tooth-fairy theme's trx_addons blows the stock 256M just
# rendering the homepage, and every page 500s. PHP_INI_SCAN_DIR needs the
# LEADING COLON — that means "the normal ini directory first, then ours"; without
# it the default scan dir is replaced and every extension ini disappears with it.
# PHP_CLI_SERVER_WORKERS: the built-in server is single-threaded, so without it
# every asset queues behind the document.
cd "$R"
export PHP_INI_SCAN_DIR=":$HOME/recovery-tmp/ini"
PHP_CLI_SERVER_WORKERS=6 nohup wp server --host=127.0.0.1 --port=$PORT --docroot="$PWD" \
  > "$T/srv.log" 2>&1 &
SRV=$!
echo "wp server pid $SRV, waiting for it to answer…"
CODE=000
for i in $(seq 1 40); do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 60 "$BASE/" || echo 000)
  [ "$CODE" = "200" ] && { echo "  ready (http $CODE)"; break; }
  sleep 3
done
[ "$CODE" = "200" ] || { echo "server never returned 200 (last: $CODE)"; tail -20 "$T/srv.log"; exit 1; }

echo
echo "=== sanity: are the constants actually in effect? ==="
curl -s --max-time 90 "$BASE/about-us/" > /tmp/chk.html
echo "  page bytes            : $(wc -c < /tmp/chk.html)"
echo "  our base ($BASE): $(grep -o "127\.0\.0\.1:$PORT" /tmp/chk.html | wc -l)"
echo "  live-domain leftovers : $(grep -o 'pediatricdentistkatytx\.com' /tmp/chk.html | wc -l)"
echo "  (leftovers are expected here and are fixed locally by 06-sanitize.mjs)"

# ------------------------------------------------------------------- url list
sed "s#https\?://\(www\.\)\?pediatricdentistkatytx\.com#$BASE#" \
  "$T/urls-pages.txt" > "$T/mirror-urls.txt"
if [ "${WANT_POSTS:-no}" = "yes" ]; then
  sed "s#https\?://\(www\.\)\?pediatricdentistkatytx\.com#$BASE#" \
    "$T/urls-posts.txt" >> "$T/mirror-urls.txt"
fi
echo
echo "=== mirroring $(wc -l < "$T/mirror-urls.txt") page URLs (HTML only) ==="

# HTML ONLY — no --page-requisites, and that is not a saving, it is a necessity.
# WordPress emits its ASSET urls port-less (src="http://127.0.0.1/wp-includes/…")
# even though WP_HOME carries the port, because something in this stack rebuilds
# them from SERVER_NAME. wget therefore tries port 80, nothing listens there
# inside the jail, and it gives up after two "errno=111" lines having fetched not
# one stylesheet. Assets are collected instead by 07-assets.mjs, which reads the
# paths out of the sanitised HTML and copies those exact files off the disk over
# SSH — no HTTP, no PHP, and an explicit refusal to transfer executable files.
#
# --force-directories is required once --page-requisites is gone. Without any
# recursion flag wget stops building a path tree and writes every URL into the
# current directory by basename — so all 40 pages land as index.html, index.html.1,
# index.html.2 … and the site structure is lost.
#
# Deliberately NO --convert-links and NO --restrict-file-names=windows either:
# between them they drop the :PORT from every absolute link they rewrite.
cd "$T/mirror"
rm -f "$T/wget.log"
wget \
  --input-file="$T/mirror-urls.txt" \
  --adjust-extension \
  --force-directories \
  --no-host-directories \
  --timeout=60 --tries=2 --waitretry=2 \
  --reject-regex '(wp-admin|wp-login|/feed/|\?s=|action=)' \
  -e robots=off \
  --no-verbose \
  --append-output="$T/wget.log" || true

# wget saves "jquery.min.js?ver=3.7.1" as a literal filename. '?' cannot exist in
# a Windows path, so the tarball would refuse to extract at the other end.
echo
echo "=== stripping query strings from saved filenames ==="
find . -name '*[?]*' -type f | while read -r f; do
  n="${f%%\?*}"
  if [ "$f" != "$n" ]; then
    if [ -e "$n" ]; then rm -f "$f"; else mv "$f" "$n"; fi
  fi
done
echo "  files still holding an illegal character: $(find . -name '*[?:*<>|]*' | wc -l)"

echo
echo "=== mirror result ==="
du -sh "$T/mirror"
echo "files: $(find "$T/mirror" -type f | wc -l)"
echo "html:  $(find "$T/mirror" -name '*.html' -type f | wc -l)"
find "$T/mirror" -type f | sed 's/.*\.//' | tr 'A-Z' 'a-z' | sort | uniq -c | sort -rn | head -15

echo
echo "=== per-page fetch check (every page must have real content) ==="
SMALL=0
for f in $(find "$T/mirror" -name '*.html'); do
  SZ=$(wc -c < "$f")
  if [ "$SZ" -lt 50000 ]; then echo "  THIN  ${f#$T/mirror/}  $SZ bytes"; SMALL=$((SMALL+1)); fi
done
[ "$SMALL" = "0" ] && echo "  all $(find "$T/mirror" -name '*.html' | wc -l) pages look fully rendered"

echo "--- wget errors (last 10) ---"
grep -iE "ERROR|failed|404" "$T/wget.log" 2>/dev/null | tail -10 || echo "(none)"

kill $SRV 2>/dev/null || true
echo
echo "=== packing ==="
cd "$T"
rm -f mirror.tar.gz
tar czf mirror.tar.gz mirror
ls -lh mirror.tar.gz
echo "=================== DONE ==================="
REMOTE
