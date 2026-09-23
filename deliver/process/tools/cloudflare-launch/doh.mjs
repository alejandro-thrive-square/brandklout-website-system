/**
 * DNS-over-HTTPS lookups (Cloudflare resolver). Plain DNS on port 53 times out on the agency
 * workstation (VPN), and a timed-out lookup reads like "no record". Always use this instead of
 * nslookup / Resolve-DnsName.
 *
 * Origin: the DoH pattern from bk-mason-park (2026-09-17 zone vs live DNS comparison) and
 * bk-ifa-dentistry (2026-09-11 email records), promoted 2026-09-23.
 *
 *   import { doh } from './doh.mjs'
 *   const answers = await doh('example.com', 'MX')   // [{ name, type, TTL, data }]
 *
 *   node doh.mjs example.com MX > out.txt            # one-off lookup (redirect stdout on Windows)
 */
import { fileURLToPath } from 'node:url'

const TYPES = { A: 1, NS: 2, CNAME: 5, SOA: 6, MX: 15, TXT: 16, AAAA: 28, SRV: 33, CAA: 257 }

export async function doh(name, type = 'A') {
  const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(url, { headers: { accept: 'application/dns-json' } })
      const json = await res.json()
      /* Status 3 = NXDOMAIN. Answer may also hold the CNAME chain; keep only the asked type. */
      return (json.Answer ?? []).filter((a) => a.type === TYPES[type]).map((a) => ({ ...a, type }))
    } catch (e) {
      if (i === 2) throw new Error(`DoH ${type} ${name}: ${e.message}`)
      await new Promise((r) => setTimeout(r, 1000))
    }
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const [name, type = 'A'] = process.argv.slice(2)
  if (!name) { console.error('usage: node doh.mjs <name> [type]'); process.exit(2) }
  const answers = await doh(name, type.toUpperCase())
  if (!answers.length) console.log(`(no ${type} record for ${name})`)
  for (const a of answers) console.log(`${a.name}\t${a.TTL}\t${a.type}\t${a.data}`)
}
