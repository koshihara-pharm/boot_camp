// 親に見せる「手元の動画」を作る（2026-11-17。boot_camp の docs/31、docs/28）
// 手元の絵（Codex。prompts/22、23）を画面いっぱいに出して、なめらかに寄る。番号つきの字幕。飾りは入れない
// 使い方（avatar-video のフォルダで）:
//   node kami/temoto.mjs stills name:temoto-water   … 絵ごとに1コマずつ書き出して、見た目を確かめる（kami/out/t-名前-*.jpg）
//   node kami/temoto.mjs all name:temoto-water      … 動画を作る（boot_camp/video/temoto-water.mp4）
//   node kami/temoto.mjs all name:temoto-water music:off … 曲なし
//   node kami/temoto.mjs audio name:temoto-water    … 絵は撮り直さず（kami/out/名前-gfx.mp4 を使う）、曲と声だけ作り直す
// 台本は boot_camp/tools/douga/cfg/temoto-*.json（字幕 cap、読み上げ voice、絵 shots）。場面の時刻の決まりは、今の動画（rec.html）と同じ
// shots の書き方: img = 絵の名前（work/名前.png）。at = 場面の中で、その絵に入れかわる時（場面の長さに対する割合）。
//   focus = 画面のまん中に置く、絵の中の点。z = 寄り方 [はじめ, おわり]。mark = 見てほしい所の輪（絵の中の x, y, 半径。横幅に対する割合）。flip = 左右を逆にする
import puppeteer from "puppeteer";
import { mkdirSync, readFileSync, rmSync } from "node:fs";
import { execFileSync, spawn } from "node:child_process";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { once } from "node:events";

const W = 720, H = 1280, FPS = 30, B = "C:/Users/y0u33/Downloads/boot_camp/", DOUGA = B + "tools/douga/", WORK = DOUGA + "work/";
const NAME = process.argv.find((a) => a.startsWith("name:"))?.slice(5) ?? "temoto-dango";
const mode = process.argv[2] ?? "all";
mkdirSync("kami/out", { recursive: true });
const len = (f) => Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString());

// 1. 場面の表（rec.html の決まり: 録画の始まり 0.1秒、場面の長さ = 読み上げ + 1.4秒、最後の画面 3.2秒、声は場面の頭 + 0.4秒）
const cfg = JSON.parse(readFileSync(DOUGA + "cfg/" + NAME + ".json", "utf8"));
let t = 0.1; const scenes = [], shots = [], voices = [];
for (const sc of cfg.scenes) {
  if (sc.end) { scenes.push({ kind: "end", start: t, dur: 3.2 }); t += 3.2; continue; }
  const d = len(WORK + sc.voice) + 1.4;
  scenes.push({ kind: "step", start: t, dur: d, cap: sc.cap, big: !!sc.big, step: sc.step || 0, label: sc.big ? "薬剤師が教える" : "" });
  for (const s of sc.shots) shots.push({ focus: [0.5, 0.5], z: [1.0, 1.06], ...s, start: t + (s.at || 0) * d });
  voices.push({ f: WORK + sc.voice, at: t + 0.4 }); t += d;
}
const total = t;
shots.forEach((s, i) => { s.len = (shots[i + 1]?.start ?? total) - s.start + 0.45; s.z0 = s.z[0]; s.z1 = s.z[1]; });
const TL = { total, scenes, shots, steps: cfg.steps || Math.max(...scenes.map((s) => s.step || 0)) };
console.log(NAME, "長さ", total.toFixed(2), "秒 /", shots.map((s) => `${s.img}@${s.start.toFixed(2)}`).join(" "));

// 2. 絵を、1コマずつ描いて撮る（「audio」のときは、前に撮った絵を使う）
const gfx = `kami/out/${NAME}-gfx.mp4`, mwav = `kami/out/${NAME}-music.wav`, out = B + "video/" + NAME + ".mp4";
if (mode !== "audio") {
const browser = await puppeteer.launch({ headless: true, args: ["--allow-file-access-from-files"] });
const page = await browser.newPage();
page.on("pageerror", (e) => console.log("ページのエラー:", e.message));
await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(resolve("kami/temoto.html")).href);
await page.evaluate((tl) => setup(tl), TL);
if (mode === "stills") {
  const pts = shots.map((s) => s.start + Math.min(2.2, s.len * 0.6));
  let i = 0; for (const x of pts) { await page.evaluate((v) => seek(v), x); await page.screenshot({ path: `kami/out/t-${NAME}-${String(i++).padStart(2, "0")}.jpg`, type: "jpeg", quality: 85 }); }
  await browser.close(); process.exit(0);
}
const ff = spawn("ffmpeg", ["-v", "error", "-y", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "mjpeg", "-i", "-", "-c:v", "libx264", "-crf", "17", "-pix_fmt", "yuv420p", gfx], { stdio: ["pipe", "inherit", "inherit"] });
const n = Math.round(total * FPS);
for (let f = 0; f < n; f++) {
  await page.evaluate((x) => seek(x), f / FPS);
  if (!ff.stdin.write(await page.screenshot({ type: "jpeg", quality: 94 }))) await once(ff.stdin, "drain");
}
ff.stdin.end(); await once(ff, "close"); await browser.close();
}

// 3. 曲（やさしいウクレレ。小さめ）。「music:off」で曲なし
// 曲の道具（compose.cjs）は、video/名前.mp4 があるとその長さで曲を作るので、先に前の動画を消す
rmSync(out, { force: true });
const MUSIC = process.argv.find((a) => a.startsWith("music:"))?.slice(6) ?? "-12";
const args = ["-v", "error", "-y", "-i", gfx]; let fc = [], mix = "", k = 1;
if (MUSIC !== "off") {
  execFileSync("node", [DOUGA + "jingle/compose.cjs", NAME, "a"], { stdio: "ignore" });
  execFileSync("cmd", ["/c", "npx", "-y", "jinglescript@1.2.1", "render", DOUGA + "jingle/" + NAME + "-a.json", "-o", mwav], { stdio: "ignore" });
  args.push("-i", mwav); fc.push(`[1:a]volume=${MUSIC}dB[m]`); mix = "[m]"; k = 2;
}
// 4. 絵・曲・読み上げを1本にする
for (const v of voices) args.push("-i", v.f);
fc.push(...voices.map((v, i) => `[${i + k}:a]pan=stereo|c0=c0|c1=c0,adelay=${Math.round(v.at * 1000)}:all=1[v${i}]`),
  mix + voices.map((_, i) => `[v${i}]`).join("") + `amix=inputs=${voices.length + k - 1}:normalize=0:duration=longest[a]`);
args.push("-filter_complex", fc.join(";"), "-map", "0:v", "-map", "[a]", "-c:v", "libx264", "-crf", "22", "-preset", "medium", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", "-ar", "48000", "-ac", "2", "-t", total.toFixed(2), "-movflags", "+faststart", out);
execFileSync("ffmpeg", args, { stdio: "inherit" });
console.log("できました: boot_camp/video/" + NAME + ".mp4", total.toFixed(1), "秒");
