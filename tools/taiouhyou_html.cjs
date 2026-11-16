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
  hokushin: "北信 2021", sawacillinIF: "インタビューフォーム",
  mucosolvanLabel: "添付文書", allelockLabel: "添付文書", clarisLabel: "添付文書",
  pmdaQ8: "PMDA Q8", handbook: "本（服用介助ハンドブック）", pharmacist: "薬剤師（ユーザー）",
  movicolLabel: "添付文書", movicolEA: "EAファーマ", movicolMochida: "持田製薬",
  levoMitoyo: "三豊総合病院の論文 2025", towaFex: "東和薬品 2018", marugameFex: "丸亀市薬剤師会 2020", chantoFex: "CHANTO 2020",
  shinchidai: "新知台耳鼻咽喉科 2020",
};

// サイトではリンクを外したが、対応表（Artifact）では手元の写しを見られる資料。Artifact に shiryou/ のファイルを一緒に送る
// 2026-11-16: 飯塚の表の元の URL が開けなくなった。ユーザーがくれた表の画像のページ（shiryou/iizuka.html）へ行く
const LOCAL = { iizuka: "shiryou/iizuka.html" };
const IIZUKA_OLD = "https://aih-net.com/yakuzaibu/kusurinomame/pdf/tekihihtou.pdf";
const urlOf = (k, refs) => (refs[k] && refs[k].url) || LOCAL[k] || "";

// data.js の why（[資料のキー, 印や言葉] の並び）を、短い名前・URL つきにする
function src(list, refs) {
  return (list || []).map(([k, mark]) => ({ short: SHORT[k] || (refs[k] ? refs[k].name : k), url: urlOf(k, refs), mark: mark || "" }));
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
  // カードに書いた飯塚の表の古い URL も、手元の写しのページへ向ける
  const md = fs.readFileSync(SRC, "utf8").replace(/\r\n?/g, "\n").split(IIZUKA_OLD).join(LOCAL.iizuka);

  const rows = [];
  for (const m of md.matchAll(/^\| (\d+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]*) \|$/gm)) {
    const [rank, name, ing, cat, src, status, memo] = m.slice(1).map((x) => x.trim());
    // 同じ順位の行（同じ成分の別の製品）があっても、図の名前が重ならないように、2つ目からは -2, -3 をつける
    let id = "d" + parseInt(rank, 10);
    for (let k = 2; rows.some((x) => x.id === id); k++) id = "d" + parseInt(rank, 10) + "-" + k;
    rows.push({ id, rank: parseInt(rank, 10), name, ing, cat, src, status, memo });
  }
  // ランク外（処方の上位60の外で、病院の表にある薬）。1つ目のマスが「外（61位）」「外（順位は未確認）」の行。ページでは欄を分けて出す（2026-11-11 ユーザーの指示）
  let outNo = 0;
  for (const m of md.matchAll(/^\| 外（([^）|]*)） \| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]*) \|$/gm)) {
    const [rankLabel, name, ing, cat, src, status, memo] = m.slice(1).map((x) => x.trim());
    rows.push({ id: "x" + (++outNo), rank: null, out: true, rankLabel, name, ing, cat, src, status, memo });
  }

  // 2026-11-14: はじめからサイトにある薬の行は、文書の下のほうにある。図の名前（id）を決めたあとで、順位の順に並べ直す。
  // ランク外は、サイトに出ている薬を先にする
  const order = new Map(rows.map((r, i) => [r, i]));
  rows.sort((a, b) => (a.out ? 1 : 0) - (b.out ? 1 : 0)
    || (a.out ? (a.status === "反映した" ? 0 : 1) - (b.status === "反映した" ? 0 : 1) : a.rank - b.rank)
    || order.get(a) - order.get(b));

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
      if (f.why && missing.length) console.log(`出どころ（why）が無い: ${r.name}: ${missing.join("、")}`);
      r.why = {
        none: !f.why,
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
        refs: f.refs.filter((k) => data.FACT_REFS[k]).map((k) => ({ ...data.FACT_REFS[k], url: urlOf(k, data.FACT_REFS) })),
        live: live ? live.has(r.name) : null,
        // サイトでの見え方の図（薬ごとの保存用の画像。card/make.cjs が data.js から作る）。画像があるときだけ出す
        img: fs.existsSync(path.join(ROOT, "card", "drug", r.name + ".png")),
      };
    }
  }

  // Python の json.dumps(ensure_ascii=False) と同じ区切り（", " と ": "）にして、前の版と差が出にくくする
  const dump = (v) => Array.isArray(v) ? "[" + v.map(dump).join(", ") + "]"
    : v && typeof v === "object" ? "{" + Object.entries(v).map(([k, x]) => JSON.stringify(k) + ": " + dump(x)).join(", ") + "}"
    : JSON.stringify(v);

  const page = fs.readFileSync(path.join(ROOT, "tools", "taiouhyou_template.html"), "utf8")
    .replace("__DATA__", () => dump(rows))
    .replace("__COUNT__", String(rows.filter((r) => !r.out).length));
  fs.writeFileSync(OUT, page);
  const onSite = rows.filter((r) => r.site);
  const noWhy = onSite.filter((r) => r.why.none).map((r) => r.name);
  console.log("中身ごとの出どころ（why）をまだ書いていない薬:", noWhy.length, noWhy.join("、"));
  const noRow = data.DRUGS.filter((d) => !rows.some((r) => r.name === d.name)).map((d) => d.name);
  if (noRow.length) console.log("！ サイトにあるのに、docs/24 に行が無い薬:", noRow.join("、"));
  // Artifact に出すときは、図を「zu/d順位.png」の名前で一緒に送る（Artifact からは ../card/ が読めないため）。その対応を書き出す
  const zu = Object.fromEntries(onSite.filter((r) => r.site.img).map((r) => ["zu/" + r.id + ".png", "card/drug/" + r.name + ".png"]));
  console.log("Artifact に一緒に送る図:", JSON.stringify(zu));
  console.log("ランク外:", rows.filter((r) => r.out).length);
  console.log("wrote", OUT, rows.length, "rows,", rows.filter((r) => Object.keys(r.card).length).length, "cards,",
    onSite.length, "on site (公開中:", live ? onSite.filter((r) => r.site.live).length : "確かめられず", ")");
})();
