#!/usr/bin/env python
"""
ads-to-nodes.py — turn the eighteen built ads pages into Instatic page documents,
headlessly, with no editor bridge anywhere in the loop.

    python ads-to-nodes.py --map <media-map.json> --out <dir> [--only slug,slug]

WHY THIS EXISTS
---------------
The platform's own HTML importer only runs inside the Site editor, through the
MCP bridge (`site_insert_html`), and that bridge needs a browser signed in as the
connector owner and drops mid-push without warning. The OAuth grant it used also
points at encorercm.com, a host that no longer exists. The REST API underneath
takes whole page documents (`PUT /site-document`, `changedPages`), so the only
thing missing was an HTML -> node-tree conversion, and that is what this is.

THE NODE SHAPES ARE COPIED FROM THE PLATFORM'S OWN IMPORT, not invented: six
live pages were read back on 2026-09-18 and every module / tag combination the
importer produced is mirrored here (22-instatic-api-sync/.tmp/node-samples.mjs).

    <div|section|nav|header|footer|main|article|ul>  base.container {tag}
    any other element                                 base.container {tag:'custom', customTag}
    a run of text                                     base.text {tag:'none'}
    <p|h2|h3|h4|span|em|strong> holding ONLY text     base.text {tag}
    <h1>, <li>, <dt>, <dd>, <summary>, <figcaption>,
    <blockquote>, <label>, <address>, <b>, <i>        containers, text as children
    <a>                                               base.link {href, target, text?}
    <img>                                             base.image {src, loading, ...}
    <iframe src=youtube>                              base.video {videoUrl, title, ...}
    <input>                                           base.input {inputType:'text', value, min, max}
    <div class="wz-embed" data-wz-embed="auto">       brandklout.embed-origins.embed {snippet}
    style="..."                                       inlineStyles {camelCase}
    class="..."                                       classNames[] — resolved to classIds by
                                                      push-ads-pages.mjs against the live registry

WHAT IS DELIBERATELY DIFFERENT FROM THE IMPORTER
    - `<a class="btn"><span>Label</span></a>` keeps its span as a child, so the
      `.btn>span{z-index:1}` label survives without 90-boot.js rebuilding it;
    - `<img alt>` is carried in htmlAttributes, which the platform emits FIRST,
      ahead of its own alt="" (browsers keep the first duplicate);
    - the YouTube `title` reaches base.video's own title prop.

ROUTES AND MEDIA follow 13-content-export-import/.tmp/to-instatic.mjs: local
`x.html#y` becomes `/x#y`, and every `assets/<name>` becomes the `/uploads/...`
path the media map holds. A page that references an image the map does not
have is REFUSED, never published with a broken picture.

THE NESTED SLUG. Brandklout asked for the set under /ads-landing-pages, and
this instance serves a slug with a slash at that path (proved on staging
2026-09-18: `ads-landing-pages/zz-probe` answered 200 at the nested URL and
404 at the flattened one). Local files stay flat (`ads-alexandria-veneers.html`)
because the local gates derive their page lists from flat slugs; this script
maps `ads-<rest>` to `ads-landing-pages/<rest>` on the way out, links included.
"""
import argparse, html, json, os, re, secrets, sys
from html.parser import HTMLParser

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.normpath(os.path.join(HERE, '..', '04-design', '.tmp', 'final-site'))
SEO = os.path.normpath(os.path.join(HERE, '..', '04-design', '.tmp', 'site-src', 'seo.json'))

ALPHABET = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict'
def nid():
    return ''.join(ALPHABET[b & 63] for b in secrets.token_bytes(21))

VOID = {'img', 'br', 'hr', 'input', 'meta', 'link', 'source', 'area', 'col', 'embed', 'track', 'wbr'}
NATIVE_CONTAINER = {'div', 'section', 'nav', 'header', 'footer', 'main', 'article', 'ul'}
TEXT_TAGS = {'p', 'h2', 'h3', 'h4', 'span', 'em', 'strong'}
DROP = {'script', 'noscript', 'link', 'style', 'template'}

class El:
    __slots__ = ('tag', 'attrs', 'children', 'parent')
    def __init__(self, tag, attrs, parent):
        self.tag, self.attrs, self.children, self.parent = tag, dict(attrs), [], parent

