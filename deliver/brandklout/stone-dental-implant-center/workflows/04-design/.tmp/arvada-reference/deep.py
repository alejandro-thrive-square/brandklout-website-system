import sys, re
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
from html.parser import HTMLParser

SKIP={'script','style','noscript','svg','path'}
class D(HTMLParser):
    def __init__(s):
        super().__init__(convert_charrefs=True)
        s.d=0; s.skip=0; s.buf=''
    def flush(s):
        t=' '.join(s.buf.split()); s.buf=''
        if t: print('  '*s.d + '· ' + t[:300])
    def handle_starttag(s,tag,attrs):
        if tag in SKIP: s.skip+=1; return
        if s.skip: return
        a=dict(attrs); cls=a.get('class','')
        if tag=='img':
            s.flush(); print('  '*s.d + f'<img> {a.get("alt","")!r} src=…{(a.get("src","") or "")[-60:]}'); return
        if tag=='iframe':
            s.flush(); print('  '*s.d + f'<iframe> {(a.get("src","") or "")[:150]}'); return
        if tag in ('br','input','link','meta','source'):
            if tag=='input': s.flush(); print('  '*s.d+f'<input {a.get("type","")} {a.get("name","")}>')
            return
        s.flush()
        label=tag
        if cls: label+=f'.{cls}'
        if a.get('href'): label+=f'  href={a["href"][:80]}'
        if a.get('data-w-id') and tag=='div' and not cls: pass
        print('  '*s.d + f'<{label}>')
        s.d+=1
    def handle_endtag(s,tag):
        if tag in SKIP:
            s.skip=max(0,s.skip-1); return
        if s.skip: return
        if tag in ('img','iframe','br','input','link','meta','source'): return
        s.flush(); s.d=max(0,s.d-1)
    def handle_data(s,data):
        if s.skip: return
        s.buf+=data

src=open(sys.argv[1],encoding='utf-8',errors='replace').read()
body=src[src.find('<body'):]
p=D(); p.feed(body)
