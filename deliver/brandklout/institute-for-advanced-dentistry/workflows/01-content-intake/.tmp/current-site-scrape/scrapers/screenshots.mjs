// Full-page desktop screenshots of every page in ../site-data.json, plus a text
// extract per page (title, meta description, headings, body text) to ../pages/.
//
// Usage: node screenshots.mjs           live site -> ../screenshots/desktop/
//        node screenshots.mjs --local   file:// mirror -> ../screenshots/local-check/
//        node screenshots.mjs --only /dental-services/dental-implants/
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import puppeteer from "puppeteer-core";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(HERE, "..");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const local = process.argv.includes("--local");
const onlyIdx = process.argv.indexOf("--only");
const only = onlyIdx > -1 ? process.argv[onlyIdx + 1] : null;
const SHOTS = path.join(OUT, "screenshots", local ? "local-check" : "desktop");
const PAGES = path.join(OUT, "pages");
fs.mkdirSync(SHOTS, { recursive: true });
if (!local) fs.mkdirSync(PAGES, { recursive: true });

const data = JSON.parse(fs.readFileSync(path.join(OUT, "site-data.json"), "utf8"));
const slugOf = (url) => {
  const p = new URL(url).pathname.replace(/^\/|\/$/g, "");
  return p ? p.replace(/\//g, "__") : "home";
};
let targets = data.pages.filter((p) => p.status === "ok");
// --only takes a slug ("home", "dental-services__dental-implants"); a bare "/" is
// rewritten to the MSYS root by Git Bash, so paths are unreliable here.
if (only) {
  const wanted = new Set(only.split(","));
  targets = targets.filter((p) => wanted.has(new URL(p.url).pathname) || wanted.has(slugOf(p.url)));
}
// --shard k/n runs every n-th page starting at k, so several Chromes can work at once;
// extracts go to page-extracts-<k>.json and inventory.mjs merges them.
const shardIdx = process.argv.indexOf("--shard");
const [shardK, shardN] = shardIdx > -1 ? process.argv[shardIdx + 1].split("/").map(Number) : [0, 1];
targets = targets.filter((_, i) => i % shardN === shardK);
const extractsFile = path.join(OUT, shardN > 1 ? `page-extracts-${shardK}.json` : "page-extracts.json");

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--hide-scrollbars", "--disable-blink-features=AutomationControlled", "--window-size=1440,1000"],
  defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
});
const page = await browser.newPage();
await page.setUserAgent(
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
);

