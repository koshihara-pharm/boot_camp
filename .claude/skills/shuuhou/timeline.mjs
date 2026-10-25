// 週報のタイムラインを作る。使い方: node .claude/skills/shuuhou/timeline.mjs 2026-10-18 2026-10-24
// 1) Claude と作業した時間帯（このフォルダの会話の記録から、時刻だけを読む。中身は読まない）
// 2) git のコミット（いつ、何を記録したか）
// 時刻は日本時間。20分以上あいたら、別の作業として分ける。
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const [from, to] = process.argv.slice(2);
if (!from || !to) {
  console.log('使い方: node timeline.mjs 始めの日 終わりの日（例: 2026-10-18 2026-10-24）');
  process.exit(1);
}
const start = new Date(`${from}T00:00:00+09:00`);
const end = new Date(`${to}T23:59:59+09:00`);
const GAP_MIN = 20;

const jst = (d) => new Date(d.getTime() + 9 * 3600e3).toISOString();
const day = (d) => jst(d).slice(0, 10);
const hm = (d) => jst(d).slice(11, 16);

// 1) Claude と作業した時間帯
const projectDir = path.join(os.homedir(), '.claude', 'projects', process.cwd().replace(/[^a-zA-Z0-9]/g, '-'));
const times = [];
for (const f of fs.existsSync(projectDir) ? fs.readdirSync(projectDir) : []) {
  if (!f.endsWith('.jsonl')) continue;
  for (const line of fs.readFileSync(path.join(projectDir, f), 'utf8').split('\n')) {
    const m = line.match(/"type":"(user|assistant)"/) && line.match(/"timestamp":"([^"]+)"/);
    if (!m) continue;
    const t = new Date(m[1]);
    if (t >= start && t <= end) times.push(t);
  }
}
times.sort((a, b) => a - b);

const blocks = [];
for (const t of times) {
  const last = blocks.at(-1);
  if (last && t - last.to <= GAP_MIN * 60e3) last.to = t;
  else blocks.push({ from: t, to: t });
}

console.log('## Claude と作業した時間帯（日本時間）\n');
console.log('| 日付 | 時間帯 | 合計 |');
console.log('|---|---|---|');
let total = 0;
const byDay = new Map();
for (const b of blocks) {
  const k = day(b.from);
  if (!byDay.has(k)) byDay.set(k, []);
  byDay.get(k).push(b);
}
for (const [k, bs] of byDay) {
  const min = bs.reduce((s, b) => s + Math.max(5, (b.to - b.from) / 60e3), 0);
  total += min;
  console.log(`| ${k} | ${bs.map((b) => `${hm(b.from)}〜${hm(b.to)}`).join('、')} | ${(min / 60).toFixed(1)} 時間 |`);
}
console.log(`\n合計: 約 ${(total / 60).toFixed(1)} 時間（Claude と話していた時間だけ。スマホで試した時間などは入らない）\n`);

// 2) git のコミット
console.log('## git のコミット\n');
const log = execFileSync('git', [
  'log', `--since=${from}T00:00:00+09:00`, `--until=${to}T23:59:59+09:00`,
  '--reverse', '--date=format:%Y-%m-%d %H:%M', '--pretty=%ad | %h | %s',
], { encoding: 'utf8' }).trim();
console.log(log || '（この期間のコミットはない）');
