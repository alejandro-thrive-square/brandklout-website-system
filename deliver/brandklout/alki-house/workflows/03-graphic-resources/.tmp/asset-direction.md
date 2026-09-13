# Asset direction — Alki House

Set 2026-09-13. Everything visual the site loads comes from one of three pipelines, all
reproducible from this folder.

## 1. Product photography — `harvest-product-images.mjs`

One folder per product slug under `product-images/`, up to five angles, harvested from the open
web by model name (DuckDuckGo images first, Bing as fallback), scored by host, size and whether the
corners are white, verified with Pillow and de-duplicated by perceptual hash. `manifest.json`
records source and page URL per file, plus `ok` / `thin` / `none` per product.

Direction: **cut-outs float on the coffee stage.** `04-design/.tmp/site-src/prepare-assets.py`
knocks the white ground out (corner flood fill, feathered), squares the canvas and writes WebP with
alpha into `site-src/assets/products/<slug>/N.webp`; a shot with a real background is kept as a
photo and flagged `cutout:false` in `assets/products/index.json` so the card shows it edge to edge.
No product ever renders in a white box on the dark ground; products with no usable shot get their
category glyph on the plate.

Licensing note: these are manufacturer and retailer marketing images gathered for the design
draft. Before launch the client replaces them with their own photographs of the actual units (the
sheet's `images` column), or confirms which manufacturer images they are entitled to use.

## 2. Scenes — `generate-scenes.mjs`

Decorative imagery in palette (Dark Coffee grounds, Autumn Ember light, Light Apricot highlights):

| Kind | Where | What |
| :--- | :--- | :--- |
| AI renders (Mystic 2k; one Seedream) | `scenes/ai/` | hero-gimbal, hero-gimbal-portrait, studio-lighting, audio-desk, rig-build, adapter-macro, creator-room, softbox-glow, product-stage, monitor-glow |
| Video loops (Kling 2.5 pro, 5 s) | `scenes/video/` | hero-gimbal, hero-gimbal-portrait, studio-lighting |
| Licensed stock (Freepik premium) | `scenes/stock/` | ten photographs: studio softboxes, gimbal in use, filmmaker on set, lav mic, cinema rig, lens adapter, LED panel, dark backdrop, creator desk |

`scenes/scenes-manifest.json` carries prompt, resource id, licence, dimensions and the review note
for each file, including nine rejected renders (fake brand lettering was the recurring fault) kept as
`.rejected-N.jpg`. `prepare-assets.py` writes the web copies to `site-src/assets/scenes/`.

Where each scene is used: hero film (hero-gimbal + portrait), the category rail (one scene per
aisle), The Stage plate (product-stage), The Promise (studio-lighting), The Set kits (creator-room,
audio-desk, rig-build), The Way (softbox-glow), the catalogue arrival (studio-lighting). The stock
photographs are held in reserve for the product page and later pages.

## 3. Brand

`site-src/assets/logo-mark.png` (apricot strokes, transparent) and `logo-mark-dark.png` (coffee
strokes) are extracted from `Brand/Alkihouse Logo.png` by colour distance; `favicon.svg` is a
simplified A on coffee.

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../../SYSTEM_RULES.md). Images and video
are gitignored; the scripts, manifests and this note are tracked.
