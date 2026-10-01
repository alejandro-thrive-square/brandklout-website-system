/**
 * Publish STAGING. Instatic's publish replaces every public page at once, which is why this refuses any
 * host but staging.ifadentistry.com.
 *
 * Usage: INSTATIC_BASE_URL=https://staging.ifadentistry.com node push/publish.mjs
 */
import { publish, BASE } from '../../../../../tools/instatic-api-sync/insta-api.mjs'
import { assertStaging } from './staging-only.mjs'

assertStaging(BASE)
console.log(JSON.stringify(await publish()))
