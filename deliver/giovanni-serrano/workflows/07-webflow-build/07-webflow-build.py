#!/usr/bin/env python3
"""Precompile an approved HTML prototype into Webflow MCP build artifacts.

The executor is intentionally offline-first: it reads local HTML/CSS/JS and
writes JSON/runbook files only. It never calls Webflow or mutates a site.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass, field
from html import unescape
from html.parser import HTMLParser
from pathlib import Path
from typing import Any
from urllib.parse import unquote


WORKFLOW_DIR = Path(__file__).resolve().parent
DEFAULT_SOURCE = (WORKFLOW_DIR.parent / "05-design-revisions" / ".tmp" / "final-design").resolve()
DEFAULT_OUTPUT = (WORKFLOW_DIR / ".tmp").resolve()
MAX_ELEMENT_SCHEMA_DEPTH = 64
MAX_EMBED_CHARS = 12000

MEDIA_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".ico", ".mp4", ".mov"}
SUPPORTED_NATIVE_TAGS = {
    "a",
    "article",
    "aside",
    "br",
    "button",
    "details",
    "div",
    "em",
    "footer",
    "form",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "header",
    "img",
    "input",
    "label",
    "li",
    "main",
    "nav",
    "ol",
    "option",
    "p",
    "section",
    "select",
    "span",
    "summary",
    "strong",
    "textarea",
    "ul",
    "video",
}
SKIP_TREE_TAGS = {"html", "head", "body", "meta", "title", "link", "style", "script"}


def slugify(value: str, fallback: str = "item") -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or fallback


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="replace")


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def write_text(path: Path, payload: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(payload, encoding="utf-8")


@dataclass
class HtmlNode:
    tag: str
    attrs: dict[str, str] = field(default_factory=dict)
    children: list["HtmlNode"] = field(default_factory=list)
    text: str = ""

    def classes(self) -> list[str]:
        return [item for item in self.attrs.get("class", "").split() if item]

    def text_content(self) -> str:
        parts = [self.text]
        for child in self.children:
            parts.append(child.text_content())
        return normalize_space(" ".join(parts))


class PrototypeParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=False)
        self.root = HtmlNode("document")
        self.stack = [self.root]
        self.styles: list[str] = []
        self.scripts: list[str] = []
        self.links: list[dict[str, str]] = []
        self.inline_svgs: list[str] = []
        self._capture_tag: str | None = None
        self._capture: list[str] = []
        self._svg_depth = 0
        self._svg_capture: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attr_map = {name: value or "" for name, value in attrs}
        raw = self.get_starttag_text() or f"<{tag}>"
        if tag == "style":
            self._capture_tag = "style"
            self._capture = []
            return
        if tag == "script":
            self._capture_tag = "script"
            self._capture = []
            return
        if tag == "link":
            self.links.append(attr_map)
        if tag == "svg":
            self._svg_depth = 1
            self._svg_capture = [raw]
        elif self._svg_depth:
            self._svg_depth += 1
            self._svg_capture.append(raw)

        node = HtmlNode(tag=tag, attrs=attr_map)
        self.stack[-1].children.append(node)
        if tag not in {"meta", "link", "img", "input", "br", "hr"}:
            self.stack.append(node)

    def handle_endtag(self, tag: str) -> None:
        if self._capture_tag == tag:
            captured = "".join(self._capture)
            if tag == "style":
                self.styles.append(captured)
            else:
                self.scripts.append(captured)
            self._capture_tag = None
            self._capture = []
            return

        if self._svg_depth:
            self._svg_capture.append(f"</{tag}>")
            self._svg_depth -= 1
            if self._svg_depth == 0:
                self.inline_svgs.append("".join(self._svg_capture))
                self._svg_capture = []

        for index in range(len(self.stack) - 1, 0, -1):
            if self.stack[index].tag == tag:
                del self.stack[index:]
                break

    def handle_data(self, data: str) -> None:
        if self._capture_tag:
            self._capture.append(data)
            return
        if self._svg_depth:
            self._svg_capture.append(data)
        if data.strip():
            self.stack[-1].text += unescape(data)

    def handle_entityref(self, name: str) -> None:
        self.handle_data(f"&{name};")

    def handle_charref(self, name: str) -> None:
        self.handle_data(f"&#{name};")


def normalize_space(value: str) -> str:
    return re.sub(r"\s+", " ", unescape(value)).strip()


def parse_page(path: Path) -> dict[str, Any]:
    parser = PrototypeParser()
    html = read_text(path)
    parser.feed(html)
    return {
        "path": path,
        "slug": path.stem,
        "html": html,
        "tree": parser.root,
        "styles": parser.styles,
        "scripts": parser.scripts,
        "links": parser.links,
        "inline_svgs": parser.inline_svgs,
    }


def extract_css_variables(css_blocks: list[str]) -> list[dict[str, str]]:
    variables: dict[str, str] = {}
    for css in css_blocks:
        for root_match in re.finditer(r":root\s*\{(?P<body>.*?)\}", css, flags=re.DOTALL):
            for name, value in re.findall(r"(--[\w-]+)\s*:\s*([^;]+);", root_match.group("body")):
                variables[name] = normalize_space(value)
    return [
        {"css_name": name, "webflow_name": name.removeprefix("--"), "type": classify_variable(value), "value": value}
        for name, value in sorted(variables.items())
    ]


def classify_variable(value: str) -> str:
    lowered = value.lower()
    if re.search(r"#(?:[0-9a-f]{3}){1,2}\b|rgba?\(|hsla?\(", lowered):
        return "color"
    if any(unit in lowered for unit in ("px", "rem", "em", "vw", "vh", "%", "clamp(", "calc(")):
        return "size"
    if "," in value and any(font in lowered for font in ("serif", "sans", "mono", "inter", "lora")):
        return "font_family"
    if re.fullmatch(r"-?\d+(\.\d+)?", value):
        return "number"
    return "string"


def strip_css_comments(css: str) -> str:
    return re.sub(r"/\*.*?\*/", "", css, flags=re.DOTALL)


def extract_balanced_blocks(css: str, at_rule: str) -> list[dict[str, str]]:
    blocks: list[dict[str, str]] = []
    pattern = re.compile(rf"@{at_rule}\s+([^{{]+)\{{")
    for match in pattern.finditer(css):
        start = match.end()
        depth = 1
        pos = start
        while pos < len(css) and depth:
            if css[pos] == "{":
                depth += 1
            elif css[pos] == "}":
                depth -= 1
            pos += 1
        blocks.append({"name": normalize_space(match.group(1)), "body": css[start : pos - 1]})
    return blocks


def remove_at_blocks(css: str, at_rule: str) -> str:
    output = []
    last = 0
    pattern = re.compile(rf"@{at_rule}\s+[^{{]+\{{")
    for match in pattern.finditer(css):
        start = match.start()
        pos = match.end()
        depth = 1
        while pos < len(css) and depth:
            if css[pos] == "{":
                depth += 1
            elif css[pos] == "}":
                depth -= 1
            pos += 1
        output.append(css[last:start])
        last = pos
    output.append(css[last:])
    return "".join(output)


def parse_declarations(body: str) -> dict[str, str]:
    declarations: dict[str, str] = {}
    for item in body.split(";"):
        if ":" not in item:
            continue
        key, value = item.split(":", 1)
        key = normalize_space(key)
        value = normalize_space(value)
        if key and value:
            declarations[key] = value
    return declarations


def extract_style_actions(css_blocks: list[str]) -> dict[str, Any]:
    combined = strip_css_comments("\n".join(css_blocks))
    keyframes = extract_balanced_blocks(combined, "keyframes")
    media_blocks = extract_balanced_blocks(combined, "media")
    base_css = remove_at_blocks(remove_at_blocks(combined, "media"), "keyframes")

    rules: dict[str, dict[str, Any]] = {}
    pseudo_selectors: list[str] = []

    def add_rules(css: str, breakpoint: str) -> None:
        for selector_text, body in re.findall(r"([^{}@]+)\{([^{}]*)\}", css):
            declarations = parse_declarations(body)
            if not declarations:
                continue
            selectors = [normalize_space(item) for item in selector_text.split(",") if normalize_space(item)]
            for selector in selectors:
                if "::before" in selector or "::after" in selector:
                    pseudo_selectors.append(selector)
                    continue
                style_name = selector_to_style_name(selector)
                rules.setdefault(
                    style_name,
                    {"style_name": style_name, "selectors": [], "breakpoints": {}, "tool": "style_tool"},
                )
                if selector not in rules[style_name]["selectors"]:
                    rules[style_name]["selectors"].append(selector)
                rules[style_name]["breakpoints"][breakpoint] = declarations

    add_rules(base_css, "desktop")
    for media in media_blocks:
        add_rules(media["body"], media["name"])

    return {
        "styles": sorted(rules.values(), key=lambda item: item["style_name"]),
        "keyframes": keyframes,
        "pseudo_selectors": sorted(set(pseudo_selectors)),
    }


def selector_to_style_name(selector: str) -> str:
    selector = re.sub(r":(hover|focus|active|visited|first-child|last-child|nth-child\([^)]*\))", "", selector)
    classes = re.findall(r"\.([A-Za-z0-9_-]+)", selector)
    if classes:
        return " ".join(slugify(item) for item in classes)
    tag = re.match(r"[A-Za-z][\w-]*", selector)
    return slugify(tag.group(0) if tag else selector, "base")


def find_body_children(root: HtmlNode) -> list[HtmlNode]:
    found: list[HtmlNode] = []

    def walk(node: HtmlNode) -> None:
        if node.tag == "body":
            found.extend(child for child in node.children if child.tag not in SKIP_TREE_TAGS)
            return
        for child in node.children:
            walk(child)

    walk(root)
    return found or [child for child in root.children if child.tag not in SKIP_TREE_TAGS]


def element_type_for(node: HtmlNode) -> str:
    tag = node.tag
    if tag in {"section"}:
        return "Section"
    if tag in {"h1", "h2", "h3", "h4", "h5", "h6"}:
        return "Heading"
    if tag == "p":
        return "Paragraph"
    if tag == "button":
        return "Button"
    if tag == "a":
        return "LinkBlock" if node.children else "TextLink"
    if tag == "img":
        return "Image"
    if tag == "form":
        return "Form"
    if tag == "input":
        return "FormTextInput"
    if tag == "textarea":
        return "FormTextArea"
    if tag == "video":
        return "Video"
    if tag in {"span", "em", "strong", "label"}:
        return "DOM"
    return "DivBlock"


def schema_for_node(node: HtmlNode, depth: int = 1) -> dict[str, Any] | None:
    if node.tag in SKIP_TREE_TAGS:
        return None
    if node.tag == "svg":
        return {"type": "DivBlock", "set_style": style_payload(node), "precompiler_note": "inline_svg_embed"}

    schema: dict[str, Any] = {"type": element_type_for(node)}
    styles = style_payload(node)
    if styles:
        schema["set_style"] = styles
    text = node.text_content()
    if schema["type"] in {"Heading", "Paragraph", "Button", "TextLink"} and text:
        schema["set_text"] = {"text": text}
    if schema["type"] == "DOM":
        schema["set_dom_config"] = {"tag": node.tag}
        if text:
            schema["set_text"] = {"text": text}
    if node.tag in {"h1", "h2", "h3", "h4", "h5", "h6"}:
        schema["set_heading_level"] = {"heading_level": int(node.tag[1])}
    if node.tag == "a" and node.attrs.get("href"):
        schema["set_link"] = classify_link(node.attrs["href"])
    if node.tag == "img":
        schema["set_image_asset"] = {
            "source_path": node.attrs.get("src", ""),
            "alt_text": node.attrs.get("alt", ""),
            "image_asset_id": "{{asset:" + node.attrs.get("src", "") + "}}",
        }
    attrs = filtered_attrs(node.attrs)
    if attrs:
        schema["attributes"] = attrs

    if depth < MAX_ELEMENT_SCHEMA_DEPTH and schema["type"] not in {"Heading", "Paragraph", "Button", "TextLink", "Image"}:
        children = [schema_for_node(child, depth + 1) for child in node.children if child.tag not in SKIP_TREE_TAGS]
        children = [child for child in children if child]
        if children:
            schema["children"] = children
    elif node.children:
        deferred = count_descendants(node)
        if deferred:
            schema["precompiler_deferred_descendants"] = deferred
    return schema


def style_payload(node: HtmlNode) -> dict[str, list[str]] | None:
    names = [slugify(item) for item in node.classes()]
    if names:
        return {"style_names": names}
    return None


def filtered_attrs(attrs: dict[str, str]) -> dict[str, str]:
    allowed: dict[str, str] = {}
    for key in ("id", "aria-label", "role", "data-screen-label", "name", "type", "placeholder", "value"):
        if attrs.get(key):
            allowed[key] = attrs[key]
    if attrs.get("style"):
        allowed["data-inline-style"] = attrs["style"]
    return allowed


def classify_link(href: str) -> dict[str, str]:
    if href.startswith("mailto:"):
        return {"link_type": "email", "link": href.removeprefix("mailto:")}
    if href.startswith("tel:"):
        return {"link_type": "phone", "link": href.removeprefix("tel:")}
    if href.startswith("#"):
        return {"link_type": "element", "link": href.removeprefix("#")}
    return {"link_type": "url", "link": href}


def count_descendants(node: HtmlNode) -> int:
    return sum(1 + count_descendants(child) for child in node.children if child.tag not in SKIP_TREE_TAGS)


def build_element_actions(page: dict[str, Any]) -> dict[str, Any]:
    actions: list[dict[str, Any]] = []
    unsupported: dict[str, int] = {}
    for node in find_body_children(page["tree"]):
        collect_unsupported(node, unsupported)
        schema = schema_for_node(node)
        if not schema:
            continue
        actions.append(
            {
                "tool": "element_builder",
                "local_ref": f"{page['slug']}-{len(actions) + 1:03d}-{slugify(node.attrs.get('id') or 'section')}",
                "parentElementId": "{{PAGE_ROOT}}",
                "creationPosition": "append",
                "elementSchema": schema,
            }
        )
    return {
        "page": page["slug"],
        "source_file": page["path"].name,
        "requires_site_id": True,
        "requires_page_root": True,
        "max_schema_depth": max((schema_depth(action["elementSchema"]) for action in actions), default=0),
        "actions": actions,
        "unsupported_tags": unsupported,
    }


def collect_unsupported(node: HtmlNode, counter: dict[str, int]) -> None:
    if node.tag == "svg":
        return
    if node.tag not in SUPPORTED_NATIVE_TAGS and node.tag not in SKIP_TREE_TAGS and node.tag != "svg":
        counter[node.tag] = counter.get(node.tag, 0) + 1
    for child in node.children:
        collect_unsupported(child, counter)


def schema_depth(schema: dict[str, Any]) -> int:
    children = schema.get("children") or []
    if not children:
        return 1
    return 1 + max(schema_depth(child) for child in children)


def collect_asset_refs(pages: list[dict[str, Any]], style_actions: dict[str, Any], source_dir: Path) -> list[dict[str, Any]]:
    refs: dict[str, dict[str, Any]] = {}

    def add_ref(ref: str, source: str) -> None:
        if not ref or ref.startswith(("http://", "https://", "data:", "#", "mailto:", "tel:")):
            return
        clean = unquote(unescape(ref).strip().strip("'\""))
        suffix = Path(clean.split("?", 1)[0]).suffix.lower()
        if suffix not in MEDIA_EXTENSIONS:
            return
        asset_path = (source_dir / clean).resolve()
        refs.setdefault(
            clean,
            {
                "original_path": clean,
                "resolved_path": str(asset_path),
                "exists": asset_path.exists(),
                "extension": suffix,
                "sources": [],
                "tool": "data_assets_tool",
            },
        )
        if source not in refs[clean]["sources"]:
            refs[clean]["sources"].append(source)

    def walk(node: HtmlNode, source: str) -> None:
        for attr in ("src", "href", "poster"):
            add_ref(node.attrs.get(attr, ""), source)
        style = node.attrs.get("style", "")
        for url in re.findall(r"url\(([^)]+)\)", style):
            add_ref(url, source)
        for child in node.children:
            walk(child, source)

    for page in pages:
        walk(page["tree"], page["path"].name)
        for css in page["styles"]:
            for url in re.findall(r"url\(([^)]+)\)", css):
                add_ref(url, page["path"].name)
    for style in style_actions.get("styles", []):
        for declarations in style.get("breakpoints", {}).values():
            for value in declarations.values():
                for url in re.findall(r"url\(([^)]+)\)", value):
                    add_ref(url, "css")
    return sorted(refs.values(), key=lambda item: item["original_path"])


def build_embed_plan(pages: list[dict[str, Any]], style_actions: dict[str, Any]) -> dict[str, Any]:
    embeds: list[dict[str, Any]] = []
    scripts: list[dict[str, Any]] = []
    for page in pages:
        for index, svg in enumerate(page["inline_svgs"], start=1):
            embeds.append(
                {
                    "page": page["slug"],
                    "kind": "inline_svg",
                    "index": index,
                    "tool": "whtml_builder",
                    "reason": classify_svg(svg),
                    "char_count": len(svg),
                    "oversized": len(svg) > MAX_EMBED_CHARS,
                    "html": svg if len(svg) <= MAX_EMBED_CHARS else svg[:MAX_EMBED_CHARS] + "\n<!-- truncated for review -->",
                }
            )
        for index, script in enumerate(page["scripts"], start=1):
            scripts.append(
                {
                    "page": page["slug"],
                    "index": index,
                    "tool": "data_scripts_tool",
                    "reason": classify_script(script),
                    "char_count": len(script),
                    "oversized": len(script) > MAX_EMBED_CHARS,
                    "contains_airtable_reference": "airtable" in script.lower() or "/api/portfolio" in script,
                }
            )
    return {
        "keyframes": [
            {"name": item["name"], "tool": "whtml_builder", "reason": "css_keyframes", "char_count": len(item["body"])}
            for item in style_actions.get("keyframes", [])
        ],
        "pseudo_elements": [
            {"selector": selector, "tool": "whtml_builder", "reason": "css_pseudo_element"}
            for selector in style_actions.get("pseudo_selectors", [])
        ],
        "embeds": embeds,
        "scripts": scripts,
    }


def classify_svg(svg: str) -> str:
    shape_count = len(re.findall(r"<(path|rect|circle|line|polyline|polygon|text|g)\b", svg))
    if shape_count <= 4 and len(svg) <= 2000:
        return "simple_svg_review_for_asset_upload"
    return "complex_svg_keep_as_embed"


def classify_script(script: str) -> str:
    lowered = script.lower()
    if "fetch('/api/portfolio'" in lowered or "airtable" in lowered:
        return "dynamic_portfolio_loader"
    if "intersectionobserver" in lowered or "addeventlistener" in lowered:
        return "custom_interaction_script"
    return "custom_page_script"


def extract_cms_import(pages: list[dict[str, Any]]) -> dict[str, Any]:
    collections: dict[str, dict[str, Any]] = {}
    class_to_collection = {
        "project-card": "Portfolio Projects",
        "r": "Testimonials",
        "path-card": "Service Cards",
        "step": "Process Steps",
        "floor": "Process Steps",
    }

    def walk(node: HtmlNode, page_slug: str) -> None:
        for class_name in node.classes():
            collection = class_to_collection.get(class_name)
            if collection:
                item = summarize_node_item(node, page_slug)
                collections.setdefault(collection, {"name": collection, "tool": "data_cms_tool", "items": []})
                if item["text"]:
                    collections[collection]["items"].append(item)
        for child in node.children:
            walk(child, page_slug)

    for page in pages:
        walk(page["tree"], page["slug"])

    for collection in collections.values():
        seen = set()
        unique_items = []
        for item in collection["items"]:
            key = (item["page"], item["text"][:120])
            if key not in seen:
                seen.add(key)
                unique_items.append(item)
        collection["items"] = unique_items[:100]
        collection["field_suggestion"] = ["name", "summary", "page", "source_classes"]

    return {"collections": sorted(collections.values(), key=lambda item: item["name"])}


def summarize_node_item(node: HtmlNode, page_slug: str) -> dict[str, Any]:
    text = node.text_content()
    return {
        "page": page_slug,
        "source_tag": node.tag,
        "source_classes": node.classes(),
        "name": text[:80],
        "text": text[:500],
    }


def build_token_actions(tokens: list[dict[str, str]]) -> dict[str, Any]:
    grouped: dict[str, list[dict[str, str]]] = {}
    for token in tokens:
        grouped.setdefault(token["type"], []).append(token)
    return {
        "requires_site_id": True,
        "tool": "variable_tool",
        "collections": [
            {
                "name": collection_name_for_type(token_type),
                "type": token_type,
                "variables": values,
            }
            for token_type, values in sorted(grouped.items())
        ],
    }


def collection_name_for_type(token_type: str) -> str:
    return {
        "color": "Brand Colors",
        "size": "Spacing and Sizing",
        "font_family": "Typography",
        "number": "Numbers",
        "string": "Other Tokens",
    }.get(token_type, "Other Tokens")


def build_report(
    pages: list[dict[str, Any]],
    tokens: list[dict[str, str]],
    style_actions: dict[str, Any],
    assets: list[dict[str, Any]],
    embed_plan: dict[str, Any],
    cms_import: dict[str, Any],
) -> dict[str, Any]:
    return {
        "source_pages": [page["path"].name for page in pages],
        "page_count": len(pages),
        "token_count": len(tokens),
        "style_count": len(style_actions.get("styles", [])),
        "asset_count": len(assets),
        "missing_asset_count": sum(1 for asset in assets if not asset["exists"]),
        "inline_svg_count": sum(len(page["inline_svgs"]) for page in pages),
        "script_count": sum(len(page["scripts"]) for page in pages),
        "keyframe_count": len(embed_plan.get("keyframes", [])),
        "pseudo_element_count": len(embed_plan.get("pseudo_elements", [])),
        "cms_collection_count": len(cms_import.get("collections", [])),
        "safety": {
            "mutates_webflow": False,
            "requires_site_confirmation_before_execution": True,
            "requires_mcp_bridge_app": True,
            "writes_credentials": False,
        },
    }


def discover_pages(source_dir: Path) -> list[Path]:
    return sorted(path for path in source_dir.glob("*.html") if path.is_file())


def analyze(source_dir: Path, output_dir: Path) -> dict[str, Any]:
    pages = [parse_page(path) for path in discover_pages(source_dir)]
    css_blocks = [css for page in pages for css in page["styles"]]
    tokens = extract_css_variables(css_blocks)
    style_actions = extract_style_actions(css_blocks)
    assets = collect_asset_refs(pages, style_actions, source_dir)
    embed_plan = build_embed_plan(pages, style_actions)
    cms_import = extract_cms_import(pages)
    report = build_report(pages, tokens, style_actions, assets, embed_plan, cms_import)

    write_json(output_dir / "precompile-report.json", report)
    write_json(output_dir / "token-map.input.json", build_token_actions(tokens))
    write_json(output_dir / "style-actions.json", style_actions)
    write_json(output_dir / "asset-upload-plan.json", {"assets": assets})
    write_json(output_dir / "embed-plan.json", embed_plan)
    write_json(output_dir / "cms-import.json", cms_import)
    return report


def compile_actions(source_dir: Path, output_dir: Path) -> dict[str, Any]:
    pages = [parse_page(path) for path in discover_pages(source_dir)]
    element_dir = output_dir / "element-actions"
    element_dir.mkdir(parents=True, exist_ok=True)
    compiled_pages = []
    for page in pages:
        payload = build_element_actions(page)
        write_json(element_dir / f"{page['slug']}.json", payload)
        compiled_pages.append(
            {
                "page": page["slug"],
                "source_file": page["path"].name,
                "action_count": len(payload["actions"]),
                "max_schema_depth": payload["max_schema_depth"],
                "unsupported_tags": payload["unsupported_tags"],
            }
        )
    runbook = render_runbook(source_dir, output_dir, compiled_pages)
    write_text(output_dir / "mcp-runbook.md", runbook)
    return {"compiled_pages": compiled_pages, "runbook": str(output_dir / "mcp-runbook.md")}


def render_runbook(source_dir: Path, output_dir: Path, pages: list[dict[str, Any]]) -> str:
    page_lines = "\n".join(
        f"- `{page['page']}` from `{page['source_file']}`: {page['action_count']} top-level actions, max schema depth {page['max_schema_depth']}"
        for page in pages
    )
    return f"""# Webflow MCP Precompile Runbook

