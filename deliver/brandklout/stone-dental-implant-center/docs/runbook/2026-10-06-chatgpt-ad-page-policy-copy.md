# 2026-10-06 — ChatGPT ad landing page: OpenAI ad-policy copy fixes, LIVE

The ChatGPT ad for All-on-X was rejected. The rejection was attributed to copy that breaks
https://openai.com/policies/ad-policies/. Page: `/ads-landing-pages/all-on-x-landing-page-chat-gpt`
(id `6aa46154dc955b61a5b54020`, site `6a07d5aac093f0e4521d29bc`). Edited in place through the
Webflow MCP (`data_element_tool` set_text / remove_element), then a full-site publish to both
domains at about 15:05 UTC.

## Done
* Hero bullets: "full arch… often the same day" became "Qualifying patients may receive a fixed
  temporary arch on the day of surgery". "gentle, minimally invasive" became "Sedation options from
  nitrous oxide to IV sedation, discussed at your consultation". "Severe bone loss welcome… other
  clinics turned down" became "Complex cases are evaluated individually using 3D imaging".
* The same claims were changed everywhere else they appeared on the page: the sedation card, the
  complex-case card, the doctor bullet, chapter 03, step 02, the zygomatic option card, the option
  table ("Often same-day teeth" became "4 to 6 months"), and the FAQ answers on bone loss, sedation
  and timeline.
* Removed: the Smile Gallery section (6 before/after photos), the "Before → After" image in the
  journey section, the Life Before / Life After columns, and the hero lead-in "Tired of failing
  teeth…". Distress copy in the journey intro, chapter 01 and the final CTA was rewritten in
  neutral terms.
* FAQ price changed from $17,000–$25,000+ to **$25,000–$50,000+ per arch**, which matches the
  service page `/services/all-on-x-implants` and the figure in ALL-ON-X-CAMPAIGN.md. This is the
  client's own published figure, not a number we priced.
* Page title + SEO title: "All-on-X Dental Implant Consultation | Stone Dental Implant Center".
  The SEO description no longer says "same-day… complex cases welcome".
* Verified on the live page: none of the flagged phrases appear, and 12/12 embeds and 9/9 video
  iframes are intact.

## Next
* Resubmit the ad in OpenAI's ad manager. That is the user's or Brandklout's step.
* Confirm $25k–$50k with the client. The $17k figure came from whoever built this page on
  2026-09-11.
* The main `/ads-landing-pages/all-on-x` page (Google Ads) still uses the original claims. It was
  not in scope.

## Gotchas
* `set_text` works directly on `String` node ids, so you can edit text inside a paragraph without
  losing its spans.
* This page was not built from `content.py`. Someone edited it in the Designer, so a rebuild script
  would overwrite these fixes.
