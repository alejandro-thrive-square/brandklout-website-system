#!/usr/bin/env node
// video-posters.mjs — replace every empty native Video element on a v2 page with a poster
// image that links to the film.
//
// A `Video` element whose source is set through this API publishes as
// `<div class="w-video w-embed"></div>` — nothing inside it. Webflow builds the embed markup
// only when the Designer fetches oEmbed for the URL, and the reference pages get their
// visible videos from HtmlEmbed iframes, which this build may not use (their own Video
// elements are all hidden). So each Video becomes:
//
//   LinkBlock .lp_video_link -> youtube watch url
//     Image   .lp_video_poster   (the uploaded poster frame)
//     span    .lp_video_play     "▶"
//
// The Video's stored {src, title} is read first, so each poster keeps its own film.
//
// Usage: node video-posters.mjs <v2-slug>
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { call, SITE, page } from "./lib.mjs";

const SLUG = process.argv[2] || "cosmetic-v2";
const P = page(SLUG);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const POSTERS = JSON.parse(fs.readFileSync(path.join(HERE, "poster-map.json"), "utf8"));
const walk = (n, o = []) => { o.push(n); (n.children || []).forEach((k) => walk(k, o)); return o; };

const readPage = () => walk(call("data_element_tool", {
  context: "Read the v2 page to find the video elements that publish empty.",
  siteId: SITE, pageId: P.page,
  actions: [{ label: "b", query_elements: { queries: [{ label: "b", element_id: { component: P.page, element: P.body }, children_depth: -1 }] } }],
})[0].result[0].data[0].matches[0]);

const videos = readPage().filter((n) => n.type === "Video");
console.log(`${videos.length} Video element(s)`);

for (const v of videos) {
  const stored = call("data_element_settings_tool", {
    context: "Read a video element's source so its poster keeps the right film.",
    siteId: SITE, pageId: P.page,
    actions: [{ label: "g", get_settings: { type: "all_raw_settings", element_id: { component: P.page, element: v.id.element } } }],
  })[0].result[0].data.matches.find((m) => m.key === "video")?.value;
  const src = stored?.src;
  const id = src?.split("v=")[1];
  const poster = id && POSTERS[id];
  if (!poster) { console.log("no poster for", src, "- left as is"); continue; }

  call("data_element_builder", {
    context: "Replace an empty native video element with a poster image linking to the film.",
    siteId: SITE, pageId: P.page,
    actions: [{
      build_label: "poster",
      parent_element_id: { component: P.page, element: v.id.element },
      creation_position: "before",
      element_schema: {
        type: "LinkBlock",
        set_style: { style_names: ["lp_video_link"] },
        set_link: { link_type: "url", link: src },
        children: [
          { type: "Image", set_style: { style_names: ["lp_video_poster"] },
            set_image_asset: { image_asset_id: poster.assetId, alt_text: "Watch this Grand Mission Dentistry patient story on YouTube" } },
          { type: "DOM", set_style: { style_names: ["lp_video_play"] },
            set_dom_config: { dom_tag: "span" }, set_text: { text: "▶" } },
        ],
      },
    }],
  });
  call("data_element_tool", {
    context: "Remove the empty video element now that the poster link stands in its place.",
    siteId: SITE, pageId: P.page,
    actions: [{ label: "rm", remove_element: { id: { component: P.page, element: v.id.element } } }],
  });
  console.log("poster placed for", id);
}

const after = readPage();
console.log("Video elements left:", after.filter((n) => n.type === "Video").length,
  "| poster links:", after.filter((n) => (n.styleNames || []).includes("lp_video_link")).length);
