import re, json, sys, urllib.request, ssl
UA={'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36'}
ctx=ssl.create_default_context()
def get(u):
    try:
        r=urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=20,context=ctx)
        return r.status, r.read().decode('utf-8','replace'), r.geturl()
    except Exception as e: return getattr(e,'code',0), '', u
def crawl(domain):
    seen=set(); urls=[]
    for path in ['/sitemap.xml','/sitemap_index.xml','/wp-sitemap.xml','/page-sitemap.xml']:
        st,body,final=get('https://'+domain+path)
        if st==200 and '<loc>' in body: queue=[final]; break
    else: return None
    while queue:
        u=queue.pop(0)
        if u in seen: continue
        seen.add(u); st,body,_=get(u)
        locs=re.findall(r'<loc>\s*(.*?)\s*</loc>',body)
        if '<sitemapindex' in body: queue+= [l for l in locs if not re.search(r'(image|video|attachment|author|tag|category|product|post_tag|elementor|wp-sitemap-users)',l)]
        else: urls+=locs
    return sorted(set(urls))
out={}
for d in sys.argv[1:]:
    r=crawl(d); out[d]=r; print(d, 'no sitemap' if r is None else len(r), file=sys.stderr)
json.dump(out,open('sitemaps.json','w'),indent=1)
