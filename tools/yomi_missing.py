#!/usr/bin/env python3
"""ふりがな辞書（data/yomi.txt）で読めない漢字を、前後の文字といっしょに一覧にする"""
import re, pathlib, collections
R = pathlib.Path(__file__).resolve().parent.parent
KJ = re.compile(r"[一-鿿々ヶ]")
ymap = {}
for line in (R/"data/yomi.txt").read_text(encoding="utf-8").splitlines():
    if not line.strip() or line.startswith("#"): continue
    k, v = line.split("=", 1); n = 0
    while n < len(k) and KJ.match(k[n]): n += 1
    ymap.setdefault(k[0], []).append((k, n))
for k in ymap: ymap[k].sort(key=lambda t: -len(t[0]))
out = collections.OrderedDict()
for f in sorted((R/"scenarios").glob("*.txt")):
    for line in f.read_text(encoding="utf-8").splitlines():
        if line.startswith(("//", "@", "#")): continue
        t = re.sub(r"[一-鿿々ヶ]+《[^》]+》", "", line)
        t = re.sub(r"人[:：](おとこ|おんな|こども|としより)", "", t)
        i = 0
        while i < len(t):
            if KJ.match(t[i]):
                hit = next((e for e in ymap.get(t[i], []) if t.startswith(e[0], i)), None)
                if hit: i += hit[1]; continue
                j = i
                while j < len(t) and KJ.match(t[j]): j += 1
                out.setdefault(t[i:j], set()).add(t[j:j+2]); i = j; continue
            i += 1
for w, c in out.items(): print(w, " ".join(sorted(c)))
