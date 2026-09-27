/**
 * Creates (replaces) the zone's URL Rewrite ruleset from URL-RULES.md, through the API.
 * The shared CLOUDFLAREAPI token may write the http_request_transform phase; it may NOT write
 * redirect rules, DNS or zone settings (403), which is why /about and /contact are rewrites here
 * and the apex -> www redirect is left to the dashboard.
 *
 * Usage: node set-url-rules.mjs [--apply] > set-url-rules.log 2>&1
 */
import fs from 'node:fs'

const ZONE = '223386e4eda469fb038a4c716bd3f0fe' // ifadentistry.com, Brandklout's account
const env = fs.readFileSync(process.env.USERPROFILE + '/.webzite/.env', 'utf8')
const token = (env.match(/^CLOUDFLAREAPI\s*=\s*"?([^"\r\n]+)/m) || [])[1]
const P = 'http.request.uri.path'
const wild = (desc, from, to, extra = '') => ({
  description: desc,
  expression: `(${P} wildcard "${from}"${extra})`,
  action: 'rewrite',
  action_parameters: { uri: { path: { expression: `wildcard_replace(${P}, "${from}", "${to}")` } } },
})
const fixed = (desc, paths, to) => ({
  description: desc,
  expression: `(${P} in {${paths.map((p) => `"${p}"`).join(' ')}})`,
  action: 'rewrite',
  action_parameters: { uri: { path: { value: to } } },
})
const rules = [
  wild('Articles pages', '/about-our-practice/articles/page/*', '/about-our-practice-articles-page-${1}'),
  wild('Category pages', '/category/*/page/*', '/category-${1}-page-${2}'),
  wild('Dental services', '/dental-services/*', '/dental-services-${1}', ` and ${P} ne "/dental-services/"`),
  wild('About our practice', '/about-our-practice/*', '/about-our-practice-${1}',
    ` and ${P} ne "/about-our-practice/" and not ${P} wildcard "/about-our-practice/articles/page/*"`),
  wild('Contact us', '/contact-us/*', '/contact-us-${1}', ` and ${P} ne "/contact-us/"`),
  wild('Categories', '/category/*', '/category-${1}', ` and ${P} ne "/category/" and not ${P} wildcard "/category/*/page/*"`),
  fixed('Old about (WordPress 301s it)', ['/about', '/about/'], '/about-our-practice/'),
  fixed('Old contact (WordPress 301s it)', ['/contact', '/contact/'], '/contact-us/'),
]

if (!process.argv.includes('--apply')) {
  console.log(JSON.stringify(rules, null, 1))
  console.log('\ndry run: re-run with --apply')
} else {
  const r = await fetch(`https://api.cloudflare.com/client/v4/zones/${ZONE}/rulesets/phases/http_request_transform/entrypoint`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ rules }),
  })
  const j = await r.json()
  console.log(r.status, j.success ? `ok: ${j.result.rules.length} rules, ruleset ${j.result.id}` : JSON.stringify(j.errors))
  process.exitCode = j.success ? 0 : 1
}
