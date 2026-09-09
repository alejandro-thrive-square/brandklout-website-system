/**
 * Runs INSIDE the Instatic container (Bun). Shipped there by prune-versions.mjs.
 *
 * Deletes old published versions, then compacts the database. Written the way it
 * is because of two traps that cost a live-site scare on 2026-08-21 - see
 * 22-instatic-api-sync.md, "Railway volume".
 *
 * Usage: bun run prune.ts <keep> [--apply]
 */
import { Database } from "bun:sqlite";

const DB = "/app/storage/data/cms.db";
const KEEP = Math.max(1, parseInt(process.argv[2] ?? "3", 10));
const APPLY = process.argv.includes("--apply");
const MB = (b: number) => (b / 1048576).toFixed(1) + " MB";

const db = new Database(DB, { readonly: !APPLY });
db.exec("PRAGMA busy_timeout=180000");
const one = (s: string, ...a: any[]) => db.query(s).get(...a) as any;
const all = (s: string, ...a: any[]) => db.query(s).all(...a) as any[];
const bytes = () => one(`SELECT (SELECT * FROM pragma_page_size())*(SELECT * FROM pragma_page_count()) v`).v;
const freelist = () => one(`SELECT (SELECT * FROM pragma_page_size())*(SELECT * FROM pragma_freelist_count()) v`).v;

const DOOMED = `
  WITH ranked AS (
    SELECT v.id, dr.active_version_id,
           row_number() OVER (PARTITION BY v.row_id ORDER BY v.version_number DESC) rn
    FROM data_row_versions v JOIN data_rows dr ON dr.id = v.row_id)
  SELECT id FROM ranked WHERE rn > ${KEEP} AND id <> coalesce(active_version_id,'')`;

console.log(`db: ${MB(bytes())}  freelist: ${MB(freelist())}  keep=${KEEP}  ${APPLY ? "APPLY" : "DRY RUN"}`);
const plan = one(`SELECT count(*) n,
    coalesce(sum((SELECT coalesce(sum(length(p.content_bytes)),0)
                  FROM published_runtime_assets p WHERE p.data_row_version_id = d.id)),0) bytes
  FROM (${DOOMED}) d`);
console.log(`would delete ${plan.n} versions, freeing ~${MB(plan.bytes)} of runtime assets`);

if (!APPLY) {
  console.log("\n(dry run - pass --apply to execute)");
  process.exit(0);
}

db.exec("PRAGMA foreign_keys=ON");
db.exec(`DROP TABLE IF EXISTS _prune_doomed`);
db.exec(`CREATE TABLE _prune_doomed (id text primary key)`);
db.exec(`INSERT INTO _prune_doomed (id) ${DOOMED}`);
const ckpt = () => db.query("PRAGMA wal_checkpoint(TRUNCATE)").get();

// Batch every delete and TRUNCATE the WAL between batches. A single big DELETE
// grows the WAL - which lives on the same volume - faster than it frees pages,
// so an unbatched prune fills the disk while trying to empty it.
const batchDelete = (label: string, select: string, table: string, size: number) => {
  let n = 0;
  for (;;) {
    const ids = all(`${select} LIMIT ${size}`);
    if (!ids.length) break;
    const ph = ids.map(() => "?").join(",");
    db.query(`DELETE FROM "${table}" WHERE id IN (${ph})`).run(...ids.map((r: any) => r.id));
    if (table !== "_prune_doomed") n += ids.length;
    ckpt();
  }
  console.log(`${label}: ${n}`);
  return n;
};

batchDelete("runtime assets deleted",
  `SELECT p.id FROM published_runtime_assets p JOIN _prune_doomed d ON d.id = p.data_row_version_id`,
  "published_runtime_assets", 400);

let vn = 0;
for (;;) {
  const ids = all(`SELECT id FROM _prune_doomed LIMIT 200`);
  if (!ids.length) break;
  const ph = ids.map(() => "?").join(",");
  db.query(`DELETE FROM data_row_versions WHERE id IN (${ph})`).run(...ids.map((r: any) => r.id));
  db.query(`DELETE FROM _prune_doomed WHERE id IN (${ph})`).run(...ids.map((r: any) => r.id));
  vn += ids.length;
  ckpt();
}
console.log(`versions deleted: ${vn}`);
db.exec(`DROP TABLE _prune_doomed`);

// site_snapshots is ON DELETE SET NULL, so orphans survive the cascade and must
// go explicitly. They are ~4 MB each, hence the tiny batch.
batchDelete("snapshots deleted",
  `SELECT s.id FROM site_snapshots s
   WHERE NOT EXISTS (SELECT 1 FROM data_row_versions v WHERE v.site_snapshot_id = s.id)`,
  "site_snapshots", 5);

ckpt();
console.log(`after delete: ${MB(bytes())}  freelist: ${MB(freelist())}`);

// --- integrity, BEFORE anything is swapped ---
console.log("integrity:", one("PRAGMA integrity_check").integrity_check);
console.log("fk violations:", all("PRAGMA foreign_key_check").length);
const orphaned = all(`SELECT dr.slug FROM data_rows dr
  WHERE dr.status='published' AND dr.deleted_at IS NULL
    AND (dr.active_version_id IS NULL
         OR NOT EXISTS (SELECT 1 FROM data_row_versions v WHERE v.id = dr.active_version_id))`);
if (orphaned.length) {
  console.log("ABORT - published rows lost their active version:", JSON.stringify(orphaned));
  process.exit(1);
}
console.log("every published row still has its active version");

// A plain in-place VACUUM CANNOT run here: it writes the rebuilt pages through
// the WAL, which sits beside the database on the same (nearly full) volume, so it
// dies with SQLITE_FULL. VACUUM INTO targets the container overlay instead.
const staged = "/tmp/cms-compact.db";
db.exec(`VACUUM INTO '${staged}'`);
db.close();

const size = Bun.file(staged).size;
console.log(`compacted -> ${staged}  ${MB(size)}`);
console.log("NEXT: prune-versions.mjs will size-check, swap it in, and restart the service.");
