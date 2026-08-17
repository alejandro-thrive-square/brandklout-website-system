const html = await (await fetch('https://mason-park-dental.webflow.io/thank-you',{cache:'no-store'})).text();
const css  = await (await fetch('https://cdn.prod.website-files.com/6a60bdc0340e5f1784b4d553/css/mason-park-dental.webflow.shared.17fa3d03b.css',{cache:'no-store'})).text();
for (const [label, src] of [['PAGE HTML (head block + embeds)', html], ['PUBLISHED CSS', css]]) {
  console.log('\n=====', label, '=====');
  for (const m of src.matchAll(/[^{}\n]{0,90}\{[^{}]*clip-path[^{}]*\}/g)) {
    const t = m[0].replace(/\s+/g,' ').trim();
    if (/map|frame|doc-photo/i.test(t)) console.log('  |', t.slice(0,200));
  }
  console.log('  !important clip-path count:', (src.match(/clip-path[^;}]*!important/g)||[]).length);
}
