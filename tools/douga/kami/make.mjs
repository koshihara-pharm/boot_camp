// 紙のコマ撮り風の5秒の動画を作る（2026-11-17。boot_camp の docs/28 の「今ある道具で、紙のコマ撮り風の5秒」）
// 使い方（avatar-video のフォルダで）:
//   node kami/make.mjs stills   … 何コマか書き出して、見た目を確かめる（kami/out/still-*.jpg）
//   node kami/make.mjs          … 動画を作る（boot_camp/video/kami-5byou.mp4）
// 絵は boot_camp/tools/douga/work/kp_*.png（Codex。prompts/20_kami_5byou.txt）。動かし方は kami/page.html
// 音は、JingleScript の短い曲と、yomiscript のかけ声（work/gq_seno・gq_gokkun・gq_dekita.wav）
import puppeteer from "puppeteer";
import { mkdirSync, writeFileSync } from "node:fs";
import { execFileSync, spawn } from "node:child_process";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { once } from "node:events";

const W = 1280, H = 720, FPS = 24, DUR = 5, B = "C:/Users/y0u33/Downloads/boot_camp/", WORK = B + "tools/douga/work/";
const mode = process.argv[2] ?? "all";
mkdirSync("kami/out", { recursive: true });

const browser = await puppeteer.launch({ headless: true, args: ["--allow-file-access-from-files"] });
const page = await browser.newPage();
page.on("pageerror", (e) => console.log("ページのエラー:", e.message));
await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(resolve("kami/page.html")).href);
console.log("絵の大きさと、切り抜いた枠:", JSON.stringify(await page.evaluate(() => setup())));
if (mode === "stills") {
  for (const t of [0.3, 1.0, 1.62, 1.9, 2.6, 3.3, 3.55, 4.2, 4.9]) { await page.evaluate((x) => seek(x), t); await page.screenshot({ path: `kami/out/still-${t.toFixed(2)}.jpg`, type: "jpeg", quality: 88 }); }
  await browser.close(); process.exit(0);
}
const ff = spawn("ffmpeg", ["-v", "error", "-y", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "mjpeg", "-i", "-", "-c:v", "libx264", "-crf", "16", "-pix_fmt", "yuv420p", "kami/out/gfx.mp4"], { stdio: ["pipe", "inherit", "inherit"] });
for (let f = 0; f < DUR * FPS; f++) {
  await page.evaluate((x) => seek(x), f / FPS);
  if (!ff.stdin.write(await page.screenshot({ type: "jpeg", quality: 95 }))) await once(ff.stdin, "drain");
}
ff.stdin.end(); await once(ff, "close"); await browser.close();

// 曲（JingleScript）: せーの（のぼる音）→ ごっくん（止まって、水の音）→ できた！（ベル、きらきら、手を3回たたく）
const score = {
  format: "jinglescript/1", title: "紙のコマ撮り風の5秒", tempo: 120, length: { seconds: DUR }, seed: 1, master: { reverb: "room", loudness: -18, fadeOut: 0.5 },
  cues: { a: { seconds: 0.2 }, b: { seconds: 1.7 }, c: { seconds: 3.2 } },
  tracks: [
    { instrument: "ukulele", name: "ウクレレ", gain: -7, notes: [{ at: "a", chord: "C", strum: { pattern: "down", spread: 25 }, vel: 0.5 }, { at: "a+1", chord: "G", strum: "D-DU", vel: 0.45 }, { at: "b", chord: "F", strum: { pattern: "down", spread: 30 }, vel: 0.5 }, { at: "c", chord: "C", strum: "D-DU-UDU", vel: 0.55 }] },
    { instrument: "marimba", name: "ベース", gain: -5, notes: [{ at: "a", pitch: "C3", vel: 0.6 }, { at: "a+1", pitch: "G2", vel: 0.55 }, { at: "b", pitch: "F2", vel: 0.7 }, { at: "c", pitch: "C3", vel: 0.7 }, { at: "c+2", pitch: "G2", vel: 0.5 }] },
    { instrument: "glockenspiel", name: "のぼる音ときらきら", gain: -3, notes: [{ at: "a+1", pitch: "G5", vel: 0.5 }, { at: "a+1.5", pitch: "A5", vel: 0.55 }, { at: "a+2", pitch: "B5", vel: 0.6 }, { at: "a+2.5", pitch: "D6", vel: 0.7 }, { at: "b+1", pitch: "C6", vel: 0.5 }, { at: "b+1.5", pitch: "A5", vel: 0.5 }, { at: "b+2", pitch: "F5", vel: 0.5 },
      { at: "c", pitch: "C6", vel: 0.75 }, { at: "c+0.25", pitch: "E6", vel: 0.75 }, { at: "c+0.5", pitch: "G6", vel: 0.75 }, { at: "c+0.75", pitch: "C7", vel: 0.8 }] },
    { instrument: "droplet", name: "水の音", gain: -2, reverb: false, notes: [{ at: "b+0.3", vel: 0.9 }] },
    { instrument: "ding", name: "ベル", gain: -6, notes: [{ at: "c", vel: 0.7 }] },
    { instrument: "clap", name: "手をたたく", gain: -1, notes: [{ at: "c+1", vel: 0.6, variant: "hands" }, { at: "c+1.66", vel: 0.6, variant: "hands" }, { at: "c+2.33", vel: 0.6, variant: "hands" }] },
  ],
};
writeFileSync("kami/out/score.json", JSON.stringify(score, null, 1));
execFileSync("cmd", ["/c", "npx", "-y", "jinglescript@1.2.1", "render", "kami/out/score.json", "-o", "kami/out/music.wav"], { stdio: "inherit" });

// 絵・曲・かけ声を1本にする（かけ声は、文字が出る時刻に合わせる）
const P = "pan=stereo|c0=c0|c1=c0";
execFileSync("ffmpeg", ["-v", "error", "-y", "-i", "kami/out/gfx.mp4", "-i", "kami/out/music.wav", "-i", WORK + "gq_seno.wav", "-i", WORK + "gq_gokkun.wav", "-i", WORK + "gq_dekita.wav",
  "-filter_complex", `[1:a]volume=-7dB[m];[2:a]${P},adelay=450:all=1[v0];[3:a]${P},adelay=1750:all=1[v1];[4:a]${P},adelay=3250:all=1[v2];[m][v0][v1][v2]amix=inputs=4:normalize=0:duration=longest[a]`,
  "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "160k", "-ar", "48000", "-ac", "2", "-t", String(DUR), "-movflags", "+faststart", B + "video/kami-5byou.mp4"], { stdio: "inherit" });
console.log("できました: boot_camp/video/kami-5byou.mp4");
