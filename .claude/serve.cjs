// このフォルダを http://localhost:8123/ で見られるようにする小さなサーバー（.claude/launch.json の "site" と同じ中身）
const h = require('http'), f = require('fs'), p = require('path');
const root = p.join(__dirname, '..');
const t = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.md': 'text/plain; charset=utf-8' };
h.createServer((q, r) => {
  let u = decodeURIComponent(q.url.split('?')[0]);
  if (u.endsWith('/')) u += 'index.html';
  const fp = p.join(root, u);
  if (!fp.startsWith(root)) { r.writeHead(403); r.end(); return; }
  f.readFile(fp, (e, d) => {
    if (e) { r.writeHead(404); r.end(); return; }
    r.writeHead(200, { 'Content-Type': t[p.extname(fp)] || 'application/octet-stream' });
    r.end(d);
  });
}).listen(process.env.PORT || 8123, () => console.log('http://localhost:8123/ で開けます。止めるときは Ctrl+C'));
