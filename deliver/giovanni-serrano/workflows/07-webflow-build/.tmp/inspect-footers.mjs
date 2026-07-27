const pages = { invest: "invest", sell: "sell", detail: "projects/4855-college-ave" };
for (const [name, path] of Object.entries(pages)) {
  const h = await (await fetch("https://giovanni-serrano.webflow.io/" + path)).text();
  console.log("=====", name);
  let i = -1, found = 0;
  while ((i = h.indexOf("nav-toggle", i + 1)) !== -1) {
    found++;
    console.log("...", h.slice(Math.max(0, i - 120), i + 80).replace(/\s+/g, " "));
    if (found > 8) break;
  }
  console.log("occurrences:", found);
}
