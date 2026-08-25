// Runs inside the (script-disabled) page. Returns a plain JSON-able object.
// `src`/`srcset` were renamed to data-* by the sanitiser so nothing loads.

var ORIGIN = "https://bestdentistinkatytx.com";
var clean = function (s) { return (s || "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim(); };
var rel = function (u) {
  if (!u) return "";
  u = u.trim();
  if (u.indexOf(ORIGIN) === 0) u = u.slice(ORIGIN.length) || "/";
  return u;
};
var imgOf = function (el) {
  if (!el) return null;
  var src = el.getAttribute("data-img-src") || el.getAttribute("data-lazy-src") || "";
  var set = el.getAttribute("data-srcset") || "";
  if (!src && set) src = set.split(",")[0].trim().split(" ")[0];
  if (!src) return null;
  return {
    src: rel(src),
    alt: clean(el.getAttribute("alt")),
    w: Number(el.getAttribute("width")) || null,
    h: Number(el.getAttribute("height")) || null,
    srcset: set ? set.split(",").map(function (s) { return rel(s.trim().split(" ")[0]); }) : [],
  };
};

// ------------------------------------------------------- strip site chrome
// Header, footer, mobile menu, cookie bars, injected overlays, third-party
// review widgets that re-render themselves — none of it is page content.
var KILL = [
  "header", "footer", "nav", "script", "style", "noscript", "link",
  ".sc_layouts_row", ".menu_mobile", ".menu_mobile_content_wrap", "#menu_mobile",
  ".top_panel", ".footer_wrap", ".breadcrumbs", ".sc_layouts_menu",
  ".elementor-location-header", ".elementor-location-footer",
  "[data-sm]", ".trustindex-widget-loader", ".ti-widget-container",
  ".sidebar", ".widget_area", ".comments_wrap", ".post_navigation",
  ".scroll_to_top", ".custom-scroll-links", ".gtranslate_wrapper",
  // interactive widgets that are re-created by JS on the rebuilt site, and whose
  // static markup is nothing but noise (a whole month of <div data-date>)
  "[data-calendar-id]", ".trx_sc_calendar", ".sc_calendar", ".booking_calendar",
  ".elementor-search-form", ".search_wrap", ".mfp-hide", ".elementor-popup-modal",
];
var scrub = function (root) {
  KILL.forEach(function (sel) {
    var n = root.querySelectorAll(sel);
    for (var i = 0; i < n.length; i++) n[i].remove();
  });
  return root;
};

// ---------------------------------------------------------- content HTML tidy
// WordPress/Elementor output is full of presentational <span style="font-weight:400">
// wrappers, empty paragraphs and inline colours. Keep structure, drop the noise.
var tidy = function (root) {
  var spans = root.querySelectorAll("span");
  for (var i = spans.length - 1; i >= 0; i--) {
    var s = spans[i];
    if (!s.className && (!s.getAttribute("style") || /font-weight|color|font-family|font-size/i.test(s.getAttribute("style")))) {
      var strongish = /font-weight:\s*(bold|[6-9]00)/i.test(s.getAttribute("style") || "");
      if (strongish) {
        var b = document.createElement("strong");
        b.innerHTML = s.innerHTML;
        s.replaceWith(b);
      } else {
        s.replaceWith.apply(s, Array.prototype.slice.call(s.childNodes));
      }
    }
  }
  var all = root.querySelectorAll("*");
  for (var j = 0; j < all.length; j++) {
    var e = all[j];
    e.removeAttribute("style");
    e.removeAttribute("class");
    e.removeAttribute("id");
    e.removeAttribute("data-settings");
    e.removeAttribute("decoding");
    e.removeAttribute("loading");
    e.removeAttribute("sizes");
    e.removeAttribute("title");
    if (e.tagName === "A") {
      var h = e.getAttribute("href");
      if (h) e.setAttribute("href", rel(h));
      e.removeAttribute("target");
      e.removeAttribute("rel");
    }
    if (e.tagName === "IMG") {
      var im = imgOf(e);
      if (im) { e.setAttribute("src", im.src); e.setAttribute("alt", im.alt); }
      e.removeAttribute("data-img-src");
      e.removeAttribute("data-srcset");
      e.removeAttribute("srcset");
    }
  }
  var ps = root.querySelectorAll("p, div");
  for (var k = ps.length - 1; k >= 0; k--) {
    if (!clean(ps[k].textContent) && !ps[k].querySelector("img")) ps[k].remove();
  }
  return root.innerHTML.replace(/\s+/g, " ").replace(/>\s+</g, "> <").trim();
};

// -------------------------------------------------------------- block walker
// For Elementor-built pages there is no single .entry-content, so walk the
// content region and emit semantic blocks in document order.
var blocksOf = function (root) {
  var out = [];
  var seen = {};
  var section = 0;
  var push = function (b) {
    var key = b.type + "|" + (b.text || b.src || b.href || "");
    if (b.type !== "image" && seen[key]) return;   // Elementor duplicates copy for tablet/mobile
    seen[key] = 1;
    b.section = section;
    out.push(b);
  };
  var walk = function (el) {
    for (var i = 0; i < el.children.length; i++) {
      var c = el.children[i];
      var tag = c.tagName;
      // Elementor top-level sections are the page's real seams — number them so
      // the rebuild can keep the original section order and grouping.
      if (c.classList && c.classList.contains("elementor-top-section")) section++;
      if (/^H[1-6]$/.test(tag)) {
        var t = clean(c.textContent);
        if (t) push({ type: "heading", level: Number(tag[1]), text: t });
        continue;
      }
      if (tag === "P") {
        var p = clean(c.textContent);
        if (p) push({ type: "para", text: p, html: tidyFragment(c) });
        continue;
      }
      if (tag === "UL" || tag === "OL") {
        var items = [];
        for (var li = 0; li < c.children.length; li++) {
          var v = clean(c.children[li].textContent);
          if (v) items.push(v);
        }
        if (items.length) push({ type: "list", ordered: tag === "OL", items: items });
        continue;
      }
      if (tag === "IMG") { var im = imgOf(c); if (im) push({ type: "image", ...im }); continue; }
      if (tag === "A" && /elementor-button|sc_button|button/i.test(c.className || "")) {
        var lt = clean(c.textContent);
        if (lt) push({ type: "cta", text: lt, href: rel(c.getAttribute("href")) });
        continue;
      }
      if (tag === "IFRAME") {
        push({ type: "embed", src: rel(c.getAttribute("data-embed-src") || "") });
        continue;
      }
      if (tag === "TABLE") { push({ type: "table", html: tidyFragment(c) }); continue; }
      walk(c);
    }
  };
  var tidyFragment = function (node) {
    var holder = document.createElement("div");
    holder.appendChild(node.cloneNode(true));
    return tidy(holder);
  };
  walk(root);
  return out;
};

// ------------------------------------------------------------------- dispatch
var doc = document;
var region = doc.querySelector(".page_content_wrap") || doc.querySelector("main") || doc.body;
var work = region.cloneNode(true);
scrub(work);

var out = { kind: "elementor", featured: null, heading: "", html: "", blocks: [], words: 0, embeds: [], images: [] };

// every image referenced anywhere in the content region, for the asset manifest
var imgs = work.querySelectorAll("img");
for (var i = 0; i < imgs.length; i++) { var m = imgOf(imgs[i]); if (m) out.images.push(m); }
var ifr = work.querySelectorAll("iframe");
for (var i2 = 0; i2 < ifr.length; i2++) out.embeds.push(rel(ifr[i2].getAttribute("data-embed-src") || ""));

var svc = work.querySelector(".services_page_content");
var ent = work.querySelector(".entry-content, .post_content");
var fea = work.querySelector(".services_page_featured img, .post_featured img");
var ttl = work.querySelector(".services_page_title, .post_title, h1");

// An Elementor-built page has no usable `.entry-content` — the "content" is the
// whole page-builder tree, calendar widgets and duplicated tablet/mobile copies
// included. Those go through the block walker instead, whatever else matches.
var elementorBuilt = !!work.querySelector("[data-elementor-type]");

if (svc) {
  out.kind = "service";
  out.featured = imgOf(fea);
  out.heading = clean(ttl && ttl.textContent);
  out.html = tidy(svc);
} else if (!elementorBuilt && ent && clean(ent.textContent).split(/\s+/).length > 60) {
  out.kind = "article";
  out.featured = imgOf(fea);
  out.heading = clean(ttl && ttl.textContent);
  out.html = tidy(ent);
} else {
  out.kind = "elementor";
  out.heading = clean(ttl && ttl.textContent);
  out.blocks = blocksOf(work);
}
out.words = clean(work.textContent).split(/\s+/).filter(Boolean).length;
return out;