class Tx:
    __slots__ = ('text', 'parent')
    def __init__(self, text, parent):
        self.text, self.parent = text, parent

class TreeParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = El('#root', [], None)
        self.cur = self.root
        self.skip = 0
    def handle_starttag(self, tag, attrs):
        if tag in DROP:
            if tag not in VOID: self.skip += 1
            return
        if self.skip: return
        el = El(tag, attrs, self.cur)
        self.cur.children.append(el)
        if tag not in VOID: self.cur = el
    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VOID and tag not in DROP and not self.skip:
            self.cur = self.cur.parent
    def handle_endtag(self, tag):
        if tag in DROP and tag not in VOID:
            self.skip = max(0, self.skip - 1); return
        if self.skip: return
        node = self.cur
        while node is not None and node.tag != tag: node = node.parent
        if node is not None and node.parent is not None: self.cur = node.parent
    def handle_data(self, data):
        if self.skip: return
        self.cur.children.append(Tx(data, self.cur))
    def handle_comment(self, data): pass

# ── routes and media ─────────────────────────────────────────────────────────
def instatic_slug(local_slug):
    m = re.match(r'^ads-(.+)$', local_slug)
    return 'ads-landing-pages/' + m.group(1) if m else local_slug

def route(href):
    m = re.match(r'^(?:(posts)/)?([A-Za-z0-9._-]+)\.html(#.*)?$', href)
    if not m: return href
    d, slug, h = m.group(1), m.group(2), m.group(3) or ''
    if d: return f'/{d}/{slug}{h}'
    if slug == 'index': return '/' + h
    return '/' + instatic_slug(slug) + h

class Media:
    def __init__(self, path):
        self.map = json.load(open(path, encoding='utf-8'))
        self.missing = set()
    def get(self, src):
        name = re.sub(r'^assets/', '', src)
        u = self.map.get(name) or self.map.get(re.sub(r'\.avif$', '.jpg', name, flags=re.I))
        if not u: self.missing.add(src)
        return u or src

# ── the converter ────────────────────────────────────────────────────────────
def camel(p):
    return re.sub(r'-([a-z])', lambda m: m.group(1).upper(), p.strip())

def inline_styles(s):
    out = {}
    depth, buf, parts = 0, '', []
    for ch in s:
        if ch == '(': depth += 1
        elif ch == ')': depth -= 1
        if ch == ';' and depth == 0: parts.append(buf); buf = ''; continue
        buf += ch
    parts.append(buf)
    for d in parts:
        if ':' not in d: continue
        k, v = d.split(':', 1)
        if k.strip(): out[camel(k)] = v.strip()
    return out

WS = re.compile(r'\s+')

def collapse(text, mixed):
    t = WS.sub(' ', text)
    if not mixed: return t.strip()
    return t

def only_text(el):
    return all(isinstance(c, Tx) for c in el.children)

def all_text(el):
    return ''.join(c.text for c in el.children if isinstance(c, Tx))

