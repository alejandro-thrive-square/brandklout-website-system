import os, re, json
from bs4 import BeautifulSoup

PAGES = {
 'landing': 'livewell/dental-implants.html',
 'consult': 'livewell/dental-implant-consultation.html',
 'thankyou': 'livewell/thank-you-implants.html',
}
os.makedirs('livewell/sections', exist_ok=True)
allclasses = set()
manifest = {}

for key, path in PAGES.items():
    soup = BeautifulSoup(open(path, encoding='utf-8').read(), 'html.parser')
    body = soup.body
    for t in body.find_all(['script','style','noscript']): t.decompose()
    # the page wrapper is the first div child
    wrap = body.find(recursive=False)
    secs = []
    for i, ch in enumerate(wrap.find_all(recursive=False)):
        name = '-'.join((ch.get('class') or ['noclass'])[:1]) or ch.name
        fn = f'livewell/sections/{key}-{i:02d}-{ch.name}-{name}.html'
        open(fn,'w',encoding='utf-8').write(ch.prettify())
        txt = ' '.join(ch.get_text(' ', strip=True).split())
        secs.append({'i':i,'tag':ch.name,'class':ch.get('class'),'file':fn,'chars':len(txt)})
    manifest[key] = {'wrapper': wrap.get('class'), 'sections': secs}
    for el in body.find_all(class_=True):
        for c in el.get('class'): allclasses.add(c)

json.dump(manifest, open('livewell/manifest.json','w',encoding='utf-8'), indent=1)
open('livewell/classes.txt','w',encoding='utf-8').write('\n'.join(sorted(allclasses)))
print('sections written:', sum(len(v['sections']) for v in manifest.values()))
print('unique classes:', len(allclasses))
for k,v in manifest.items():
    print(); print(k, 'wrapper=', v['wrapper'])
    for s in v['sections']:
        print('  ', s['file'].split('/')[-1], s['chars'])
