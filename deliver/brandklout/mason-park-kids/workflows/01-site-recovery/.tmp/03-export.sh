#!/usr/bin/env bash
# Step 3: get the content off the box, without executing any of the site's code.
#
# This writes ONLY into ~/recovery-tmp (our own home, never the docroot) and
# reads the site through wp-cli with --skip-plugins --skip-themes, so none of
# the four planted plugins or the mu-plugin backdoor load while we work.
#
# What it produces, on the server, for step 4 to pull down:
#
#   urls.txt        every published page and post URL, one per line — the crawl list
#   pages.csv       page inventory: ID, slug, title, template, parent, modified
#   posts.csv       the same for the 157 blog posts
#   media.csv       580 attachments with their real file paths and sizes
#   content.xml     full WXR export — the copy, verbatim, the way workflow 09 wanted it
#   options.txt     the theme/plugin settings a rebuild needs (menus, widgets, RankMath)
#   db.sql.gz       complete database dump, for anything the above misses
#
# Nothing here is destructive and nothing touches the live site. Re-running is safe.
#
#   bash 03-export.sh
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

bash "$HERE/sg.sh" 'bash -s' <<'REMOTE' | tee "$HERE/export.log"
set -u
R=~/www/pediatricdentistkatytx.com/public_html
OUT=~/recovery-tmp
mkdir -p "$OUT"
cd "$R" || exit 1

# --skip-plugins --skip-themes on EVERY call. The site has four planted plugins
# and a mu-plugin backdoor; there is no reason to load any of them to read rows
# out of the database.
WP="wp --skip-plugins --skip-themes"

echo "=================== URL LIST ==================="
$WP post list --post_type=page --post_status=publish --field=url > "$OUT/urls-pages.txt" 2>/dev/null || true
$WP post list --post_type=post --post_status=publish --field=url > "$OUT/urls-posts.txt" 2>/dev/null || true
cat "$OUT/urls-pages.txt" "$OUT/urls-posts.txt" > "$OUT/urls.txt" 2>/dev/null || true
echo "pages: $(wc -l < "$OUT/urls-pages.txt") posts: $(wc -l < "$OUT/urls-posts.txt") total: $(wc -l < "$OUT/urls.txt")"
echo
echo "--- the 40 pages ---"
cat "$OUT/urls-pages.txt"
echo

echo "=================== INVENTORIES ==================="
$WP post list --post_type=page --post_status=publish \
  --fields=ID,post_name,post_title,post_parent,post_modified,url --format=csv > "$OUT/pages.csv" 2>/dev/null || true
$WP post list --post_type=post --post_status=publish \
  --fields=ID,post_name,post_title,post_date,post_modified,url --format=csv > "$OUT/posts.csv" 2>/dev/null || true
$WP post list --post_type=attachment \
  --fields=ID,post_title,post_mime_type,guid --format=csv > "$OUT/media.csv" 2>/dev/null || true
wc -l "$OUT/pages.csv" "$OUT/posts.csv" "$OUT/media.csv" 2>/dev/null || true
echo

echo "=================== WXR CONTENT EXPORT ==================="
# One file, all post types. This is the verbatim copy the rebuild works from.
$WP export --dir="$OUT" --filename_format=content.xml --stdout > "$OUT/content.xml" 2>/dev/null \
  || $WP export --dir="$OUT" --filename_format=content.xml 2>/dev/null \
  || echo "(wp export failed; the DB dump below still carries everything)"
ls -la "$OUT"/*.xml 2>/dev/null || true
echo

echo "=================== SETTINGS A REBUILD NEEDS ==================="
{
  echo "### siteurl/home/theme"
  for o in siteurl home blogname blogdescription template stylesheet page_on_front show_on_front posts_per_page permalink_structure; do
    printf "%-22s " "$o"; $WP option get "$o" 2>/dev/null || echo "(unset)"
  done
  echo
  echo "### nav menus"
  $WP menu list --format=csv 2>/dev/null || true
  for M in $($WP menu list --field=slug 2>/dev/null); do
    echo "--- menu: $M"
    $WP menu item list "$M" --fields=type,title,link,parent,position --format=csv 2>/dev/null || true
  done
} > "$OUT/options.txt" 2>&1 || true
head -40 "$OUT/options.txt"
echo

echo "=================== DATABASE DUMP ==================="
$WP db export - 2>/dev/null | gzip -9 > "$OUT/db.sql.gz" || echo "(wp db export failed)"
ls -lh "$OUT/db.sql.gz" 2>/dev/null || true
echo

echo "=================== MEDIA MANIFEST (originals only, no thumbnails) ==================="
# 11,878 files on disk vs 580 attachments: the rest are generated size variants.
# The rebuild regenerates its own, so list the originals and let step 4 decide.
UP="$R/wp-content/uploads"
find "$UP" -type f \
  \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.gif" -o -iname "*.webp" -o -iname "*.svg" -o -iname "*.pdf" -o -iname "*.mp4" \) \
  -not -regex ".*-[0-9]+x[0-9]+\.[a-zA-Z]+$" \
  -not -path "*/backup/*" \
  -printf "%s\t%p\n" 2>/dev/null | sort -rn > "$OUT/media-originals.tsv" || true
echo "original media files: $(wc -l < "$OUT/media-originals.tsv")"
echo "total bytes: $(awk -F'\t' '{s+=$1} END {print s}' "$OUT/media-originals.tsv")"
echo "--- 15 largest ---"
head -15 "$OUT/media-originals.tsv"
echo

echo "=================== WHAT IS WAITING TO BE PULLED ==================="
du -sh "$OUT"
ls -la "$OUT"
echo "=================== DONE ==================="
REMOTE
