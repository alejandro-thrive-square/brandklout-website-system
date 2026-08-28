/**
 * Gate for scope-css.mjs. A namespacing bug here does not look like a bug - it
 * looks like the whole live site quietly restyling itself - so the transform is
 * checked case by case before it is pointed at the real stylesheet.
 *
 *   node scope-css.test.mjs
 */
import { scopeCss } from "./scope-css.mjs";

const cases = [
  ["plain class", `.button{color:red}`, `.lp-page .button{color:red}`],
  ["descendant", `.a .b{x:1}`, `.lp-page .a .b{x:1}`],
  ["selector list", `.a,.b{x:1}`, `.lp-page .a,.lp-page .b{x:1}`],
  ["tag", `h1{x:1}`, `.lp-page h1{x:1}`],
  ["root vars go to the root element", `:root{--a:1}`, `html:has(.lp-page){--a:1}`],
  ["html font-size stays on the root", `html{font-size:2rem}`, `html:has(.lp-page){font-size:2rem}`],
  ["html with a class", `html.w-mod-js{x:1}`, `html.w-mod-js:has(.lp-page){x:1}`],
  ["body becomes the wrapper", `body{margin:0}`, `.lp-page{margin:0}`],
  ["body compound", `body.dark{x:1}`, `.lp-page.dark{x:1}`],
  ["body descendant", `body .x{x:1}`, `.lp-page .x{x:1}`],
  ["universal", `*{box-sizing:border-box}`, `.lp-page *{box-sizing:border-box}`],
  ["universal list", `*,*::before{x:1}`, `.lp-page *,.lp-page *::before{x:1}`],
  ["media recurses", `@media (max-width:479px){:root{--a:2}.b{x:1}}`,
    `@media (max-width:479px){html:has(.lp-page){--a:2}.lp-page .b{x:1}}`],
  ["font-face untouched", `@font-face{font-family:X;src:url(a.woff2)}`,
    `@font-face{font-family:X;src:url(a.woff2)}`],
  ["keyframe stops are not selectors", `@keyframes spin{from{x:1}to{x:2}}`,
    `@keyframes spin{from{x:1}to{x:2}}`],
  ["comma inside :is()", `:is(.a,.b) .c{x:1}`, `.lp-page :is(.a,.b) .c{x:1}`],
  ["comma inside an attribute value", `[data-x="a,b"]{x:1}`, `.lp-page [data-x="a,b"]{x:1}`],
  ["pseudo-element", `.a::before{content:","}`, `.lp-page .a::before{content:","}`],
  [":where from the parity patch", `:where([data-theme="light"]){x:1}`,
    `.lp-page :where([data-theme="light"]){x:1}`],
  ["@import survives", `@import url(x.css);.a{x:1}`, `@import url(x.css);.lp-page .a{x:1}`],
  ["nested media in supports", `@supports (a:b){@media screen{.a{x:1}}}`,
    `@supports (a:b){@media screen{.lp-page .a{x:1}}}`],
];

let pass = 0;
const fails = [];
for (const [name, input, want] of cases) {
  const got = scopeCss(input).replace(/\s+/g, " ").trim();
  const exp = want.replace(/\s+/g, " ").trim();
  if (got === exp) pass++;
  else fails.push(`${name}\n    in   ${input}\n    want ${exp}\n    got  ${got}`);
}

console.log(`${pass}/${cases.length} passed`);
for (const f of fails) console.log(`\nFAIL ${f}`);

// The property that actually protects the live site: nothing may match outside
// the scope. Every rule must mention .lp-page somewhere in its prelude.
const real = scopeCss(`.a{x:1}@media print{.b{y:2}}:root{--z:3}body{m:0}`);
const leaked = real.split("}").map((s) => s.split("{")[0]).filter(Boolean)
  .filter((p) => !p.startsWith("@") && p.trim() && !p.includes("lp-page"));
console.log(`\nunscoped rules that could leak to the live site: ${leaked.length}`);
for (const l of leaked) console.log(`  LEAK ${l}`);

process.exitCode = fails.length || leaked.length ? 1 : 0;
