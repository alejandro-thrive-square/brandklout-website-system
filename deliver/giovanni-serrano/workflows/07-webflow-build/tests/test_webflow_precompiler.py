import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path


SCRIPT_PATH = Path(__file__).resolve().parents[1] / "07-webflow-build.py"
SPEC = importlib.util.spec_from_file_location("webflow_precompiler", SCRIPT_PATH)
precompiler = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
sys.modules[SPEC.name] = precompiler
SPEC.loader.exec_module(precompiler)


class WebflowPrecompilerTest(unittest.TestCase):
    def test_fixture_generates_expected_artifacts(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            source = root / "source"
            output = root / "out"
            source.mkdir()
            (source / "sample.webp").write_bytes(b"fixture")
            (source / "index.html").write_text(
                """<!doctype html>
<html>
<head>
  <style>
    :root { --terra: #E07A5F; --space: 24px; --display: "Lora", serif; }
    .hero { color: var(--terra); padding: var(--space); }
    .hero::before { content: ""; display: block; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @media (max-width: 640px) { .hero { padding: 12px; } }
  </style>
</head>
<body>
  <nav class="top"><a href="index.html">Home</a></nav>
  <section class="hero" id="intro">
    <h1>Move with intention</h1>
    <p>Sample body copy.</p>
    <img src="sample.webp" alt="Sample">
    <svg viewBox="0 0 10 10"><path d="M0 0L10 10"></path></svg>
  </section>
  <script>document.addEventListener('click', () => {});</script>
</body>
</html>
""",
                encoding="utf-8",
            )

            result = precompiler.run_all(source, output)

            self.assertTrue(result["validation"]["valid"])
            self.assertTrue((output / "precompile-report.json").exists())
            self.assertTrue((output / "token-map.input.json").exists())
            self.assertTrue((output / "element-actions" / "index.json").exists())

            tokens = json.loads((output / "token-map.input.json").read_text(encoding="utf-8"))
            token_names = {item["css_name"] for group in tokens["collections"] for item in group["variables"]}
            self.assertEqual({"--display", "--space", "--terra"}, token_names)

            elements = json.loads((output / "element-actions" / "index.json").read_text(encoding="utf-8"))
            self.assertLessEqual(elements["max_schema_depth"], precompiler.MAX_ELEMENT_SCHEMA_DEPTH)
            self.assertEqual(2, len(elements["actions"]))

            embeds = json.loads((output / "embed-plan.json").read_text(encoding="utf-8"))
            self.assertEqual(1, len(embeds["keyframes"]))
            self.assertEqual(1, len(embeds["pseudo_elements"]))
            self.assertEqual(1, len(embeds["embeds"]))
            self.assertEqual(1, len(embeds["scripts"]))


if __name__ == "__main__":
    unittest.main()
