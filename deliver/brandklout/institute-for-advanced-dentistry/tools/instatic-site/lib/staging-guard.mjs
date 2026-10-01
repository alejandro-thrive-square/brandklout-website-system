/**
 * staging-guard.mjs — refuse to write anywhere but the named staging host.
 *
 * Pattern promoted 2026-09-23 from bk-ifa-dentistry, workflows/21-instatic-upload/home/staging-only.mjs
 * (and Mason Park's IS_STAGING check in insta.mjs). The worktree .env points at PRODUCTION, and a
 * replace-mode push deletes every page not in the payload.
 *
 * "Is this the client's domain" is NOT the test: staging.<domain> and www.<domain> both pass it
 * (IFA runbook 2026-09-18). The test is an exact hostname: STAGING_HOST=staging.example.com (or the
 * staging environment's *.up.railway.app host before launch). Pass --allow-production to write to any
 * other host on purpose; the flag ends up in the runbook where it can be challenged.
 */
export function assertStaging(base = process.env.INSTATIC_BASE_URL) {
  const host = new URL(base).hostname
  const want = (process.env.STAGING_HOST || '').trim()
  if (process.argv.includes('--allow-production')) {
    console.warn(`--allow-production: writing to ${host}`)
    return host
  }
  if (!want) {
    console.error(`REFUSING: set STAGING_HOST to the staging hostname (INSTATIC_BASE_URL resolves to ${host}), or pass --allow-production.`)
    process.exit(2)
  }
  if (host !== want) {
    console.error(`REFUSING: this only writes to ${want}, and INSTATIC_BASE_URL resolves to ${host}.\n` +
      `Run it as: INSTATIC_BASE_URL=https://${want} node <script>`)
    process.exit(2)
  }
  return host
}
