#!/usr/bin/env bash
# The photographs the agency attached to the 2026-09-21 round, cropped into the
# four-width sets the pages' srcsets use and registered in album-manifest.json.
# Sources are the BugHerd attachments in screens-2026-09-21/; run from .tmp.
#
#   bash bugherd/import-2026-09-21.sh > bugherd/import-2026-09-21.log 2>&1
#
# The crop boxes are in SOURCE pixels and were chosen against frame.mjs --probe.
# Every box matches the aspect of the slot the picture lands in, so object-fit
# has nothing left to cut: 4/3 for a .svc-card_media in .ch-qualify and for a
# .pa-shot, 16/10 for a .svc-card_media in .ch-why, 4/3 for an .el-pair_frame.
set -e
S=bugherd/screens-2026-09-21

# #89  About, the pair: two patients going through their plan on the sofa.
node frame.mjs "$S/89-att1-PXL_20260715_150618801_MP.jpg" sofa-tablet-pair \
  --alt "Two patients going through their treatment plan on a tablet in the waiting room" \
  --source "client photograph, PXL_20260715_150618801_MP.jpg 2607x1958, attached to BugHerd #89 on 2026-09-18; full frame"

# #101  Preventative, "Is this you" 01: persistent bad breath.
node frame.mjs "$S/101-att1-image.png" stock-bad-breath --box 0,0,2231,1673 \
  --alt "A man checking his own breath against his hand" \
  --source "client stock image, attached to BugHerd #101 on 2026-09-19 (2972x1673); cropped 4:3 from the left so the raised hand stays in frame"

# #102  Preventative, "Is this you" 02: bleeding or swollen gums.
node frame.mjs "$S/102-att1-image.png" stock-bleeding-gums --box 56,0,885,664 --widths 410,768,1024 --upscale \
  --alt "Inflamed lower gums, the lip held back" \
  --source "client stock image, attached to BugHerd #102 on 2026-09-19 (998x664); cropped 4:3 on the mouth. The source is small: 1024 is a 1.16x upscale and there is no 1536"

# #104  Preventative, "Is this you" 04: pain or sensitivity.
node frame.mjs "$S/104-att1-image.png" stock-toothache --box 57,0,889,667 --widths 410,768,1024 --upscale \
  --alt "A woman holding her jaw, the sore side marked" \
  --source "client stock image, attached to BugHerd #104 on 2026-09-19 (1003x667); cropped 4:3. The source is small: 1024 is a 1.15x upscale and there is no 1536"

# #105  Preventative, "Why this one" 02: gum disease caught early.
node frame.mjs "$S/105-att1-image.png" stock-gingivitis --box 0,166,2506,1566 \
  --alt "Inflamed gum margins behind the lower teeth" \
  --source "client stock image, attached to BugHerd #105 on 2026-09-19 (2506x1661); cropped 16:10 for the .ch-why card frame"

# #107  Preventative, the path 01: the front desk.
node frame.mjs "$S/107-att1-image.png" desk-call-6 --box 0,250,1244,933 --widths 410,768,1024 \
  --alt "A member of the front desk booking a visit by phone" \
  --source "client photograph, attached to BugHerd #107 on 2026-09-19 (1244x1660); cropped 4:3 for the path card's band"

# #108  Oral cancer screening, "Why this one" 01: early is the whole thing.
node frame.mjs "$S/108-att1-image.png" clinical-pair-senior --box 0,400,1459,912 \
  --alt "Two of the clinical team with an older patient in the chair" \
  --source "client photograph, attached to BugHerd #108 on 2026-09-19 (1459x1929); cropped 16:10 across the two clinicians and the chair"

# #109  Oral cancer screening, "Why this one" 04: it is documented.
node frame.mjs "$S/109-att1-image.png" schedule-screen-2 --box 0,166,2596,1622 \
  --alt "The day's schedule on the front desk screen" \
  --source "client photograph, attached to BugHerd #109 on 2026-09-19 (2596x1955); cropped 16:10 for the .ch-why card frame"
