# The typographic rule that turns "6-18 months" into "6 to 18 months" also turned
# (281) 578-7100 into "(281) 578 to 7100" on 18 pages. Park phone-shaped runs
# behind a sentinel before the range rule runs, and put the hyphens back after.
#   python guard-phone.py
# Compute every new file first, write only when they all came out: opening for
# writing truncates, and a raise between the open and the write leaves an empty
# generator behind (it did, once).
import io

EN = "–"
RANGE = "    .replace(/(\\d)\\s*[" + EN + "-]\\s*(\\d)/g, '$1 to $2')"

NEW = "\n".join([
    "    // A phone number is not a range. Without this guard the rule below turned",
    "    // (281) 578-7100 into \"(281) 578 to 7100\" on 18 pages, and the schema block",
    "    // a WP post carried into \"281 to 578 to 7100\". Both shapes are parked:",
    "    // 281-578-7100 and the bare local 578-7100. A three-then-four digit run is",
    "    // a phone number on this site; no real range is written that way.",
    "    .replace(/(?<!\\d)(\\d{3})[" + EN + "-](\\d{3})[" + EN + "-](\\d{4})(?!\\d)/g, '$1\\x01$2\\x01$3')",
    "    .replace(/(?<!\\d)(\\d{3})[" + EN + "-](\\d{4})(?!\\d)/g, '$1\\x01$2')",
    RANGE,
    "    .replace(/\\x01/g, '-')",
])

pending = {}
for name in ("build-pages.mjs", "build-blog.mjs"):
    src = io.open(name, encoding="utf-8", newline="").read()
    assert src.count(RANGE) == 1, (name, src.count(RANGE))
    assert "A phone number is not a range" not in src, (name, "already patched")
    pending[name] = src.replace(RANGE, NEW)

for name, out in pending.items():
    io.open(name, "w", encoding="utf-8", newline="").write(out)
    print("patched", name)
