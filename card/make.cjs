// 飲ませ方の画像（やり方ごとに1枚）を、card.html から全部作り直す
// 使い方: node card/make.cjs （Windows の Chrome を使う）
// data.js の文を直したら、これを動かす。画像は card/年齢-やり方.png にできる
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const dir = __dirname;
const page = "file:///" + path.join(dir, "card.html").replace(/\\/g, "/");

// data.js の AGE_FLOWS から、年齢とやり方の組み合わせを取り出す
const ctx = {};
vm.runInNewContext(fs.readFileSync(path.join(dir, "..", "data.js"), "utf8") + "\nthis.AGE_FLOWS = AGE_FLOWS;", ctx);

const chrome = (args) => execFileSync(CHROME, ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--virtual-time-budget=6000", ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });

for (const f of ctx.AGE_FLOWS) {
  for (const way of f.groups.flatMap((g) => g.items)) {
    const url = `${page}?age=${f.age}&way=${way}`;
    const h = Number(/data-h="(\d+)"/.exec(chrome(["--window-size=390,844", "--dump-dom", url]))[1]);
    const out = path.join(dir, `${f.age}-${way}.png`);
    chrome(["--force-device-scale-factor=3", `--window-size=390,${h}`, `--screenshot=${out}`, url]);
    console.log(`${f.label} ${way}: ${path.basename(out)}（390×${h} を3倍）`);
  }
}
