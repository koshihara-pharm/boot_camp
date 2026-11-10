// 飲ませ方の動画を1本作る。手順は docs/28
// 使い方: node tools/douga/make.cjs toddler-water   （名前は cfg/ の中のファイル名）
// rec.html を Chrome（画面なし）で開いて、絵・文・読み上げ・曲を録画し、work/名前.mp4 と video/名前.mp4 に置く
// 先に、絵（work/*.png。Codex で作る）と読み上げ（work/*.wav。yomi.cjs で作る）をそろえておく
const http = require("http"), fs = require("fs"), path = require("path"), { spawn } = require("child_process");

const name = process.argv[2];
const dir = __dirname, work = path.join(dir, "work"), site = path.join(dir, "..", "..", "video");
if (!name || !fs.existsSync(path.join(dir, "cfg", name + ".json"))) {
  console.log("使い方: node tools/douga/make.cjs 名前（cfg にあるもの: " + fs.readdirSync(path.join(dir, "cfg")).map((f) => f.replace(".json", "")).join(", ") + "）");
  process.exit(1);
}
// 足りない絵と読み上げを先に知らせる
const cfg = JSON.parse(fs.readFileSync(path.join(dir, "cfg", name + ".json"), "utf8"));
const need = [...new Set(cfg.scenes.flatMap((s) => [...(s.imgs || [s.img]).map((n) => n + ".png"), ...(s.voice ? [s.voice] : [])]))];
const missing = need.filter((f) => !fs.existsSync(path.join(work, f)));
if (missing.length) { console.log("work/ に足りないもの: " + missing.join(", ")); process.exit(1); }

// Chrome の場所（Windows / Mac / Linux）。CHROME で指定もできる
const CHROME = process.env.CHROME || [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
].find((p) => fs.existsSync(p));
if (!CHROME) { console.log("Chrome が見つかりません。CHROME=Chromeの場所 をつけて動かしてください"); process.exit(1); }

const TYPES = { ".html": "text/html; charset=utf-8", ".json": "application/json", ".png": "image/png", ".wav": "audio/wav" };
let chrome;
const srv = http.createServer((q, r) => {
  const u = decodeURIComponent(q.url.split("?")[0]);
  if (q.method === "POST") {
    const parts = []; q.on("data", (d) => parts.push(d)); q.on("end", () => {
      r.end("ok");
      if (u === "/save") {
        const p = new URL(q.url, "http://x").searchParams;
        const out = path.join(work, name + ".mp4");
        fs.writeFileSync(out, Buffer.concat(parts));
        fixDuration(out, Number(p.get("dur")));
        fs.mkdirSync(site, { recursive: true });
        fs.copyFileSync(out, path.join(site, name + ".mp4"));
        console.log(`できました: video/${name}.mp4（${(fs.statSync(out).size / 1e6).toFixed(1)}MB、${Number(p.get("dur")).toFixed(1)}秒）`);
      } else console.log("録画のページでエラー: " + Buffer.concat(parts).toString());
      chrome.kill(); srv.close(); process.exit(u === "/save" ? 0 : 1);
    });
    return;
  }
  const fp = path.join(dir, u);
  if (!fp.startsWith(dir)) { r.writeHead(403); r.end(); return; }
  fs.readFile(fp, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { "Content-Type": TYPES[path.extname(fp)] || "application/octet-stream" }); r.end(d); });
}).listen(0, () => {
  const port = srv.address().port;
  chrome = spawn(CHROME, ["--headless=new", "--autoplay-policy=no-user-gesture-required", "--user-data-dir=" + path.join(work, ".chrome"), "--window-size=720,1280", `http://localhost:${port}/rec.html?cfg=${name}`], { stdio: "ignore" });
  console.log(`録画中: ${name}（動画の長さと同じくらいかかります）`);
});
setTimeout(() => { console.log("時間切れ（3分）"); chrome && chrome.kill(); process.exit(1); }, 180000);

// Chrome の録画（MediaRecorder）の MP4 は、長さが 0 と書かれている。長さの欄だけを正しい秒数に書きかえる（ファイルの大きさは変えない）
function fixDuration(f, sec) {
  const b = fs.readFileSync(f);
  const moov = b.indexOf("moov") - 4, end = moov + b.readUInt32BE(moov);
  let movieTs = 0;
  const set = (off, v, units) => { if (v) b.writeBigUInt64BE(BigInt(Math.round(units)), off); else b.writeUInt32BE(Math.round(units), off); };
  (function walk(o, e) {
    while (o < e) {
      const s = b.readUInt32BE(o), t = b.toString("latin1", o + 4, o + 8), v = b[o + 8], p = o + 12;
      if (t === "mvhd") { movieTs = b.readUInt32BE(p + (v ? 16 : 8)); set(p + (v ? 20 : 12), v, sec * movieTs); }
      if (t === "tkhd") set(p + (v ? 24 : 16), v, sec * movieTs);
      if (t === "mdhd") set(p + (v ? 20 : 12), v, sec * b.readUInt32BE(p + (v ? 16 : 8)));
      if (["moov", "trak", "mdia"].includes(t)) walk(o + 8, o + s);
      o += s;
    }
  })(moov + 8, end);
  fs.writeFileSync(f, b);
}
