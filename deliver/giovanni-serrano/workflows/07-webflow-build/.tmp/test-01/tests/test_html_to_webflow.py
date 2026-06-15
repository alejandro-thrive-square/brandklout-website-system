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
        ref = SCRIPT_PATH.parent / ".tmp" / "webflow_combo_class.json"
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
        by_name = {style["name"]: style for style in payload["payload"]["styles"]}

        self.assertIn("background: var(--canvas)", by_name["scene"]["styleLess"])
        self.assertIn("font-family: var(--body)", by_name["scene"]["styleLess"])
        self.assertIn("padding-top: 120px", by_name["scene"]["styleLess"])
        self.assertIn("padding-right: 40px", by_name["scene"]["styleLess"])
        self.assertIn("padding-bottom: 120px", by_name["scene"]["styleLess"])
        self.assertIn("padding-left: 40px", by_name["scene"]["styleLess"])
        self.assertIn("border-top-style: solid", by_name["scene"]["styleLess"])
        self.assertIn("border-top-width: 1px", by_name["scene"]["styleLess"])
        self.assertIn("border-top-color: var(--line)", by_name["scene"]["styleLess"])
        self.assertIn("background: var(--bone)", by_name["bone"]["styleLess"])
        self.assertEqual("&", by_name["bone"]["comb"])

    def test_preserved_vars_can_use_webflow_css_name_map(self) -> None:
        html = '<body><section class="scene">Title</section></body>'
        css = """
        :root { --canvas: #F4F1DE; --body: Inter, sans-serif; }
        body { background: var(--canvas); font-family: var(--body); }
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


if __name__ == "__main__":
    unittest.main()
