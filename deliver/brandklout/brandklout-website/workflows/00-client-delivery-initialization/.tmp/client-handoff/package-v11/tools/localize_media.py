#!/usr/bin/env python3
"""Download approved remote photos into assets/images and update the HTML.
Confirm usage permissions first. Requires an internet-connected environment.
Failures are reported and leave the original remote URL unchanged.
"""
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.parse import urlparse
import hashlib, re, json, sys
ROOT=Path(__file__).resolve().parents[1]
DEST=ROOT/'assets'/'images'
DEST.mkdir(parents=True,exist_ok=True)
files=list(ROOT.glob('*.html'))
urls=sorted({u for p in files for u in re.findall(r'<img[^>]+src="(https?://[^\"]+)"',p.read_text())})
replacements={}; report=[]
for url in urls:
    try:
        request=Request(url,headers={'User-Agent':'Mozilla/5.0 BrandKloutAssetSync/1.0'})
        with urlopen(request,timeout=25) as response:
            content_type=response.headers.get('Content-Type','').split(';')[0]
            if not content_type.startswith('image/'): raise ValueError('Not an image: '+content_type)
            data=response.read(15000000)
        extension={'image/jpeg':'.jpg','image/png':'.png','image/webp':'.webp','image/svg+xml':'.svg','image/avif':'.avif'}.get(content_type,'.img')
        filename=hashlib.sha256(url.encode()).hexdigest()[:16]+extension
        (DEST/filename).write_bytes(data)
        replacements[url]='assets/images/'+filename
        report.append({'source':url,'local':replacements[url],'bytes':len(data),'status':'saved'})
        print('Saved',filename,len(data),'bytes')
    except Exception as error:
        report.append({'source':url,'status':'not downloaded','error':str(error)})
        print('Could not fetch',url,':',error,file=sys.stderr)
for p in files:
    text=p.read_text()
    for remote,local in replacements.items():text=text.replace(remote,local)
    p.write_text(text)
(ROOT/'assets'/'localization-report.json').write_text(json.dumps(report,indent=2))
print('Localized',len(replacements),'of',len(urls),'images. Failed URLs are unchanged.')
