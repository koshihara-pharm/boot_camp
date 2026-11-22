// 飲ませ方の動画「1〜3歳・少しの水で溶かす」を、紙のコマ撮り風で作る（2026-11-17。boot_camp の docs/28）
// 使い方（avatar-video のフォルダで）:
//   node kami/nomase.mjs stills   … 場面ごとに何コマか書き出して、見た目を確かめる（kami/out/n-*.jpg）
//   node kami/nomase.mjs          … 動画を作る（boot_camp/video/kami-toddler-water.mp4）
// 場面の時刻・字幕・読み上げは、今の動画と同じ（boot_camp/tools/douga/cfg/toddler-water.json と work/s1〜s6.wav）
// 絵は work/kn_*.png と kp_*.png（Codex。prompts/20、21）。動かし方は kami/nomase.html
import puppeteer from "puppeteer";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { execFileSync, spawn } from "node:child_process";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { once } from "node:events";

const W = 720, H = 1280, FPS = 24, B = "C:/Users/y0u33/Downloads/boot_camp/", DOUGA = B + "tools/douga/", WORK = DOUGA + "work/", NAME = "toddler-water";
const mode = process.argv[2] ?? "all";
mkdirSync("kami/out", { recursive: true });
const len = (f) => Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString());

// 1. 場面の表（rec.html の決まり: 録画の始まり 0.1秒、場面の長さ = 読み上げ + 1.4秒、最後の画面 3.2秒、声は場面の頭 + 0.4秒）
const cfg = JSON.parse(readFileSync(DOUGA + "cfg/" + NAME + ".json", "utf8"));
const KINDS = ["title", "youi", "tokasu", "nomu", "nomimono", "homeru"];
let t = 0.1; const scenes = [], voices = [];
cfg.scenes.forEach((sc, i) => {
  if (sc.end) { scenes.push({ kind: "owari", start: t, dur: 3.2 }); t += 3.2; return; }
  const d = len(WORK + sc.voice) + 1.4;
  scenes.push({ kind: KINDS[i], start: t, dur: d, cap: sc.cap, big: !!sc.big, step: sc.step || 0 });
  voices.push({ f: WORK + sc.voice, at: t + 0.4 }); t += d;
});
const total = t, at = (k) => scenes.find((s) => s.kind === k).start;
const TL = { total, scenes };
console.log("長さ", total.toFixed(2), "秒 /", scenes.map((s) => `${s.kind}@${s.start.toFixed(2)}`).join(" "));

// 2. 絵を、1コマずつ描いて撮る
const browser = await puppeteer.launch({ headless: true, args: ["--allow-file-access-from-files"] });
const page = await browser.newPage();
page.on("pageerror", (e) => console.log("ページのエラー:", e.message));
await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(resolve("kami/nomase.html")).href);
console.log("絵の大きさと、切り抜いた枠:", JSON.stringify(await page.evaluate((tl) => setup(tl), TL)));
if (mode === "stills") {
  const pts = [["title", 2.5], ["youi", 1.0], ["youi", 3.2], ["tokasu", 1.5], ["tokasu", 4.4], ["tokasu", 5.8], ["tokasu", 8.0], ["nomu", 0.6], ["nomu", 2.4], ["nomimono", 3.0], ["homeru", 0.25], ["homeru", 2.6], ["owari", 1.5]];
  let i = 0; for (const [k, dt] of pts) { await page.evaluate((x) => seek(x), at(k) + dt); await page.screenshot({ path: `kami/out/n-${String(i++).padStart(2, "0")}-${k}.jpg`, type: "jpeg", quality: 85 }); }
  await browser.close(); process.exit(0);
}
const ff = spawn("ffmpeg", ["-v", "error", "-y", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "mjpeg", "-i", "-", "-c:v", "libx264", "-crf", "17", "-pix_fmt", "yuv420p", "kami/out/nomase-gfx.mp4"], { stdio: ["pipe", "inherit", "inherit"] });
const n = Math.round(total * FPS);
for (let f = 0; f < n; f++) {
  await page.evaluate((x) => seek(x), f / FPS);
  if (!ff.stdin.write(await page.screenshot({ type: "jpeg", quality: 94 }))) await once(ff.stdin, "drain");
  if (f % 240 === 0) console.log("撮った", f, "/", n);
}
ff.stdin.end(); await once(ff, "close"); await browser.close();

