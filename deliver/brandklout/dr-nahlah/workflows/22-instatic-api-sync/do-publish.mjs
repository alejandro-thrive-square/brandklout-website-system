import { publish, publishStatus, BASE } from '../../../../process/22-instatic-api-sync/insta-api.mjs'
console.log('publishing', BASE)
const r = await publish()
console.log(JSON.stringify(r).slice(0, 400))
