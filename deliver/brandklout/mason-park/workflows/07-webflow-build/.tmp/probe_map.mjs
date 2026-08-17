import fs from 'node:fs';
const live = await (await fetch('https://mason-park-dental.webflow.io/thank-you',{cache:'no-store'})).text();
const design = fs.readFileSync('../04-design/.tmp/thank-you/index.html','utf8');
function chunk(src){
  const i = src.indexOf("tl.fromTo('#mapFrame'");
  if (i < 0) return '(not found)';
  const s = src.lastIndexOf('MPD.add', i);
  return src.slice(s, i + 700);
}
console.log('======== DESIGN ========\n' + chunk(design));
console.log('\n======== LIVE ========\n' + chunk(live));
