"""Instatic Staging Clone & Promotion - module orchestrator.

The real executors are the `.mjs` files beside this one (the same exception
`07-webflow-build`, `18-instatic-embeds` and `20-instatic-domain-origins` make).
This wrapper exists so the module has one entry point, and so the order - which
has real order dependencies - is printed rather than remembered.

    python 21-instatic-staging-clone.py size    --from URL
    python 21-instatic-staging-clone.py seed    --from URL --to URL
    python 21-instatic-staging-clone.py promote --from URL --to URL
    python 21-instatic-staging-clone.py gates   --prod URL --staging URL
    python 21-instatic-staging-clone.py standup

Read 21-instatic-staging-clone.md before running any of it. The two things that
are not optional and fail SILENTLY are plugins (the site looks perfect and has
lost its entire SEO layer) and per-row publish for collections (the listing
renders zero items). Both gates below catch them; neither is caught by looking
at the site.
"""
import argparse
import sys

HERE = "deliver/process/21-instatic-staging-clone"


def size(a):
    print(f"""
Decide which path this site takes BEFORE planning anything.

    node clone-site.mjs --from {a.source} --dry

Read the `estimate` line. Under ~95 MB with media -> the one-shot path.
Over it -> the split path; the Railway edge answers 413 on Content-Length.
""")


def seed(a):
    print(f"""
SEED  {a.source}  ->  {a.to}

  # one shot (archive under ~95 MB with media)
  node clone-site.mjs --from {a.source} --to {a.to} --strategy replace --media

  # OR, large site: document first, then media separately
  node clone-site.mjs --from {a.source} --to {a.to} --strategy replace
  #   media bytes -> see pull-media.js header for the railway ssh commands
  python chunk-media.py ./.tmp/prod-full.zip ./chunks
  node import-media-chunks.mjs --to {a.to} --chunks ./chunks

  # ALWAYS, both paths - these are the two silent failures:
  node clone-plugins.mjs --from {a.source} --to {a.to} --files ./.tmp/plugins
  node publish-rows.mjs --site {a.to} --table posts

  # publish the site, then prove it:
  node diff-sites.mjs --a {a.source} --b {a.to}
""")


def promote(a):
    print(f"""
PROMOTE  {a.source}  ->  {a.to}

  node clone-site.mjs --from {a.source} --to {a.to} \\
      --strategy merge-overwrite --rows <the rows you changed>
  node publish-rows.mjs --site {a.to} --table posts   # only if rows moved
  # publish, then:
  node diff-sites.mjs --a {a.source} --b {a.to}

NEVER pass --media in this direction: a media-bearing import rewrites
production's media rows and destroys its srcset variants, which are generated
at upload and are in no archive. clone-site.mjs refuses it.
""")


def gates(a):
    print(f"""
  node diff-sites.mjs   --a {a.prod} --b {a.staging}
  node check-noindex.mjs --staging {a.staging} --production {a.prod}

Both must exit 0. Run check-noindex.mjs after ANY Cloudflare change - it is what
catches `noindex` shipped alongside a canonical, the one combination that can
de-index PRODUCTION.
""")


def standup(a):
    print("""
STAND UP A STAGING ENVIRONMENT (once per client), in this order:

  1. Duplicate the production environment in Railway.
  2. Fix PUBLIC_ORIGIN to the staging host ONLY - it is copied verbatim, so the
     new environment is born listing production's domains and every login POST
     is refused 403 invalid origin.
  3. Add the custom domain in Railway.
  4. Add BOTH Cloudflare records: the traffic CNAME, and the ownership TXT from
     status.verificationDnsHost / status.verificationToken. The TXT is NOT in
     status.dnsRecords. Until ownership verifies, Railway answers
     "Application not found" on a container that is up and listening.
  5. Create the admin: POST /admin/api/cms/setup (a duplicated env has none).
  6. De-index, in this order: delete the generated Railway host (it bypasses
     Cloudflare and can never be protected), add the X-Robots-Tag transform rule
     scoped to the staging hostname, set emitCanonical:false, republish, and
     LEAVE robots.txt allowing the crawl.

If the zone carries a WAF/geo rule, exempt /.well-known/acme-challenge/ and the
staging hostname, or no certificate on the zone can ever issue. A failed
certificate never retries itself - call customDomainIssueCertificate.
""")


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)

    s = sub.add_parser("size"); s.add_argument("--from", dest="source", required=True); s.set_defaults(fn=size)
    s = sub.add_parser("seed"); s.add_argument("--from", dest="source", required=True); s.add_argument("--to", required=True); s.set_defaults(fn=seed)
    s = sub.add_parser("promote"); s.add_argument("--from", dest="source", required=True); s.add_argument("--to", required=True); s.set_defaults(fn=promote)
    s = sub.add_parser("gates"); s.add_argument("--prod", required=True); s.add_argument("--staging", required=True); s.set_defaults(fn=gates)
    s = sub.add_parser("standup"); s.set_defaults(fn=standup)

    a = p.parse_args()
    a.fn(a)
    print(f"Full procedure, traps and measurements: {HERE}/21-instatic-staging-clone.md")
    return 0


if __name__ == "__main__":
    sys.exit(main())
