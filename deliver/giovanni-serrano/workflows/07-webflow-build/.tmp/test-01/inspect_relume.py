import json, re

d = json.load(open('relume_variable_capture.json', encoding='utf-8'))
p = d['payload']
print('top keys:', list(d.keys()), '| type:', d.get('type'))
print('payload keys:', list(p.keys()))
print('num styles:', len(p.get('styles', [])))
print('union style keys:', sorted({k for s in p['styles'] for k in s.keys()}))

blob = json.dumps(p)
# candidate variable-reference token shapes
patterns = {
    'var()': r'var\([^)]*\)',
    '@token': r'@[A-Za-z][\w\-]*',
    'comp|': r'comp\|[\w\-]*',
    '$token': r'\$[\w\-]+',
    'uuid-ish': r'\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b',
}
for name, pat in patterns.items():
    toks = sorted(set(re.findall(pat, blob)))
    print(f'{name}: {toks[:25]}')

# show every styleLess that is NOT purely concrete (look for non-hex color refs)
print('\n=== styles with possible variable refs in styleLess ===')
for s in p['styles']:
    sl = s.get('styleLess', '')
    variants = s.get('variants', {})
    allcss = sl + ' ' + ' '.join(v.get('styleLess', '') for v in variants.values())
    if re.search(r'var\(|@[A-Za-z]|comp\||\$[\w]', allcss):
        print(f"- {s['name']}: {sl[:240]}")
