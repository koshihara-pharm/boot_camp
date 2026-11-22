# 紙のコマ撮り風の動画の道具（控え）

このフォルダは**控え**です。動かすのは、リポジトリの外の `Downloads/avatar-video/kami/` のほうです（ページを1コマずつ撮る puppeteer が、そちらのフォルダに入っているため）。

- `page.html`: 絵を切り抜いて重ね、`seek(t)` で t 秒の1コマを描く
- `make.mjs`: 1コマずつ撮って動画にし、JingleScript の曲と yomiscript のかけ声を重ねる

作り方と手順は [docs/28_douga_tsukurikata.md](../../../docs/28_douga_tsukurikata.md) の「今ある道具で、紙のコマ撮り風の5秒」。

`avatar-video/kami/` を直したら、ここにも写してください。

```bash
cp ../avatar-video/kami/page.html ../avatar-video/kami/make.mjs tools/douga/kami/
```

## 親に見せる「手元の動画」（temoto）

- `temoto.html`: 手元の絵を画面いっぱいに出して、ゆっくり寄る。番号つきの字幕、見てほしい所の輪
- `temoto.mjs`: cfg と読み上げから場面の表を作り、1コマずつ撮って動画にする

作り方は docs/28 の「生成した絵で『手元の動画』」、考え方は docs/31。

- `temoto_usagi.mjs`: 手元の動画に、うさぎの解説（丸い枠）を右上に重ねる
- `temoto_all.sh`: 1本を最後まで作る（絵の動画 → うさぎの動き → うさぎを重ねる）
- 台本は tools/douga/cfg/temoto-*.json、絵の指示は tools/douga/prompts/22、23

```bash
cp ../avatar-video/kami/temoto.html ../avatar-video/kami/temoto.mjs ../avatar-video/kami/temoto_usagi.mjs ../avatar-video/kami/temoto_all.sh tools/douga/kami/
```
