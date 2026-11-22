// 飲ませ方の動画の曲を、ゼロから考えて JingleScript の楽譜（JSON）にする（2026-11-16。docs/28 の「曲をゼロから考える」）
// 使い方: node tools/douga/jingle/compose.cjs baby-spoit a   → tools/douga/jingle/baby-spoit-a.json（a・b・c は曲の性格。下の STYLES）
//        npx -y jinglescript@1.2.1 render tools/douga/jingle/baby-spoit-a.json -o tools/douga/work/jingle-baby-spoit-a.wav
//        node tools/douga/jingle/mix.cjs baby-spoit a -8       → video/try-jingle-baby-spoit-a.mp4
//
// 3つの性格に共通の考え方:
// - 声が主役。曲は、声と重ならない高さ（低いベースと、高いチャイム）と、少ない音数にする。メロディーは声の合間（場面の頭と終わり）だけ
// - 場面が変わる時刻（cfg と読み上げの長さから計算）を「キュー」にして、場面ごとに曲の区切りを始める。場面の長さが変わっても、曲がずれない
// - 手順の頭のチャイムは、手順の番号と同じ数だけ鳴らす（1回・2回・3回。画面の丸い数字と同じ）
// - 「飲めたら、ほめましょう」の所: きらきら（グロッケン）
// - 最後の画面: どの動画でも同じ短いメロディー（サイトの音の目印。ミ・ソ・ド、ソ・ド・ミ）
const fs = require("fs"), path = require("path"), { execFileSync } = require("child_process");
const name = process.argv[2], style = process.argv[3] || "a", dir = path.join(__dirname, "..");
const STYLES = {
  a: { label: "やさしいウクレレ", tempo: 96, bar: 4 },     // ゆっくりめ。ウクレレのつまびき、マリンバのベース、ビブラフォンのうすい和音。ほめる所で手を3回たたく
  b: { label: "オルゴールの子守歌", tempo: 88, bar: 3 },   // 3拍子のワルツ。マリンバのベースとビブラフォンの「ずん・ちゃっ・ちゃっ」、チャイムはオルゴール。いちばん静か
  c: { label: "明るいマリンバ", tempo: 112, bar: 4 },      // 速め。ウクレレのじゃかじゃか、はずむマリンバのベース、軽い手拍子、チャイムは木琴。元気
};
const ST = STYLES[style]; if (!ST) { console.log("性格は a・b・c のどれか"); process.exit(1); }
const cfg = JSON.parse(fs.readFileSync(path.join(dir, "cfg", name + ".json"), "utf8"));
const len = (f) => Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString());
const BEAT = 60 / ST.tempo, BAR = ST.bar;

// 1. 場面ごとのキュー（rec.html の決まり: 録画の始まり 0.1秒、場面の長さ = 読み上げ + 1.4秒）
// お話の動画（cfg に "story": true。手順の番号が無い）は、ページごとに区切る（kind "page"）。最後のほめるページは cfg の場面に "praise": true
let t = 0.1, stepSeen = 0, page = 0; const secs = [];
for (const sc of cfg.scenes) {
  if (sc.end) { secs.push({ cue: "end", at: t, kind: "end" }); continue; }
  let kind, step = 0;
  if (sc.big) kind = "title";
  else if (sc.step) { step = sc.step; kind = sc.step !== stepSeen ? "step" : "cont"; stepSeen = sc.step; }
  else if (cfg.story && !sc.praise) kind = "page";
  else kind = "praise";
  secs.push({ cue: "s" + secs.length, at: t, kind, step, page: kind === "page" ? ++page : 0 });
  t += len(path.join(dir, "work", sc.voice)) + 1.4;
}
const usagi = path.join(dir, "..", "..", "video", name + "-usagi.mp4");
const made = fs.existsSync(usagi) ? usagi : path.join(dir, "..", "..", "video", name + ".mp4");
const total = fs.existsSync(made) ? len(made) : t + 3.2;
secs.forEach((s, i) => { s.dur = (i + 1 < secs.length ? secs[i + 1].at : total) - s.at; s.next = i + 1 < secs.length ? secs[i + 1].cue : null; });

