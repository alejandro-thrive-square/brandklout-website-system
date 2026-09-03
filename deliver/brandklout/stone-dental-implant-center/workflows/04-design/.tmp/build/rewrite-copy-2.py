# -*- coding: utf-8 -*-
"""Second pass: clear remaining Livewell 6-gram overlaps."""
import io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

path = "content.py"
src = open(path, encoding="utf-8").read()

R = [
    ("— Limited Consultation Availability", "— Now Booking Consultations"),
    ("<p class=\"axon-step_p\">A complimentary exam of your bone, bite, and goals, including a 3D scan — plus a clear treatment plan and a full itemized quote before anything begins.</p>",
     "<p class=\"axon-step_p\">A complimentary exam — 3D scan included — that maps your bone, bite, and goals, with a clear plan and a full itemized quote before anything begins.</p>"),
    ("<p class=\"axon-faq_a\">No — in most cases a fixed temporary arch goes in the same day as surgery. Your 3D scan at the consultation tells us whether your case qualifies.</p>",
     "<p class=\"axon-faq_a\">No — in most cases a fixed temporary arch goes in the same day as surgery. The 3D scan from your consultation visit tells us whether your case qualifies.</p>"),
    ("<p class=\"axon-p axon-p_light axon-p_lead\">Get your complimentary consultation with Dr. Stone on the calendar — the call takes about two minutes.</p>",
     "<p class=\"axon-p axon-p_light axon-p_lead\">Book your complimentary visit with Dr. Stone today — the call takes about two minutes.</p>"),
]

applied = 0
for old, new in R:
    if old in src:
        src = src.replace(old, new)
        applied += 1
    else:
        print("NOT FOUND:", old[:90])

open(path, "w", encoding="utf-8").write(src)
print(f"applied {applied}/{len(R)}")
