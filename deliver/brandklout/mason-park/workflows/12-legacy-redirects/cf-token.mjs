/**
 * Mint or revoke the short-lived Cloudflare token the redirect scripts need (2026-09-25).
 * The shared CLOUDFLAREAPI key is account-owned and has no zone permissions of its own, but
 * it can create tokens. The token is written to .tmp/.cf-token (gitignored) and never printed.
 *
 *   node cf-token.mjs mint      # 3-hour token: zone read/DNS/routes/redirects/settings/purge on
 *                               # this account's zones, and Workers Scripts on the account
 *   node cf-token.mjs revoke    # delete it again (always run this at the end)
 *
 * Then: CLOUDFLARE_API_TOKEN=$(cat .tmp/.cf-token) node deploy-redirects.mjs ...
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const HERE = path.dirname(fileURLToPath(import.meta.url));
const TOKEN_FILE = path.join(HERE, ".tmp", ".cf-token");
const ID_FILE = path.join(HERE, ".tmp", ".cf-token-id");
const env = (() => {
  let dir = HERE;
  for (let i = 0; i < 12; i++) {
    const p = path.join(dir, ".env");
    if (fs.existsSync(p)) return Object.fromEntries(fs.readFileSync(p, "utf8").split(/\r?\n/).map((l) => l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/i)).filter(Boolean).map((m) => [m[1], m[2].replace(/^["']|["']$/g, "").trim()]));
    dir = path.dirname(dir);
  }
  return {};
})();
const KEY = env.CLOUDFLAREAPI;
if (!KEY) throw new Error("CLOUDFLAREAPI missing from the master .env");
const cf = async (method, p, body, token = KEY) => {
  const r = await fetch(`https://api.cloudflare.com/client/v4${p}`, { method, headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json();
  if (!j.success) throw new Error(`${method} ${p}: ${JSON.stringify(j.errors).slice(0, 300)}`);
  return j.result;
};
const [account] = await cf("GET", "/accounts");
const mode = process.argv[2];
if (mode === "revoke") {
  if (!fs.existsSync(ID_FILE)) { console.log("no token to revoke"); process.exit(0); }
  await cf("DELETE", `/accounts/${account.id}/tokens/${fs.readFileSync(ID_FILE, "utf8").trim()}`);
  fs.rmSync(TOKEN_FILE, { force: true }); fs.rmSync(ID_FILE, { force: true });
  console.log("revoked");
} else if (mode === "mint") {
  const groups = await cf("GET", `/accounts/${account.id}/tokens/permission_groups`);
  const pick = (names) => names.map((n) => { const g = groups.find((x) => x.name === n); if (!g) throw new Error(`no permission group "${n}"`); return { id: g.id }; });
  const zones = { [`com.cloudflare.api.account.${account.id}`]: { "com.cloudflare.api.account.zone.*": "*" } };
  const res = await cf("POST", `/accounts/${account.id}/tokens`, {
    name: `mason-park-legacy-redirects ${new Date().toISOString().slice(0, 16)}`,
    expires_on: new Date(Date.now() + 3 * 3600e3).toISOString().replace(/\.\d+Z$/, "Z"),
    policies: [
      { effect: "allow", resources: zones, permission_groups: pick(["Zone Read", "DNS Write", "Workers Routes Write", "Zone Settings Write", "Cache Purge", "Dynamic URL Redirects Write", "Config Settings Write"]) },
      { effect: "allow", resources: { [`com.cloudflare.api.account.${account.id}`]: "*" }, permission_groups: pick(["Workers Scripts Write"]) },
    ],
  });
  fs.mkdirSync(path.dirname(TOKEN_FILE), { recursive: true });
  fs.writeFileSync(TOKEN_FILE, res.value); fs.writeFileSync(ID_FILE, res.id);
  console.log(`minted (expires ${res.expires_on ?? "in 3h"}); account ${account.name}`);
} else throw new Error("usage: node cf-token.mjs mint|revoke");
