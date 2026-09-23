// Live functional gate for the runtime-state CSS the prune touches.
// Static "the rule is present" checks cannot see this: a state class is applied
// by JS, so the only proof is driving the page and reading computed style.
import { open } from "./cdp.mjs";
const BASE = process.argv[2] || "https://encorercm.com";
const out = [];
const t = (name, pass, detail = "") => { out.push({ name, pass, detail }); console.log(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`); };

// ---- desktop: nav solid on scroll, before/after slider ----
{
  const b = await open(BASE + "/smile-gallery", 1440, 900);
  const r = JSON.parse(await b.evalx(`(async()=>{
    const nav = document.querySelector('.nav');
    const before = { cls: nav.className, bg: getComputedStyle(nav).backgroundColor };
    WZ.smoother ? WZ.smoother.scrollTop(1200) : window.scrollTo(0,1200);
    await new Promise(r=>setTimeout(r,1500));
    const after = { cls: nav.className, bg: getComputedStyle(nav).backgroundColor };
    // before/after slider
    const range = document.querySelector('.pk-ba input[type=range]');
    const fig = range ? range.closest('.pk-ba') : null;
    const clipBefore = fig ? getComputedStyle(fig.querySelector('img:last-of-type') || fig).clipPath : null;
    let clipAfter = null, tagOK = null;
    if (range) {
      range.value = 15; range.dispatchEvent(new Event('input', {bubbles:true}));
      await new Promise(r=>setTimeout(r,400));
      clipAfter = getComputedStyle(fig.querySelector('img:last-of-type') || fig).clipPath;
      const tb = fig.querySelector('.ba-tag-before'), ta = fig.querySelector('.ba-tag-after');
      tagOK = !!(tb && ta) && getComputedStyle(tb).backgroundColor !== getComputedStyle(ta).backgroundColor;
    }
    return JSON.stringify({ before, after, hasRange: !!range, clipBefore, clipAfter, tagOK });
  })()`, true));
  t("nav takes its scrolled state", /is-solid/.test(r.after.cls) && !/is-solid/.test(r.before.cls), r.after.cls.trim());
  t("the scrolled nav actually repaints", r.before.bg !== r.after.bg, `${r.before.bg} -> ${r.after.bg}`);
  t("before/after slider is present", r.hasRange);
  t("dragging the slider moves the reveal", r.hasRange && r.clipBefore !== r.clipAfter, `${r.clipBefore} -> ${r.clipAfter}`);
  t("the two before/after tags are styled apart", r.tagOK === true);
  b.close();
}
// ---- mobile: burger, drawer ----
{
  const b = await open(BASE + "/", 390, 800);
  const r = JSON.parse(await b.evalx(`(async()=>{
    const burger = document.querySelector('#burger, .burger');
    const drawer = document.querySelector('.drawer');
    const nav = document.querySelector('.nav');
    const rd = () => { const c = getComputedStyle(drawer); return { clip: c.clipPath, op: c.opacity, cls: drawer.className }; };
    const shut = rd();
    burger.click(); await new Promise(r=>setTimeout(r,900));
    const open_ = { ...rd(), nav: nav.className, linkOp: getComputedStyle(drawer.querySelector('.dr-col li a')).opacity };
    document.dispatchEvent(new KeyboardEvent('keydown', {key:'Escape', bubbles:true}));
    await new Promise(r=>setTimeout(r,900));
    const shut2 = rd();
    return JSON.stringify({ shut, open_, shut2 });
  })()`, true));
  const closed = (x) => /circle\(0%|circle\(0px/.test(x.clip);
  const opened = (x) => /circle\(/.test(x.clip) && !closed(x);
  t("drawer starts clipped shut", closed(r.shut), r.shut.clip);
  t("burger opens the drawer", opened(r.open_), `${r.open_.clip}  ${r.open_.cls.trim()}`);
  t("the nav takes its menu-open state", /is-menu-open/.test(r.open_.nav), r.open_.nav.trim());
  t("drawer links are revealed, not left at 0", r.open_.linkOp === "1", `link opacity ${r.open_.linkOp}`);
  t("Escape clips the drawer shut again", closed(r.shut2), r.shut2.clip);
  b.close();
}
const bad = out.filter(o => !o.pass);
console.log(`\n${out.length - bad.length}/${out.length} live state checks passed`);
process.exit(bad.length ? 1 : 0);
