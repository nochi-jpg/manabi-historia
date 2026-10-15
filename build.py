#!/usr/bin/env python3
"""src/ と scenarios/ をまとめて、1ファイルの index.html を作る（Canva・GitHub Pages 用）"""
import json, pathlib, re
R = pathlib.Path(__file__).parent

def fnv(s):
    x = 2166136261
    for ch in "mh:" + s:
        x ^= ord(ch); x = (x * 16777619) & 0xFFFFFFFF
    n, out = x, ""
    digits = "0123456789abcdefghijklmnopqrstuvwxyz"
    while True:
        out = digits[n % 36] + out; n //= 36
        if n == 0: return out

keys = [l.strip() for l in (R/"teacher/keys.txt").read_text(encoding="utf-8").splitlines() if l.strip() and not l.startswith("#")]
hashes = [""] + [fnv(k) for k in keys]
scen = {}
for f in sorted((R/"scenarios").glob("ep*.txt")):
    scen[int(re.search(r"\d+", f.stem).group())] = f.read_text(encoding="utf-8")
data = "window.SCENARIO_SRC=" + json.dumps(scen, ensure_ascii=False) + ";\nwindow.UNLOCK_HASHES=" + json.dumps(hashes) + ";"
html = (R/"src/template.html").read_text(encoding="utf-8")
html = html.replace("/*CSS*/", (R/"src/style.css").read_text(encoding="utf-8"))
html = html.replace("/*DATA*/", data.replace("</", "<\\/"))
html = html.replace("/*JS*/", (R/"src/bg.js").read_text(encoding="utf-8") + "\n" + (R/"src/engine.js").read_text(encoding="utf-8"))
(R/"index.html").write_text(html, encoding="utf-8")
print("index.html", round(len(html.encode())/1024), "KB /", len(scen), "話")
