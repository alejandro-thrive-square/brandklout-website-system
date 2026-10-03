/**
 * Home redesign, step 5 — publish STAGING. Instatic's publish replaces every public page at once,
 * which is exactly why this refuses any host but staging.ifadentistry.com.
 *
 * Usage: INSTATIC_BASE_URL=https://staging.ifadentistry.com node home/publish-home.mjs
 */
import { publish, BASE } from '../../../../../process/tools/instatic-api-sync/insta-api.mjs'
import { assertStaging } from './staging-only.mjs'

assertStaging(BASE)
console.log(JSON.stringify(await publish()))
