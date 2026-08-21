import re
def strip_comments(css):
    return re.sub(r'/\*.*?\*/','',css,flags=re.S)
def parse(css):
    """-> dict[(context, selector)] = {prop: value} ; last write wins (cascade within file)"""
    css = strip_comments(css)
    out = {}
    def walk(text, ctx):
        i = 0; n = len(text)
        while i < n:
            j = text.find('{', i)
            if j < 0: break
            prelude = text[i:j].strip()
            # find matching close brace
            depth = 1; k = j+1
            while k < n and depth:
                if text[k]=='{': depth+=1
                elif text[k]=='}': depth-=1
                k+=1
            body = text[j+1:k-1]
            if prelude.startswith('@'):
                at = re.split(r'[\s(]', prelude, 1)[0].lower()
                if at in ('@media','@supports','@container','@layer','@scope'):
                    walk(body, (ctx+' && ' if ctx else '')+norm_at(prelude))
                else:
                    out[(ctx, prelude)] = {'__raw__': ' '.join(body.split())}
            else:
                for sel in [s.strip() for s in split_top(prelude) if s.strip()]:
                    sel = ' '.join(sel.split())
                    d = out.setdefault((ctx, sel), {})
                    for prop, val in decls(body):
                        d[prop] = val
            i = k
    walk(css, '')
    return out
def split_top(s):
    parts=[]; depth=0; cur=''
    for ch in s:
        if ch in '([': depth+=1
        elif ch in ')]': depth-=1
        if ch==',' and depth==0: parts.append(cur); cur=''
        else: cur+=ch
    parts.append(cur); return parts
def decls(body):
    depth=0; cur=''; items=[]
    for ch in body:
        if ch in '([': depth+=1
        elif ch in ')]': depth-=1
        if ch==';' and depth==0: items.append(cur); cur=''
        else: cur+=ch
    items.append(cur)
    for it in items:
        if ':' not in it: continue
        p,_,v = it.partition(':')
        p=p.strip().lower(); v=' '.join(v.split())
        if p and v and not p.startswith('@'): yield p, v

def norm_at(p):
    p = ' '.join(p.split())
    p = re.sub(r'^@([a-z-]+)\s*\(', r'@ (', p)
    p = re.sub(r'\s*:\s*', ':', p)
    return p
def norm_val(v):
    v = v.strip().lower()
    v = re.sub(r'(?<![\w.])(-?)0*(\d*\.\d+)', lambda m: m.group(1)+str(float(m.group(2))), v)
    v = re.sub(r'(?<![\w.%-])0(px|em|rem|%|vw|vh)', '0', v)
    v = re.sub(r'\s*,\s*', ',', v)
    return ' '.join(v.split())
