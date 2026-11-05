// 飲ませ方の画像（やり方ごとに1枚）と、薬ごとの画像を、card.html から全部作り直す
// 使い方: node card/make.cjs （Windows の Chrome を使う）
// data.js の文を直したら、これを動かす。画像は card/年齢-やり方.png と card/drug/薬の名前.png にできる
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const dir = __dirname;
const page = "file:///" + path.join(dir, "card.html").replace(/\\/g, "/");

// data.js の AGE_FLOWS から、年齢とやり方の組み合わせを取り出す
const ctx = {};
vm.runInNewContext(fs.readFileSync(path.join(dir, "..", "data.js"), "utf8") + "\nthis.AGE_FLOWS = AGE_FLOWS; this.DRUGS = DRUGS;", ctx);

const chrome = (args) => execFileSync(CHROME, ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--virtual-time-budget=6000", ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });

// 中身の高さを測ってから、幅 390 を3倍の大きさで画像にする
function shot(url, out) {
  const h = Number(/data-h="(\d+)"/.exec(chrome(["--window-size=390,844", "--dump-dom", url]))[1]);
  chrome(["--force-device-scale-factor=3", `--window-size=390,${h}`, `--screenshot=${out}`, url]);
  return h;
}

for (const f of ctx.AGE_FLOWS) {
  for (const way of f.groups.flatMap((g) => g.items)) {
    const out = path.join(dir, `${f.age}-${way}.png`);
    const h = shot(`${page}?age=${f.age}&way=${way}`, out);
    console.log(`${f.label} ${way}: ${path.basename(out)}（390×${h} を3倍）`);
  }
}

// 薬ごとの画像（2026-11-05 ユーザーと決定。サイトに入っている薬すべて）。ファイル名は薬の名前
fs.mkdirSync(path.join(dir, "drug"), { recursive: true });
ctx.DRUGS.forEach((d, i) => {
  const out = path.join(dir, "drug", `${d.name}.png`);
  const h = shot(`${page}?drug=${i}`, out);
  console.log(`${d.name}: drug/${path.basename(out)}（390×${h} を3倍）`);
});
