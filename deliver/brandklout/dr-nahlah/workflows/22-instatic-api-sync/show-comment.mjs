import { getSite } from '../../../../process/22-instatic-api-sync/insta-api.mjs'
const { site } = await getSite()
const c = site.files.find(f => f.path === 'src/styles/site.css').content
const i = c.indexOf('the story embed')
console.log(JSON.stringify(c.slice(i - 20, i + 520)))
