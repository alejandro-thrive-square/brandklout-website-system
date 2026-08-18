"""Diff the prose of every Instatic page against the local built package.

Writes a full report to instatic-diff.txt and prints only the summary table,
because the Windows console cannot encode the arrows and dashes in the copy.

TWO EXTRACTION RULES THAT COST TIME WHEN GOT WRONG:

1. HTML comments are stripped BEFORE <script>/<style>. The page sources contain
   the literal words "<script>" and "<style>" inside comments, so stripping
   elements first lets a comment open a match that runs to the next real
   </script> and silently swallows ~10KB of prose (see webflow-parity.mjs).

2. Inline tags (span, b, strong, em, i, a) must NOT be treated as line breaks.
   The local build hard-wraps its source and marks phrases with <strong>; if
   those split the text, one unchanged paragraph reports as five changed lines
   and every page looks rewritten.
"""
import json, io, os, re, html as htmlmod

HERE = os.path.dirname(os.path.abspath(__file__))
INSTATIC = os.path.join(HERE, '.instatic')
LOCAL = os.path.abspath(os.path.join(HERE, '..', '..', '04-design', '.tmp', 'final-site'))

BLOCK = re.compile(
    r'</?(p|div|section|main|ul|ol|li|h[1-6]|br|table|td|th|tr|dl|dt|dd|figure|figcaption'
    r'|summary|details|button|label|option|blockquote|nav|header|footer|aside|form|article'
    r')\b[^>]*>', re.I)

REPORT = []
def out(line=''):
    REPORT.append(line)


def prose(h):
    h = re.sub(r'<!--.*?-->', ' ', h, flags=re.S)                 # comments FIRST
    h = re.sub(r'<(script|style)\b.*?</\1>', ' ', h, flags=re.S | re.I)
    # <title> is page metadata, not body copy. Instatic returns it as its own
    # `title` field rather than inside the html, so leaving it in makes every
    # single page report one phantom difference.
    h = re.sub(r'<title\b.*?</title>', ' ', h, flags=re.S | re.I)
    # Block boundaries become a sentinel, NOT a newline. The local build
    # hard-wraps its source inside <p>, while Instatic emits one line per block;
    # splitting on raw newlines therefore compares source-wrapped fragments
    # against whole paragraphs, and every page reads as completely rewritten.
    h = BLOCK.sub('\x00', h)
    h = re.sub(r'<[^>]+>', '', h)                                 # inline tags vanish, no space
    h = htmlmod.unescape(h)
    lines = []
    for seg in h.split('\x00'):
        t = re.sub(r'\s+', ' ', seg).strip()
        if len(t) > 3:
            lines.append(t)
    return lines


def norm(s):
    # Whitespace is dropped as well as punctuation. Adjacent inline elements
    # (a nav's links, a card's label+title+blurb) are one source line each in
    # the local build and run together with no separator in Instatic's output,
    # so "Implants Cosmetic" and "ImplantsCosmetic" are the same content and
    # would otherwise show up as a difference on all 26 pages.
    return re.sub(r'[^a-z0-9]', '', s.lower())


rows = []
for f in sorted(os.listdir(INSTATIC)):
    if not f.endswith('.json'):
        continue
    d = json.load(io.open(os.path.join(INSTATIC, f), encoding='utf-8'))
    slug = d['slug']
    localf = os.path.join(LOCAL, slug + '.html')
    if not os.path.exists(localf):
        rows.append((slug, 'NO LOCAL FILE', 0, 0, 0))
        continue
    i_lines = prose(d['html'])
    l_lines = prose(io.open(localf, encoding='utf-8').read())
    I = {norm(x) for x in i_lines if norm(x)}
    L = {norm(x) for x in l_lines if norm(x)}
    only_local = [x for x in l_lines if norm(x) and norm(x) not in I]
    only_inst = [x for x in i_lines if norm(x) and norm(x) not in L]

    # Second pass: same words, different punctuation. This is where the em-dash
    # sweep lands — norm() deliberately ignores punctuation so that structural
    # changes stay readable, which would otherwise hide every one of them.
    #
    # Restricted to pairs where the INSTATIC side actually holds an em dash.
    # Without that filter the pass is swamped by rendering artefacts: the smile
    # gallery alone reported 54 "changes" that were all `Before & After` against
    # `BeforeAfter`, i.e. how the two platforms serialise adjacent inline spans,
    # not a difference in the copy.
    imap = {}
    for x in i_lines:
        imap.setdefault(norm(x), x)
    punct = []
    for x in l_lines:
        k = norm(x)
        if k and k in imap and '—' in imap[k]:
            a = imap[k]
            b = re.sub(r'\s+', ' ', x).strip()
            if re.sub(r'\s+', '', a) != re.sub(r'\s+', '', b):
                punct.append((a, b))

    rows.append((slug, '', len(only_local), len(only_inst), len(punct)))
    if only_local or only_inst or punct:
        out('')
        out(f'=== {slug}   (+{len(only_local)} local-only / -{len(only_inst)} instatic-only'
            f' / {len(punct)} punctuation)')
        for x in only_local:
            out('  LOCAL  ' + x)
        for x in only_inst:
            out('  INSTA  ' + x)
        for a, b in punct:
            out('  PUNCT  was: ' + a)
            out('         now: ' + b)

out('')
out('---- summary ----')
for slug, note, a, b, tot in rows:
    out(f'{slug:28} content +{a:<3} -{b:<3}   punctuation {tot:<3} {note}')
missing = [s for s in ('thank-you', 'terms-conditions')
           if not os.path.exists(os.path.join(INSTATIC, s + '.json'))]
out('')
out('pages in local but absent from Instatic: ' + str(missing))

io.open(os.path.join(HERE, 'instatic-diff.txt'), 'w', encoding='utf-8').write('\n'.join(REPORT))
i = REPORT.index('---- summary ----')
print('\n'.join(REPORT[i:]))
