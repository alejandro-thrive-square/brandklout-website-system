import fs from "node:fs";

const pages = { invest: "invest", develop: "develop", scale: "scale", sell: "sell", detail: "projects/4855-college-ave" };
fs.mkdirSync(".tmp/footer-patch", { recursive: true });

for (const [name, path] of Object.entries(pages)) {
  const h = await (await fetch("https://giovanni-serrano.webflow.io/" + path)).text();
  // page footer custom code: the <script> block containing the nav toggle selector
  const old = "= document.querySelector('.nav-toggle');";
  const neu = "= document.querySelector('button.nav-toggle') || document.querySelector('.nav-toggle');";
  const marker = h.indexOf(old);
  if (marker === -1) { console.log(name, "NO SELECTOR LINE"); continue; }
  const start = h.lastIndexOf("<script>", marker);
  const end = h.indexOf("</script>", marker) + "</script>".length;
  let code = h.slice(start, end);
  const before = code.length;
  code = code.replace(old, neu);
  fs.writeFileSync(".tmp/footer-patch/" + name + ".html", code);
  console.log(name, "extracted", before, "->", code.length, "chars; scripts sane:", code.startsWith("<script>") && code.endsWith("</script>"));
}
