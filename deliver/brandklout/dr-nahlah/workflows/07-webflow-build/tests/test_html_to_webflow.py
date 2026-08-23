import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path


SCRIPT_PATH = Path(__file__).resolve().parents[1] / "html_to_webflow.py"
SPEC = importlib.util.spec_from_file_location("html_to_webflow", SCRIPT_PATH)
converter = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
sys.modules[SPEC.name] = converter
SPEC.loader.exec_module(converter)


class HtmlToWebflowTest(unittest.TestCase):
    def test_preserve_vars_and_combo_classes(self) -> None:
        html = '<a class="button is-secondary" href="#">Button</a>'
        css = """
        :root { --terra: #E07A5F; }
        .button { color: var(--terra); background-color: black; }
        .is-secondary { background-color: transparent; }
        """

        payload = converter.convert(html, css, preserve_vars=True)
        styles = payload["payload"]["styles"]
        by_name = {style["name"]: style for style in styles}

        self.assertEqual("", by_name["button"]["comb"])
        self.assertEqual("&", by_name["is-secondary"]["comb"])
        self.assertIn(by_name["is-secondary"]["_id"], by_name["button"]["children"])
        self.assertIn("var(--terra)", by_name["button"]["styleLess"])

        link = payload["payload"]["nodes"][0]
        self.assertEqual([by_name["button"]["_id"], by_name["is-secondary"]["_id"]],
                         link["classes"])

    def test_combo_reference_capture_shape(self) -> None:
        ref = Path(__file__).parent / "fixtures" / "webflow_combo_class.json"
        payload = json.loads(ref.read_text(encoding="utf-8"))
        styles = payload["payload"]["styles"]
        combo_styles = [style for style in styles if style.get("comb") == "&"]

        self.assertTrue(combo_styles)
        self.assertTrue(any(style["name"] == "is-secondary" for style in combo_styles))
        self.assertTrue(any(style["children"] for style in styles if style["name"] == "button"))

    def test_unsupported_pseudo_elements_do_not_style_host(self) -> None:
        html = '<div class="h-stage"><div class="track"></div></div>'
        css = """
        .h-stage .track { display: flex; overflow-x: auto; }
        .h-stage .track::-webkit-scrollbar { display: none; width: 0; height: 0; }
        """

        payload = converter.convert(html, css)
        track_style = next(
            style for style in payload["payload"]["styles"]
            if style["name"] == "track"
        )

        self.assertIn("display: flex", track_style["styleLess"])
        self.assertNotIn("display: none", track_style["styleLess"])
        self.assertNotIn("width: 0", track_style["styleLess"])
        self.assertNotIn("height: 0", track_style["styleLess"])

    def test_roots_keep_body_base_and_tag_qualified_combo_styles(self) -> None:
        html = '<body><section class="scene bone"><h2>Title</h2></section></body>'
        css = """
        :root { --canvas: #F4F1DE; --bone: #EDE8D5; --line: rgba(0,0,0,.2); --body: Inter, sans-serif; }
        body { background: var(--canvas); color: black; font-family: var(--body); }
        section.scene { padding: 120px 40px; border-top: 1px solid var(--line); }
        section.scene.bone { background: var(--bone); }
        """

        payload = converter.convert(html, css, preserve_vars=True)
        styles = payload["payload"]["styles"]
        by_name = {style["name"]: style for style in styles}
        by_id = {style["_id"]: style for style in styles}

        # Tag-qualified rules (`section.scene`, `section.scene.bone`) are
        # context-dependent, so they live on the per-element content class —
        # not on the shared `scene`/`bone` records, which stay thin so
        # Webflow's site-wide merge-by-name cannot leak one element's styles
        # onto another. The body base rides the content class too.
        section_node = next(n for n in payload["payload"]["nodes"]
                            if n.get("tag") == "section")
        content = by_id[section_node["classes"][0]]
        names = [by_id[c]["name"] for c in section_node["classes"]]
        self.assertIn("scene", names)
        self.assertIn("bone", names)
        self.assertIn("font-family: var(--body)", content["styleLess"])
        self.assertIn("padding-top: 120px", content["styleLess"])
        self.assertIn("padding-right: 40px", content["styleLess"])
        self.assertIn("padding-bottom: 120px", content["styleLess"])
        self.assertIn("padding-left: 40px", content["styleLess"])
        self.assertIn("border-top-style: solid", content["styleLess"])
        self.assertIn("border-top-width: 1px", content["styleLess"])
        self.assertIn("border-top-color: var(--line)", content["styleLess"])
        self.assertIn("background: var(--bone)", content["styleLess"])
        self.assertEqual("&", by_name["bone"]["comb"])

    def test_preserved_vars_can_use_webflow_css_name_map(self) -> None:
        # `background` is declared on the SECTION, not on body. It used to be
        # read off body here, which quietly depended on body's background being
        # copied onto every section root — see
        # test_body_background_is_not_copied_onto_sections for why that is wrong.
        html = '<body><section class="scene">Title</section></body>'
        css = """
        :root { --canvas: #F4F1DE; --body: Inter, sans-serif; }
        body { font-family: var(--body); }
        .scene { background: var(--canvas); }
        """

        payload = converter.convert(
            html,
            css,
            preserve_vars=True,
            variable_css_names={
                "--canvas": "--base--canvas",
                "--body": "--base--body",
            },
        )
        scene = next(style for style in payload["payload"]["styles"]
                     if style["name"] == "scene")

        self.assertIn("background: var(--base--canvas)", scene["styleLess"])
        # font-family vars are now preserved (and CSS-name-mapped) under
        # preserve_vars so the post-paste binding manifest can link them.
        self.assertIn("font-family: var(--base--body)", scene["styleLess"])
        self.assertNotIn("var(--canvas)", scene["styleLess"])
        self.assertNotIn("var(--body)", scene["styleLess"])

    def test_scoped_custom_properties_resolve_per_ancestor(self) -> None:
        """A theme layer scopes tokens; resolution must follow the DOM.

        `:root`, `[data-theme="dark"]` and `[data-theme="light"]` all declare
        `--fg`. Collapsing them into one flat map let whichever block came last
        win for the whole document, so every dark chapter baked light-theme
        text and the headings shipped near-black on near-black.
        """
        html = (
            '<body>'
            '<section class="lightsec"><h2 class="t1">L</h2></section>'
            '<section class="darksec" data-theme="dark"><h2 class="t2">D</h2>'
            '<div class="island" data-theme="light"><h2 class="t3">I</h2></div>'
            '</section></body>'
        )
        css = """
        :root{--fg:#141416;--bg:#FAF8F3}
        [data-theme="dark"]{--fg:#FFFFFF;--bg:#0B0B0C;background:var(--bg)}
        [data-theme="light"]{--fg:#141416;--bg:#FAF8F3;background:var(--bg)}
        h2{color:var(--fg)}
        """

        payload = converter.convert(html, css)
        by_id = {s["_id"]: s for s in payload["payload"]["styles"]}
        headings = [
            [by_id[c]["styleLess"] for c in n.get("classes", []) if c in by_id]
            for n in payload["payload"]["nodes"] if n.get("tag") == "h2"
        ]

        self.assertIn("color: #141416", headings[0][0])   # light section
        self.assertIn("color: #FFFFFF", headings[1][0])   # dark section
        self.assertIn("color: #141416", headings[2][0])   # light island inside dark

        by_name = {s["name"]: s for s in payload["payload"]["styles"]}
        self.assertIn("background: #0B0B0C", by_name["darksec"]["styleLess"])
        self.assertIn("background: #FAF8F3", by_name["island"]["styleLess"])

    def test_body_background_is_not_copied_onto_sections(self) -> None:
        """`background` is not an inherited property.

        Copying body's onto each top-level element painted the fixed header
        opaque at rest, so the nav read as permanently scrolled and the
        transparent-over-hero effect was gone (Dr. Nahlah, live 2026-08-04).
        Inherited properties like `color` must still come through, because
        Webflow's Body does not always carry them.
        """
        html = '<body><header class="bar">x</header><section class="scene">y</section></body>'
        css = "body { background: #F4F1DE; overflow-x: hidden; color: #222; }"

        payload = converter.convert(html, css)
        styles = payload["payload"]["styles"]
        self.assertTrue(styles, "expected at least one emitted style")

        # Asserted across every emitted style rather than by class name:
        # elements whose resolved definitions are identical are deduped into
        # one record, so `.scene` may not have a style of its own.
        for style in styles:
            self.assertNotIn("background", style["styleLess"], style["name"])
            self.assertNotIn("overflow", style["styleLess"], style["name"])
        self.assertTrue(
            any("color: #222" in s["styleLess"] for s in styles),
            "inherited color must still reach the section roots",
        )

    def test_variable_artifact_preserves_existing_webflow_css_names(self) -> None:
        css = ":root { --canvas: #F4F1DE; --ink: #3D405B; }"
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "webflow-variable-map.json"
            path.write_text(json.dumps({
                "variables": [
                    {"sourceName": "--canvas", "cssName": "--base--canvas"}
                ]
            }), encoding="utf-8")

            converter.write_variable_artifacts(css, tmp)
            payload = json.loads(path.read_text(encoding="utf-8"))
            by_source = {item["sourceName"]: item for item in payload["variables"]}

        self.assertEqual("--base--canvas", by_source["--canvas"]["cssName"])
        self.assertEqual("var(--base--canvas)", by_source["--canvas"]["binding"])
        self.assertEqual("--ink", by_source["--ink"]["cssName"])

    def test_style_variable_binding_manifest_writes_mcp_variable_actions(self) -> None:
        html = '<body><nav class="top"><a class="brand"><em>Brand</em></a></nav></body>'
        css = """
        :root { --canvas: #F4F1DE; --ink: #3D405B; --terra: #E07A5F; --display: Lora, serif; }
        .top { background: var(--canvas); color: var(--ink); }
        .brand { font-family: var(--display); }
        .brand em { color: var(--terra); }
        """
        sections = converter.convert_sections(
            html,
            css,
            preserve_vars=True,
            variable_css_names={"--canvas": "--base--canvas", "--terra": "--base--terra"},
        )

        with tempfile.TemporaryDirectory() as tmp:
            converter.write_style_variable_bindings(
                sections,
                tmp,
                {"--canvas": "--base--canvas", "--terra": "--base--terra"},
                {
                    "--canvas": {
                        "cssName": "--base--canvas",
                        "variableId": "var_canvas",
                    },
                    "--terra": {
                        "cssName": "--base--terra",
                        "variableId": "var_terra",
                    },
                },
            )
            payload = json.loads(
                (Path(tmp) / "webflow-style-variable-bindings.json")
                .read_text(encoding="utf-8")
            )

        by_field = {
            (item["className"], item["property"]): item
            for item in payload["bindings"]
        }
        self.assertEqual(["--base--canvas"], by_field[("top", "background")]["cssNames"])
        self.assertEqual(["--canvas"], by_field[("top", "background")]["sourceNames"])
        self.assertEqual("ready", by_field[("top", "background")]["status"])
        self.assertEqual(
            {"property_name": "background-color", "variable_as_value": "var_canvas"},
            by_field[("top", "background")]["mcp"]["property"],
        )
        self.assertEqual("missing_variable_id", by_field[("top", "color")]["status"])
        self.assertEqual(["--base--terra"], by_field[("em", "color")]["cssNames"])
        self.assertEqual(
            {"property_name": "color", "variable_as_value": "var_terra"},
            by_field[("em", "color")]["mcp"]["property"],
        )
        # font-family bindings are now emitted so headings/brand link to the
        # font variable post-paste. --display has no variableId in this map, so
        # it reports missing_variable_id (and stays out of the actions list).
        self.assertIn(("brand", "font-family"), by_field)
        self.assertEqual(["--display"], by_field[("brand", "font-family")]["sourceNames"])
        self.assertEqual("missing_variable_id", by_field[("brand", "font-family")]["status"])
        self.assertEqual(
            "font-family",
            by_field[("brand", "font-family")]["mcp"]["property"]["property_name"],
        )
        self.assertEqual(
            [
                {
                    "update_style": {
                        "style_name": "em",
                        "breakpoint_id": "main",
                        "pseudo": "noPseudo",
                        "properties": [
                            {"property_name": "color", "variable_as_value": "var_terra"}
                        ],
                    }
                },
                {
                    "update_style": {
                        "style_name": "top",
                        "breakpoint_id": "main",
                        "pseudo": "noPseudo",
                        "properties": [
                            {
                                "property_name": "background-color",
                                "variable_as_value": "var_canvas",
                            }
                        ],
                    }
                },
            ],
            payload["styleTool"]["actions"],
        )


    def test_shared_utility_class_stays_thin_across_single_and_combo_use(self) -> None:
        # `reveal` is an animation utility used both as a sole class on a heading
        # and as a combo on a container. The heading's typography must NOT bake
        # into the shared `reveal` name, or Webflow's merge-by-name leaks the
        # heading font onto every reveal element ("headings go very large").
        html = (
            '<body><section class="scene">'
            '<h2 class="reveal">Big Title</h2>'
            '<div class="cap reveal"><p>copy</p></div>'
            '</section></body>'
        )
        css = """
        .scene h2 { font-size: 88px; font-family: Lora, serif; font-weight: 700; }
        .reveal { opacity: 0; transform: translateY(40px); transition: opacity 1s; }
        .cap { padding: 20px; }
        """
        payload = converter.convert(html, css)
        styles = payload["payload"]["styles"]

        reveal_records = [s for s in styles if s["name"] == "reveal"]
        self.assertTrue(reveal_records)
        for rec in reveal_records:
            self.assertNotIn("font-size", rec["styleLess"])
            self.assertNotIn("font-family", rec["styleLess"])
            self.assertIn("opacity: 0", rec["styleLess"])
        # all reveal records must be byte-identical so Webflow's merge is a no-op
        self.assertEqual(1, len({r["styleLess"] for r in reveal_records}))

        by_id = {s["_id"]: s for s in styles}
        heading = next(n for n in payload["payload"]["nodes"]
                       if n.get("tag") == "h2")
        heading_classes = [by_id[c]["name"] for c in heading["classes"]]
        # heading is emitted as [content, reveal]; font lives on the content class
        self.assertEqual("reveal", heading_classes[-1])
        font_owner = next(by_id[c] for c in heading["classes"]
                          if "font-size" in by_id[c]["styleLess"])
        self.assertNotEqual("reveal", font_owner["name"])
        self.assertIn("font-size: 88px", font_owner["styleLess"])


    def test_expand_shorthands_padding_margin_border_radius(self) -> None:
        html = '<div class="box">content</div>'
        css = """
        .box {
            padding: 22px 40px;
            margin: 0 0 56px;
            border: 1px solid #3D405B;
            border-radius: 50%;
        }
        """
        payload = converter.convert(html, css)
        style = next(s for s in payload["payload"]["styles"] if s["name"] == "box")
        sl = style["styleLess"]

        self.assertIn("padding-top: 22px", sl)
        self.assertIn("padding-right: 40px", sl)
        self.assertIn("padding-bottom: 22px", sl)
        self.assertIn("padding-left: 40px", sl)

        self.assertIn("margin-top: 0", sl)
        self.assertIn("margin-right: 0", sl)
        self.assertIn("margin-bottom: 56px", sl)
        self.assertIn("margin-left: 0", sl)

        self.assertIn("border-top-style: solid", sl)
        self.assertIn("border-top-width: 1px", sl)
        self.assertIn("border-top-color: #3D405B", sl)
        self.assertIn("border-left-style: solid", sl)

        self.assertIn("border-top-left-radius: 50%", sl)
        self.assertIn("border-bottom-right-radius: 50%", sl)

    def test_contested_combo_name_records_stay_byte_identical(self) -> None:
        # `sub` is used as a thin token in one stack (styled only through the
        # descendant rule `.scene-head .sub`) and as a real combo in another
        # (`.sample-line.sub { color }`). Webflow merges styles by class name
        # site-wide, so every record named `sub` must be byte-identical or one
        # context silently loses its declarations after paste (the invest-page
        # sample-section regression). The compound declarations must move to
        # the per-element content class instead of the combo record.
        html = (
            '<body>'
            '<div class="scene-head"><p class="sub reveal">subtitle</p></div>'
            '<div class="sample-line sub"><span>line</span></div>'
            '</body>'
        )
        css = """
        .scene-head .sub { font-style: italic; font-size: 22px; }
        .reveal { opacity: 0; }
        .sample-line { display: flex; padding: 12px 0; }
        .sample-line.sub { color: rgba(61, 64, 91, 0.65); }
        """
        payload = converter.convert(html, css)
        styles = payload["payload"]["styles"]

        sub_records = [s for s in styles if s["name"] == "sub"]
        self.assertTrue(sub_records)
        self.assertEqual(
            1,
            len({s["styleLess"] + json.dumps(s["variants"], sort_keys=True)
                 for s in sub_records}))
        for rec in sub_records:
            self.assertNotIn("color", rec["styleLess"])

        # the compound declaration still reaches the element via a content class
        by_id = {s["_id"]: s for s in styles}
        sample_line = next(
            n for n in payload["payload"]["nodes"]
            if n.get("classes") and any(
                by_id[c]["name"] == "sample-line" for c in n["classes"]))
        owners = [by_id[c] for c in sample_line["classes"]
                  if "color: rgba(61, 64, 91, 0.65)" in by_id[c]["styleLess"]]
        self.assertTrue(owners)
        self.assertNotEqual("sub", owners[0]["name"])
        names = [by_id[c]["name"] for c in sample_line["classes"]]
        self.assertIn("sample-line", names)
        self.assertIn("sub", names)

    def test_uncontested_combo_keeps_native_compound_rules(self) -> None:
        # A combo name used in only one stack context keeps the Relume-style
        # native emission: compound `.base.combo` declarations stay on the
        # combo record.
        html = '<a class="button is-secondary" href="#">Button</a>'
        css = """
        .button { color: black; }
        .button.is-secondary { background-color: transparent; }
        """
        payload = converter.convert(html, css)
        by_name = {s["name"]: s for s in payload["payload"]["styles"]}
        self.assertIn("background-color: transparent",
                      by_name["is-secondary"]["styleLess"])
        self.assertEqual("&", by_name["is-secondary"]["comb"])

    def test_namespace_avoidance_renames_cross_page_collisions(self) -> None:
        # Webflow merges styles by class name SITE-WIDE and the existing
        # definition wins. A second page converted in a separate run must not
        # reuse another page's auto-named content classes with different
        # declarations (the invest `.div-33` regression).
        html = '<body><div class="card"><p>hello</p></div></body>'
        css = ".card { padding: 10px; } .card p { color: red; }"
        sections = converter.convert_sections(html, css)
        ours = {s["name"]: converter.style_signature(s)
                for _l, p in sections for s in p["payload"]["styles"]}
        reserved = {
            "p": {"font-size: 56px;" + json.dumps({}, sort_keys=True)},
            "card": {ours["card"]},
        }
        renames = converter.apply_namespace_avoidance(
            sections, reserved, protected=set(), suffix="pg2")
        names = {s["name"] for _l, p in sections
                 for s in p["payload"]["styles"]}
        self.assertEqual({"p": "p-pg2"}, renames)
        self.assertIn("p-pg2", names)
        self.assertNotIn("p", names)      # colliding name fully renamed
        self.assertIn("card", names)      # identical definition keeps its name

    def test_namespace_avoidance_never_renames_protected_hooks(self) -> None:
        html = '<body><div class="reveal">x</div></body>'
        css = ".reveal { opacity: 0; }"
        sections = converter.convert_sections(html, css)
        reserved = {"reveal": {"something-else" + json.dumps({}, sort_keys=True)}}
        renames = converter.apply_namespace_avoidance(
            sections, reserved, protected={"reveal"}, suffix="pg2")
        self.assertEqual({}, renames)
        names = {s["name"] for _l, p in sections
                 for s in p["payload"]["styles"]}
        self.assertIn("reveal", names)

    def test_state_css_selectors_follow_class_renames(self) -> None:
        html = """<html><head><style>
        .row .bar { width: 0; }
        .compare.in .row .bar::before { width: 25%; }
        @keyframes spin { to { transform: rotate(1turn); } }
        </style></head><body>
        <div class="compare"><div class="row"><div class="bar"></div></div></div>
        <script>document.querySelectorAll('.compare');</script>
        </body></html>"""
        with tempfile.TemporaryDirectory() as tmp:
            converter.write_text_artifacts(html, tmp,
                                           class_renames={"bar": "bar-pg2"})
            css = (Path(tmp) / "webflow-runtime-states.css").read_text(
                encoding="utf-8")
        # the class token is renamed AND the pseudo targets the materialized
        # child div (which keeps its own, non-colliding name)
        self.assertIn(".bar-pg2 > .bar-before", css)
        self.assertNotIn(".bar::before", css)

    def test_runtime_state_css_includes_unmatched_class_combinations(self) -> None:
        # `active` exists in markup (nav a.active), so the token check alone
        # missed `.pin-step.active` — but no element carries that COMBINATION
        # at markup time, so it is runtime state and must ship in the head CSS
        # (the invest pin-step regression).
        html = """<html><head><style>
        .pin-step { opacity: .35; }
        .pin-step.active { opacity: 1; }
        .pin-step.active .n { color: red; }
        nav a.active { color: blue; }
        </style></head><body>
        <nav><a class="active">here</a></nav>
        <div class="pin-step"><span class="n">1</span></div>
        </body></html>"""
        css = converter.extract_runtime_state_css(html)
        self.assertIn(".active.active.active{opacity:1", css)
        self.assertIn(" .n{color:red", css)
        # markup-time rules stay out
        self.assertNotIn("opacity:.35", css)
        self.assertNotIn("color:blue", css)

    def test_runtime_state_css_includes_details_open_rules(self) -> None:
        html = """<html><head><style>
        .faq details summary { cursor: pointer; }
        .faq details[open] summary { color: red; }
        .faq details[open] .a-wrap { max-height: 400px; }
        </style></head><body>
        <div class="faq"><details><summary>Q</summary>
        <div class="a-wrap">A</div></details></div>
        </body></html>"""
        css = converter.extract_runtime_state_css(html)
        # [open] is runtime attribute state; shipped with a specificity boost
        self.assertIn("details[open][open][open] summary{color:red", css)
        self.assertIn("details[open][open][open] .a-wrap{max-height:400px", css)
        self.assertNotIn("cursor:pointer", css)

    def test_runtime_state_pseudo_selectors_target_materialized_divs(self) -> None:
        # ::before/::after are materialized as real child divs in the paste;
        # a verbatim pseudo selector in the state CSS matches nothing (the
        # invest compare-bars regression).
        html = """<html><head><style>
        .bar::before { content: ''; width: 0; }
        .compare.in .row .bar::before { width: 25%; }
        summary::after { content: '+'; }
        details[open] summary::after { content: '-'; }
        </style></head><body>
        <div class="compare"><div class="row"><div class="bar"></div></div></div>
        <details><summary>Q</summary></details>
        </body></html>"""
        css = converter.extract_runtime_state_css(html)
        self.assertIn(".bar > .bar-before{width:25%", css)
        self.assertNotIn(".bar::before", css)
        self.assertIn("summary > .summary-after{content:'-'", css)

    def test_embed_style_selectors_follow_namespace_renames(self) -> None:
        # The form HtmlEmbed's <style> prefix scopes rules to ancestor classes
        # OUTSIDE the embed; when --avoid renames those ancestors, the embed
        # selectors must follow (the invest contact form regression).
        html = ('<body><section class="contact-grid">'
                '<form class="inner"><input type="text"></form>'
                '</section></body>')
        css = """
        .contact-grid { display: grid; }
        .contact-grid form input { border: none; }
        .inner { padding: 0; }
        """
        sections = converter.convert_sections(html, css)
        reserved = {"contact-grid": {"clash" + json.dumps({}, sort_keys=True)},
                    "inner": {"clash" + json.dumps({}, sort_keys=True)}}
        converter.apply_namespace_avoidance(sections, reserved,
                                            protected=set(), suffix="pg2")
        embed_nodes = [n for _l, p in sections
                       for n in p["payload"]["nodes"]
                       if n.get("type") == "HtmlEmbed"]
        self.assertTrue(embed_nodes)
        # The HTML lives in BOTH node["v"] AND the canonical Webflow field
        # node["data"]["embed"]["meta"]["html"] — Webflow PASTES from meta.html,
        # so the rename must reach both. Asserting only "v" let the contact-form
        # regression ship (meta.html kept ".contact-grid", form pasted native).
        meta_html = embed_nodes[0]["data"]["embed"]["meta"]["html"]
        for where in (embed_nodes[0]["v"], meta_html):
            # ancestor class renamed in the embed's <style> selectors
            self.assertIn(".contact-grid-pg2 form input", where)
            self.assertNotIn(".contact-grid form", where)
            # class used INSIDE the embed html stays untouched
            self.assertIn('class="inner"', where)

    def test_custom_code_artifact_is_iife_wrapped(self) -> None:
        # Top-level const/let share one global lexical scope across all
        # <script> tags; two pages' scripts installed site-wide collide
        # ("Identifier 'io' has already been declared") and the second never
        # runs. The artifact must ship pre-wrapped in its own scope.
        html = ('<html><body><div class="reveal">x</div>'
                '<script>const io = 1; console.log(io);</script>'
                '</body></html>')
        with tempfile.TemporaryDirectory() as tmp:
            converter.write_text_artifacts(html, tmp)
            code = (Path(tmp) / "webflow-custom-code.js").read_text(
                encoding="utf-8")
        self.assertTrue(code.startswith("(() => {"))
        self.assertTrue(code.rstrip().endswith("})();"))
        self.assertIn("const io = 1", code)

    def test_state_css_hook_tokens_survive_tag_name_squatting(self) -> None:
        # Anchor content classes are display-named after the tag (`a`, `a-2`,
        # ...). The FAQ answer `<div class="a">` is a state-CSS hook
        # (`details[open] .a`), and its record was uniquified to `a-10`,
        # stripping the literal token — every open answer stayed at opacity 0
        # (the invest FAQ empty-answer regression). Tag-derived names must
        # avoid hook tokens, and the hook element keeps its class verbatim.
        html = """<html><head><style>
        .faq details .a { opacity: 0; }
        .faq details[open] .a { opacity: 1; }
        a { color: inherit; }
        </style></head><body>
        <div class="faq"><a href="#">link one</a><a href="#x">link two</a>
        <details><summary>Q</summary><div class="a">answer text</div></details>
        </div>
        </body></html>"""
        payload = converter.convert(html, css="")
        styles = {s["_id"]: s for s in payload["payload"]["styles"]}
        answer = next(n for n in payload["payload"]["nodes"]
                      if n.get("v") is None and n.get("tag") == "div"
                      and any(styles[c]["name"] == "a"
                              for c in n.get("classes", [])))
        self.assertTrue(answer)
        # no anchor content class may claim the bare hook name
        for n in payload["payload"]["nodes"]:
            if n.get("tag") == "a":
                self.assertNotIn(
                    "a", [styles[c]["name"] for c in n.get("classes", [])])

    def test_inline_custom_properties_restored_via_custom_code(self) -> None:
        # Per-element inline tokens (`--w: 100%` on each compare row) cannot
        # ride the clipboard; the state CSS must keep `var(--w, 25%)` live and
        # the custom-code artifact must re-apply the inline values (the invest
        # compare-bars regression, round two).
        html = """<html><head><style>
        .compare .row .bar::before { content: ''; width: 0; }
        .compare.in .row .bar::before { width: var(--w, 25%); }
        </style></head><body>
        <section id="strategy"><div class="compare">
        <div class="row" style="--w: 100%"><span class="bar"></span></div>
        <div class="row" style="--w: 30%"><span class="bar"></span></div>
        </div></section>
        <script>document.querySelectorAll('.compare');</script>
        </body></html>"""
        css = converter.extract_runtime_state_css(html)
        # inline-defined var stays live; :root-style expansion would freeze
        # every bar at the 25% fallback
        self.assertIn("width:var(--w, 25%)", css)

        restorations = converter.extract_inline_var_restorations(html)
        self.assertEqual(
            [["#strategy .row", 0, "--w", "100%"],
             ["#strategy .row", 1, "--w", "30%"]],
            restorations)

        with tempfile.TemporaryDirectory() as tmp:
            converter.write_text_artifacts(html, tmp,
                                           class_renames={"row": "row-pg2"})
            code = (Path(tmp) / "webflow-custom-code.js").read_text(
                encoding="utf-8")
        # restoration block present, with renamed query, inside the IIFE
        self.assertIn('"#strategy .row-pg2", 0, "--w", "100%"', code)
        self.assertIn("style.setProperty(p, v)", code)
        self.assertTrue(code.startswith("(() => {"))

    def test_data_embed_style_script_ride_as_html_embeds(self) -> None:
        html = (
            '<section class="section_x">'
            '<div class="card">Hi</div>'
            '<style data-embed>.card:hover{opacity:.5}</style>'
            '<script data-embed>(function(){var x=1;})();</script>'
            '</section>'
        )
        css = '.card { color: red; }'

        payload = converter.convert(html, css)
        nodes = payload["payload"]["nodes"]
        embeds = [n for n in nodes if n.get("type") == "HtmlEmbed"]
        self.assertEqual(2, len(embeds))
        style_embed = next(n for n in embeds if n["v"].startswith("<style"))
        script_embed = next(n for n in embeds if n["v"].startswith("<script"))

        # embed content rides verbatim, in place, as the section's last children
        self.assertIn(".card:hover{opacity:.5}", style_embed["v"])
        self.assertIn("var x=1", script_embed["v"])
        self.assertTrue(script_embed["data"]["embed"]["meta"]["script"])
        self.assertFalse(style_embed["data"]["embed"]["meta"]["script"])
        root = nodes[0]
        self.assertEqual([style_embed["_id"], script_embed["_id"]],
                         root["children"][-2:])

        # the embed CSS is NOT folded into class records (external css is)
        card = next(s for s in payload["payload"]["styles"]
                    if s["name"] == "card")
        self.assertIn("color: red", card["styleLess"])
        self.assertNotIn("opacity", json.dumps(card))

        # the embed JS is NOT extracted into the page custom-code artifact
        code, _meta = converter.extract_custom_code(html)
        self.assertNotIn("var x=1", code)


if __name__ == "__main__":
    unittest.main()
