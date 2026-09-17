## DONE 2026-08-27 (session 17): the Vimeo desktop/mobile swap — DRAFT, not published

Client placed two Vimeo Embeds in Chapter 03 (`.ch-specialist`) and could not
make them swap by breakpoint: "it wouldn't work like on webflow". Nothing was
broken. The panel had done exactly what it was told, and what it was told was
not what they meant.

### What was stored, and why it looked like a bug

```
.vimeo-deskop   base { display:none }   tablet { display:none }
.vimeo-mobile   base { display:none }   tablet { display:block }
```

Base `display:none` on `.vimeo-deskop` hid the desktop video at **every** width,
so above 768px neither video rendered. The client's tablet edit had landed
correctly — `tablet { display:none }` is theirs — but it was invisible work,
because base was already hiding the element everywhere.

### Now (verified against the draft)

```
.vimeo-deskop   base { display:block }  tablet { display:none }
.vimeo-mobile   base { display:none }   tablet { display:block }
tablet breakpoint  width 768 (frame), mediaQuery (max-width: 991px)
```

Client applied all three edits by hand. **Not published** — check
`lastPublishedAt` before anyone does.

### Gotchas

- **`.vimeo-video` is on BOTH embeds** and forces `aspect-ratio: 16 / 9`. A
  vertical mobile cut will letterbox. Move the ratio onto `.vimeo-deskop`, or
  override it at `(max-width: 991px)`, if the mobile video is not 16:9.
- **`.cta-offices` is the only other rule using the `tablet` context**
  (`gridTemplateColumns: repeat(1, 1fr)`). Widening tablet 768 -> 991 means its
  offices grid now collapses to one column from 991. Intended, but it changed.
- **The tablet `width` and `mediaQuery` are separate fields.** Width is the
  canvas frame size only; mediaQuery is what publishes. The frame is still 768
  inside a `<= 991` query, which is legitimate and deliberately left alone.
- `15-instatic-api-sync/.tmp/vimeo-inspect.mjs` dumps breakpoints, conditions,
  the vimeo rules and their cascade neighbourhood. Read-only.

The reusable half of this — how the Styles panel decides where a value lands —
is written up in [15-instatic-api-sync.md](../deliver/brandklout/dr-nahlah/workflows/15-instatic-api-sync/15-instatic-api-sync.md)
under Gotchas, not here.
