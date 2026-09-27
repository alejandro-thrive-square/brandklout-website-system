import { api, BASE } from './insta.mjs';
for (const p of ['/admin/api/cms/users', '/admin/api/cms/team/users']) {
  try { const r = await api('GET', p); const u = r.users || r.data || r; console.log(BASE, p, JSON.stringify((Array.isArray(u) ? u : []).map(x => [x.email, x.role]))); break; } catch (e) { console.log(p, e.message.slice(0, 80)); }
}
