/**
 * The home redesign is pushed in `replace` mode, which DELETES every stored page that is not in the
 * payload. On staging that is the point. On production it would take the live 59-page site down to
 * one page. The worktree .env points at production, so every script in this folder refuses to run
 * unless the host it is about to talk to is the staging one.
 *
 * "Is this an ifadentistry.com host" is NOT the test: staging.ifadentistry.com and
 * www.ifadentistry.com both pass it (runbook 2026-09-18, first gotcha).
 */
export function assertStaging (base) {
  const host = new URL(base).hostname
  if (host !== 'staging.ifadentistry.com') {
    console.error(`REFUSING: this pipeline only ever writes to staging.ifadentistry.com, and INSTATIC_BASE_URL resolves to ${host}.\nRun it as: INSTATIC_BASE_URL=https://staging.ifadentistry.com node home/<script>.mjs`)
    process.exit(2)
  }
}
