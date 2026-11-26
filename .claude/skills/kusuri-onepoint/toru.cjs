// 叩きのページを、スマホの幅（390px）で撮る。スキル kusuri-onepoint の道具。
// 使い方: node .claude/skills/kusuri-onepoint/toru.cjs <叩きの HTML> <出す PNG> [高さ]
// Chrome は窓の幅を 500px より細くできないので、幅 390px の枠（iframe）の中にページを入れて撮る。
// 叩きの HTML は、Artifact に出す形（<title> から始まり、<html> や <body> を書かない）でよい。絵（img/...）は、リポジトリのいちばん上から読む。
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const { pathToFileURL } = require("url");

const [src, out, h] = process.argv.slice(2);
if (!src || !out) { console.error("使い方: node toru.cjs <叩きの HTML> <出す PNG> [高さ]"); process.exit(1); }
const height = Number(h) || 2400;
const root = path.resolve(__dirname, "..", "..", "..");

const chrome = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
].find((p) => p && fs.existsSync(p));
if (!chrome) { console.error("Chrome が見つからない。CHROME_PATH に場所を入れる"); process.exit(1); }

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "tataki-"));
const body = fs.readFileSync(src, "utf8");
// Artifact が足す土台と同じもの。<base> で、絵をリポジトリのいちばん上から読む
fs.writeFileSync(path.join(dir, "view.html"),
  `<!doctype html><html lang="ja"><head><meta charset="utf8"><base href="${pathToFileURL(root + path.sep).href}">` +
  `<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">` +
  `<style>:root{color-scheme:light;box-sizing:border-box}body{margin:0;padding:0;font:14px sans-serif;background:#fff;color:#000}img{max-width:100%}</style></head><body>\n${body}\n</body></html>`);
fs.writeFileSync(path.join(dir, "host.html"),
  `<!doctype html><html><body style="margin:0;background:#fff4f6"><iframe src="view.html" style="display:block;border:0;width:390px;height:${height}px;margin:0 auto"></iframe></body></html>`);

const png = path.resolve(out);
const r = spawnSync(chrome, ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--allow-file-access-from-files",
  "--virtual-time-budget=4000", `--window-size=500,${height}`, `--screenshot=${png}`, pathToFileURL(path.join(dir, "host.html")).href], { stdio: "ignore" });
fs.rmSync(dir, { recursive: true, force: true });
if (r.status !== 0 || !fs.existsSync(png)) { console.error("撮れなかった"); process.exit(1); }
console.log("撮った: " + png + "（幅 390px の枠、高さ " + height + "px）");
