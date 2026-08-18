#!/usr/bin/env node
// videos.mjs — give every embedded video on a v2 page its YouTube source.
//
// THE TRAP: `data_element_builder` offers BOTH `Video` and `YouTubeVideo` element types, and
// the obvious one is wrong. A `YouTubeVideo` element's `video` setting cannot be written —
// every value shape answers `Invalid value for setting "video": expected video` — while the
// identical write on a plain `Video` element succeeds. The reference pages use `Video` too.
// The builder also has NO setter for the source at creation (set_video / set_youtube_video
// and friends are silently ignored), so the URL is always a settings pass afterwards.
//
// This pass therefore: replaces any YouTubeVideo with a Video in the same position, then
// writes {src, title} onto every Video in page order from the reference's iframe order.
//
// Usage: node videos.mjs <v2-slug> <ref-section-index...>
import { call, SITE, page, tree, all } from "./lib.mjs";

const SLUG = process.argv[2] || "cosmetic-v2";
const SECTIONS = process.argv.slice(3).map(Number);
const P = page(SLUG);
const walk = (n, o = []) => { o.push(n); (n.children || []).forEach((k) => walk(k, o)); return o; };

const readPage = () => walk(call("data_element_tool", {
  context: "Read the v2 page tree to locate its video elements in document order.",
  siteId: SITE, pageId: P.page,
  actions: [{ label: "b", query_elements: { queries: [{ label: "b", element_id: { component: P.page, element: P.body }, children_depth: -1 }] } }],
})[0].result[0].data[0].matches[0]);

// 1. swap every YouTubeVideo for a Video in the same slot
let nodes = readPage();
const wrong = nodes.filter((n) => n.type === "YouTubeVideo");
for (const y of wrong) {
  call("data_element_builder", {
    context: "Replace a YouTubeVideo element with a native Video element, whose source is writable.",
    siteId: SITE, pageId: P.page,
    actions: [{
      build_label: "v", parent_element_id: { component: P.page, element: y.id.element },
      creation_position: "before",
      element_schema: { type: "Video", ...(y.styleNames?.length ? { set_style: { style_names: y.styleNames } } : {}) },
    }],
  });
  call("data_element_tool", {
    context: "Remove the YouTubeVideo element now that a writable Video has taken its place.",
    siteId: SITE, pageId: P.page,
    actions: [{ label: "rm", remove_element: { id: { component: P.page, element: y.id.element } } }],
  });
  console.log("swapped YouTubeVideo -> Video", y.id.element.slice(0, 8));
}

// 2. write the sources, matching page order against the reference's iframe order
nodes = readPage();
const videos = nodes.filter((n) => n.type === "Video");
const T = tree(SLUG.replace(/-v2$/, ""));
const refs = SECTIONS.flatMap((i) => all(T.sections[i], (n) => n.tag === "iframe"))
  .map((n) => n.src.replace("/embed/", "/watch?v="));
if (videos.length !== refs.length) {
  throw new Error(`page has ${videos.length} Video elements but the reference sections give ${refs.length} sources`);
}
const title = (url) => `Grand Mission Dentistry video (${url.split("v=")[1]})`;
call("data_element_settings_tool", {
  context: "Write each native video element its YouTube source and title.",
  siteId: SITE, pageId: P.page,
  actions: [{
    label: "src",
    set_settings: {
      operations: videos.map((v, i) => ({
        element_id: { component: P.page, element: v.id.element },
        settings: [{ key: "video", static_video: { src: refs[i], title: title(refs[i]) } }],
      })),
    },
  }],
});

// 3. read back — a write echo is not proof
for (const v of readPage().filter((n) => n.type === "Video")) {
  const s = call("data_element_settings_tool", {
    context: "Read each video element back to confirm its source landed.",
    siteId: SITE, pageId: P.page,
    actions: [{ label: "g", get_settings: { type: "all_raw_settings", element_id: { component: P.page, element: v.id.element } } }],
  })[0].result[0].data.matches.find((m) => m.key === "video");
  console.log("Video", v.id.element.slice(0, 8), JSON.stringify(s?.value));
}