## Review Gate
Do not execute these payloads until the optional Webflow path is activated, the target Webflow site ID is confirmed, and the Webflow MCP Bridge App is open in Designer.

## Source
- Prototype: `{source_dir}`
- Artifacts: `{output_dir}`

## Execution Order
1. Review `precompile-report.json` and resolve any validation errors.
2. Use `token-map.input.json` with `variable_tool`.
3. Use `style-actions.json` with `style_tool`.
4. Upload assets from `asset-upload-plan.json` with `data_assets_tool`.
5. Create or select each page with `de_page_tool`.
6. Execute the relevant `element-actions/*.json` batches with `element_builder`.
7. Use `cms-import.json` with `data_cms_tool` where CMS collections are approved.
8. Use `embed-plan.json` for targeted `whtml_builder` and `data_scripts_tool` work only after review.

## Pages
{page_lines}

## Notes
- `{{PAGE_ROOT}}`, `{{siteId}}`, and `{{asset:*}}` placeholders must be replaced by the MCP-enabled agent at runtime.
- This precompiler does not publish, delete, overwrite, or mutate Webflow data.

## Version Control
This artifact follows the root-level version control rules in `SYSTEM_RULES.md`. Commit lightweight JSON/Markdown artifacts only; never commit secrets or binary media.

