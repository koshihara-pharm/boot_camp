// 子ども向けの動画「ごっくん できるかな？」の、かけ声・場面・曲をまとめて作る（2026-11-16。決まりは docs/30、経緯は docs/28）
// 使い方: node tools/douga/gokkun.cjs
//   1. かけ声の読み方（yomi/gq_*.ys）を書いて、yomiscript で音にする（work/gq_*.wav）
//   2. 場面ごとに、かけ声を拍の頭に並べた音を作る（work/gk_*.wav）
//   3. 場面（cfg/gokkun.json）を書く
//   4. 曲の楽譜（jingle/gokkun.json。JingleScript）を書く
// そのあと: node tools/douga/make.cjs gokkun → npx jinglescript render tools/douga/jingle/gokkun.json -o tools/douga/work/jingle-gokkun.wav → node tools/douga/jingle/mix.cjs gokkun "" -6
//
// 形（docs/30 の決まり）: ねらいは「コップのお薬を、ごっくんと飲む」の1つだけ。同じ型（名前 → せーの → ごっくん → できた！）を4回くり返す。
// 曲はテンポ100で、1小節（4拍）= 2.4秒。場面の長さを小節にそろえて、かけ声が毎回、小節の頭に来るようにする（音が進める）
const fs = require("fs"), path = require("path"), { execFileSync } = require("child_process");
const dir = __dirname, work = path.join(dir, "work");
const BAR = 2.4, LEAD = 0.4;   // LEAD = 場面の頭から、かけ声までの間（rec.html の決まり）

// かけ声の部品
const PIECES = {
  gq_title: "ja /gokkɯɴ<t:ごっくん> ‖<t:、> dekiɾɯ<t:できる> kana<t:かな？> ↗/",
  gq_kousagi: "ja /koɯsagitɕaɴ<t:こうさぎちゃん> ↘/",
  gq_dango: "ja /daŋgotɕaɴ<t:だんごちゃん> ↘/",
  gq_hakase: "ja /hakase<t:はかせ> ↘/",
  gq_seno: "ja /seːno<t:せーの> ↘/",
  gq_gokkun: "ja /gokkɯɴ<t:ごっくん> ↘/",
  gq_dekita: "ja /dekita<t:できた！> ↘/",
  gq_sugoi: "ja /sɯgoi<t:すごい！> ↘/",
  gq_yattane: "ja /jattane<t:やったね！> ↘/",
  gq_tsugi: "ja /tsɯgi<t:つぎ> wa<t:は> ‖<t:、> kimi<t:きみ> no<t:の> baɴ<t:ばん> ↘/",
  gq_oshimai: "ja /oɕimai<t:おしまい> ↘/",
  gq_baibai: "ja /baibai<t:ばいばい> ↘/",
  gq_mouikkai: "ja /moːikkai<t:もういっかい！> ↘/",
};
// 場面。bars = 小節ごとの役わり（曲がこれを見る）。say = その小節の頭で言う、かけ声の部品（無ければ言わない）
const round = (id, name, piece, praiseWord, praisePiece, lead) => [
  { voice: `gk_${id}a.wav`, cap: [name, "せーの"], imgs: [`g${id}1`], bars: ["name", "seno"], say: [piece, "gq_seno"], lead },
  { voice: `gk_${id}b.wav`, cap: ["ごっくん"], imgs: [`g${id}2`], bars: ["gokkun"], say: ["gq_gokkun"], lead },
  { voice: `gk_${id}c.wav`, cap: [praiseWord], imgs: [`g${id}3`], bars: ["dekita"], say: [praisePiece], lead },
];
const SC = [
  { voice: "gk_title.wav", cap: ["ごっくん", "できるかな？"], imgs: ["g0"], bars: ["title1", "title2"], say: ["gq_title"], lead: "glockenspiel" },
  ...round("k", "こうさぎちゃん", "gq_kousagi", "できた！", "gq_dekita", "glockenspiel"),
  ...round("d", "だんごちゃん", "gq_dango", "すごい！", "gq_sugoi", "marimba"),
  ...round("h", "はかせ", "gq_hakase", "やったね！", "gq_yattane", "xylophone"),
  { voice: "gk_ta.wav", cap: ["つぎは", "きみの ばん"], imgs: ["g0"], bars: ["turn1", "turn2"], say: ["gq_tsugi"], lead: "glockenspiel" },
  // 見ている子の番: 「ごっくん」のあと、1小節、何も言わずに待つ
  { voice: "gk_tb.wav", cap: ["せーの", "ごっくん"], imgs: ["gt"], bars: ["seno", "gokkun", "wait"], say: ["gq_seno", "gq_gokkun"], lead: "glockenspiel" },
  { voice: "gk_tc.wav", cap: ["できた！", "おしまい ばいばい"], imgs: ["ge"], bars: ["dekita_all", "oshimai", "baibai"], say: ["gq_dekita", "gq_oshimai", "gq_baibai"], lead: "glockenspiel" },
  // もういっかい（docs/30 の決まり 10。docs/18 の 18-3）: 「ばいばい」で終わったあとに、短い2回目。いちばん大事な所（せーの → ごっくん → できた！）と、ばいばいだけ。7小節 = 約17秒（1回目の約3分の1）
  { voice: "gk_ea.wav", cap: ["もういっかい！"], imgs: ["g0"], bars: ["mouikkai"], say: ["gq_mouikkai"], lead: "glockenspiel" },
  { voice: "gk_eb.wav", cap: ["せーの"], imgs: ["gt"], bars: ["seno"], say: ["gq_seno"], lead: "glockenspiel" },
  { voice: "gk_ec1.wav", cap: ["ごっくん"], imgs: ["gk2"], bars: ["gokkun"], say: ["gq_gokkun"], lead: "glockenspiel" },
  { voice: "gk_ec2.wav", cap: ["ごっくん"], imgs: ["gd2"], bars: ["gokkun"], say: ["gq_gokkun"], lead: "marimba" },
  { voice: "gk_ec3.wav", cap: ["ごっくん"], imgs: ["gh2"], bars: ["gokkun"], say: ["gq_gokkun"], lead: "xylophone" },
  { voice: "gk_ed.wav", cap: ["できた！", "ばいばい"], imgs: ["ge"], bars: ["dekita_all", "baibai"], say: ["gq_dekita", "gq_baibai"], lead: "glockenspiel" },
];

