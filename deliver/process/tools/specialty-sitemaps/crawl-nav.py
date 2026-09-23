import re, sys, json, urllib.request, ssl
from urllib.parse import urljoin, urlparse
UA={'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36'}
def get(u):
    try:
        r=urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=20)
        return r.read().decode('utf-8','replace'), r.geturl()
    except Exception as e: return '', u
out={}
for dom in sys.argv[1:]:
    html,final=get('https://'+dom+'/'); host=urlparse(final).netloc
    seen={'/'}; queue=['/']; pages=[]
    while queue and len(seen)<200:
        p=queue.pop(0); h,_=get('https://'+host+p) if p!='/' else (html,final)
        if not h: continue
        pages.append(p)
        for href in re.findall(r'href=["\']([^"\'#?]+)',h):
            u=urlparse(urljoin('https://'+host+p,href))
            if u.netloc not in (host,host.replace('www.',''),'www.'+host): continue
            path=u.path.rstrip('/') or '/'
            if re.search(r'\.(png|jpe?g|svg|webp|pdf|css|js|xml|ico|woff2?)$',path,re.I) or path.startswith(('/wp-','/cdn-cgi','/assets','/media','/_')): continue
            if path not in seen: seen.add(path); queue.append(path)
    out[dom]={'host':host,'pages':sorted(pages)}
    print(dom, host, len(pages), file=sys.stderr)
json.dump(out,open('navcrawl.json','w'),indent=1)
