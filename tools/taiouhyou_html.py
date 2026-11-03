# docs/24_junbichu_taiouhyou.md（準備中の薬の対応表）から、スマホで見る HTML（docs/junbichu_taiouhyou.html）を作る。
# 表はいつも docs/24 が元。docs/24 を書き足したら、これを動かして HTML を作り直す: python3 tools/taiouhyou_html.py
import json, re, sys, html, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "docs", "24_junbichu_taiouhyou.md")
OUT = os.path.join(ROOT, "docs", "junbichu_taiouhyou.html")

md = open(SRC, encoding="utf-8").read()

rows = []
for m in re.finditer(r"^\| (\d+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]*) \|$", md, re.M):
    rk, name, ing, cat, src, status, memo = [x.strip() for x in m.groups()]
    rows.append(dict(rank=int(rk), name=name, ing=ing, cat=cat, src=src, status=status, memo=memo))

cards = {}
for m in re.finditer(r"^### (.+?)\n(.*?)(?=^### |\Z)", md, re.M | re.S):
    fields = {}
    for fm in re.finditer(r"^- ([^:：]+)[:：] ?(.*)$", m.group(2), re.M):
        fields[fm.group(1).strip()] = fm.group(2).strip()
    cards[m.group(1).strip()] = fields

for r in rows:
    r["card"] = cards.get(r["name"], {})

m = re.search(r"\((\d{4}-\d{2}-\d{2})", md)
updated = m.group(1) if m else ""
data = json.dumps(rows, ensure_ascii=False)

page = open(os.path.join(ROOT, "tools", "taiouhyou_template.html"), encoding="utf-8").read()
page = page.replace("__DATA__", data).replace("__COUNT__", str(len(rows)))
open(OUT, "w", encoding="utf-8").write(page)
print("wrote", OUT, len(rows), "rows,", sum(1 for r in rows if r["card"]), "cards")
