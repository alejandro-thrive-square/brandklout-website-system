// Prove the phone guard against the generators' real type(), by lifting the
// function out of each file rather than re-typing it here.
// node guard-phone-check.mjs
import fs from 'node:fs';

const CASES = [
  ['(281) 578-7100', '(281) 578-7100'],
  ['281-578-7100', '281-578-7100'],
  ['Call (281) 578-7100 today', 'Call (281) 578-7100 today'],
  ['tel 281-578-7100.', 'tel 281-578-7100.'],
  ['6-18 months', '6 to 18 months'],
  ['Mon 9-6', 'Mon 9 to 6'],
  ['ages 3-5', 'ages 3 to 5'],
  ['2021-2026', '2021 to 2026'],
  ['100-150 per visit', '100 to 150 per visit'],
];

let bad = 0;
for (const file of ['build-pages.mjs', 'build-blog.mjs']) {
  const src = fs.readFileSync(file, 'utf8');
  const body = src.slice(src.indexOf('function type(s) {'));
  const fn = body.slice(0, body.indexOf('\n}\n') + 3);
  const type = new Function(`${fn}; return type;`)();
  console.log('---', file);
  for (const [input, want] of CASES) {
    const got = type(input);
    const ok = got === want;
    if (!ok) bad++;
    console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${JSON.stringify(input)} -> ${JSON.stringify(got)}${ok ? '' : `  (want ${JSON.stringify(want)})`}`);
  }
}
console.log(bad ? `\n${bad} failing` : '\nall cases pass');
process.exitCode = bad ? 1 : 0;
