// 手元の動画（boot_camp/video/temoto-名前.mp4）に、うさぎの解説（丸い枠）を右上に重ねる（2026-11-17。docs/28）
// うさぎの動きは、kaisetsu/make.mjs で前に作ったもの（kaisetsu/名前-usagi.webm）を使う。台本と時刻が同じなので、口の動きが声に合う
// 使い方（avatar-video のフォルダで）: node kami/temoto_usagi.mjs temoto-toddler-dango
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";

const B = "C:/Users/y0u33/Downloads/boot_camp/", name = process.argv[2] ?? "temoto-toddler-dango", who = "usagi";
const FPS = 30, W = 720, H = 1280;
const R = 100, CX = 606, CY = 196;            // 丸い枠の半径と中心（右上。左上は手順の番号、下は字幕）
const AH = 270, DISC_CY = 915;                // アバターを置くときの高さ。disc.png の丸の中心の高さ（kaisetsu/make.mjs と同じ）
const len = (f) => Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString());
const dim = (f) => execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", f]).toString().trim().split(",").map(Number);

const base = B + `video/${name}.mp4`, webm = `kaisetsu/${name}-${who}.webm`;
if (!existsSync(webm)) throw new Error("うさぎの動きがない。先に node kaisetsu/make.mjs " + name + " usagi");
const total = len(base), [sw, sh] = dim(webm), aw = Math.round((AH * sw / sh) / 2) * 2;
if (Math.abs(len(webm) - total) > 0.3) throw new Error("うさぎの動きと動画の長さが合わない: " + len(webm) + " / " + total);

const ax = Math.round(CX - aw / 2), ay = CY + R - AH + 6;     // アバターの下のふちを、枠の下のふちに合わせる
const cx = CX - ax, cy = CY - ay;
const fadeOut = (total - 3.2 - 0.35).toFixed(2);              // 最後の画面（サイトの名前と URL）の前に消す
const fc =
  `color=c=black@0:s=${W}x${H}:r=${FPS},format=rgba[c];` +
  `[c][1:v]overlay=0:${CY - DISC_CY}:format=auto[d];` +
  `[2:v]scale=${aw}:${AH}:flags=lanczos,format=rgba,geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='alpha(X,Y)*if(lt(Y,${cy})+lte(hypot(X-${cx},Y-${cy}),${R - 3}),1,0)'[av];` +
  `[d][av]overlay=${ax}:${ay}:format=auto,fade=t=in:st=0.15:d=0.35:alpha=1,fade=t=out:st=${fadeOut}:d=0.3:alpha=1[layer];` +
  `[0:v]fps=${FPS}[base];[base][layer]overlay=0:0:shortest=1[vout]`;
const out = B + `video/${name.replace("temoto-", "temoto-usagi-")}.mp4`;            // 「-usagi.mp4」で終わらない名前（GitHub に上がらない）
execFileSync("ffmpeg", ["-v", "error", "-y", "-i", base, "-loop", "1", "-framerate", String(FPS), "-i", "kaisetsu/disc.png", "-c:v", "libvpx-vp9", "-i", webm,
  "-filter_complex", fc, "-map", "[vout]", "-map", "0:a", "-t", String(total), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "22", "-c:a", "copy", "-movflags", "+faststart", out], { stdio: "inherit" });
console.log("できた", out, total.toFixed(1), "秒。うさぎが消える時刻", fadeOut);
