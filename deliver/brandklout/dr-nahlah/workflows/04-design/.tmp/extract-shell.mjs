// One-shot: split the verified home page into shell partials + a body file so
// every page in the site can be assembled from the same shell.
import fs from "node:fs";
import path from "node:path";

const SRC = ".tmp/final-design-gsap/index.html";
const OUT = ".tmp/site-src";
const html = fs.readFileSync(SRC, "utf8");

const cut = (startMark, endMark, from = 0) => {
  const a = html.indexOf(startMark, from);
  if (a < 0) throw new Error("missing start: " + startMark);
  const b = html.indexOf(endMark, a);
  if (b < 0) throw new Error("missing end: " + endMark);
  return { text: html.slice(a, b + endMark.length), a, b: b + endMark.length };
};

fs.mkdirSync(path.join(OUT, "partials"), { recursive: true });
fs.mkdirSync(path.join(OUT, "pages"), { recursive: true });

// head: <!DOCTYPE ...> ... </head>
const head = cut("<!DOCTYPE html>", "</head>");
fs.writeFileSync(path.join(OUT, "partials", "head.html"), head.text);

// nav header + drawer
const nav = cut('<header class="nav"', "</header>");
fs.writeFileSync(path.join(OUT, "partials", "nav.html"), nav.text);
// drawer runs from `<!-- Mobile drawer -->` to the div that closes before #smooth-wrapper
const dStart = html.indexOf("<!-- Mobile drawer -->");
const dEnd = html.indexOf('<div id="smooth-wrapper">');
fs.writeFileSync(path.join(OUT, "partials", "drawer.html"), html.slice(dStart, dEnd).trim());

// body: everything inside <main id="top"> ... </main>
const mStart = html.indexOf('<main id="top">');
const mEnd = html.indexOf("</main>");
fs.writeFileSync(path.join(OUT, "pages", "home.body.html"),
  html.slice(mStart + '<main id="top">'.length, mEnd).trim());

// footer element
const foot = cut('<footer class="foot"', "</footer>");
fs.writeFileSync(path.join(OUT, "partials", "footer.html"), foot.text);

// flush script: the last <script> before </body>
const fStart = html.lastIndexOf("<script>");
const fEnd = html.indexOf("</script>", fStart) + "</script>".length;
fs.writeFileSync(path.join(OUT, "partials", "flush.html"), html.slice(fStart, fEnd));

console.log("head", head.text.length, "nav", nav.text.length,
  "body", mEnd - mStart, "footer", foot.text.length, "flush", fEnd - fStart);
