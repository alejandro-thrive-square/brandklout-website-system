import sys, re
from bs4 import BeautifulSoup

path = sys.argv[1]
soup = BeautifulSoup(open(path, encoding='utf-8').read(), 'html.parser')
body = soup.body
for t in body.find_all(['script','style','noscript']): t.decompose()

def cls(el):
    c = el.get('class') or []
    return '.'.join(c)

# top-level structural children of body
def walk(el, depth=0, maxdepth=2):
    for ch in el.find_all(recursive=False):
        if ch.name in ('script','style'): continue
        c = cls(ch)
        txt = ' '.join(ch.get_text(' ', strip=True).split())
        print('  '*depth + f'<{ch.name} class="{c}">  [{len(txt)}ch] {txt[:110]}')
        if depth < maxdepth:
            walk(ch, depth+1, maxdepth)

walk(body, 0, int(sys.argv[2]) if len(sys.argv)>2 else 2)