// 1. かけ声の部品を音にする
for (const [n, t] of Object.entries(PIECES)) fs.writeFileSync(path.join(dir, "yomi", n + ".ys"), t + "\n");
execFileSync("node", [path.join(dir, "yomi.cjs")], { stdio: "inherit" });
const len = (f) => Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString());

// 2. 場面ごとに、かけ声を小節の頭に並べる（場面の音は、場面の頭 + LEAD から鳴る。なので、n 小節目のかけ声は n × BAR 秒の所）
for (const sc of SC) {
  const args = ["-v", "error", "-y"], parts = [];
  sc.say.forEach((p, i) => { const f = path.join(work, p + ".wav"); if (len(f) > BAR - 0.15 && sc.bars.length === sc.say.length) console.log("長い:", p, len(f).toFixed(2)); args.push("-i", f); parts.push(`[${i}:a]adelay=${Math.round(i * BAR * 1000)}:all=1[a${i}]`); });
  const fc = parts.join(";") + ";" + sc.say.map((_, i) => `[a${i}]`).join("") + `amix=inputs=${sc.say.length}:normalize=0:duration=longest[a]`;
  args.push("-filter_complex", fc, "-map", "[a]", "-ar", "24000", "-ac", "1", path.join(work, sc.voice));
  execFileSync("ffmpeg", args, { stdio: "inherit" });
}

// 3. 場面（cfg）。"kid": 1語を大きく出す。"dur": 場面の長さ（小節の数 × 2.4秒）
const cfg = { story: true, scenes: [...SC.map((sc) => ({ voice: sc.voice, kid: true, dur: +(sc.bars.length * BAR).toFixed(2), cap: sc.cap, imgs: sc.imgs })), { end: true, img: "ge" }] };
fs.writeFileSync(path.join(dir, "cfg", "gokkun.json"), JSON.stringify(cfg, null, 1) + "\n");

