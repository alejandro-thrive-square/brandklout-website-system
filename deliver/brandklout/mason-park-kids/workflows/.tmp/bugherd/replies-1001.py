"""Round seven replies (#507, #509-#515) -> replies.json for reply.mjs."""
import json, os

S = " It is on staging now (staging.masonparkpediatricdental.com); please hard-refresh (Ctrl+Shift+R) to see it."
D = {
    507: "Changed the heading to \"Designed for them.\"",
    509: "Replaced the paragraph with your text.",
    510: "Added a \"Book an appointment today\" link at the bottom of the card. It opens online booking (flexbook) in a new tab, same as the Book button in the header.",
    511: "Removed.",
    512: "Removed. The photo now has no caption.",
    513: "Removed. The photo now has no caption.",
    514: "Fixed. With fewer names on the team now, the scrolling strip ran out of names and left a blank gap. It now repeats the names so the strip is always full, at any screen width.",
    515: "Replaced with AdobeStock_1781157191.",
}
OPEN = {
}
plan = [{"n": n, "text": t + S, "done": True} for n, t in sorted(D.items())]
plan += [{"n": n, "text": t, "done": False} for n, t in sorted(OPEN.items())]
here = os.path.dirname(os.path.abspath(__file__))
with open(os.path.join(here, "replies.json"), "w", encoding="utf-8", newline="") as f:
    json.dump(plan, f, indent=2, ensure_ascii=False)
print(len(plan), "replies:", sum(p["done"] for p in plan), "close,", sum(not p["done"] for p in plan), "stay open")