// 3. 曲: 飲ませ方の動画の曲 A（やさしいウクレレ。boot_camp の tools/douga/jingle/compose.cjs）を、この動画の長さで作る
execFileSync("node", [DOUGA + "jingle/compose.cjs", NAME, "a"], { stdio: "inherit" });
execFileSync("cmd", ["/c", "npx", "-y", "jinglescript@1.2.1", "render", DOUGA + "jingle/" + NAME + "-a.json", "-o", "kami/out/nomase-music.wav"], { stdio: "inherit" });
// 4. 動きに合わせた効果音（JingleScript）: 道具がぽんと出る、粉がさらさら、水がぽたぽた、混ぜる、ごっくん
const y = at("youi"), k = at("tokasu"), nm = at("nomu");
const sfx = {
  format: "jinglescript/1", title: "紙のコマ撮りの効果音", tempo: 120, length: { seconds: +total.toFixed(2) }, seed: 2, master: { reverb: "room", loudness: -24, fadeOut: 0.3 },
  tracks: [
    { instrument: "pop", name: "ぽん", gain: -2, reverb: false, notes: [{ at: { seconds: +(y + 0.5).toFixed(2) }, pitch: "E6", vel: 0.8 }, { at: { seconds: +(y + 1.5).toFixed(2) }, pitch: "G6", vel: 0.8 }] },
    { instrument: "droplet", name: "水", gain: 0, reverb: false, notes: [4.45, 5.15, 5.85].map((d) => ({ at: { seconds: +(k + d).toFixed(2) }, vel: 0.8 })).concat([{ at: { seconds: +(nm + 1.3).toFixed(2) }, vel: 0.9 }]) },
    { instrument: "tapdance", name: "混ぜる音", gain: -8, reverb: false, notes: [7.0, 7.35, 7.7, 8.05, 8.4].map((d) => ({ at: { seconds: +(k + d).toFixed(2) }, vel: 0.5, variant: "toe" })) },
  ],
};
writeFileSync("kami/out/nomase-sfx.json", JSON.stringify(sfx, null, 1));
execFileSync("cmd", ["/c", "npx", "-y", "jinglescript@1.2.1", "render", "kami/out/nomase-sfx.json", "-o", "kami/out/nomase-sfx.wav"], { stdio: "inherit" });

// 5. 絵・曲・効果音・読み上げを1本にする
const MUSIC_DB = process.argv.find((a) => a.startsWith("music:"))?.slice(6) ?? "-7.5", SFX_DB = process.argv.find((a) => a.startsWith("sfx:"))?.slice(4) ?? "-10";
const args = ["-v", "error", "-y", "-i", "kami/out/nomase-gfx.mp4", "-i", "kami/out/nomase-music.wav", "-i", "kami/out/nomase-sfx.wav"];
for (const v of voices) args.push("-i", v.f);
const fc = [`[1:a]volume=${MUSIC_DB}dB[m]`, `[2:a]volume=${SFX_DB}dB[x]`, ...voices.map((v, i) => `[${i + 3}:a]pan=stereo|c0=c0|c1=c0,adelay=${Math.round(v.at * 1000)}:all=1[v${i}]`),
  "[m][x]" + voices.map((_, i) => `[v${i}]`).join("") + `amix=inputs=${voices.length + 2}:normalize=0:duration=longest[a]`].join(";");
args.push("-filter_complex", fc, "-map", "0:v", "-map", "[a]", "-c:v", "libx264", "-crf", "23", "-preset", "medium", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", "-ar", "48000", "-ac", "2", "-t", total.toFixed(2), "-movflags", "+faststart", B + "video/kami-" + NAME + ".mp4");
execFileSync("ffmpeg", args, { stdio: "inherit" });
console.log("できました: boot_camp/video/kami-" + NAME + ".mp4", total.toFixed(1), "秒");
