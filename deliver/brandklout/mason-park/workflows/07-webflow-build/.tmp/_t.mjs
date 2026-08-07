import path from "node:path";
import { fileURLToPath } from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url));
const m = await import("file:///" + path.resolve(here, "../../../../../mcp-servers/webflow-clientfirst/lib.mjs").replaceAll("\\","/").replace(/^file:\/\/\/([A-Za-z]):/, "file:///$1:"));
console.log("resolveFluid:", typeof m.resolveFluid);
