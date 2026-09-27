import { api, BASE } from './insta.mjs';
const r = await api('GET', '/admin/api/cms/plugins/brandklout.open-graph/runtime/pages');
const rows = r.pages || r.data?.pages || [];
const w = rows.filter(x => x.override);
console.log(BASE, rows.length, 'pages,', w.length, 'with override; sample', JSON.stringify(w[0]?.override || rows[0]).slice(0, 300));
