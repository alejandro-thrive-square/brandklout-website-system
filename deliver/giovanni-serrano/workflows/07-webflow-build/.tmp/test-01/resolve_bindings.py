#!/usr/bin/env python3
"""Resolve Webflow variable IDs into the binding manifest and emit batched
style_tool update actions for the MCP. Run from the 07-webflow-build/.tmp dir.

Reads:
  - webflow-style-variable-bindings.json (post-paste binding manifest)
Writes:
  - webflow-variable-map.json            (map filled with real IDs)
  - mcp-style-actions.json               (batched update_style actions)
"""
import json
import os
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
COLLECTION_ID = "collection-229705e6-35ea-822b-b1bc-658d51c6b202"

# cssName -> Webflow variable ID (from variable_tool > get_variables)
VAR_IDS = {
    "--bone": "variable-97601e57-7c91-cf56-eeb1-577f3ea1aee3",
    "--bone-d": "variable-7fa62bb4-2d08-1db6-ab67-c78afab5dd95",
    "--canvas": "variable-51aaaba6-a892-11e4-0838-87807e4bdf66",
    "--gold": "variable-c80f6bab-49ce-ff6f-15f0-b010bb3e89e9",
    "--ink": "variable-88869292-03e0-a196-3a3a-87fec9346859",
    "--ink-fade": "variable-6c190ae5-661a-bdcf-f04b-86bdaa255245",
    "--ink-mute": "variable-a982e047-3234-a4fc-52e9-d9a54f14779b",
    "--ink-soft": "variable-589aa521-b980-fd27-e6a2-78033a9a0aaf",
    "--line": "variable-55a3337f-0215-3b43-94a7-a50abee954b7",
    "--navy": "variable-9e125476-dc36-6c82-f263-2bf9c521a88f",
    "--navy-d": "variable-5198da49-4222-be73-31df-a4e2a766d1a3",
    "--on-d": "variable-b48b9679-1fd0-7112-0664-3494da5c77e3",
    "--on-d-line": "variable-9a890a68-f9fd-277d-53f9-1386e1192423",
    "--on-d-mute": "variable-fa45533c-4e70-8e48-c6fc-5382868492e6",
    "--on-d-soft": "variable-8d072c1a-719b-578f-3500-e1ecc18dd28a",
    "--terra": "variable-e1f6700e-f038-b700-a7c8-7a04a55b7210",
    "--terra-d": "variable-df46a112-7d54-49a2-7548-534b7981db5b",
    "--body": "variable-f57469e5-3ba3-995b-d9a3-055117332e3c",
    "--display": "variable-c33487f0-ffba-366a-ff1c-0f2a780b4e32",
    "--mono": "variable-aec63a33-70ff-b758-14c7-5e90dd13f167",
    "--svc-card": "variable-a434ea9c-908b-6935-e2f4-cd753d4f18e1",
    "--svc-gap": "variable-75e526c9-b2f2-0e1f-ec8c-9fa7ffdb03b8",
}


def update_var_map():
    path = os.path.join(HERE, "webflow-variable-map.json")
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    filled = 0
    for v in data["variables"]:
        css = v["cssName"]
        if css in VAR_IDS:
            v["variableId"] = VAR_IDS[css]
            v["collectionId"] = COLLECTION_ID
            filled += 1
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
        f.write("\n")
    return filled, len(data["variables"])


def build_actions():
    path = os.path.join(HERE, "webflow-style-variable-bindings.json")
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    bindings = data["bindings"]

    actionable = []
    skipped = []
    unresolved = []

    # group by (style_name, parents, breakpoint, pseudo) so each style/state is
    # one update_style action carrying all its variable properties.
    groups = defaultdict(list)

    for b in bindings:
        mcp = b.get("mcp")
        if not mcp:
            skipped.append(b)
            continue
        css = mcp["cssName"]
        vid = VAR_IDS.get(css)
        if not vid:
            unresolved.append(b)
            continue
        key = (mcp["style_name"], mcp["breakpoint_id"], mcp["pseudo"])
        groups[key].append({
            "property_name": mcp["property"]["property_name"],
            "variable_as_value": vid,
        })
        actionable.append(b)

    actions = []
    for (style_name, bp, pseudo), props in groups.items():
        # de-dup identical property/value pairs
        seen = set()
        uniq = []
        for p in props:
            t = (p["property_name"], p["variable_as_value"])
            if t in seen:
                continue
            seen.add(t)
            uniq.append(p)
        actions.append({
            "label": f"bind {style_name} [{bp}/{pseudo}]",
            "update_style": {
                "style_name": style_name,
                "breakpoint_id": bp,
                "pseudo": pseudo,
                "properties": uniq,
            },
        })

    out = os.path.join(HERE, "mcp-style-actions.json")
    with open(out, "w", encoding="utf-8") as f:
        json.dump({"actions": actions}, f, indent=2)
        f.write("\n")

    return {
        "total_bindings": len(bindings),
        "actionable": len(actionable),
        "grouped_actions": len(actions),
        "skipped_compound": len(skipped),
        "unresolved_css": len(unresolved),
        "skipped_props": sorted({b["property"] + " <- " + b["value"][:40] for b in skipped}),
        "unresolved_names": sorted({n for b in unresolved for n in b["cssNames"]}),
    }


if __name__ == "__main__":
    filled, total = update_var_map()
    print(f"variable map: filled {filled}/{total} variable IDs")
    summary = build_actions()
    print(json.dumps(summary, indent=2))
