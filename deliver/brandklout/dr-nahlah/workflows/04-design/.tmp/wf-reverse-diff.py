"""What the PUBLISHED Webflow site says that the local package does not.

`webflow-parity.mjs` only reports one direction — local lines with no published
counterpart — because it was written when Webflow was always the source of
truth. That assumption no longer holds: the local package is ahead on the
2026-08-18 client corrections while Webflow is ahead on whatever the user last
edited in the Designer. Both directions matter now, so this is the other half.

Same extraction rules as compare-instatic.py, and the same two traps:
comments are stripped BEFORE script/style, and inline tags do not break a line.

Usage: python wf-reverse-diff.py <dir-of-fetched-webflow-html>
"""
import io, os, re, sys, html as htmlmod

HERE = os.path.dirname(os.path.abspath(__file__))
LOCAL = os.path.join(HERE, 'final-site')
WF = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, '.parity')

BLOCK = re.compile(
    r'</?(p|div|section|main|ul|ol|li|h[1-6]|br|table|td|th|tr|dl|dt|dd|figure|figcaption'
    r'|summary|details|button|label|option|blockquote|nav|header|footer|aside|form|article'
    r')\b[^>]*>', re.I)


def prose(h):
    h = re.sub(r'<!--.*?-->', ' ', h, flags=re.S)
    h = re.sub(r'<(script|style)\b.*?</\1>', ' ', h, flags=re.S | re.I)
    h = re.sub(r'<title\b.*?</title>', ' ', h, flags=re.S | re.I)
    h = BLOCK.sub('\x00', h)
    h = re.sub(r'<[^>]+>', '', h)
    h = htmlmod.unescape(h)
    return [t for t in (re.sub(r'\s+', ' ', s).strip() for s in h.split('\x00')) if len(t) > 3]


def norm(s):
    return re.sub(r'[^a-z0-9]', '', s.lower())


report = []
for f in sorted(os.listdir(WF)):
    if not f.endswith('.html'):
        continue
    slug = f[:-5]
    lf = os.path.join(LOCAL, f)
    if not os.path.exists(lf):
        report.append(f'=== {slug}: NO LOCAL FILE')
        continue
    w = prose(io.open(os.path.join(WF, f), encoding='utf-8').read())
    l = prose(io.open(lf, encoding='utf-8').read())
    L = {norm(x) for x in l if norm(x)}
    only_wf = [x for x in w if norm(x) and norm(x) not in L]
    if only_wf:
        report.append('')
        report.append(f'=== {slug}   ({len(only_wf)} published-only)')
        for x in only_wf:
            report.append('  WF  ' + x)

io.open(os.path.join(HERE, 'wf-reverse-diff.txt'), 'w', encoding='utf-8').write('\n'.join(report))
print(f'wrote wf-reverse-diff.txt ({len(report)} lines)')
