#!/usr/bin/env bash
# Deterministic end-to-end regeneration of the Mason Park pasteable-components
# build from the CURRENT design source. Run from 07-webflow-build/.
# Mirrors 07-webflow-build.md § Project Notes exactly. Source Asana GID 1217040406855582.
set -euo pipefail

D=../04-design/.tmp
CSS=$D/shared/mpd.css

echo "== 1. raws (no vocab, no avoid) =="
python html_to_webflow_wholepage.py --html $D/invisalign/index.html          --css $CSS --wrap --page-prefix inv --out .tmp/_raw/invisalign
python html_to_webflow_wholepage.py --html $D/new-patient-special/index.html --css $CSS --wrap --page-prefix nps --out .tmp/_raw/new-patient-special
python html_to_webflow_wholepage.py --html $D/thank-you/index.html           --css $CSS --wrap --page-prefix ty  --out .tmp/_raw/thank-you

echo "== 2. vocabulary =="
python build_vocab.py --sources .tmp/build-sources.json

echo "== 3. finals (vocab + avoid chain) =="
python html_to_webflow_wholepage.py --html $D/invisalign/index.html --css $CSS --wrap \
  --page-prefix inv --vocab .tmp/style-vocabulary.json --out .tmp/pc/invisalign
python html_to_webflow_wholepage.py --html $D/new-patient-special/index.html --css $CSS --wrap \
  --page-prefix nps --vocab .tmp/style-vocabulary.json \
  --avoid .tmp/pc/invisalign --avoid-suffix nps --out .tmp/pc/new-patient-special
python html_to_webflow_wholepage.py --html $D/thank-you/index.html --css $CSS --wrap \
  --page-prefix ty --vocab .tmp/style-vocabulary.json \
  --avoid .tmp/pc/invisalign,.tmp/pc/new-patient-special --avoid-suffix ty --out .tmp/pc/thank-you

echo "== 4. resolve + rebind per page =="
for p in invisalign new-patient-special thank-you; do
  node resolve_wholepage.mjs .tmp/pc/$p/paste_00_full-page.html .tmp/pc/$p/resolved
  node rebind_assets.mjs .tmp/pc/$p/resolved.json .tmp/asset-uploads.json .tmp/pc/$p/final.json
done

echo "== 5. post-processing passes =="
node fix_variant_fns.mjs .tmp/pc/invisalign/final.json .tmp/pc/new-patient-special/final.json .tmp/pc/thank-you/final.json
node bake_display_ladder.mjs .tmp/pc/invisalign/final.json .tmp/pc/new-patient-special/final.json .tmp/pc/thank-you/final.json
node gen_install_blocks.mjs

echo "== 6. paste pages =="
for p in invisalign new-patient-special thank-you; do
  python make_paste_page.py --payload .tmp/pc/$p/final.json --out .tmp/pc/$p/PASTE-full-page.html
done

echo "== 7. qa =="
python wf_tools.py qa .tmp/pc/invisalign
python wf_tools.py qa .tmp/pc/new-patient-special --against .tmp/pc/invisalign
python wf_tools.py qa .tmp/pc/thank-you --against .tmp/pc/invisalign,.tmp/pc/new-patient-special

echo "== 8. section components =="
for p in invisalign new-patient-special thank-you; do
  EMIT_SHELL=1 node extract_section_components.mjs .tmp/pc/$p $p .tmp/components
done
# extract_section_components writes final.json only; every component's paste page
# must be rebuilt from it or PASTE.html silently keeps the previous build's payload
# (check_components only compares node COUNT, which survives a content change).
for c in .tmp/components/*/*/; do
  python make_paste_page.py --payload "${c}final.json" --out "${c}PASTE.html" > /dev/null
done
node gen_component_docs.mjs
node check_components.mjs .tmp/components

echo "== 9. simulate paste =="
for p in invisalign new-patient-special thank-you; do
  node simulate_paste.mjs .tmp/pc/$p/final.json .tmp/pc/$p $D/shared/img
done

echo "== rebuild complete =="
