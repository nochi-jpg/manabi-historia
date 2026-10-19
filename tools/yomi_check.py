#!/usr/bin/env python3
"""ふりがなの見直し（ゲームと同じしくみで読みをつけて、あやしい所だけ出す）
使い方：python3 tools/yomi_check.py [話の番号 …]   （番号なしで全部の話）
出すもの：
  ✕ 読みがない漢字
  ？ 2文字以上の漢字のことばが、1字ずつの読みの「つなぎ合わせ」になっている所（例：物語 → 物(もの)語(かた)）
     → 正しければ data/yomi_ok.txt に書く（次から出ない）。まちがいなら data/yomi.txt に ことばごと 足す（例：物語=ものがたり）
※ 1字だけの読み（物=もの など）は、熟語に入ると まちがいやすい。新しい話を書いたら、必ずこれを実行して「？」を0にする"""
import re, sys, pathlib
R = pathlib.Path(__file__).resolve().parent.parent
KJ = re.compile(r"[一-鿿々ヶ]")
Y = {}
for l in (R/"data/yomi.txt").read_text(encoding="utf-8").splitlines():
    l = l.strip()
    if not l or l.startswith("#") or "=" not in l: continue
    k, v = l.split("=", 1); n = 0
    while n < len(k) and KJ.match(k[n]): n += 1
    Y.setdefault(k[0], []).append((k, n, v))
for a in Y.values(): a.sort(key=lambda e: -len(e[0]))   # ゲーム（engine.js autoRuby）と同じ：長いことばから
okf = R/"data/yomi_ok.txt"
OK = {l.strip() for l in okf.read_text(encoding="utf-8").splitlines() if l.strip() and not l.startswith("#")} if okf.exists() else set()
SINGLE = "--1" in sys.argv; sys.argv = [a for a in sys.argv if a != "--1"]   # --1：1字の 漢字の 読みも 一覧にする（新しい話の 見直し用）
eps = sys.argv[1:] or [p.stem[2:] for p in sorted((R/"scenarios").glob("ep*.txt"))]
SKIP = ("//", "@人物", "@BGM", "@SE", "@変装", "@画像", "@背景", "@時ワープ", "@たいせつ g")
bad = {}; none = {}; one = {}
for e in eps:
    f = R/"scenarios"/f"ep{int(e):02d}.txt"
    for ln, line in enumerate(f.read_text(encoding="utf-8").splitlines(), 1):
        if line.startswith(SKIP): continue
        s = line; i = 0
        while i < len(s):
            if not KJ.match(s[i]): i += 1; continue
            j = i
            while j < len(s) and KJ.match(s[j]): j += 1
            if j < len(s) and s[j] == "《": i = j; continue   # 台本で よみを 書いた所
            k = i; segs = []
            while k < j:
                h = next((x for x in Y.get(s[k], []) if s.startswith(x[0], k)), None)
                if h and "|" in h[2]: segs = [f"{h[0]}({h[2]})"]; j = max(j, k + len(h[0])); k += len(h[0]); continue   # かなを はさむ ことば（読みは「|」で 区切る）
                if h and h[1] > 0: segs.append(f"{s[k:k+h[1]]}({h[2]})"); k += h[1]
                else: none.setdefault(s[k], f"ep{int(e):02d}:{ln}"); k += 1
            w = s[i:j]
            if SINGLE and len(segs) == 1 and len(w) == 1: one.setdefault(w + s[j:j+2], segs[0])
            if len(segs) > 1 and w not in OK: bad.setdefault(w, (" ".join(segs), f"ep{int(e):02d}:{ln}"))
            i = j
for c, at in none.items(): print(f"✕ {c}  （{at}）")
for w, (sg, at) in sorted(bad.items(), key=lambda t: t[1][1]): print(f"？ {w} → {sg}  （{at}）")
if SINGLE: print("1字：" + "　".join(f"{v}{k[1:]}" for k, v in sorted(one.items())))
print(f"✕{len(none)} ？{len(bad)}")
