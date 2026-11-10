// 読み上げの音声を作る。yomi/*.ys（YomiScript で書いた読み方）を、yomiscript（Kokoro）で work/*.wav にする。手順は docs/28
// 使い方: node tools/douga/yomi.cjs          （まだ無いものだけ作る）
//         node tools/douga/yomi.cjs s3 fk1   （名前を書いたものだけ作り直す）
// 初回は yomiscript がモデル（約350MB）を ~/.cache/yomiscript に取ってくる。Windows では音は鳴らず、ファイルに書き出すだけ
const fs = require("fs"), path = require("path"), { execSync } = require("child_process");
const dir = __dirname, work = path.join(dir, "work");
fs.mkdirSync(work, { recursive: true });
const only = process.argv.slice(2);
const names = fs.readdirSync(path.join(dir, "yomi")).filter((f) => f.endsWith(".ys")).map((f) => f.replace(".ys", ""))
  .filter((n) => only.length ? only.includes(n) : !fs.existsSync(path.join(work, n + ".wav")));
if (!names.length) console.log("作るものはありません（作り直すときは名前を書く）");
for (const n of names) {
  const q = (p) => `"${p}"`;
  execSync(`npx -y yomiscript@0.1.6 speak --out ${q(path.join(work, n + ".wav"))} --file ${q(path.join(dir, "yomi", n + ".ys"))}`,
    { stdio: "inherit", env: { ...process.env, YOMISCRIPT_PLAY: "0" } });
}
