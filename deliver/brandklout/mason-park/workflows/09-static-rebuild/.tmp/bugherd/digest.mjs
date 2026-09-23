import fs from "node:fs";
const { tasks } = JSON.parse(fs.readFileSync(`tasks-${process.argv[2]}.json`, "utf8"));
const open = tasks.filter((t) => !["done", "closed"].includes(t.task.status));
const out = [`${open.length} open of ${tasks.length}`];
for (const { task: t, comments, attachments } of open) {
  const url = t.site && t.url ? t.site + t.url : (t.url || t.page_url || "");
  const sel = t.selector_info?.path || t.selector_info?.data?.selector || "";
  const os = t.requester_os || t.selector_info?.data?.os || "", br = t.requester_browser || "", res = t.requester_resolution || "";
  out.push(`\n#${t.local_task_id} [${t.status}] ${url}\n  ${br} ${os} ${res}\n  sel: ${String(sel).slice(0, 160)}\n  "${(t.description || "").replace(/\s+/g, " ").trim()}"\n  att: ${(attachments || []).map((a) => a.file_name || a.url).join(", ")}${comments.length ? "\n  comments: " + comments.map((c) => (c.user?.display_name || "?") + ": " + c.text.replace(/\s+/g, " ")).join(" | ") : ""}`);
}
fs.writeFileSync(`open-${process.argv[2]}.txt`, out.join("\n"));
