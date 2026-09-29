import fs from 'node:fs'
import { api } from '../../../../../process/tools/instatic-api-sync/insta-api.mjs'
const s = await api('GET', '/admin/api/site')
fs.writeFileSync(new URL('./seq.txt', import.meta.url), JSON.stringify({ seq: s.seq ?? s.site?.seq, publishedPages: s.publishedPages ?? s.site?.publishedPages }, null, 1))