class Doc:
    def __init__(self, media):
        self.nodes = {}
        self.media = media
        self.embeds = 0
        self.videos = 0
        self.images = 0

    def add(self, module, props, parent, class_names=(), inline=None):
        i = nid()
        n = {'id': i, 'moduleId': module, 'props': props, 'breakpointOverrides': {},
             'classIds': [], 'classNames': list(class_names), 'children': [], 'parentId': parent}
        if inline: n['inlineStyles'] = inline
        self.nodes[i] = n
        if parent: self.nodes[parent]['children'].append(i)
        return i

    def attrs_of(self, el):
        """class -> classNames, style -> inlineStyles, everything else -> htmlAttributes."""
        cls = [c for c in (el.attrs.get('class') or '').split() if c]
        style = inline_styles(el.attrs.get('style') or '') if el.attrs.get('style') else None
        rest = {k: (v if v is not None else '') for k, v in el.attrs.items() if k not in ('class', 'style')}
        return cls, style, rest

    def text_node(self, text, tag, parent, attrs=None, cls=(), inline=None):
        return self.add('base.text', {'text': text, 'tag': tag, 'htmlAttributes': attrs or {}}, parent, cls, inline)

    def convert_children(self, el, parent):
        kids = el.children
        mixed = any(isinstance(c, El) for c in kids) and any(isinstance(c, Tx) and c.text.strip() for c in kids)
        for c in kids:
            if isinstance(c, Tx):
                t = collapse(c.text, mixed)
                if not t.strip(): continue
                self.text_node(t, 'none', parent)
            else:
                self.convert(c, parent)

    def convert(self, el, parent):
        tag = el.tag
        cls, style, attrs = self.attrs_of(el)

        # the campaign form: the embed module, snippet verbatim
        if tag == 'div' and 'wz-embed' in cls and attrs.get('data-wz-embed') == 'auto':
            snippet = serialize_children(el)
            # mirror the proven live snippet (contact pages): the vendor script deferred
            snippet = snippet.replace('<script src="https://link.msgsndr.com/js/form_embed.js"></script>',
                                      '<script src="https://link.msgsndr.com/js/form_embed.js" defer></script>')
            self.embeds += 1
            return self.add('brandklout.embed-origins.embed', {
                'source': 'snippet', 'url': '', 'snippet': snippet.strip(), 'title': '', 'fit': 'auto',
                'height': 600, 'ratio': '16 / 9', 'lazy': True, 'allowFullscreen': False, 'allow': '',
            }, parent)

        if tag == 'img':
            src = attrs.pop('src', '')
            loading = attrs.pop('loading', 'eager')
            self.images += 1
            return self.add('base.image', {
                'src': self.media.get(src) if src.startswith('assets/') else src,
                'loading': loading, 'fetchPriority': 'auto', 'decoding': 'async', 'htmlAttributes': attrs,
            }, parent, cls, style)

        if tag == 'iframe':
            src = attrs.get('src', '')
            if 'youtube.com/embed/' in src:
                self.videos += 1
                return self.add('base.video', {
                    'videoUrl': src, 'poster': '', 'autoplay': False, 'loop': False, 'muted': False,
                    'controls': True, 'playsinline': True, 'preload': 'metadata',
                    'title': attrs.get('title', ''), 'noRelatedVideos': False,
                }, parent, cls, style)
            raise SystemExit(f'non-YouTube iframe outside an embed block: {src}')

        if tag == 'input':
            return self.add('base.input', {
                'inputType': 'text', 'fieldId': '', 'name': attrs.get('name', ''), 'id': attrs.get('id', ''),
                'placeholder': '', 'value': attrs.get('value', ''), 'required': False, 'disabled': False,
                'readOnly': False, 'autocomplete': '', 'min': attrs.get('min', ''), 'max': attrs.get('max', ''),
                'minLength': 0, 'maxLength': 0, 'pattern': '',
            }, parent, cls, style)

        if tag == 'a':
            href = attrs.pop('href', '#')
            target = attrs.pop('target', '_self')
            props = {'href': route(href), 'target': target, 'htmlAttributes': attrs}
            if only_text(el):
                props['text'] = collapse(all_text(el), False)
                return self.add('base.link', props, parent, cls, style)
            i = self.add('base.link', props, parent, cls, style)
            self.convert_children(el, i)
            return i

        if tag in TEXT_TAGS and only_text(el):
            return self.text_node(collapse(all_text(el), False), tag, parent, attrs, cls, style)

        if tag in NATIVE_CONTAINER:
            props = {'tag': tag, 'customTag': '', 'htmlAttributes': attrs}
        else:
            props = {'tag': 'custom', 'customTag': tag, 'htmlAttributes': attrs}
        i = self.add('base.container', props, parent, cls, style)
        self.convert_children(el, i)
        return i

def serialize_children(el):
    return ''.join(serialize(c) for c in el.children)

def serialize(n):
    if isinstance(n, Tx): return html.escape(n.text, quote=False)
    a = ''.join(f' {k}="{html.escape(v or "", quote=True)}"' for k, v in n.attrs.items())
    if n.tag in VOID: return f'<{n.tag}{a}>'
    return f'<{n.tag}{a}>' + serialize_children(n) + f'</{n.tag}>'

def body_of(raw):
    src = re.sub(r'<!--[\s\S]*?-->', '', raw)
    a, b = src.find('<body>'), src.rfind('</body>')
    if a < 0 or b < 0: raise SystemExit('no <body>')
    return src[a + 6:b]

