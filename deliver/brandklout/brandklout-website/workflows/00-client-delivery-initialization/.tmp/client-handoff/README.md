# Client handoff — Brandklout website

Drop the source material here, once, exactly as received.

- **`preview (1).html`** (the name it arrived with, kept): the page Sang (Brandklout CEO) built with ChatGPT. It goes here
  as-is, including any stylesheets, scripts or images that came with it. Do not edit this copy.
  Any cleanup happens on a working copy under `../../../21-instatic-upload/.tmp/`, so this file
  always shows what Sang actually sent.
- **`BrandKlout-Preview1-Website-Package (1).zip`** (2026-09-11, v2): seven pages, three
  stylesheets. The zip is kept as received (gitignored). It is unpacked, never over itself, into
  **`package-v2/`**, which is the source `21-instatic-upload/prepare-source.mjs` reads. Its
  `preview (1).html` is byte-identical to its `index.html`. The v1 file above stays as it was.
- **`BrandKlout-Complete-Website-v11.zip`** (2026-09-14, v11, **replaces v2**): 33 flat pages
  sharing six stylesheets and three scripts, plus Sang's own README, CHANGELOG, QA summary and
  `tools/`. Kept as received (gitignored), unpacked into **`package-v11/`**, which is what
  `prepare-source.mjs package-v11` reads (its shared-layout branch). Its media and
  `OPEN-ME.html` (a 1.3MB self-contained preview with every image inlined) are gitignored; the
  pages, CSS, JS and notes are committed.
- Anything else Sang sends that belongs to the first handoff (logo files, brand notes, the
  compliance request itself) goes here too. Later material goes in the `.tmp/` of the workflow
  that uses it.

Binary files (images, fonts, zips) are gitignored and synced as heavy assets. The HTML itself is
lightweight and is committed.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../../../../SYSTEM_RULES.md). Commit the HTML; never commit
credentials or media.
