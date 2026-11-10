// docs/24_junbichu_taiouhyou.md（準備中の薬の対応表）から、スマホで見る HTML（docs/junbichu_taiouhyou.html）を作る。
// 表はいつも docs/24 が元。docs/24 を書き足したら、これを動かして HTML を作り直す: node tools/taiouhyou_html.cjs
// 2026-11-10: Python の tools/taiouhyou_html.py のかわり（この PC に Python が無いため）。
// あわせて、サイトに足した薬は data.js から「サイトに出ている内容」を取りこみ、公開中のサイトの data.js にも入っているかを見る
// （ユーザーの指示「本番にどう反映させたかが、対応表を見て分かりにくい。シンプルに」）
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.dirname(__dirname);
const SRC = path.join(ROOT, "docs", "24_junbichu_taiouhyou.md");
const OUT = path.join(ROOT, "docs", "junbichu_taiouhyou.html");
const LIVE_URL = "https://koshihara-pharm.github.io/boot_camp/data.js";

// 対応表で、出どころを一目で分かるように出すときの短い呼び名（data.js の FACT_REFS の名前は長いので）。無いときは長い名前のまま
const SHORT = {
  obihiro: "帯広 2024", iizuka: "飯塚 2016", ncchd: "成育 2018", kurumiMix: "くるみ薬局 2018",
  mucosolvanLabel: "添付文書", allelockLabel: "添付文書", clarisLabel: "添付文書",
  pmdaQ8: "PMDA Q8", handbook: "本（服用介助ハンドブック）", pharmacist: "薬剤師（ユーザー）",
};

// data.js の why（[資料のキー, 印や言葉] の並び）を、短い名前・URL つきにする
function src(list, refs) {
  return (list || []).map(([k, mark]) => ({ short: SHORT[k] || (refs[k] ? refs[k].name : k), url: refs[k] ? refs[k].url || "" : "", mark: mark || "" }));
}

// data.js の中の DRUGS・FACTS・FACT_REFS を取り出す
function loadData(code) {
  const ctx = {};
  vm.runInNewContext(code + "\nthis.DRUGS = DRUGS; this.FACTS = FACTS; this.FACT_REFS = FACT_REFS;", ctx);
  return ctx;
}

async function liveNames() {
  try {
    const res = await fetch(LIVE_URL, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    return new Set(loadData(await res.text()).DRUGS.map((d) => d.name));
  } catch {
    return null; // 公開中のサイトを確かめられなかった
  }
}

(async () => {
  const md = fs.readFileSync(SRC, "utf8").replace(/\r\n?/g, "\n");

  const rows = [];
  for (const m of md.matchAll(/^\| (\d+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]*) \|$/gm)) {
    const [rank, name, ing, cat, src, status, memo] = m.slice(1).map((x) => x.trim());
    rows.push({ rank: parseInt(rank, 10), name, ing, cat, src, status, memo });
  }

  const cards = {};
  for (const m of md.matchAll(/^### (.+?)\n([\s\S]*?)(?=^### |(?![\s\S]))/gm)) {
    const fields = {};
    for (const fm of m[2].matchAll(/^- ([^:：\n]+)[:：] ?(.*)$/gm)) fields[fm[1].trim()] = fm[2].trim();
    cards[m[1].trim()] = fields;
  }

  const data = loadData(fs.readFileSync(path.join(ROOT, "data.js"), "utf8"));
  const live = await liveNames();

  for (const r of rows) {
    r.card = cards[r.name] || {};
    const drug = data.DRUGS.find((d) => d.name === r.name);
    const f = data.FACTS[r.name];
    if (drug && f) {
      const w = f.why || {};
      const R = data.FACT_REFS;
      const foods = [...(f.easy ? f.easy.foods : []), ...(f.good ? f.good.foods : []), ...(f.avoid ? f.avoid.foods : [])];
      const missing = foods.filter((x) => !(w.foods && w.foods[x]));
      if (!w.taste) missing.unshift("味");
      if (missing.length) console.log(`出どころ（why）が無い: ${r.name}: ${missing.join("、")}`);
      r.why = {
        note: w.note || "",
        taste: src(w.taste, R),
        point: src(w.point, R),
        foods: Object.fromEntries(foods.map((x) => [x, src(w.foods && w.foods[x], R)])),
        tips: (f.tips || []).map((_, i) => src(w.tips && w.tips[i], R)),
      };
      r.site = {
        taste: f.taste || drug.taste,
        point: f.point || "",
        easy: f.easy ? f.easy.foods : [],
        good: f.good ? f.good.foods : [],
        avoid: f.avoid ? f.avoid.foods : [],
        tips: f.tips || [],
        refs: f.refs.map((k) => data.FACT_REFS[k]).filter(Boolean),
        live: live ? live.has(r.name) : null,
      };
    }
  }

  // Python の json.dumps(ensure_ascii=False) と同じ区切り（", " と ": "）にして、前の版と差が出にくくする
  const dump = (v) => Array.isArray(v) ? "[" + v.map(dump).join(", ") + "]"
    : v && typeof v === "object" ? "{" + Object.entries(v).map(([k, x]) => JSON.stringify(k) + ": " + dump(x)).join(", ") + "}"
    : JSON.stringify(v);

  const page = fs.readFileSync(path.join(ROOT, "tools", "taiouhyou_template.html"), "utf8")
    .replace("__DATA__", () => dump(rows))
    .replace("__COUNT__", String(rows.length));
  fs.writeFileSync(OUT, page);
  const onSite = rows.filter((r) => r.site);
  console.log("wrote", OUT, rows.length, "rows,", rows.filter((r) => Object.keys(r.card).length).length, "cards,",
    onSite.length, "on site (公開中:", live ? onSite.filter((r) => r.site.live).length : "確かめられず", ")");
})();