// 4. 曲（JingleScript）。キュー go = 最初のかけ声の時刻。そこから、拍（1拍 0.6秒）で数える
const CH = { C: ["C3", "G2", ["C4", "E4", "G4"]], G: ["G2", "D3", ["G3", "B3", "D4"]], F: ["F2", "C3", ["F3", "A3", "C4"]], Am: ["A2", "E3", ["A3", "C4", "E4"]] };
const ROLE_CHORD = { title1: "C", title2: "G", name: "C", seno: "G", gokkun: "F", dekita: "C", dekita_all: "C", turn1: "Am", turn2: "G", wait: "F", oshimai: "G", baibai: "C", mouikkai: "G" };
const T = {};
const tr = (key, instrument, gain, extra) => (T[key] = T[key] || { instrument, name: key, gain, ...(extra || {}), notes: [] }).notes;
const at = (b) => (b === 0 ? "go" : "go+" + +b.toFixed(3));
let bar = 0;
for (const sc of SC) for (const role of sc.bars) {
  const b = bar * 4, cname = ROLE_CHORD[role], [root, fifth] = CH[cname];
  const lead = (o, pitch, vel) => tr("リード（" + sc.lead + "）", sc.lead, sc.lead === "marimba" ? -2 : -3).push({ at: at(b + o), pitch, vel });
  const strum = (pattern, vel) => tr("ウクレレ", "ukulele", -8).push({ at: at(b), chord: cname, strum: pattern, vel });
  const bass = (o, p, vel) => tr("ベース", "marimba", -5).push({ at: at(b + o), pitch: p, vel });
  if (role === "wait") {            // 見ている子が飲むのを待つ小節: 小さく、とん・とん・とん・とん
    [0, 1, 2, 3].forEach((o) => tr("ベース", "marimba", -5).push({ at: at(b + o), pitch: "C4", vel: 0.3 }));
  } else if (role === "gokkun") {   // ごっくん: 曲をいったん止めて、水の音と、下がっていく音
    strum({ pattern: "down", spread: 25 }, 0.5); bass(0, root, 0.75);
    tr("水の音", "droplet", -2, { reverb: false }).push({ at: at(b + 0.25), vel: 0.9 });
    [[1, "C6"], [1.5, "A5"], [2, "F5"]].forEach(([o, p]) => lead(o, p, 0.55));
  } else {
    strum("D-DU-UDU", role === "turn1" || role === "turn2" ? 0.35 : 0.45); bass(0, root, 0.65); bass(2, fifth, 0.5);
    if (role === "title1") [[0, "G5"], [0.5, "C6"], [1, "E6"]].forEach(([o, p]) => lead(o, p, 0.7));
    if (role === "title2") [[2, "D6"], [2.5, "E6"], [3, "G6"]].forEach(([o, p]) => lead(o, p, 0.6));
    if (role === "name") [[2, "E5"], [2.5, "G5"], [3, "E5"]].forEach(([o, p]) => lead(o, p, 0.5));
    if (role === "seno" || role === "turn2" || role === "mouikkai") [[2, "G5"], [2.5, "A5"], [3, "B5"], [3.5, "D6"]].forEach(([o, p], i) => lead(o, p, 0.5 + i * 0.08));   // のぼっていく（わくわく）
    if (role === "dekita" || role === "dekita_all") {   // できた！: 明るい和音、きらきら、手を3回たたく
      ["C6", "E6", "G6", "C7"].forEach((p, i) => tr("きらきら", "glockenspiel", -3).push({ at: at(b + i * 0.25), pitch: p, vel: 0.7 }));
      tr("ベル", "ding", -6).push({ at: at(b), vel: 0.7 });
      [1, 2, 3].forEach((o) => tr("手をたたく", "clap", -1).push({ at: at(b + o), vel: 0.6, variant: "hands" }));
      if (role === "dekita_all") tr("拍手", "applause", -8).push({ at: at(b + 0.5), vel: 0.7 });
    }
    if (role === "oshimai") [[0, "G5"], [1, "E5"]].forEach(([o, p]) => lead(o, p, 0.55));
    if (role === "baibai") [[0, "E5"], [1, "C5"]].forEach(([o, p]) => lead(o, p, 0.55));
  }
  bar++;
}
// 最後の画面（サイトの名前）: サイトの音の目印（ミ・ソ・ド、ソ・ド・ミ）
const e = bar * 4;
[[0, "E4"], [0.5, "G4"], [1, "C5"], [2, "G4"], [2.5, "C5"], [3, "E5"]].forEach(([o, p]) => tr("サイトの音の目印", "musicbox", -3).push({ at: at(e + o), pitch: p, vel: o === 3 ? 0.9 : 0.75 }));
tr("ウクレレ", "ukulele", -8).push({ at: at(e), chord: "C", strum: { pattern: "down", spread: 30 }, vel: 0.6 }, { at: at(e + 3), chord: "C", strum: { pattern: "down", spread: 40 }, vel: 0.7 });
tr("ベース", "marimba", -5).push({ at: at(e), pitch: "C3", vel: 0.6 }, { at: at(e + 3), pitch: "C2", vel: 0.6 });
const total = 0.1 + bar * BAR + 3.2;
const score = { format: "jinglescript/1", title: "ごっくん できるかな？", tempo: 100, length: { seconds: +total.toFixed(2) }, seed: 1,
  master: { reverb: "room", loudness: -18, fadeOut: 1.0 }, cues: { go: { seconds: 0.1 + LEAD } }, tracks: Object.values(T) };
fs.mkdirSync(path.join(dir, "jingle"), { recursive: true });
fs.writeFileSync(path.join(dir, "jingle", "gokkun.json"), JSON.stringify(score, null, 1) + "\n");
console.log("できた: 場面", cfg.scenes.length, "個 /", bar, "小節 /", total.toFixed(1), "秒 / 曲の音", Object.values(T).reduce((n, x) => n + x.notes.length, 0), "個");
