# -*- coding: utf-8 -*-
"""Add the missing Livewell-equivalent sections to the Stone landing page:
   1. interactive before/after drag slider (replaces static grid)
   2. smile gallery section (was missing)
   3. office section upgraded to image grid
"""
import json, sys
sys.path.insert(0, ".")
import content as C
from build import call
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

U = json.load(open("C:/Users/ACER/orca/workspaces/Brandklout Website System/bk-stone-dental/.tmp/ba-split/uploaded.json"))
PAGE = C.PAGE_LANDING

# ---------------------------------------------------------------- new CSS
NEW_CSS = """
.axon-gallery-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
.axon-gallery-grid img { width: 100%; height: auto; display: block; border-radius: 14px; box-shadow: 0 12px 40px rgba(8, 31, 51, 0.1); }
.axon-office-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start; }
.axon-office-grid img { width: 100%; height: auto; display: block; border-radius: 14px; box-shadow: 0 12px 40px rgba(8, 31, 51, 0.12); }
@media screen and (max-width: 767px) {
  .axon-gallery-grid { grid-template-columns: 1fr; }
  .axon-office-grid { grid-template-columns: 1fr; }
}
"""

# ---------------------------------------------------------------- slider embed
P1B = U["p1-before"]["url"]
P1A = U["p1-after"]["url"]

SLIDER_EMBED = f"""
<style>
.axon-ba2 {{ position: relative; overflow: hidden; border-radius: 14px; max-width: 760px; margin: 0 auto;
  box-shadow: 0 24px 60px rgba(8, 31, 51, 0.25); user-select: none; -webkit-user-select: none;
  aspect-ratio: 572 / 763; background: #0b1622; --pos: 50%; }}
.axon-ba2 img {{ position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;
  display: block; pointer-events: none; -webkit-user-drag: none; }}
.axon-ba2__before {{ position: absolute; inset: 0; clip-path: inset(0 calc(100% - var(--pos)) 0 0); }}
.axon-ba2__bar {{ position: absolute; top: 0; bottom: 0; left: var(--pos); width: 3px;
  background: #e6ff0b; transform: translateX(-50%); pointer-events: none; }}
.axon-ba2__knob {{ position: absolute; top: 50%; left: var(--pos); transform: translate(-50%, -50%);
  width: 46px; height: 46px; border-radius: 50%; background: #e6ff0b; color: #081f33;
  display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 700;
  pointer-events: none; box-shadow: 0 4px 18px rgba(0, 0, 0, 0.4); }}
.axon-ba2__tag {{ position: absolute; top: 16px; background: rgba(8, 31, 51, 0.72); color: #fff;
  font-family: Montserrat, sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 1px;
  text-transform: uppercase; padding: 7px 14px; border-radius: 100px; pointer-events: none; }}
.axon-ba2__tag--l {{ left: 16px; }}
.axon-ba2__tag--r {{ right: 16px; background: rgba(33, 121, 168, 0.85); }}
.axon-ba2__range {{ position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0;
  cursor: ew-resize; margin: 0; -webkit-appearance: none; }}
.axon-ba2__hint {{ text-align: center; font-family: Montserrat, sans-serif; color: #4d4d4d;
  font-size: 14px; margin-top: 14px; }}
</style>
<div class="axon-ba2" data-ba2>
  <img src="{P1A}" alt="After full-arch All-on-X restoration at Stone Dental Implant Center" />
  <div class="axon-ba2__before">
    <img src="{P1B}" alt="Before full-arch restoration - worn and missing teeth" />
  </div>
  <span class="axon-ba2__tag axon-ba2__tag--l">Before</span>
  <span class="axon-ba2__tag axon-ba2__tag--r">After</span>
  <div class="axon-ba2__bar"></div>
  <div class="axon-ba2__knob">↔</div>
  <input class="axon-ba2__range" type="range" min="0" max="100" value="50"
         aria-label="Drag to compare before and after" />
</div>
<p class="axon-ba2__hint">← Drag to compare →</p>
<script>
(function () {{
  var slider = document.querySelector("[data-ba2]");
  if (!slider) return;
  var range = slider.querySelector(".axon-ba2__range");
  function set(p) {{ slider.style.setProperty("--pos", p + "%"); }}
  range.addEventListener("input", function () {{ set(range.value); }});
  set(50);
}})();
</script>
"""

# ---------------------------------------------------------------- section defs
slider_section = f"""
<section class="axon-section"><div class="axon-container">
<div class="axon-head-block axon-head-block_center axon-center">
<span class="axon-eyebrow">— One Patient's Real Journey</span>
<h2 class="axon-h2">One Patient. One Complete Plan.</h2>
<p class="axon-p">This is a real Stone Dental Implant Center patient. He arrived with several failing teeth and years of patchwork dentistry. Drag the slider to see what changed when his whole arch was rebuilt around one plan, designed for his face.</p>
</div>
{SLIDER_EMBED}
<div class="axon-ctas axon-ctas_center" style="margin-top: 40px;"><a href="{C.CONSULT_URL}" class="axon-button">Book a Consultation</a></div>
</div></section>
"""

