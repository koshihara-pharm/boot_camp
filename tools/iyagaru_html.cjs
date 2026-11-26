// 嫌がられやすい薬の表（docs/iyagaru_taiouhyou.html）を作る。薬の対応表（docs/junbichu_taiouhyou.html）とは別のページで、対応表のボタンから開く。
// もとのデータは tools/iyagaru_data.cjs。順位・分け方・状態は薬の対応表（docs/24 から作ったページ）から、サイトの今の味は data.js から読む。
// 先に `node tools/taiouhyou_html.cjs` で薬の対応表を作り直してから、これを動かす: node tools/iyagaru_html.cjs
// 2026-11-23 ユーザーの指示「対応表に直接書かず、別の表を対応表にくっつけて、そこから見られるように」
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.dirname(__dirname);
const { S, D } = require("./iyagaru_data.cjs");

// 薬の対応表のページから、行（順位・名前・分け方・状態・カード）を読む
const taiou = fs.readFileSync(path.join(ROOT, "docs", "junbichu_taiouhyou.html"), "utf8");
const m = taiou.match(/const ROWS = (\[.*?\]);\s*\n/s);
if (!m) throw new Error("docs/junbichu_taiouhyou.html に ROWS が見つからない。先に node tools/taiouhyou_html.cjs を動かす");
const rows = JSON.parse(m[1]);

// サイトの薬（data.js）。画面を開くアドレス（#drug-番号）と、今の味
const ctx = {};
vm.runInNewContext(fs.readFileSync(path.join(ROOT, "data.js"), "utf8") + "\nthis.DRUGS = DRUGS;", ctx);
const siteIndex = new Map(ctx.DRUGS.map((d, i) => [d.name, i]));

const TIERS = [
  { key: "A", short: "嫌がられやすい", title: "複数の資料が、名前を挙げて書いている", tone: "neg", reasonHead: "嫌がられる理由（資料から）" },
  { key: "B", short: "条件つき", title: "後味・混ぜるもの・ざらつきなどで飲みにくい", tone: "soft", reasonHead: "どんなときに飲みにくいか（資料から）" },
  { key: "C", short: "分かれる・弱い", title: "資料で分かれる、または資料が弱い", tone: "neu", reasonHead: "分かっていること（資料から）" },
  { key: "D", short: "飲みやすい", title: "飲みやすいとされている", tone: "pos", reasonHead: "分かっていること（資料から）" },
  { key: "E", short: "資料なし", title: "資料が見つからない", tone: "neu", reasonHead: "分かっていること" },
];

const byName = new Map(D.map((d) => [d.name, d]));
const missing = rows.filter((r) => !byName.has(r.name)).map((r) => r.name);
const extra = D.filter((d) => !rows.some((r) => r.name === d.name)).map((d) => d.name);
if (missing.length || extra.length) throw new Error("薬の対応表と合わない。データに無い: " + missing.join("、") + " ／ 対応表に無い: " + extra.join("、"));

const srcOf = (s) => {
  const a = typeof s === "string" ? S[s] : s;
  if (!a) throw new Error("資料のキーが無い: " + s);
  return { name: a[0], url: a[1], kind: a[2], how: a[3] };
};

const drugs = rows.map((r, order) => {
  const d = byName.get(r.name);
  const live = r.status === "反映した";
  if (live && !siteIndex.has(r.name)) throw new Error("data.js に無い: " + r.name);
  return {
    id: r.id, order, name: r.name, rank: r.out ? 0 : r.rank, cat: r.cat, status: r.status, live,
    index: live ? siteIndex.get(r.name) : -1,
    taste: live ? ctx.DRUGS[siteIndex.get(r.name)].taste : ((r.card && r.card["味"]) || ""),
    tier: d.tier, reason: d.reason, gap: d.gap || "", kufuu: d.kufuu || [], src: (d.src || []).map(srcOf),
  };
});

const today = new Date().toISOString().slice(0, 10);
const page = fs.readFileSync(path.join(ROOT, "tools", "iyagaru_template.html"), "utf8")
  .replace("__DATA__", () => JSON.stringify({ drugs, tiers: TIERS }))
  .replace("__DATE__", "2026-11-23 に調べた。" + today + " に作り直した");
fs.writeFileSync(path.join(ROOT, "docs", "iyagaru_taiouhyou.html"), page);

const n = (t) => drugs.filter((d) => d.tier === t).length;
console.log(`薬 ${drugs.length}（公開中 ${drugs.filter((d) => d.live).length}）: A ${n("A")}・B ${n("B")}・C ${n("C")}・D ${n("D")}・E ${n("E")} → docs/iyagaru_taiouhyou.html`);
