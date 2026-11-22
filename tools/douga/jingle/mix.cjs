// JingleScript で作った曲（work/jingle-名前.wav）を、動画（video/名前-usagi.mp4）の絵に重ねて、聞き比べ用の動画を作る。試し（docs/28）
// 使い方: node tools/douga/jingle/mix.cjs baby-spoit       → video/try-jingle-baby-spoit.mp4（GitHub に上げない名前）
//        node tools/douga/jingle/mix.cjs baby-spoit v2 -13 → 曲は work/jingle-baby-spoit-v2.wav、曲の大きさは -13dB、出力は video/try-jingle-baby-spoit-v2.mp4
// 音は、新しい曲（-15dB）と、もとの読み上げ（work/*.wav を、動画と同じ時刻に置く）。大きさは、今の動画に合わせてある（声の平均 -22dB、曲だけの所 -33〜-29dB）
const fs = require("fs"), path = require("path"), { execFileSync } = require("child_process");
const name = process.argv[2], ver = process.argv[3] ? "-" + process.argv[3] : "", gain = process.argv[4] || "-15", dir = path.join(__dirname, ".."), root = path.join(dir, "..", "..");
const cfg = JSON.parse(fs.readFileSync(path.join(dir, "cfg", name + ".json"), "utf8"));
const len = (f) => Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString());
const usagi = path.join(root, "video", name + "-usagi.mp4");
const video = fs.existsSync(usagi) ? usagi : path.join(root, "video", name + ".mp4"), music =path.join(dir, "work", "jingle-" + name + ver + ".wav");
// 声が入る時刻（rec.html の決まり: 録画の始まり 0.1秒、場面の頭の間 0.4秒、声のあと 1.0秒）
let t = 0.1; const voices = [];
for (const sc of cfg.scenes) { if (!sc.voice) continue; const f = path.join(dir, "work", sc.voice); voices.push({ f, ms: Math.round((t + 0.4) * 1000) }); t += sc.dur || len(f) + 1.4; }
const args = ["-v", "error", "-y", "-i", video, "-i", music];
for (const v of voices) args.push("-i", v.f);
const fc = ["[1:a]volume=" + gain + "dB[m]", ...voices.map((v, i) => `[${i + 2}:a]pan=stereo|c0=c0|c1=c0,adelay=${v.ms}:all=1[v${i}]`),
  "[m]" + voices.map((_, i) => `[v${i}]`).join("") + `amix=inputs=${voices.length + 1}:normalize=0:duration=longest[a]`].join(";");
const out = path.join(root, "video", "try-jingle-" + name + ver + ".mp4");
args.push("-filter_complex", fc, "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "160k", "-ar", "48000", "-ac", "2", "-t", String(len(video)), "-movflags", "+faststart", out);
execFileSync("ffmpeg", args, { stdio: "inherit" });
console.log("できました: video/try-jingle-" + name + ver + ".mp4", "曲", gain + "dB", "声の時刻", voices.map((v) => (v.ms / 1000).toFixed(2)).join(" "));
