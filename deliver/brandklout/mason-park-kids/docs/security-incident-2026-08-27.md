# Security incident — pediatricdentistkatytx.com, 2026-08-27

> [!CAUTION]
> **The WordPress install on this host is actively compromised, and was being written to while we
> were working in it.** This is not residual damage from the attack that took the practice's main
> site down in August. New files were landing on 27 August at 03:14, 05:11, 08:02 and 13:56.
> Whoever had access still had it.

Sibling incident on the practice's other site:
[`mason-park/docs/security-incident-2026-08-24.md`](../../mason-park/docs/security-incident-2026-08-24.md).

## What is on the disk

### Four planted plugins

All four carry fake headers ("Author: Core Team", "Author: Speed Solutions",
`Plugin URI: https://developer.wordpress.org/plugins/`) over obfuscated bodies — mangled function
names like `_oc9f115f1()`, `_r49aa2d6f()`, and classes named `DB_Handler_7b5a`, `Core_Helper_3916`.
The trailing random hex on each slug is not how the WordPress.org repository names anything.

| Plugin | Created | Active | Notes |
| :--- | :--- | :--- | :--- |
| `advanced-content-toolkit-d163` | 25 Aug, modified 27 Aug 13:56 | **yes** | 15 KB, single obfuscated file |
| `advanced-health-scanner-a415-e8c7` | 26 Aug 20:34 | no | 15 KB, same shape |
| `cloud-image-engine-c72e` | 27 Aug 03:14 | no | main file is mode `----------`; carries `data/manifest.bin`, `data/cache.bin` |
| `wp-health-engine-a96e` | 27 Aug 05:11 | **yes** | carries `assets/state.dat`, `assets/index.bin` |

### The mu-plugin backdoor

`wp-content/mu-plugins/transient-cleanup.php` — **177,896 bytes**, mtime backdated to
`2022-02-15`, permissions `000`. Must-use plugins load automatically with no activation step, and
`wp-settings.php` line 508 tries to `include_once` this one on **every single request**. The
`php_errorlog` is a wall of it failing, most recently 27 Aug 22:39.

The `000` permissions on this file and on `cloud-image-engine-c72e.php` are most likely
SiteGround's scanner quarantining them as they appear. That is probably why the ClickFix overlay
documented on the main site has gone quiet here — the loader is being neutralised faster than it
can run. **It is not a fix.** The attacker keeps planting new files.

### Other

- `wp-content/themes/tooth-fairy/functions.php` modified within the last three days.
- `wp-content/uploads/health-check-8190c93ed470.php` — a PHP file inside the uploads directory,
  which should contain no executable code at all. (The other 23 `.php` files under uploads are
  legitimate empty `index.php` directory guards.)
- `all-404-redirect-to-homepage` is installed and active — the same plugin the main site's audit
  found installed **twice**.
- `wp-file-manager` is installed. It has a long history of critical RCE vulnerabilities and is a
  plausible entry point.

## Handling rules for anything recovered from this host

These are not precautions in principle; they are what the recovery was actually built to satisfy.

1. **No PHP was downloaded, and none should be.** The recovery pulls content and presentation
   only: a WXR export, a database dump, and an offline mirror of HTML/CSS/JS/images/fonts. The
   plugin and theme PHP stayed on the server. `verify-safe.mjs` enforces this and fails the
   bundle if a `.php`, `.phtml`, `.htaccess` or archive file ever appears in it.
2. **Never serve the mirror with a PHP interpreter.** It is static files. `06-shoot.mjs` serves it
   with a plain Node static server that only reads bytes off disk.
3. **Render it offline only.** Chrome runs with
   `--host-resolver-rules="EXCLUDE 127.0.0.1, EXCLUDE localhost, MAP * ~NOTFOUND"`, so a page
   cannot reach any external host. Injected loaders fetch their payload at runtime; here they
   resolve to nothing. Google Fonts, Google Tag Manager and the Maps embed fail for the same
   reason, and that is the intended trade.
4. **The sanitiser strips third-party script and iframe tags** out of the mirrored HTML before it
   is ever opened, so the copy on disk is inert even if someone opens it in an ordinary browser.
   Both the pre- and post-sanitise IOC counts are recorded, so removals are auditable rather than
   silent.
5. **The database dump contains credentials and user records.** `**/recovered/` is gitignored. Do
   not commit it, do not paste it into a transcript, and do not import it into any live system.
6. **The recovery SSH key is a live credential.** It lives at
   `.secrets/sg_pediatric_recovery`, is gitignored, has no passphrase, and should be **revoked in
   SiteGround Site Tools → Devs → SSH Keys Manager once the recovery is finished.**

## IOC markers checked on every capture

Carried over from the main site's incident so the two stay comparable:

```
div[data-sm="1"]      iframe[src*="yourbodybydesign"]      yourbodybydesign
2147483647            webanalytics-cdn.sbs
```

~~**No IOC fired on any of the 40 captured pages.**~~ **Wrong, found 2026-09-15.** Every one of the
40 captured pages carries an inline ClearFake/EtherHiding loader as its last `<script>`. It is
14,034 bytes, `(function(){var _2e7be=atob("…")…new Function(…)()})()`, and it is base64 plus a
per-byte `((c-156)&255)^38`. Decoded, it reads a URL from Polygon contract
`0x08207B087F61d7e95E441E15fd6d40BEfd6eD308` (`eth_call` data `0x38bcdc1c`) through six public RPCs
(drpc, publicnode, lava, subquery, and two nodies hosts). It then covers the page with a full-screen white
`div[data-sm="1"]` at `z-index:2147483647` holding an iframe of that URL, and sets `_cf_verified` and
`_wp_perf_ok` cookies for 90 days. That is the fake-verification (ClickFix) lure. The decoded body
also names `webanalytics-cdn.sbs`, **the main site's IOC**, so it is the same campaign. The gate missed it
because every marker exists only after decoding and the loader has no `src`. It was
live on `masonparkpediatricdental.com` for about 1 h on 2026-09-14/15 before it was stripped. `verify-safe.mjs`
now matches the loader's shape and scans decoded blobs. See `workflows/01-site-recovery/README.md`.

## What Brandklout should be told

1. The account is **still being written to**. SiteGround should be told that specifically — the
   earlier cleanup did not hold.
2. The install should be treated as **unrecoverable rather than cleanable**, which is the same
   conclusion reached for the main site.
3. `wp-file-manager` and the duplicated `all-404-redirect-to-homepage` are worth naming in that
   conversation.
4. Every WordPress and SiteGround credential for this account should be rotated, and the admin
   user list audited, on the assumption they are known to the attacker.

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md).
