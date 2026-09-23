import fs from "node:fs";
const { tasks } = JSON.parse(fs.readFileSync("tasks-2026-09-23.json", "utf8"));
for (const n of process.argv.slice(2).map(Number)) {
  const { attachments } = tasks.find((t) => t.task.local_task_id === n);
  for (const [i, a] of attachments.entries()) {
    const f = `screens-2026-09-23/${n}-att${i + 1}-${a.url.split("/").pop().split("?")[0]}`;
    const r = await fetch(a.url);
    const b = Buffer.from(await r.arrayBuffer());
    console.log(n, r.status, r.headers.get("content-type"), b.length, f);
    if (b.length) fs.writeFileSync(f, b);
  }
}
