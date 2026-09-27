#!/usr/bin/env python3
"""Create a single-file, internally navigable website preview.
Local images are inlined when available; external images remain online.
Usage: python tools/build_preview.py [output.html]
"""
from pathlib import Path
import base64, json, mimetypes, re, sys, argparse
from bs4 import BeautifulSoup
ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser()
parser.add_argument('output', nargs='?', default=str(ROOT.parent/'BrandKlout-Visual-Preview-v11.html'))
parser.add_argument('--start-page', default='index.html')
args=parser.parse_args()
DEST=Path(args.output)
START=args.start_page
if not (ROOT/START).is_file(): raise SystemExit('Unknown start page: '+START)
css='\n'.join((ROOT/'assets'/name).read_text() for name in ['site.css','visual.css','reference-theme.css','preview-fix.css','update-v6.css','stories-v10.css'])
scripts='\n'.join((ROOT/'assets'/name).read_text() for name in ['site.js','visual.js','stories-v10.js'])
pages={}
for file in sorted(ROOT.glob('*.html')):
    if file.name in ['OPEN-ME.html','START-HERE.html']: continue
    s=BeautifulSoup(file.read_text(),'html.parser')
    if not s.body: continue
    for tag in s.body.select('script'): tag.decompose()
    for img in s.select('img[src]'):
        src=img['src']
        if not src.startswith(('http:','https:','data:')):
            local=(ROOT/src)
            if local.is_file():
                mime=mimetypes.guess_type(local.name)[0] or 'image/jpeg'
                img['src']='data:'+mime+';base64,'+base64.b64encode(local.read_bytes()).decode()
    pages[file.name]={'title':s.title.get_text() if s.title else file.stem,'body':''.join(str(t) for t in s.body.contents),'class':' '.join(s.body.get('class',[]))}
index=BeautifulSoup((ROOT/START).read_text(),'html.parser')
for tag in index.head.select('link[rel="stylesheet"],script'): tag.decompose()
style=index.new_tag('style'); style.string=css; index.head.append(style)
# Keep external fonts as optional enhancement.
# Fonts load as a non-blocking optional enhancement at the end of the document.
robots=index.new_tag('meta',attrs={'name':'robots','content':'noindex,nofollow'})
index.head.append(robots)
index.body.clear()
root=index.new_tag('div',id='bk-preview-root')
root.append(BeautifulSoup(pages[START]['body'],'html.parser'))
index.body.append(root)
# Inline favicon, too.
for icon in index.head.select('link[rel="icon"]'):
    icon['href']='data:image/svg+xml;base64,'+base64.b64encode((ROOT/'favicon.svg').read_bytes()).decode()
data=index.new_tag('script',type='application/json',id='bk-preview-pages')
data.string=json.dumps(pages).replace('<','\\u003c')
index.body.append(data)
js=index.new_tag('script'); js.string=scripts; index.body.append(js)
router=r'''
(function(){
  'use strict';
  if (navigator.onLine !== false) {
    const font = document.createElement('link');
    font.rel = 'stylesheet';
    font.href = 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@500;600;700;800&display=swap';
    document.head.append(font);
  }
  const pages=JSON.parse(document.getElementById('bk-preview-pages').textContent);
  const root=document.getElementById('bk-preview-root');
  const startPage=__START_PAGE__;
  function readHash(){
    const raw=location.hash.startsWith('#/')?location.hash.slice(2):startPage;
    const parts=raw.split('#');
    return {path:parts[0]||startPage,anchor:parts[1]||''};
  }
  let current=startPage;
  function show(path,anchor=''){
    if(!pages[path]) return;
    if(current!==path){
      window.BKVisual?.closeVideo(); window.BKStories?.stopAll();
      root.innerHTML=pages[path].body;
      document.title=pages[path].title;
      document.body.className=pages[path].class;
      window.BKSite?.init(); window.BKVisual?.init();
      current=path;
    }
    requestAnimationFrame(()=>{
      const target=anchor?document.getElementById(anchor):null;
      if(target) target.scrollIntoView({behavior:window.BKVisual?.reduced()?'auto':'smooth',block:'start'});
      else window.scrollTo({top:0,behavior:'auto'});
    });
  }
  document.addEventListener('click',event=>{
    const a=event.target.closest('a[href]');
    if(!a||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||a.hasAttribute('download'))return;
    const raw=a.getAttribute('href');
    if(raw.startsWith('#')&&!raw.startsWith('#/')){
      event.preventDefault();
      const anchor=raw.slice(1);
      history.pushState(null,'','#/'+current+'#'+anchor);show(current,anchor);return;
    }
    if(/^(https?:|mailto:|tel:|data:)/.test(raw)) return;
    const [path,anchor='']=raw.replace(/^\.\//,'').split('#');
    if(!pages[path])return;
    event.preventDefault();
    history.pushState(null,'','#/'+path+(anchor?'#'+anchor:''));
    show(path,anchor);
  },true);
  window.addEventListener('popstate',()=>{const r=readHash();show(r.path,r.anchor);});
  window.addEventListener('hashchange',()=>{const r=readHash();show(r.path,r.anchor);});
  if(location.hash.startsWith('#/')){const r=readHash();show(r.path,r.anchor);}
})();
'''
js=index.new_tag('script'); js.string=router.replace('__START_PAGE__',json.dumps(START)); index.body.append(js)
DEST.write_text(str(index))
print('Preview created:',DEST,'bytes:',DEST.stat().st_size,'pages:',len(pages))
