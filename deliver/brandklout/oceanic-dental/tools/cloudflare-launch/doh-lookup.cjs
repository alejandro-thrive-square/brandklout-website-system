/**
 * Node preload: resolve hostnames through DNS-over-HTTPS instead of the OS resolver.
 *
 * Origin: the scratch preload used on bk-stone-med-spa (2026-09-15, staging.westlaketxmedspa.com)
 * and noted in auto-memory "new-subdomain-nxdomain-on-this-workstation". Promoted 2026-09-23.
 *
 * Why: on the agency workstation a subdomain created minutes ago keeps answering NXDOMAIN through
 * the OS (the VPN caches it upstream; ipconfig /flushdns does not help), while DoH already has it.
 * A staging /admin/api/cms/setup is open to anyone until claimed, so waiting is not an option.
 *
 *   set DOH_ZONES=staging.example.com,example.com
 *   node -r ./doh-lookup.cjs some-script.mjs
 *
 * Only names equal to or under a DOH_ZONES entry are resolved over DoH (all names when DOH_ZONES is
 * unset). Global fetch (undici) calls dns.lookup, so it follows this. Resolution is cached per
 * process: after you proxy a CNAME, start a NEW process or you keep talking to the old target.
 * For a single curl call use: curl --resolve host:443:<A from `node doh.mjs host A`> https://host/
 */
'use strict'
const dns = require('node:dns')
const { execFileSync } = require('node:child_process')

const zones = (process.env.DOH_ZONES || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
const wanted = (host) => !zones.length || zones.some((z) => host === z || host.endsWith('.' + z))
const cache = new Map()
const original = dns.lookup

/* Synchronous DoH query in a child process: dns.lookup callers expect the answer on the callback,
   and a sync child keeps this preload dependency-free. Follows CNAME chains (Answer holds them). */
function resolve(host, family) {
  const key = `${host}/${family}`
  if (cache.has(key)) return cache.get(key)
  const type = family === 6 ? 'AAAA' : 'A'
  const code = `fetch('https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(host)}&type=${type}',{headers:{accept:'application/dns-json'}})` +
    `.then(r=>r.json()).then(j=>process.stdout.write(JSON.stringify((j.Answer||[]).filter(a=>a.type===${family === 6 ? 28 : 1}).map(a=>a.data))))`
  let ips = []
  try { ips = JSON.parse(execFileSync(process.execPath, ['-e', code], { encoding: 'utf8', timeout: 10000 }) || '[]') } catch {}
  cache.set(key, ips)
  return ips
}

dns.lookup = function lookup(hostname, options, callback) {
  if (typeof options === 'function') { callback = options; options = {} }
  if (typeof options === 'number') options = { family: options }
  const host = String(hostname).toLowerCase()
  if (!wanted(host) || host === 'cloudflare-dns.com') return original.call(dns, hostname, options, callback)
  const family = options.family === 6 ? 6 : 4
  const ips = resolve(host, family)
  if (!ips.length) return original.call(dns, hostname, options, callback)
  if (options.all) return process.nextTick(callback, null, ips.map((address) => ({ address, family })))
  return process.nextTick(callback, null, ips[0], family)
}
