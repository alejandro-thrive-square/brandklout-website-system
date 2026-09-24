"""BugHerd #170-#187 (2026-09-24, evening): replies for the notes that are done.
#176 and #182 wait on their Drive originals and are not in this plan.
    python replies-0924c.py   -> writes replies-0924c.json and replies.json
"""
import json

S = " It is on staging now; please hard-refresh (Ctrl+Shift+R) to see it."
P = "Replaced with the photo you chose (AdobeStock_{})"
T = {
    170: P.format("1479590356") + " for step 3, positioned so the dentist's and the girl's faces are both in the frame.",
    171: P.format("1046540974") + " for step 4.",
    172: "Fixed. \"Fluoride.\" and \"Sealants.\" now stay on one line. The list was laid out so the bold word could squeeze down to a letter's width; it now wraps like normal text. The fix applies to every bulleted list of this kind on the site.",
    173: P.format("2035604342") + " (the high five).",
    174: "Done. Steps 2 to 5 now have photos (your notes #175, #177, #178 and #179). Step 1 will get IMG_7693 (#176) as soon as we have the original from the Drive.",
    175: P.format("841531687") + " for step 3, the cleaning.",
    177: P.format("477444358") + " for step 2.",
    178: P.format("530839181") + " for step 4, the brushing lesson.",
    179: "Added the tooth-and-calendar photo to step 5, the plan and the next date.",
    180: "Replaced with PXL_20240408_202735547 (the girl and team member at the prize shelf), cropped to fit this space.",
    181: "Changed the paragraph to your text.",
    183: "Replaced with PXL_20260714_212222254. The caption now reads \"A brushing lesson, mid visit.\"",
    184: "Replaced with PXL_20260714_221325464. The caption now reads \"The screen in the ceiling, from the chair.\"",
    185: "Changed to \"Parents welcome\".",
    186: "Changed to \"Sedation is available if needed, and treatment is discussed to meet your child's personalized needs.\"",
    187: "Changed to \"Amazing care under one roof\".",
}
out = [{"n": n, "done": n != 174, "text": T[n] + S} for n in sorted(T)]  # 174 closes with #176
for f in ("replies-0924c.json", "replies.json"):
    with open(f, "w", encoding="utf-8", newline="") as fh:
        json.dump(out, fh, indent=2, ensure_ascii=False)
print(len(out), "replies")
