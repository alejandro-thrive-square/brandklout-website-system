#!/usr/bin/env bash
# Export a WordPress site's content over SSH WITHOUT running any of its code: URL list, page/post/
# media inventories, a full WXR export, the settings a rebuild needs, a DB dump and the original
# media manifest. Everything is written to ~/recovery-tmp on the server; pull it down with scp.
#
# Origin: bk-mason-park-kids workflows/01-site-recovery/.tmp/sg.sh + 03-export.sh (2026-08-27,
# a compromised SiteGround host: 40 pages, 157 posts, 580 attachments recovered). Generalized
# 2026-09-23: host, user, port, key and docroot come from the environment and the argument.
#
#   WP_SSH_HOST=ssh.host.com WP_SSH_USER=u123 WP_SSH_PORT=18765 WP_SSH_KEY=~/.ssh/client_recovery \
#     bash wp-ssh-export.sh '~/www/old-site.com/public_html' > export.log
#   scp -P "$WP_SSH_PORT" -i "$WP_SSH_KEY" "$WP_SSH_USER@$WP_SSH_HOST:recovery-tmp/*" <client drive>/old-site/recovered/
#
# Rules:
#   - Every wp-cli call uses --skip-plugins --skip-themes: a planted plugin or mu-plugin backdoor
#     never loads while we read rows out of the database.
#   - Read-only on the site. Nothing outside ~/recovery-tmp is written. Never download PHP.
#   - Put the credentials in the client's section of ~/.webzite/.env, never on a command line in a
#     transcript. Generate a passphrase-less recovery key, add it in the host panel, revoke it after.
#   - db.sql.gz and content.xml carry credentials and PII: keep them out of git (the recovered/
#     folder is gitignored) and run scan-mirror.mjs on anything you render from them.
#   - SiteGround jails refuse `ssh -L` tunnels and hide `ps`: render pages ON the box (wp server on
#     a fresh random port each run), see the Mason Park Kids 05-mirror.sh listed in the README.
set -euo pipefail
: "${WP_SSH_HOST:?set WP_SSH_HOST}" "${WP_SSH_USER:?set WP_SSH_USER}" "${WP_SSH_PORT:=22}" "${WP_SSH_KEY:?set WP_SSH_KEY}"
DOCROOT="${1:?usage: bash wp-ssh-export.sh <remote docroot, e.g. ~/www/site.com/public_html>}"
chmod 600 "$WP_SSH_KEY" 2>/dev/null || true

ssh -i "$WP_SSH_KEY" -p "$WP_SSH_PORT" -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new \
  -o ConnectTimeout=20 -o BatchMode=yes "$WP_SSH_USER@$WP_SSH_HOST" "R=$DOCROOT bash -s" <<'REMOTE'
set -u
OUT=~/recovery-tmp
mkdir -p "$OUT"
cd "$(eval echo "$R")" || { echo "docroot not found: $R"; exit 1; }
WP="wp --skip-plugins --skip-themes"

echo "== URL LIST"
$WP post list --post_type=page --post_status=publish --field=url > "$OUT/urls-pages.txt" 2>/dev/null || true
$WP post list --post_type=post --post_status=publish --field=url > "$OUT/urls-posts.txt" 2>/dev/null || true
cat "$OUT/urls-pages.txt" "$OUT/urls-posts.txt" > "$OUT/urls.txt" 2>/dev/null || true
echo "pages: $(wc -l < "$OUT/urls-pages.txt") posts: $(wc -l < "$OUT/urls-posts.txt")"

echo "== INVENTORIES"
$WP post list --post_type=page --post_status=publish --fields=ID,post_name,post_title,post_parent,post_modified,url --format=csv > "$OUT/pages.csv" 2>/dev/null || true
$WP post list --post_type=post --post_status=publish --fields=ID,post_name,post_title,post_date,post_modified,url --format=csv > "$OUT/posts.csv" 2>/dev/null || true
$WP post list --post_type=attachment --fields=ID,post_title,post_mime_type,guid --format=csv > "$OUT/media.csv" 2>/dev/null || true
$WP plugin list --format=csv > "$OUT/plugins.csv" 2>/dev/null || true
wc -l "$OUT"/*.csv 2>/dev/null || true

echo "== WXR EXPORT"
$WP export --stdout > "$OUT/content.xml" 2>/dev/null || echo "(wp export failed; the DB dump still has everything)"
ls -la "$OUT/content.xml" 2>/dev/null || true

echo "== SETTINGS A REBUILD NEEDS"
{
  for o in siteurl home blogname blogdescription template stylesheet page_on_front show_on_front permalink_structure; do
    printf "%-22s " "$o"; $WP option get "$o" 2>/dev/null || echo "(unset)"
  done
  echo "### nav menus"
  $WP menu list --format=csv 2>/dev/null || true
  for M in $($WP menu list --field=slug 2>/dev/null); do
    echo "--- menu: $M"
    $WP menu item list "$M" --fields=type,title,link,parent,position --format=csv 2>/dev/null || true
  done
} > "$OUT/options.txt" 2>&1 || true

echo "== DATABASE DUMP"
$WP db export - 2>/dev/null | gzip -9 > "$OUT/db.sql.gz" || echo "(wp db export failed)"
ls -lh "$OUT/db.sql.gz" 2>/dev/null || true

echo "== MEDIA ORIGINALS (no size variants)"
find wp-content/uploads -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.gif" -o -iname "*.webp" -o -iname "*.svg" -o -iname "*.pdf" -o -iname "*.mp4" \) \
  -not -regex ".*-[0-9]+x[0-9]+\.[a-zA-Z]+$" -not -path "*/backup/*" -printf "%s\t%p\n" 2>/dev/null | sort -rn > "$OUT/media-originals.tsv" || true
echo "original media files: $(wc -l < "$OUT/media-originals.tsv")"

echo "== SUSPICIOUS FILES (report only; never download them)"
find wp-content/mu-plugins wp-content/plugins -maxdepth 2 -name "*.php" -newer wp-config.php -printf "%TY-%Tm-%Td %p\n" 2>/dev/null | head -40 || true
grep -rlE "eval\(base64_decode|gzinflate\(base64|str_rot13\(|\\\$_(POST|REQUEST)\[[^]]+\]\(" wp-content --include=*.php 2>/dev/null | head -40 || true

echo "== READY TO PULL"
du -sh "$OUT"; ls -la "$OUT"
REMOTE
