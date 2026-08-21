# Asana comment: research handoff

Paste-ready. Attach `West-LA-Implants-Research-2026-08-21.zip` to the same comment.

---

**Competitor and content gap research is done. Package attached.**

Both sites were crawled in full from their sitemaps on Aug 20: **91 of 91** client URLs and
**79 of 79** competitor URLs, zero failures. Benchmark is **Wilshire Oral Surgery, 12300
Wilshire Blvd**, directly across the street from the client at 12301, same lead procedure,
comparable site size. Five other candidates were screened and rejected on record.

**What we found**

- They publish **58% more words across 12 fewer URLs**. Their pages run **1.8x deeper**.
- **31 neighborhood landing pages** (9 Westside areas x 4 services). The client has **0**.
- They publish **prices**: All-on-4 from $9,990, "$110/month", 0% financing. The client
  publishes no price for any procedure, only lender credit limits.
- **"Board-certified" appears 192 times** on their site and **0 times** on the client's.
  The client's homepage H1 is "General Dentist".
- An **FAQ block on 44** of their pages, on **1** of the client's.

**Where the client already wins**, and what the rebuild should lead with: Yomi robotic-guided
surgery (the competitor has none), full restorative and cosmetic breadth, a 219-asset media
library with named patient video, 46 blog posts, and the only structured data of the two sites.

**Two defects worth fixing whatever the scope ends up being**

1. `/schedule/` is an unbranded third-party app shell with the page title "Evspatient".
   Every booking click leaves the brand at the moment of highest intent.
2. The site-wide phone CTA is the **current-patient** line. The new-patient number appears on
   4 of 91 pages, so new-patient calls are landing in the wrong queue and any call tracking
   on that number is measuring almost nothing.

**This settles the page count.** 28 to 34 designed pages closes the competitive gap, or back
toward 24 if the neighborhood set ships as one CMS-templated page instead of six designed
ones. At 2 days per page that is 56 to 68 execution days. We need sign-off on that number
before design starts.

**Still blocking:** (1) a vector logo, the only mark that exists is a 250 x 200 px, 5 KB PNG;
(2) patient consent for Leslie, Emily and Michael (stills and B-roll).

**In the zip:** open `West-LA-Implants-Research.html` for the whole thing in a browser. Also
inside: the four reports as markdown, 12 CSV/JSON evidence tables, and the readable text of
all 170 pages across both sites.

---

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../SYSTEM_RULES.md). The zip itself is
gitignored; this comment text and the underlying reports are committed.
