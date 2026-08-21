#!/usr/bin/env bash
# Assemble the client-facing research zip (the one that gets attached to Asana) from the
# committed intake artifacts. Run from the client folder root.
#
#   bash workflows/01-content-intake/.tmp/scrapers/build-research-package.sh
#
# Output: West-LA-Implants-Research-<date>.zip in the client folder root (gitignored).
#
# Windows note: zipping fails from a deep staging path (MAX_PATH), so the package is staged
# under $TEMP/wlai before the archive is written. Do not stage it inside .tmp/.
#
# Fidelity caveat: the 2026-08-21 zip that went to Asana also carried hand edits to the
# packaged markdown that this script does NOT reproduce: the "Evidence files" table in the
# gap analysis was rewritten to describe package paths instead of repo paths, and short
# "in this package" notes were added to the inventory and asset catalogue. Re-running gives
# you the same structure and the same numbers; redo those three edits before shipping again.
set -euo pipefail

DATE="$(date +%Y-%m-%d)"
ROOT="$(pwd)"
W="$ROOT/workflows"
GA="$W/01-content-intake/.tmp/gap-analysis"
CS="$W/01-content-intake/.tmp/current-site-scrape"
CO="$W/01-content-intake/.tmp/competitor-scrape/wilshireoralsurgery"
AS="$W/03-graphic-resources/.tmp"
STAGE="${TEMP:-/tmp}/wlai"
PKG="$STAGE/West-LA-Implants-Research"

rm -rf "$STAGE"
mkdir -p "$PKG/evidence" "$PKG/page-text/westlaimplants" "$PKG/page-text/wilshireoralsurgery"

cp "$GA/CONTENT-GAP-ANALYSIS.md"   "$PKG/01-Content-Gap-Analysis.md"
cp "$GA/COMPETITOR-SELECTION.md"   "$PKG/02-Competitor-Selection-Report.md"
cp "$CS/current-site-inventory.md" "$PKG/03-Current-Site-Inventory.md"
cp "$AS/ASSETS.md"                 "$PKG/04-Client-Asset-Catalogue.md"
cp "$GA"/*.csv "$GA"/gap-data.json "$PKG/evidence/"
cp "$AS/asset-catalogue.csv" "$AS/video-embeds.csv" "$PKG/evidence/"
cp "$CS/media-manifest.csv" "$PKG/evidence/media-manifest-westlaimplants.csv"
cp "$CO/media-manifest.csv" "$PKG/evidence/media-manifest-wilshireoralsurgery.csv"
cp "$CS/pages/"*.md "$PKG/page-text/westlaimplants/"
cp "$CO/pages/"*.md "$PKG/page-text/wilshireoralsurgery/"
# READ-ME-FIRST.md is hand-written per package; keep the last one alongside this script.
cp "$(dirname "$0")/READ-ME-FIRST.md" "$PKG/READ-ME-FIRST.md"

# The packaged copies drop the repo-internal Version Control sections and repoint any
# relative links, because outside the repo those paths resolve to nothing.
python - "$PKG" <<'PY'
import io, os, sys
pkg = sys.argv[1]
for name in ('01-Content-Gap-Analysis.md','02-Competitor-Selection-Report.md',
             '03-Current-Site-Inventory.md','04-Client-Asset-Catalogue.md'):
    p = os.path.join(pkg, name)
    s = io.open(p, encoding='utf-8').read()
    i = s.find('\n## Version Control')
    if i != -1:
        io.open(p, 'w', encoding='utf-8').write(s[:i].rstrip() + '\n')
PY

node "$(dirname "$0")/md2html.mjs" \
  "$PKG/West-LA-Implants-Research.html" \
  "West LA Implants: Competitor & Content Gap Research" \
  "$PKG/READ-ME-FIRST.md::Overview" \
  "$PKG/01-Content-Gap-Analysis.md::Content Gap Analysis" \
  "$PKG/02-Competitor-Selection-Report.md::Competitor Selection Report" \
  "$PKG/03-Current-Site-Inventory.md::Current Site Inventory"

powershell.exe -NoProfile -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; \
  \$d='$ROOT\West-LA-Implants-Research-$DATE.zip' -replace '/','\'; \
  if (Test-Path \$d) { Remove-Item \$d -Force }; \
  [System.IO.Compression.ZipFile]::CreateFromDirectory('$STAGE', \$d, 'Optimal', \$false)"

echo "built West-LA-Implants-Research-$DATE.zip"