## Infrastructure
- Hosting: Hostinger VPS
- OS: Ubuntu 24.04 LTS
"""


def validate(output_dir: Path) -> dict[str, Any]:
    errors: list[str] = []
    warnings: list[str] = []

    required = [
        "precompile-report.json",
        "token-map.input.json",
        "style-actions.json",
        "asset-upload-plan.json",
        "embed-plan.json",
        "cms-import.json",
        "mcp-runbook.md",
    ]
    for name in required:
        if not (output_dir / name).exists():
            errors.append(f"Missing artifact: {name}")

    asset_plan_path = output_dir / "asset-upload-plan.json"
    if asset_plan_path.exists():
        asset_plan = json.loads(read_text(asset_plan_path))
        for asset in asset_plan.get("assets", []):
            if not asset.get("exists"):
                warnings.append(f"Missing local asset: {asset.get('original_path')}")

    for path in sorted((output_dir / "element-actions").glob("*.json")):
        payload = json.loads(read_text(path))
        for index, action in enumerate(payload.get("actions", []), start=1):
            depth = schema_depth(action.get("elementSchema", {}))
            if depth > MAX_ELEMENT_SCHEMA_DEPTH:
                errors.append(f"{path.name} action {index} exceeds schema depth {MAX_ELEMENT_SCHEMA_DEPTH}: {depth}")
        for tag, count in payload.get("unsupported_tags", {}).items():
            warnings.append(f"{path.name} contains unsupported tag `{tag}` {count} time(s)")

    embed_path = output_dir / "embed-plan.json"
    if embed_path.exists():
        embed_plan = json.loads(read_text(embed_path))
        for group in ("embeds", "scripts"):
            for item in embed_plan.get(group, []):
                if item.get("oversized"):
                    warnings.append(f"Oversized {group[:-1]} in page {item.get('page')} index {item.get('index')}")

    for path in output_dir.rglob("*"):
        if path.is_file() and path.suffix.lower() in {".json", ".md", ".txt", ".csv"}:
            text = read_text(path)
            if re.search(r"(airtable_token|api[_-]?key|secret|password)\s*[:=]\s*['\"][^'\"]+", text, re.I):
                errors.append(f"Potential secret material in {path.relative_to(output_dir)}")

    result = {"valid": not errors, "errors": errors, "warnings": warnings}
    write_json(output_dir / "validation-report.json", result)
    return result


def run_all(source_dir: Path, output_dir: Path) -> dict[str, Any]:
    report = analyze(source_dir, output_dir)
    compiled = compile_actions(source_dir, output_dir)
    validation = validate(output_dir)
    return {"report": report, "compiled": compiled, "validation": validation}


def build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Precompile HTML/CSS/JS into Webflow MCP-ready artifacts.")
    parser.add_argument("command", choices=["analyze", "compile", "validate", "all"])
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE, help="Approved final-design directory.")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT, help="Workflow .tmp artifact directory.")
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_arg_parser().parse_args(argv)
    source_dir = args.source.resolve()
    output_dir = args.output.resolve()
    if args.command in {"analyze", "compile", "all"} and not source_dir.exists():
        print(f"Source directory does not exist: {source_dir}", file=sys.stderr)
        return 2

    if args.command == "analyze":
        result = analyze(source_dir, output_dir)
    elif args.command == "compile":
        result = compile_actions(source_dir, output_dir)
    elif args.command == "validate":
        result = validate(output_dir)
    else:
        result = run_all(source_dir, output_dir)

    print(json.dumps(result, indent=2, ensure_ascii=False))
    return 0 if not (isinstance(result, dict) and result.get("valid") is False) else 1


if __name__ == "__main__":
    raise SystemExit(main())
