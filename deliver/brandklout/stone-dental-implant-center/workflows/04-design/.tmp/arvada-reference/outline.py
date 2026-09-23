import re,sys,html
from html.parser import HTMLParser
import sys
sys.stdout.reconfigure(encoding="utf-8",errors="replace")

class Outline(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack=[]; self.out=[]; self.cap=None; self.buf=''
        self.depth=0
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        cls=a.get('class','')
        if tag in ('section','header','footer','nav'):
            self.out.append(('SEC',tag,cls))
        elif tag in ('h1','h2','h3','h4'):
            self.cap=tag; self.buf=''
        elif tag=='img':
            self.out.append(('IMG','', (a.get('src','') or '')[-70:]))
        elif tag=='video':
            self.out.append(('VIDEO','',a.get('src','') or str(a)[:120]))
        elif tag=='iframe':
            self.out.append(('IFRAME','',(a.get('src','') or '')[:100]))
        elif tag=='a' and 'button' in cls:
            self.cap='btn'; self.buf=''
    def handle_endtag(self,tag):
        if self.cap and (tag==self.cap or (self.cap=='btn' and tag=='a')):
            t=' '.join(self.buf.split())
            if t: self.out.append((self.cap.upper(),'',t[:110]))
            self.cap=None; self.buf=''
    def handle_data(self,d):
        if self.cap: self.buf+=d

src=open(sys.argv[1],encoding='utf-8',errors='replace').read()
body=src[src.find('<body'):]
p=Outline(); p.feed(body)
for kind,tag,val in p.out:
    if kind=='SEC': print(f"\n### <{tag}> {val}")
    else: print(f"  [{kind}] {val}")
