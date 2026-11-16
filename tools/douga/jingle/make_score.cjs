// 飲ませ方の動画の曲を、JingleScript の楽譜（JSON）にする。試し（2026-11-16。docs/28）
// 使い方: node tools/douga/jingle/make_score.cjs baby-spoit   → tools/douga/jingle/baby-spoit.json
//        npx -y jinglescript@1.2.1 render tools/douga/jingle/baby-spoit.json -o tools/douga/work/jingle-baby-spoit.wav
// 曲は、今までの曲（rec.html の music）と同じメロディーと和音（C・G・Am・F、テンポ120）。楽器だけを、ウクレレ・マリンバ・グロッケンに変えた
// 場面が変わる時刻（cfg と読み上げの長さから計算）に、効果音を置く: 手順の頭に「ポン」、ほめる所に拍手
const fs = require("fs"), path = require("path"), { execFileSync } = require("child_process");
const name = process.argv[2], dir = path.join(__dirname, "..");
const cfg = JSON.parse(fs.readFileSync(path.join(dir, "cfg", name + ".json"), "utf8"));
const len = (f) => Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString());
// 場面の頭の時刻（rec.html の決まり: 録画の始まり 0.1秒、場面の長さ = 読み上げ + 1.4秒、終わりの画面は 3.6秒）
let t = 0.1; const cues = {}; let stepSeen = 0;
for (const sc of cfg.scenes) {
  if (sc.end) { cues.end = { seconds: +t.toFixed(2) }; t += 3.6; continue; }
  if (sc.big) cues.title = { seconds: +t.toFixed(2) };
  else if (sc.step && sc.step !== stepSeen) { stepSeen = sc.step; cues["step" + sc.step] = { seconds: +t.toFixed(2) }; }
  else if (!sc.step) cues.praise = { seconds: +t.toFixed(2) };
  t += len(path.join(dir, "work", sc.voice)) + 1.4;
}
// 曲の長さは、できている動画（video/名前-usagi.mp4）があれば、その長さに合わせる（終わりの画面の長さが、計算と少し違うため）
const made = path.join(dir, "..", "..", "video", name + "-usagi.mp4");
const total = fs.existsSync(made) ? len(made) : t;
const N = (n) => ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"][n % 12] + (Math.floor(n / 12) - 1);
const chords = ["C", "G", "Am", "F"], roots = [48, 43, 45, 41];
const mel = [
  [[0, 76], [2, 76], [4, 79], [8, 76], [10, 74], [12, 72]],
  [[0, 74], [2, 74], [4, 79], [8, 74], [10, 71], [12, 67]],
  [[0, 72], [2, 76], [4, 81], [8, 79], [10, 76], [12, 76], [14, 79]],
  [[0, 77], [4, 76], [6, 74], [8, 72], [12, 74], [14, 76]],
];
const bars = Math.floor((total - 1.8) / 2);   // 1小節 = 2秒（テンポ120）。最後の和音が鳴り終わる間を残す
const uke = [], bass = [], lead = [], bell = [], clap = [];
for (let b = 0; b < bars; b++) {
  const at = b * 4, k = b % 4, intro = b < 2;
  uke.push({ at, chord: chords[k], strum: intro ? "D---D---" : "D-DU-UDU", vel: 0.6 });
  bass.push({ at, pitch: N(roots[k]), vel: 0.7 }, { at: at + 2, pitch: N(roots[k] + 7), vel: 0.55 });
  if (!intro) {
    for (const [p, n] of mel[k]) { lead.push({ at: at + p / 4, pitch: N(n - 12), vel: 0.8 }); }
    const last = mel[k][mel[k].length - 1]; bell.push({ at: at + last[0] / 4, pitch: N(last[1]), vel: 0.5 });
    clap.push({ at: at + 1, vel: 0.5 }, { at: at + 3, vel: 0.5 });
  }
}
const endAt = bars * 4;
uke.push({ at: endAt, chord: "C", strum: { pattern: "down", spread: 25 }, vel: 0.8 });
bass.push({ at: endAt, pitch: "C3", vel: 0.7 }); bell.push({ at: endAt, pitch: "C6", vel: 0.6 });
const sfx = Object.keys(cues).filter((c) => /^step/.test(c)).map((c, i) => ({ at: c, pitch: ["E6", "G6", "C7"][i % 3], vel: 0.8 }));
const score = {
  format: "jinglescript/1", title: "飲ませ方の動画の曲（" + name + "）", tempo: 120, length: { seconds: +total.toFixed(2) }, seed: 1,
  master: { reverb: "room", loudness: -14, fadeOut: 2 }, cues,
  tracks: [
    { instrument: "ukulele", name: "和音", gain: -3, notes: uke },
    { instrument: "marimba", name: "ベース", gain: -4, notes: bass },
    { instrument: "marimba", name: "メロディー", gain: 0, notes: lead },
    { instrument: "glockenspiel", name: "きらきら", gain: -9, notes: bell },
    { instrument: "clap", name: "手拍子", gain: -12, notes: clap.map((c) => ({ ...c, variant: "hands" })) },
    { instrument: "pop", name: "手順の頭", gain: -3, reverb: false, notes: sfx },
    ...(cues.praise ? [{ instrument: "applause", name: "ほめる", gain: -8, notes: [{ at: "praise+1", vel: 0.7 }] }] : []),
  ],
};
fs.writeFileSync(path.join(__dirname, name + ".json"), JSON.stringify(score, null, 1) + "\n");
console.log("書いた:", name + ".json", "長さ", total.toFixed(2), "秒", "小節", bars, JSON.stringify(cues));
