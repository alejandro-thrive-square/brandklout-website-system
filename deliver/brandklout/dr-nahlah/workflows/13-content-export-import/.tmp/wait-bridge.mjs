/* wait-bridge.mjs — block until the Instatic Site editor bridge is back.
 * It flaps: site_list_documents, site_read_document and every write need it,
 * while the Content workspace and the public site keep working without it.
 * Opening the Instatic editor in a browser brings it up; it also returns on its
 * own after a while.
 *   node wait-bridge.mjs [maxMinutes]
 */
import { callJson } from './instatic-mcp.mjs';
const MAX = Number(process.argv[2] || 45) * 60_000;
const started = Date.now();
let n = 0;
for (;;) {
  let connected = false;
  try {
    const ctx = await callJson('get_context', {}, { tries: 1 });
    connected = !!ctx?.editor?.siteConnected;
  } catch { /* the call itself fails while it is down */ }
  if (connected) { console.log(`bridge up after ${Math.round((Date.now() - started) / 1000)}s`); process.exit(0); }
  if (Date.now() - started > MAX) { console.log('still down after ' + (MAX / 60000) + ' minutes'); process.exit(1); }
  if (++n % 6 === 0) console.log(`  still down, ${Math.round((Date.now() - started) / 1000)}s`);
  await new Promise((r) => setTimeout(r, 20_000));
}
