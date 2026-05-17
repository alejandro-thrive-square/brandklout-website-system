#!/usr/bin/env python3
"""
03-design.py — Design Workflow Executor (Giovanni Serrano)
Converts HTML variant prototypes to Figma via Figma MCP.

Usage:
    python 03-design.py --variant a
    python 03-design.py --variant b --port 9090

Workflow:
    1. Validates variant HTML exists
    2. Extracts design tokens from CSS custom properties
    3. Starts a local HTTP server to serve the HTML live
    4. Generates a structured MCP prompt for Claude Code
    5. Monitors for Figma file link (written by Claude Code)
    6. Logs conversion results and cleans up

Prerequisites:
    - Claude Code with Figma MCP installed:
        claude mcp add --scope user --transport http figma https://mcp.figma.com/mcp
"""

import argparse
import json
import os
import re
import signal
import sys
import threading
import time
from functools import partial
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path

WORKFLOW_DIR = Path(__file__).parent
TMP_DIR = WORKFLOW_DIR / ".tmp"
DEFAULT_PORT = 8080

VARIANT_A = TMP_DIR / "variant-a.html"
VARIANT_B = TMP_DIR / "variant-b.html"
VARIANTS = {"a": VARIANT_A, "b": VARIANT_B}

SECTION_MAP = [
    ("Hero", ".hero"),
    ("Nav", "nav.top"),
    ("Services", ".services-pin"),
    ("About", ".about-grid"),
    ("Milestones", ".milestones"),
    ("Capstone / Portfolio", ".capstone-card"),
    ("Proforma Analysis", ".proforma"),
    ("Reviews", ".review-stage"),
    ("CTA", ".cta-section"),
    ("Footer", "footer"),
]

FONT_MAP = {
    "display": {"family": "Lora", "fallback": "Georgia, serif", "weight": [400, 700]},
    "body": {"family": "Inter", "fallback": "-apple-system, sans-serif", "weight": [300, 400, 500, 600]},
}


def extract_tokens(html_text):
    """Extract CSS custom properties from the :root block of the HTML."""
    match = re.search(r":root\s*\{([^}]+)\}", html_text, re.DOTALL)
    if not match:
        return {}
    tokens = {}
    for line in match.group(1).split(";"):
        line = line.strip()
        if not line.startswith("--"):
            continue
        parts = line.split(":", 1)
        if len(parts) == 2:
            key = parts[0].strip()
            val = parts[1].strip().rstrip(";")
            tokens[key] = val
    return tokens


def extract_page_title(html_text):
    """Extract the <title> tag content."""
    m = re.search(r"<title>([^<]+)</title>", html_text)
    return m.group(1).strip() if m else "Untitled"


def categorize_tokens(tokens):
    """Group tokens by category (colors, fonts, spacing)."""
    categorized = {"colors": {}, "fonts": {}, "spacing": {}, "other": {}}
    for key, val in tokens.items():
        if val.startswith("#") or val.startswith("rgb") or val.startswith("hsl"):
            categorized["colors"][key] = val
        elif "font" in key.lower() or "family" in key.lower():
            categorized["fonts"][key] = val
        elif any(x in key for x in ["gap", "padding", "margin", "spacing", "size"]):
            categorized["spacing"][key] = val
        else:
            categorized["other"][key] = val
    return categorized


def detect_sections(html_text):
    """Identify key page sections present in the HTML."""
    found = []
    for name, selector in SECTION_MAP:
        escaped = selector.replace(".", "\\.").replace("#", "\\#")
        pattern = re.escape(selector)
        if re.search(pattern, html_text):
            found.append(name)
    return found


def build_tokens_markdown(tokens):
    """Format tokens as a compact markdown table."""
    cat = categorize_tokens(tokens)
    lines = []
    if cat["colors"]:
        lines.append("### Colors")
        for k, v in cat["colors"].items():
            lines.append(f"- `{k}` -> {v}")
    if cat["fonts"]:
        lines.append("\n### Typography")
        for k, v in cat["fonts"].items():
            lines.append(f"- `{k}` -> {v}")
    if cat["spacing"]:
        lines.append("\n### Spacing")
        for k, v in cat["spacing"].items():
            lines.append(f"- `{k}` -> {v}")
    if cat["other"]:
        lines.append("\n### Other Tokens")
        for k, v in cat["other"].items():
            lines.append(f"- `{k}` -> {v}")
    return "\n".join(lines)


