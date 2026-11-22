#!/bin/bash
# 手元の動画を、名前ごとに最後まで作る（絵の動画 → うさぎの動き → うさぎを重ねる）。使い方（avatar-video のフォルダで）: bash kami/temoto_all.sh temoto-water temoto-fukuro
for n in "$@"; do
  node kami/temoto.mjs all name:$n 2>&1 | grep -E "長さ|できました|エラー|Error" | cut -c1-160
  node kaisetsu/make.mjs $n usagi 2>&1 | grep -E "アバターができた|Error|エラー" | cut -c1-120
  node kami/temoto_usagi.mjs $n 2>&1 | tail -1
done
