# rebuild.ps1 — regenerate one page's whole build chain from its design package.
#   .\rebuild.ps1 implant | cosmetic | thank-you
# Vocabulary is shared, so regenerate the raw payloads for ALL pages first
# (.\rebuild.ps1 vocab) whenever the converter itself changed.
param([Parameter(Mandatory = $true)][string]$Page)

# 'Continue', not 'Stop': the converter writes informational notes to stderr
# ("embedded unsupported tags as HtmlEmbed: …") and Stop turns those into a
# fatal NativeCommandError. Real failures are caught by $LASTEXITCODE below.
$ErrorActionPreference = 'Continue'
function Assert-Ok($what) { if ($LASTEXITCODE -ne 0) { throw "$what failed (exit $LASTEXITCODE)" } }
$dirs = @{ implant = 'implant-landing-page'; cosmetic = 'cosmetic-landing-page'; 'thank-you' = 'thank-you-landing-page' }
$pfx = @{ implant = 'imp'; cosmetic = 'cos'; 'thank-you' = 'ty' }
$d = '..\04-design\.tmp'

function Build-Css($p) {
  $css = [IO.File]::ReadAllText("$PWD\$d\$($dirs[$p])\assets\kit.css") + "`n`n" +
  [IO.File]::ReadAllText("$PWD\$d\$($dirs[$p])\styles.css")
  [IO.File]::WriteAllText("$PWD\.tmp\_css\$p.css", $css, [Text.UTF8Encoding]::new($false))
  node expand_type_tier.mjs ".tmp\_css\$p.css" ".tmp\_css\$p.tier.css"
}

if ($Page -eq 'vocab') {
  foreach ($p in $dirs.Keys) {
    Build-Css $p
    python html_to_webflow_wholepage.py --html "$d\$($dirs[$p])\index.html" --css ".tmp\_css\$p.tier.css" `
      --wrap --wrap-class "$($pfx[$p])-page" --page-prefix $pfx[$p] --out ".tmp\_raw\$p" | Select-String 'whole page'
  }
  python build_vocab.py --sources .tmp\build-sources.json --raw-dir .tmp\_raw --out .tmp\style-vocabulary.json |
  Select-String 'RESOLVED|PENDING'
  exit 0
}

$p = $Page
Build-Css $p
python html_to_webflow_wholepage.py --html "$d\$($dirs[$p])\index.html" --css ".tmp\_css\$p.tier.css" `
  --wrap --wrap-class "$($pfx[$p])-page" --page-prefix $pfx[$p] --vocab .tmp\style-vocabulary.json `
  --out ".tmp\$p" | Select-String 'whole page'
node resolve_wholepage.mjs ".tmp\$p\paste_00_full-page.html" ".tmp\$p\resolved" | Select-String 'merged|CSS functions'
node gm_rebind.mjs ".tmp\$p\resolved.json" .tmp\asset-map.json ".tmp\$p\final.json"
python ..\..\..\..\process\07-webflow-build\make_paste_page.py --payload ".tmp\$p\final.json" `
  --out ".tmp\$p\PASTE-full-page.html" | Select-String 'wrote|round-trips'
Copy-Item ".tmp\$p\PASTE-full-page.html" ".tmp\PASTE-THESE\$p-FULL-PAGE.html" -Force
python payload_to_whtml.py --payload ".tmp\$p\PASTE-full-page.html" --out ".tmp\$p\whtml" `
  --prefix $pfx[$p] --box-class gm-box --asset-map .tmp\asset-map-flat.json --source ".tmp\_css\$p.tier.css" |
Select-String 'nodes|chunks|largest|embeds_kept|unresolved'