const results = [];
for (const t of targets) {
  const slug = slugOf(t.url);
  const url = local ? pathToFileURL(path.join(OUT, "site", ...t.rel.split("/"))).href : t.url;
  const file = path.join(SHOTS, `${slug}.png`);
  try {
    // DOM-ready, then wait for fonts + images with a cap. "load" blocks on the 6.6 MB hero
    // video, Vimeo iframes and GTM/Trustindex beacons and ran to the 60 s timeout.
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.evaluate(async () => {
      await Promise.race([
        Promise.all([
          document.fonts.ready,
          // lazy images never fire until scrolled to, so they must not hold this up
          ...[...document.images]
            .filter((i) => i.loading !== "lazy")
            .map((i) => (i.complete ? null : new Promise((r) => i.addEventListener("load", r, { once: true }) && i.addEventListener("error", r, { once: true })))),
        ]),
        new Promise((r) => setTimeout(r, 12000)),
      ]);
    });
    await new Promise((r) => setTimeout(r, local ? 800 : 2000));
    await page.evaluate(() => {
      document.documentElement.style.scrollBehavior = "auto";
      document.body.style.scrollBehavior = "auto";
    });
    // walk the page so lazy images and scroll-triggered motion resolve
    await page.evaluate(async () => {
      const step = Math.floor(innerHeight * 0.7);
      for (let y = 0; y < document.body.scrollHeight + step; y += step) {
        scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 180));
      }
      scrollTo(0, 0);
    });
    await new Promise((r) => setTimeout(r, 1500));
    // lazy <img loading=lazy> that are still pending: force them
    await page.evaluate(() => {
      document.querySelectorAll("img[loading='lazy']").forEach((i) => (i.loading = "eager"));
    });
    // now every image is eager: wait for the lot (smile-gallery has 160 before/afters), cap 20 s
    await page.evaluate(async () => {
      await Promise.race([
        Promise.all([...document.images].map((i) => (i.complete ? null : new Promise((r) => i.addEventListener("load", r, { once: true }) && i.addEventListener("error", r, { once: true }))))),
        new Promise((r) => setTimeout(r, 20000)),
      ]);
    });
    await new Promise((r) => setTimeout(r, 800));
    // Motion.page / GSAP scroll-triggered blocks sit at inline opacity:0 until their
    // trigger scrolls into view and reverse when it leaves (home "difference-section"
    // is a blank gold band otherwise). Reveal them so the shot shows the designed state.
    await page.mouse.move(720, 850);
    const revealed = await page.evaluate(() => {
      let n = 0;
      // content only: the Bricks header/mega-menu also carries inline styles and
      // revealing it paints the open "About" dropdown over the hero
      document.querySelectorAll("[style]").forEach((el) => {
        if (el.closest("header, nav, #brx-header, .brx-dropdown-content, .brxe-nav-menu, .brxe-nav-nested, footer")) return;
        const cs = getComputedStyle(el);
        if (cs.opacity === "0" || cs.visibility === "hidden" || (el.style.transform && el.style.transform !== "none")) {
          el.style.setProperty("opacity", "1", "important");
          el.style.setProperty("visibility", "visible", "important");
          el.style.setProperty("transform", "none", "important");
          el.style.setProperty("clip-path", "none", "important");
          n++;
        }
      });
      return n;
    });
    await new Promise((r) => setTimeout(r, 400));
    const height = await page.evaluate(() => Math.max(document.documentElement.scrollHeight, document.body.scrollHeight));
    // clip to the 1440 viewport width: the live site has an element that overflows to ~1626px
    await page.screenshot({ path: file, captureBeyondViewport: true, clip: { x: 0, y: 0, width: 1440, height } });

    if (!local) {
      const extract = await page.evaluate(() => {
        const q = (s) => document.querySelector(s);
        const meta = (n) => q(`meta[name='${n}']`)?.content || q(`meta[property='${n}']`)?.content || "";
        const main = q("main") || q("#brx-content") || document.body;
        const heads = [...main.querySelectorAll("h1,h2,h3")].map((h) => `${"#".repeat(+h.tagName[1])} ${h.innerText.trim()}`);
        const clone = main.cloneNode(true);
        clone.querySelectorAll("script,style,noscript,svg").forEach((n) => n.remove());
        const text = clone.innerText.replace(/\n{3,}/g, "\n\n").trim();
        const imgs = [...main.querySelectorAll("img")].map((i) => ({ src: i.currentSrc || i.src, alt: i.alt }));
        const videos = [...document.querySelectorAll("video source, video[src], iframe")].map((v) => v.src).filter(Boolean);
        return {
          title: document.title,
          description: meta("description"),
          ogImage: meta("og:image"),
          canonical: q("link[rel=canonical]")?.href || "",
          h1: q("h1")?.innerText.trim() || "",
          heads,
          text,
          imgs,
          videos,
          words: text.split(/\s+/).filter(Boolean).length,
        };
      });
      const md = [
        `# ${extract.h1 || extract.title}`,
        ``,
        `- URL: ${t.url}`,
        `- Title: ${extract.title}`,
        `- Meta description: ${extract.description}`,
        `- Canonical: ${extract.canonical}`,
        `- OG image: ${extract.ogImage}`,
        `- Words: ${extract.words}`,
        `- Screenshot: screenshots/desktop/${slug}.png`,
        ``,
        `## Outline`,
        ...extract.heads.map((h) => `- ${h}`),
        ``,
        `## Images on page`,
        ...extract.imgs.map((i) => `- ${i.src}${i.alt ? ` — alt: "${i.alt}"` : ""}`),
        ...(extract.videos.length ? [``, `## Video / embeds`, ...extract.videos.map((v) => `- ${v}`)] : []),
        ``,
        `## Text`,
        ``,
        extract.text,
        ``,
      ].join("\n");
      fs.writeFileSync(path.join(PAGES, `${slug}.md`), md);
      results.push({ url: t.url, slug, words: extract.words, title: extract.title, description: extract.description, h1: extract.h1 });
    }
    const st = fs.statSync(file);
    console.log(`shot ${slug}.png (${(st.size / 1024).toFixed(0)} KB)`);
  } catch (e) {
    console.log(`FAIL ${slug}: ${e.message}`);
    results.push({ url: t.url, slug, error: e.message });
  }
}
await browser.close();
if (!local) fs.writeFileSync(extractsFile, JSON.stringify(results, null, 2));
console.log(`done: ${results.filter((r) => !r.error).length || targets.length} pages`);
