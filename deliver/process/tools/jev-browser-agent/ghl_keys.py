"""Read each GoHighLevel sub-account's location API key: Jev navigates, code reads, no model sees it.

uv run --project ~/tools/jev-ultrafast --env-file ~/tools/jev-ultrafast/.env python ghl_keys.py \
    --url https://app.gohighlevel.com/ --account "Mason Park Dental" [--account ...] --out DIR

* Jev only navigates: switcher → the sub-account → Settings → Business Profile.
* jev_deep masks anything key-shaped before page text goes to TypeSafe or the text helper.
* read_secret() reads the value from the DOM in code. Only a fingerprint (first 6 characters,
  length, sha256 prefix) is printed or written to the run log; values go to --secrets-out, a JSON
  file you move into ~/.webzite/.env (never commit it, never paste it).
* Regenerate, delete, save and similar controls are hidden from the model.
"""

import argparse
import hashlib
import json
import re
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import jev_deep  # noqa: E402

FORBID = [r"regenerate|reset|rotate|revoke", r"delete|remove|trash", r"update information|\bsave\b|submit",
          r"log ?out|sign ?out", r"\bcopy\b|copy\]", r"create|add new|\+ add", r"publish", r"upgrade"]

# Find a key-shaped value whose field is labelled like the wanted label. Runs in each document.
READ = r"""(want => {
  const SECRET=/eyJ[\w-]{8,}\.[\w-]{8,}\.[\w-]{8,}|\bpit-[0-9a-f-]{20,}/;
  const near = e => {
    const own=[...(e.labels||[])].map(l=>l.innerText).join(' ') || e.getAttribute('aria-label') || '';
    if (own) return own;
    let p=e;
    for (let i=0; i<4 && p; i++) {
      p=p.parentElement;
      let s=p?.previousElementSibling;
      for (let j=0; j<3 && s; j++, s=s.previousElementSibling) if (s.innerText?.trim()) return s.innerText.trim();
    }
    return '';
  };
  const out=[];
  for (const e of document.querySelectorAll('input,textarea,code,pre,[data-value]')) {
    const v=(e.value ?? e.getAttribute('data-value') ?? e.textContent ?? '').trim();
    const m=v.match(SECRET); if (!m) continue;
    out.push({label: near(e).slice(0,80), value: m[0]});
  }
  return out.filter(o => new RegExp(want,'i').test(o.label));
})"""


def fingerprint(value):
    return f"{value[:6]}…({len(value)}) sha:{hashlib.sha256(value.encode()).hexdigest()[:8]}"


def read_secret(browser, label=r"api key"):
    """The key-shaped values labelled `label`, read from every document in the tab, in code."""
    found = []
    for doc in browser._documents():
        try:
            found += browser._eval(doc["session"], READ + "(" + json.dumps(label) + ")") or []
        except Exception:
            continue
    return sorted({f["value"] for f in found})


NAMED = """(name => [...document.querySelectorAll('input,b,strong,span,div,h1,h2,h3,p')].some(e =>
  (e.tagName==='INPUT' ? e.value : (e.children.length ? '' : e.innerText||'')).trim().toLowerCase()===name.toLowerCase()))"""


def named_exact(browser, account):
    """True when some field or leaf element reads exactly the account name (not a longer look-alike)."""
    for doc in browser._documents():
        try:
            if browser._eval(doc["session"], NAMED + "(" + json.dumps(account) + ")"):
                return True
        except Exception:
            continue
    return False


def steps(account):
    return [
        "Open the sub-account switcher at the top left. Stop when the list of sub-accounts is open.",
        f"Type {account} into the sub-account search field.",
        f"Click the sub-account named exactly '{account}', not a longer name that only starts with it. "
        "Stop when that sub-account's dashboard shows.",
        "Click Settings in the left sidebar; scroll the sidebar down if Settings is not visible. "
        "Stop when the Business Profile settings with the API Key field are showing.",
    ]


def extract(url, account, limit_s=150, on_state=None):
    """Navigate to one sub-account's Business Profile and read its key. Returns a result dict."""
    from jev_ultrafast import Agent

    jev_deep.install(forbid=FORBID)
    agent = Agent(url, steps(account)[0])
    started = time.perf_counter()
    try:
        status = jev_deep.drive(agent, steps(account), limit_s=limit_s, on_state=on_state,
                                task=f"In GoHighLevel, open the Business Profile settings of the sub-account {account}.")
        keys = read_secret(agent.browser) if status == "done" else []
        url_now = agent.browser.evaluate("location.href")
        title = agent.browser.evaluate("document.title")
        # The page must name exactly the account we asked for, or the key belongs to someone else.
        named = named_exact(agent.browser, account)
        location = (re.search(r"/location/([^/#?]+)", url_now) or [None, None])[1]
        return dict(account=account, status=status, keys=keys, location_id=location, named=named,
                    title=title, steps=len(agent.state["history"]),
                    seconds=round(time.perf_counter() - started, 1),
                    actions=[f"{h['kind']}:{h['action'][:60]}" for h in agent.state["history"]],
                    model_saw_secret=any(k in json.dumps(agent.state["decisions"], default=str) +
                                         json.dumps(agent.state["text_calls"], default=str) for k in keys))
    finally:
        agent.close()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", required=True, help="the agency dashboard URL (white-label domains work)")
    parser.add_argument("--account", action="append", required=True)
    parser.add_argument("--out", required=True, help="run log folder (fingerprints only)")
    parser.add_argument("--secrets-out", help="JSON file for the values; keep it outside the repository")
    args = parser.parse_args()
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    secrets = {}
    for account in args.account:
        r = extract(args.url, account)
        ok = r["status"] == "done" and len(r["keys"]) == 1 and r["named"] and not r["model_saw_secret"]
        if ok:
            secrets[account] = {"location_id": r["location_id"], "api_key": r["keys"][0]}
        log = {**{k: v for k, v in r.items() if k != "keys"}, "ok": ok,
               "keys": [fingerprint(k) for k in r["keys"]]}
        with (out / "ghl-keys.jsonl").open("a", encoding="utf-8") as f:
            f.write(json.dumps(log, ensure_ascii=False) + "\n")
        print(("OK  " if ok else "FAIL"), account, "|", r["status"], "| location", r["location_id"], "|",
              ", ".join(log["keys"]) or "no key", "| named" if r["named"] else "| NOT NAMED ON PAGE",
              "| MODEL SAW SECRET" if r["model_saw_secret"] else "", flush=True)
    if args.secrets_out and secrets:
        Path(args.secrets_out).write_text(json.dumps(secrets, indent=1), encoding="utf-8")
        print(f"{len(secrets)} key(s) written to {args.secrets_out} (values not printed)")


if __name__ == "__main__":
    main()