// 2. 和音（ハ長調）。[ベース, 和音の4つの音, ベースの5度]
const CH = {
  C: ["C3", ["C4", "E4", "G4", "C5"], "G2"], Am: ["A2", ["A3", "C4", "E4", "A4"], "E3"], F: ["F2", ["F3", "A3", "C4", "F4"], "C3"],
  G: ["G2", ["G3", "B3", "D4", "G4"], "D3"], Em: ["E3", ["E4", "G4", "B4", "E5"], "B2"], Dm: ["D3", ["D4", "F4", "A4", "D5"], "A2"],
};
// 場面の役わりごとの和音の進み方。手順が進むと、少しずつ色が変わって、最後に落ち着く
const PROG = { title: ["C", "C"], 1: ["C", "Am", "F", "G"], 2: ["F", "G", "Em", "Am"], 3: ["Dm", "G", "C", "Am"], praise: ["C", "F"] };
const ARP = [0, 2, 1, 2, 3, 2, 1, 2];   // 8分音符のつまびき方: 根音・5度・3度・5度・上の根音・5度・3度・5度
const T = {};   // トラック。名前 → { instrument, gain, notes }
const tr = (key, instrument, gain, extra) => (T[key] = T[key] || { instrument, name: key, gain, ...(extra || {}), notes: [] }).notes;
const at = (cue, b) => (b === 0 ? cue : cue + (b > 0 ? "+" : "") + +b.toFixed(3));
const down8 = (p) => p.replace(/\d/, (d) => String(Number(d) - 1));   // オルゴールは書いた音より1オクターブ上で鳴るので、1つ下で書く
// チャイム（場面の頭の合図）: a はグロッケン、b はオルゴール、c は木琴
const chime = (when, pitch, vel) => {
  if (style === "a") tr("チャイム", "glockenspiel", 0).push({ at: when, pitch, vel });
  if (style === "b") tr("チャイム", "musicbox", -2).push({ at: when, pitch: down8(pitch), vel });
  if (style === "c") { tr("チャイム", "xylophone", -1).push({ at: when, pitch, vel }); tr("きらきら", "glockenspiel", -7).push({ at: when, pitch, vel: vel * 0.7 }); }
};
const barsUsed = {};   // 同じ手順の続きの場面では、和音の進み方を続きから始める