gallery_section = f"""
<section class="axon-section axon-section_soft"><div class="axon-container">
<div class="axon-head-block axon-head-block_center axon-center">
<span class="axon-eyebrow">— Smile Gallery</span>
<h2 class="axon-h2">Real Arches. Real Results.</h2>
<p class="axon-p">Every arch below started with a conversation, a 3D scan, and a plan designed around that specific patient. No shortcuts, no standard molds.</p>
</div>
<div class="axon-gallery-grid">
<img src="{C.BA1}" alt="All-on-X patient before and after full-arch restoration" loading="lazy"/>
<img src="{C.BA2}" alt="All-on-X full-arch patient result" loading="lazy"/>
<img src="{C.BA3}" alt="All-on-X full-arch patient result" loading="lazy"/>
<img src="{C.BA5}" alt="All-on-X full-arch patient result" loading="lazy"/>
</div>
<p class="axon-disclaimer">Individual results vary. All photos show actual patients of Stone Dental Implant Center.</p>
<div class="axon-ctas axon-ctas_center" style="margin-top: 32px;"><a href="{C.CONSULT_URL}" class="axon-button axon-button_dark">Book a Consultation</a></div>
</div></section>
"""

office_section = f"""
<section class="axon-section"><div class="axon-container"><div class="axon-grid2">
<div>
<span class="axon-eyebrow">— The Experience</span>
<h2 class="axon-h2">Comfortable, Modern, and Built Around You</h2>
<p class="axon-p">The experience starts the moment you arrive. Our team speaks English and Spanish, and someone is available 24/7 to help you schedule.</p>
<div class="axon-ctas"><a href="{C.PHONE_TEL}" class="axon-button axon-button_dark">Call {C.PHONE_DISPLAY}</a></div>
</div>
<div class="axon-office-grid">
<img src="{C.OFFICE}" alt="The front desk team welcoming patients at Stone Dental Implant Center" loading="lazy"/>
<img src="{C.GALLERY_IMG}" alt="A happy Stone Dental Implant Center patient" loading="lazy"/>
</div>
</div></div></section>
"""

# ---------------------------------------------------------------- element ops
def find_by_style(style, page_id=PAGE):
    d = call("data_element_tool", {
        "siteId": C.SITE, "pageId": page_id,
        "actions": [{"label": "find", "query_elements": {
            "queries": [{"element_filter": {"style": style}, "children_depth": 0}]}}],
    })
    res = d["actions"][0]["result"] if "actions" in d else d["result"]
    node = res[0] if isinstance(res, list) else res

    def find_matches(o):
        if isinstance(o, dict):
            if "matches" in o and isinstance(o["matches"], list):
                return o["matches"]
            for v in o.values():
                r = find_matches(v)
                if r is not None:
                    return r
        elif isinstance(o, list):
            for v in o:
                r = find_matches(v)
                if r is not None:
                    return r
        return None

    ms = find_matches(node)
    return ms[0]["id"] if ms else None

def parent_section_of(inner_style):
    """Full tree walk: return the top-level section containing inner_style."""
    d = call("data_element_tool", {
        "siteId": C.SITE, "pageId": PAGE,
        "actions": [{"label": "tree", "get_all_elements": {"depth": -1}}],
    })
    res = d["actions"][0]["result"] if "actions" in d else d["result"]
    node = res[0] if isinstance(res, list) else res
    data = node.get("data", node)

    found = {}

    def walk(el, ancestors):
        cls = el.get("styleNames", []) or []
        if inner_style in cls:
            found["section"] = ancestors[0]["id"] if ancestors else None
            return True
        for ch in el.get("children", []):
            if walk(ch, ancestors + [el]):
                return True
        return False

    body = data
    # body node itself: its children are top-level sections
    for ch in body.get("children", []):
        if walk(ch, [ch]):
            break
    return found.get("section")


def insert(html, css, anchor_id, position):
    payload = {"siteId": C.SITE, "pageId": PAGE,
               "context": "Restoring Livewell-equivalent sections to the Stone All-on-X landing page",
               "actions": [{"build_label": "section", "parent_element_id": anchor_id,
                            "creation_position": position, "html": html.strip()}]}
    if css:
        payload["actions"][0]["css"] = css
    d = call("data_whtml_builder", payload)
    res = d["actions"] if "actions" in d else [d]
    rr = res[0][0] if isinstance(res[0], list) else res[0]
    print("   insert:", rr.get("status"), (rr.get("data") or {}).get("warnings", []))
    return rr

def remove(el_id):
    d = call("data_element_tool", {
        "siteId": C.SITE, "pageId": PAGE,
        "actions": [{"label": "rm", "remove_element": {"id": el_id}}]})
    res = d["actions"][0] if "actions" in d else d
    rr = res[0] if isinstance(res, list) else res
    print("   remove:", rr.get("status"))

if __name__ == "__main__":
    print("1. slider section: remove static BA grid, insert slider after trust")
    grid_parent = parent_section_of("axon-ba_img")
    print("   static BA section:", grid_parent)
    trust_section = parent_section_of("axon-trust")
    print("   trust section:", trust_section)
    remove(grid_parent)
    insert(slider_section, None, trust_section, "after")

    print("2. gallery section after process")
    process_section = parent_section_of("axon-steps_grid")
    print("   process section:", process_section)
    insert(gallery_section, NEW_CSS, process_section, "after")

    print("3. office section upgrade")
    office_parent = parent_section_of("axon-office_img")
    print("   old office section:", office_parent)
    remove(office_parent)
    # new office goes after the (new) gallery section; gallery contains axon-gallery-grid
    gallery_parent = parent_section_of("axon-gallery-grid")
    insert(office_section, None, gallery_parent, "after")
    print("done")
