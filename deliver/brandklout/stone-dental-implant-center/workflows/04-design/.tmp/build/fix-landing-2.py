# -*- coding: utf-8 -*-
"""Fix pass 2: insert slider (shell + HtmlEmbed), gallery, office sections."""
import json, sys
sys.path.insert(0, ".")
import content as C
from build import call
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

U = json.load(open("C:/Users/ACER/orca/workspaces/Brandklout Website System/bk-stone-dental/.tmp/ba-split/uploaded.json"))
PAGE = C.PAGE_LANDING
P1B, P1A = U["p1-before"]["url"], U["p1-after"]["url"]

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

SLIDER_CODE = f"""<style>
.axon-ba2 {{ position: relative; overflow: hidden; border-radius: 14px; max-width: 640px; margin: 0 auto;
  box-shadow: 0 24px 60px rgba(8, 31, 51, 0.25); user-select: none; -webkit-user-select: none;
  aspect-ratio: 572 / 763; background: #0b1622; }}
.axon-ba2 img {{ position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;
  display: block; pointer-events: none; -webkit-user-drag: none; }}
.axon-ba2 .axon-ba2__before {{ position: absolute; inset: 0; width: 50%; overflow: hidden; }}
.axon-ba2 .axon-ba2__before img {{ max-width: none; }}
.axon-ba2 .axon-ba2__before img {{ width: 640px; height: 100%; object-fit: cover; }}
.axon-ba2__bar {{ position: absolute; top: 0; bottom: 0; left: 50%; width: 3px;
  background: #e6ff0b; transform: translateX(-50%); pointer-events: none; z-index: 3; }}
.axon-ba2__knob {{ position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  width: 46px; height: 46px; border-radius: 50%; background: #e6ff0b; color: #081f33;
  display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 700;
  pointer-events: none; box-shadow: 0 4px 18px rgba(0, 0, 0, 0.4); z-index: 3; }}
.axon-ba2__tag {{ position: absolute; top: 16px; background: rgba(8, 31, 51, 0.72); color: #fff;
  font-family: Montserrat, sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 1px;
  text-transform: uppercase; padding: 7px 14px; border-radius: 100px; pointer-events: none; z-index: 2; }}
.axon-ba2__tag--l {{ left: 16px; }}
.axon-ba2__tag--r {{ right: 16px; background: rgba(33, 121, 168, 0.85); }}
.axon-ba2__range {{ position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0;
  cursor: ew-resize; margin: 0; -webkit-appearance: none; z-index: 4; }}
.axon-ba2__hint {{ text-align: center; font-family: Montserrat, sans-serif; color: #4d4d4d;
  font-size: 14px; margin-top: 14px; }}
</style>
<div class="axon-ba2" id="axon-ba2">
  <img src="{P1A}" alt="After full-arch All-on-X restoration at Stone Dental Implant Center" />
  <div class="axon-ba2__before"><img src="{P1B}" alt="Before full-arch restoration" /></div>
  <span class="axon-ba2__tag axon-ba2__tag--l">Before</span>
  <span class="axon-ba2__tag axon-ba2__tag--r">After</span>
  <div class="axon-ba2__bar"></div>
  <div class="axon-ba2__knob">&#8596;</div>
  <input class="axon-ba2__range" type="range" min="0" max="100" value="50"
         aria-label="Drag to compare before and after" />
</div>
<p class="axon-ba2__hint">&#8592; Drag to compare &#8594;</p>
<script>
(function () {{
  var slider = document.getElementById("axon-ba2");
  if (!slider) return;
  var before = slider.querySelector(".axon-ba2__before");
  var bar = slider.querySelector(".axon-ba2__bar");
  var knob = slider.querySelector(".axon-ba2__knob");
  var img = before.querySelector("img");
  var range = slider.querySelector(".axon-ba2__range");
  function set(p) {{
    before.style.width = p + "%";
    bar.style.left = p + "%";
    knob.style.left = p + "%";
    img.style.width = slider.offsetWidth + "px";
  }}
  range.addEventListener("input", function () {{ set(range.value); }});
  window.addEventListener("resize", function () {{ set(range.value); }});
  set(50);
}})();
</script>"""

