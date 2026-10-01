/**
 * This pipeline pushes the WHOLE rebuilt site in `replace` mode, which deletes every stored page that is not
 * in the payload, and replaces site.css / site.js. On staging that is the point. On production it would
 * replace the live WordPress clone's 59 pages and its cascade. The worktree .env points at production, so
 * every script here refuses unless the host it is about to talk to is the staging one.
 *
 * "Is this an ifadentistry.com host" is NOT the test: staging.ifadentistry.com and www.ifadentistry.com
 * both pass it (runbook 2026-09-18, first gotcha).
 */
export function assertStaging (base) {
  const host = new URL(base).hostname
  if (host !== 'staging.ifadentistry.com') {
    console.error(`REFUSING: this pipeline only ever writes to staging.ifadentistry.com, and INSTATIC_BASE_URL resolves to ${host}.\nRun it as: INSTATIC_BASE_URL=https://staging.ifadentistry.com node push/<script>.mjs`)
    process.exit(2)
  }
}