def title_of(raw):
    m = re.search(r'<title>([^<]+)</title>', raw)
    return html.unescape(m.group(1).strip()) if m else ''

def convert_page(local_slug, media):
    raw = open(os.path.join(SITE, local_slug + '.html'), encoding='utf-8').read()
    p = TreeParser(); p.feed(body_of(raw)); p.close()
    doc = Doc(media)
    root = doc.add('base.body', {}, None)
    doc.nodes[root]['parentId'] = None
    for c in p.root.children:
        if isinstance(c, Tx):
            if c.text.strip(): raise SystemExit(f'{local_slug}: stray text at body level: {c.text[:40]!r}')
            continue
        doc.convert(c, root)
    return {
        'localSlug': local_slug, 'slug': instatic_slug(local_slug), 'title': title_of(raw),
        'rootNodeId': root, 'nodes': doc.nodes,
        'stats': {'nodes': len(doc.nodes), 'images': doc.images, 'videos': doc.videos, 'embeds': doc.embeds,
                  'sections': sum(1 for n in doc.nodes.values() if n['props'].get('tag') == 'section'),
                  'classed': sum(1 for n in doc.nodes.values() if n.get('classNames'))},
    }

def convert_fragment(html_text, media):
    """One block of markup -> nodes under a synthetic root. Used to splice a
    block into an existing page (restore-home-offices.mjs)."""
    p = TreeParser(); p.feed(html_text); p.close()
    doc = Doc(media)
    root = doc.add('base.container', {'tag': 'div', 'customTag': '', 'htmlAttributes': {}}, None)
    doc.nodes[root]['parentId'] = None
    for c in p.root.children:
        if isinstance(c, El): doc.convert(c, root)
    return {'rootNodeId': root, 'nodes': doc.nodes}

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--map', required=True)
    ap.add_argument('--out', required=True)
    ap.add_argument('--only', default='')
    ap.add_argument('--fragment', default='', help='convert one HTML fragment file instead of the ads pages')
    ap.add_argument('--pages', default='', help='convert these built pages by local slug instead of the ads set; '
                                                'the conversion is identical, only the discovery differs')
    a = ap.parse_args()
    media = Media(a.map)
    if a.fragment:
        frag = convert_fragment(open(a.fragment, encoding='utf-8').read(), media)
        json.dump(frag, open(a.out, 'w', encoding='utf-8'), ensure_ascii=False)
        print(f"fragment -> {a.out}: {len(frag['nodes'])} nodes")
        if media.missing: print('missing media:', sorted(media.missing)); sys.exit(1)
        return
    if a.pages:
        # An editorial page converts through exactly the same code: `instatic_slug`
        # leaves a non-`ads-` slug alone and `route()` already maps `x.html` to
        # `/x`. Only the discovery here was ads-only. Added 2026-09-21 for
        # /five-year-warranty (BugHerd #47).
        slugs = [x.strip() for x in a.pages.split(',') if x.strip()]
        for s in slugs:
            if not os.path.exists(os.path.join(SITE, s + '.html')):
                raise SystemExit(f'{s}.html is not in {SITE} — build it first')
    else:
        slugs = sorted(f[:-5] for f in os.listdir(SITE) if f.startswith('ads-') and f.endswith('.html'))
    if a.only: slugs = [s for s in slugs if s in set(a.only.split(','))]
    seo = json.load(open(SEO, encoding='utf-8'))
    os.makedirs(a.out, exist_ok=True)
    for s in slugs:
        page = convert_page(s, media)
        e = seo.get(s, {})
        page['seo'] = {'title': e.get('title', ''), 'desc': e.get('desc', ''), 'robots': e.get('robots', '')}
        json.dump(page, open(os.path.join(a.out, s + '.json'), 'w', encoding='utf-8'), ensure_ascii=False)
        st = page['stats']
        print(f"{s:46} -> /{page['slug']:56} nodes {st['nodes']:4} img {st['images']:3} vid {st['videos']} embed {st['embeds']} sec {st['sections']:2} classed {st['classed']}")
    if media.missing:
        print('\nREFUSING: images not in the media map:\n  ' + '\n  '.join(sorted(media.missing)))
        sys.exit(1)

if __name__ == '__main__':
    main()