def start_server(directory, port):
    """Start a background HTTP server serving the given directory."""
    os.chdir(directory)
    handler = partial(SimpleHTTPRequestHandler, directory=str(directory))
    server = HTTPServer(("0.0.0.0", port), handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    return server


def build_mcp_prompt(variant_label, variant_url, tokens, sections, page_title):
    """Generate the structured MCP action prompt for Claude Code."""
    token_table = build_tokens_markdown(tokens)
    section_list = "\n".join(f"  {i+1}. {s}" for i, s in enumerate(sections))

    return f"""# Figma MCP Conversion: Variant {variant_label}

## Source
**Page**: {page_title}
**URL**: {variant_url}
**Sections detected**:
{section_list}

## Action
Use the Figma MCP `generate_figma_design` tool to capture the live UI from the URL above into a new Figma file.

## Design Tokens (CSS custom properties)
{token_table}

## Fonts
| Role | Family | Weights |
|------|--------|---------|
| Display | {FONT_MAP['display']['family']} | {', '.join(str(w) for w in FONT_MAP['display']['weight'])} |
| Body | {FONT_MAP['body']['family']} | {', '.join(str(w) for w in FONT_MAP['body']['weight'])} |

## Requirements
1. Capture the full page at **1440px** viewport width
2. Create **auto-layout frames** for each section
3. Apply design tokens as **Figma Variables** (colors, typography, spacing)
4. Create **reusable components** for repeated patterns (nav items, stat blocks, service cards, review cards, CTAs)
5. Set up **responsive constraints** matching the CSS grid behavior

## After Conversion
1. Save the Figma file link here: `{TMP_DIR / "figma-homepage.figma"}`
2. Update conversion log: `{TMP_DIR / "figma-conversion-log.json"}`

## Notes
- The HTML uses CSS Grid for layout — preserve this structure using Figma auto-layout
- Some visual effects (WebGL canvas, custom cursor, scroll animations) are JS-driven — capture the static layout as rendered
- Google Fonts (Lora, Inter) should resolve correctly during live capture
- Hero section may use a placeholder background since the WebGL shader requires JS runtime
"""


def main():
    parser = argparse.ArgumentParser(
        description="Convert HTML variants to Figma via Figma MCP"
    )
    parser.add_argument(
        "--variant",
        choices=["a", "b", "both"],
        default="a",
        help="Which variant to convert (default: a)",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=DEFAULT_PORT,
        help=f"Local server port (default: {DEFAULT_PORT})",
    )
    args = parser.parse_args()

    # -- Step 1: Validate inputs --------------------------------------
    files = []
    if args.variant == "both":
        files = [("a", VARIANT_A), ("b", VARIANT_B)]
    else:
        files = [(args.variant, VARIANTS[args.variant])]

    for label, path in files:
        if not path.exists():
            print(f"[ERROR] Variant {label} not found: {path}")
            print(f"  Expected HTML prototypes at {TMP_DIR / f'variant-{label}.html'}")
            sys.exit(1)

    TMP_DIR.mkdir(parents=True, exist_ok=True)

    # -- Step 2: Extract tokens & metadata ----------------------------
    tokens = {}
    sections = []
    page_title = ""
    for label, path in files:
        html = path.read_text(encoding="utf-8")
        tokens[label] = extract_tokens(html)
        if label == args.variant or args.variant == "both":
            sections = detect_sections(html)
            page_title = extract_page_title(html)

    tokens_path = TMP_DIR / "design-tokens.json"
    tokens_path.write_text(json.dumps(tokens, indent=2), encoding="utf-8")
    print(f"[OK] Design tokens extracted -> {tokens_path}")

    # -- Step 3: Start local server -----------------------------------
    server = start_server(TMP_DIR, args.port)
    variant_name = "both" if args.variant == "both" else f"variant-{args.variant}.html"
    variant_url = f"http://localhost:{args.port}/{variant_name}"

    print(f"\n[OK] Local server started -> http://localhost:{args.port}")
    for label, path in files:
        print(f"      Variant {label.upper()}: http://localhost:{args.port}/{path.name}")
    print()

    # -- Step 4: Generate MCP prompt ----------------------------------
    variant_label = args.variant.upper()
    mcp_text = build_mcp_prompt(
        variant_label=variant_label,
        variant_url=variant_url,
        tokens=tokens.get(args.variant) or list(tokens.values())[0],
        sections=sections,
        page_title=page_title,
    )

    prompt_path = TMP_DIR / "mcp-prompt.txt"
    prompt_path.write_text(mcp_text, encoding="utf-8")
    print(f"[OK] MCP prompt saved -> {prompt_path}")

    # Print the prompt for the terminal
    print("=" * 70)
    print("MCP PROMPT FOR CLAUDE CODE — copy this into Claude Code:")
    print("=" * 70)
    print(mcp_text)

    # -- Step 5: Write initial conversion log --------------------------
    log_entry = {
        "variant": args.variant,
        "page_title": page_title,
        "source_files": [str(p) for _, p in files],
        "local_url": variant_url,
        "server_port": args.port,
        "sections_detected": sections,
        "tokens_extracted": {k: len(v) for k, v in tokens.items()},
        "fonts": FONT_MAP,
        "mcp_prompt_file": str(prompt_path),
        "status": "awaiting_mcp",
        "figma_link": None,
    }
    log_path = TMP_DIR / "figma-conversion-log.json"
    log_path.write_text(json.dumps(log_entry, indent=2), encoding="utf-8")
    print(f"\n[OK] Conversion log -> {log_path}")

    # -- Step 6: Monitor for Figma link --------------------------------
    figma_link_file = TMP_DIR / "figma-homepage.figma"
    print(f"\n{'=' * 70}")
    print("NEXT STEPS:")
    print(f"{'=' * 70}")
    print("1. Make sure Figma MCP is installed in Claude Code:")
    print("     claude mcp add --scope user --transport http figma https://mcp.figma.com/mcp")
    print("2. Open Claude Code and paste the MCP prompt above")
    print("3. Claude Code will capture the live HTML and create a Figma file")
    print("4. The file link will be saved automatically to:")
    print(f"     {figma_link_file}")
    print(f"\nPress Ctrl+C to stop the server.\n")

    figma_link_file_path = figma_link_file

    def signal_handler(signum, frame):
        print("\n[!] Server stopped by user.")
        server.shutdown()
        sys.exit(0)

    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    try:
        while not figma_link_file_path.exists():
            time.sleep(1)
        figma_link = figma_link_file_path.read_text(encoding="utf-8").strip()
        log_entry["status"] = "completed"
        log_entry["figma_link"] = figma_link
        log_path.write_text(json.dumps(log_entry, indent=2), encoding="utf-8")
        print(f"\n[SUCCESS] Figma file created!")
        print(f"  Link: {figma_link}")
        print(f"  Log: {log_path}")
    except KeyboardInterrupt:
        print("\n[!] Server stopped by user.")
    finally:
        server.shutdown()


if __name__ == "__main__":
    main()
