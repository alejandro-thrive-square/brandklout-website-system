// Compare Instatic's two published slots on the container: the publish that just ran against the
// one before it. Every page HTML must be identical once the per-publish script-folder id
// (/_instatic/assets/<21-char id>/) is masked, and each page's script files must be identical too.
//
//   [STRIP='<exact html>'] node .tmp/terms/slots-diff.mjs   # staging; PROMOTE=production INSTATIC_BASE_URL=... for production
import { ssh } from "../railway-ssh.mjs";

const script = String.raw`
cd /app/storage/uploads/published
# newest slot = the one whose index.html is newer
if [ b/index.html -nt a/index.html ]; then NEW=b; OLD=a; else NEW=a; OLD=b; fi
echo "new=$NEW old=$OLD"
mask() { sed -E 's#_instatic/assets/[A-Za-z0-9_-]{21}/#_instatic/assets/X/#g; s#embed-origins\.embed\.js\?v=[0-9]+#embed-origins.embed.js?v=N#g' "$1"; }
# STRIP: one exact string expected in every NEW page, removed once before comparing.
STRIP='__STRIP__'
# (no python on the container) A page must hold STRIP exactly once, or it is left as is and so differs.
strip() { if [ -n "$STRIP" ] && [ "$(grep -oF "$STRIP" "$1" | wc -l)" = 1 ]; then sed "s#$STRIP##" "$1"; else cat "$1"; fi; }
n=0; same=0; diffs=""
for f in $(cd $OLD && find . -name '*.html' | sort); do
  n=$((n+1))
  if [ "$(mask $OLD/$f | sha256sum)" = "$(strip $NEW/$f > /tmp/terms1003-s.html; mask /tmp/terms1003-s.html | sha256sum)" ]; then same=$((same+1)); else diffs="$diffs $f"; fi
done
echo "html: $same/$n identical (masked)"; [ -n "$diffs" ] && echo "DIFF:$diffs"
echo "new only: $(cd $NEW && find . -name '*.html' | sort | while read f; do [ -e ../$OLD/$f ] || printf '%s ' $f; done)"
# script bundles: concatenated content per page, folder id ignored
sd=0
for f in $(cd $OLD && find . -name '*.html' | sort); do
  a=$(grep -oE '_instatic/assets/[A-Za-z0-9_-]{21}/[^"]+' $OLD/$f | while read p; do cat "$OLD/$p"; done | sha256sum)
  b=$(grep -oE '_instatic/assets/[A-Za-z0-9_-]{21}/[^"]+' $NEW/$f | while read p; do cat "$NEW/$p"; done | sha256sum)
  [ "$a" = "$b" ] || { sd=$((sd+1)); echo "SCRIPT DIFF $f"; }
done
echo "scripts: $sd page(s) differ"
diff -rq $OLD/_instatic/css $NEW/_instatic/css && echo "css: identical"
`;
const b64 = Buffer.from(script.replace("__STRIP__", (process.env.STRIP || "").replace(/'/g, ""))).toString("base64");
ssh(`rm -f /tmp/terms1003-slots.sh /tmp/terms1003-slots.b64`);
for (let i = 0; i < b64.length; i += 7000) ssh(`printf '%s' '${b64.slice(i, i + 7000)}' >> /tmp/terms1003-slots.b64`);
console.log(ssh(`base64 -d /tmp/terms1003-slots.b64 > /tmp/terms1003-slots.sh && rm /tmp/terms1003-slots.b64 && bash /tmp/terms1003-slots.sh; rm -f /tmp/terms1003-slots.sh`, 2));