for (const s of secs) {
  if (s.kind === "end") {
    // サイトの音の目印: ミ・ソ・ド、ソ・ド・ミ
    const logo = [[0, "E5"], [0.5, "G5"], [1, "C6"], [2, "G5"], [2.5, "C6"], [3, "E6"]];
    for (const [b, p] of logo) {
      const vel = b === 3 ? 0.9 : 0.75;
      if (style === "c") tr("チャイム", "xylophone", -1).push({ at: at("end", b), pitch: p, vel });
      else tr("サイトの音の目印", "musicbox", style === "a" ? -5 : -3).push({ at: at("end", b), pitch: down8(p), vel });
    }
    tr("きらきら", "glockenspiel", style === "a" ? 0 : -7).push({ at: at("end", 3), pitch: "E6", vel: 0.4 });
    if (style === "b") tr("和音", "vibraphone", -6).push({ at: "end", pitch: ["C4", "E4", "G4"], vel: 0.4 }, { at: at("end", 3), pitch: ["C4", "E4", "G4", "C5"], vel: 0.45 });
    else tr(style === "a" ? "つまびき" : "じゃかじゃか", "ukulele", style === "a" ? -4 : -7).push({ at: "end", chord: "C", strum: { pattern: "down", spread: 30 }, vel: 0.6 }, { at: at("end", 3), chord: "C", strum: { pattern: "down", spread: 40 }, vel: 0.7 });
    tr("ベース", "marimba", style === "c" ? -4 : -6).push({ at: "end", pitch: "C3", vel: 0.6 }, { at: at("end", 3), pitch: "C2", vel: 0.6 });
    continue;
  }
  const beats = s.dur / BEAT, key = s.kind === "title" ? "title" : s.kind === "praise" ? "praise" : s.kind === "page" ? "p" + s.page : s.step;
  const prog = PROG[key] || PROG[(((s.page || s.step) - 1) % 3) + 1];
  const startBar = s.kind === "cont" ? (barsUsed[key] || 0) : 0;
  const fill = beats - 1.2;   // 次の場面の前に、ひと息の間をあける
  const chordAt = (b) => CH[prog[(startBar + Math.floor(b / BAR)) % prog.length]];

  if (style === "a") {
    for (let b = 0; b < fill; b += 0.5) {
      const inBar = b % 4, [root, tones] = chordAt(b);
      tr("つまびき", "ukulele", -4).push({ at: at(s.cue, b), pitch: tones[ARP[Math.round(inBar * 2)]], vel: inBar === 0 ? 0.6 : 0.45 });
      if (inBar === 0) { tr("ベース", "marimba", -6).push({ at: at(s.cue, b), pitch: root, vel: 0.6 }); if (fill - b >= 2) tr("うすい和音", "vibraphone", -11).push({ at: at(s.cue, b), pitch: tones.slice(0, 3), vel: 0.35 }); }
      if (inBar === 2 && fill - b >= 1) tr("ベース", "marimba", -6).push({ at: at(s.cue, b), pitch: root, vel: 0.4 });
    }
  }
  if (style === "b") {
    // 3拍子: 1拍目にベース、2・3拍目にビブラフォンの和音（ずん・ちゃっ・ちゃっ）
    for (let b = 0; b < fill; b += 3) {
      const [root, tones] = chordAt(b);
      tr("ベース", "marimba", -6).push({ at: at(s.cue, b), pitch: root, vel: 0.55 });
      if (b + 1 < fill) tr("和音", "vibraphone", -6).push({ at: at(s.cue, b + 1), pitch: [tones[1], tones[2]], vel: 0.4 });
      if (b + 2 < fill) tr("和音", "vibraphone", -6).push({ at: at(s.cue, b + 2), pitch: [tones[1], tones[2]], vel: 0.32 });
    }
  }
  if (style === "c") {
    // 4拍子: ウクレレのじゃかじゃか、はずむベース、2拍目と4拍目に軽い手拍子
    for (let b = 0; b < fill; b += 4) {
      const [root, , fifth] = chordAt(b), cname = prog[(startBar + Math.floor(b / 4)) % prog.length], left = fill - b;
      if (left >= 4) tr("じゃかじゃか", "ukulele", -7).push({ at: at(s.cue, b), chord: cname, strum: "D-DU-UDU", vel: 0.45 });
      else if (left >= 1) tr("じゃかじゃか", "ukulele", -7).push({ at: at(s.cue, b), chord: cname, strum: { pattern: "down", spread: 25 }, vel: 0.45 });
      [[0, root, 0.65], [1.5, root, 0.4], [2, fifth, 0.55], [3.5, root, 0.4]].forEach(([o, p, v]) => { if (o < left) tr("ベース", "marimba", -4).push({ at: at(s.cue, b + o), pitch: p, vel: v }); });
      [1, 3].forEach((o) => { if (o < left && s.kind !== "title") tr("手拍子", "clap", -13).push({ at: at(s.cue, b + o), vel: 0.4, variant: "hands" }); });
    }
  }
  barsUsed[key] = startBar + Math.ceil(fill / BAR);

  // 場面の頭のチャイム
  if (s.kind === "title") { chime(s.cue, "G5", 0.6); chime(at(s.cue, 0.5), "C6", 0.7); }
  if (s.kind === "step") ["C6", "E6", "G6"].slice(0, Math.min(s.step, 3)).forEach((p, i) => chime(at(s.cue, i * 0.25), p, 0.7));
  if (s.kind === "cont") chime(s.cue, "G5", 0.35);
  if (s.kind === "page") chime(s.cue, ["G5", "A5", "C6", "D6", "E6"][(s.page - 1) % 5], 0.5);   // お話のページをめくる合図。ページが進むと、少しずつ高くなる
  if (s.kind === "praise") {
    ["C6", "E6", "G6", "C7"].forEach((p, i) => tr("きらきら", "glockenspiel", style === "a" ? 0 : -4).push({ at: at(s.cue, i * 0.25), pitch: p, vel: 0.65 }));
    // 読み上げが終わったあとに、親が手をたたく（ぱち・ぱち・ぱち）。子守歌（b）では入れない
    if (s.next && style !== "b") [-1.5, -1, -0.5].forEach((b) => tr("手をたたく", "clap", 0, { reverb: true }).push({ at: at(s.next, b), vel: 0.6, variant: "hands" }));
  }
}

const cues = {}; for (const s of secs) cues[s.cue] = { seconds: +s.at.toFixed(2) };
const score = {
  format: "jinglescript/1", title: "飲ませ方の動画の曲 " + style.toUpperCase() + " " + ST.label + "（" + name + "）", tempo: ST.tempo, length: { seconds: +total.toFixed(2) }, seed: 1,
  // 目標の大きさは -20（初めの -14 だと、音数が少ないので全体を大きくしすぎて、チャイムの頭が 5.5dB おさえられた）。動画に重ねるときに大きさを決める
  master: { reverb: "room", loudness: -20, fadeOut: 1.2 }, cues,
  tracks: Object.values(T),
};
fs.writeFileSync(path.join(__dirname, name + "-" + style + ".json"), JSON.stringify(score, null, 1) + "\n");
console.log("書いた:", name + "-" + style + ".json", ST.label, "テンポ", ST.tempo, "長さ", total.toFixed(2), "秒 / 音", Object.values(T).reduce((n, x) => n + x.notes.length, 0), "個 /", Object.values(T).map((x) => x.name + "=" + x.instrument).join(", "));