slider_shell = f"""
<section class="axon-section"><div class="axon-container">
<div class="axon-head-block axon-head-block_center axon-center">
<span class="axon-eyebrow">— One Patient's Real Journey</span>
<h2 class="axon-h2">One Patient. One Complete Plan.</h2>
<p class="axon-p">This is a real Stone Dental Implant Center patient. He arrived with several failing teeth and years of patchwork dentistry. Drag the slider to see what changed when his whole arch was rebuilt around one plan, designed for his face.</p>
</div>
<div class="axon-ba2_slot"></div>
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
<section class="axon-section axon-section_soft"><div class="axon-container"><div class="axon-grid2">
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


def get_tree():
    d = call("data_element_tool", {"siteId": C.SITE, "pageId": PAGE,
        "actions": [{"label": "tree", "get_all_elements": {"depth": -1}}]})
    res = d["actions"][0]["result"] if "actions" in d else d["result"]
    node = res[0] if isinstance(res, list) else res
    return node.get("data", node)


def find_section(inner_style):
    data = get_tree()

    def walk(el, top):
        cls = el.get("styleNames", []) or []
        if inner_style in cls:
            return top["id"]
        for ch in el.get("children", []):
            r = walk(ch, top)
            if r:
                return r
        return None

    for ch in data.get("children", []):
        r = walk(ch, ch)
        if r:
            return r
    return None


def insert(html, css, anchor_id, position):
    action = {"build_label": "section", "parent_element_id": anchor_id,
              "creation_position": position, "html": html.strip()}
    if css:
        action["css"] = css
    d = call("data_whtml_builder", {"siteId": C.SITE, "pageId": PAGE,
        "context": "Restoring Livewell-equivalent sections to the Stone All-on-X landing page",
        "actions": [action]})
    res = d["actions"] if "actions" in d else [d]
    rr = res[0][0] if isinstance(res[0], list) else res[0]
    print("   insert:", rr.get("status"))
    if rr.get("status") != "success":
        print("    ", json.dumps(rr)[:500])
        return None
    return rr["data"]["id"]["element"]


def add_embed(parent_id, code):
    d = call("data_element_builder", {"siteId": C.SITE, "pageId": PAGE,
        "context": "Adding the before-after comparison slider embed to the landing page",
        "actions": [{"build_label": "ba-slider", "parent_element_id": parent_id,
                     "creation_position": "append", "element_schema": {"type": "HtmlEmbed"}}]})
    res = d["actions"] if "actions" in d else [d]
    rr = res[0][0] if isinstance(res[0], list) else res[0]
    embed_id = rr["data"]["id"]["element"]
    print("   slider embed:", rr.get("status"), embed_id[:12])
    d2 = call("data_element_settings_tool", {"siteId": C.SITE, "pageId": PAGE,
        "actions": [{
            "label": "set-code",
            "set_settings": {
                "operations": [{
                    "element_id": {"component": PAGE, "element": embed_id},
                    "settings": [{"key": "code", "static_text": {"value": code}}]
                }]
            }
        }]})
    res2 = d2["actions"][0] if "actions" in d2 else d2
    rr2 = res2[0] if isinstance(res2, list) else res2
    print("   slider code:", rr2.get("status"))


if __name__ == "__main__":
    # find current anchors
    trust = find_section("axon-trust")
    journey = find_section("axon-story_card")
    why = find_section("axon-feature")
    process = find_section("axon-steps_grid")
    faq = find_section("axon-faq_item")
    print("anchors: trust", trust and trust["element"][:12], "| process", process and process["element"][:12])

    # 1. slider section right after trust (i.e. before journey)
    sid = insert(slider_shell, None, trust, "after")
    assert sid, "slider shell failed"
    # find the slot inside the new section
    d = call("data_element_tool", {"siteId": C.SITE, "pageId": PAGE,
        "actions": [{"label": "q", "query_elements": {"queries": [
            {"element_filter": {"style": "axon-ba2_slot"}, "children_depth": 0}]}}]})
    import time
    slot_id = None
    for attempt in range(5):
        res = d["actions"][0]["result"] if "actions" in d else d["result"]
        node = res[0] if isinstance(res, list) else res
        data = node.get("data", node)
        matches = data[0]["matches"] if isinstance(data, list) else data.get("matches", [])
        if matches:
            slot_id = matches[0]["id"]
            break
        time.sleep(2)
        d = call("data_element_tool", {"siteId": C.SITE, "pageId": PAGE,
            "actions": [{"label": "q", "query_elements": {"queries": [
                {"element_filter": {"style": "axon-ba2_slot"}, "children_depth": 0}]}}]})
    assert slot_id, "slot not found after retries"
    print("   slot:", slot_id["element"][:12])
    add_embed(slot_id, SLIDER_CODE)

    # 2. gallery after process
    g = insert(gallery_section, NEW_CSS, process, "after")
    assert g, "gallery failed"

    # 3. office after gallery
    gallery_sec = find_section("axon-gallery-grid")
    o = insert(office_section, None, gallery_sec, "after")
    assert o, "office failed"
    print("all sections inserted")
