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
# 2行チェック：セリフ・証言が セリフ枠2行（約37字×2）を こえていないか
def width(t):
    t = re.sub(r"《[^》]+》", "", t).replace("【", "").replace("】", "")
    return sum(0.3 if c == " " else (0.55 if ord(c) < 128 else 1) for c in t)
warn = 0
for no, src in scen.items():
    for ln, line in enumerate(src.splitlines(), 1):
        l = line.strip(); text = None
        m = re.match(r"^[^「（(@#/\-]+?(?:[（(].+?[）)])?「(.*)」$", l)
        if m: text = m.group(1)
        elif l.startswith("＊"): text = l[1:]
        elif l.startswith("- ") and ("|" in l):
            parts = [x.strip() for x in l[2:].split("|")]
            if parts[0] in ("ふつう", "矛盾", "ホント", "ウソ"): text = parts[1]
        if text and width(text) > 72:
            warn += 1; print(f"⚠ 2行こえ ep{no:02d} {ln}行目（{width(text):.0f}字ぶん）: {text[:30]}…")
data = "window.SCENARIO_SRC=" + json.dumps(scen, ensure_ascii=False) + ";\nwindow.UNLOCK_HASHES=" + json.dumps(hashes) + ";"
html = (R/"src/template.html").read_text(encoding="utf-8")
# フォント：ゲームで使う字だけにしぼって埋めこむ（OFL）
import base64, subprocess, tempfile
chars = set()
for f in [R/"src/engine.js", R/"src/template.html", R/"src/bg.js", R/"build.py"]: chars |= set(f.read_text(encoding="utf-8"))
for v in scen.values(): chars |= set(v)
chars |= {chr(c) for c in range(0x20, 0x7f)} | {chr(c) for c in range(0x3041, 0x3097)} | {chr(c) for c in range(0x30a1, 0x30fb)} | set("ー・「」『』、。！？（）…―〜★☆♡◀▶▼")
fcss = ""
for fam, ttf in [("Mincho", "fonts/ShipporiMinchoB1-ExtraBold.ttf"), ("Gothic", "fonts/ZenKakuGothicNew-Bold.ttf")]:
    with tempfile.NamedTemporaryFile(suffix=".woff") as tmp:
        subprocess.run(["pyftsubset", str(R/ttf), "--text=" + "".join(sorted(chars)), "--flavor=woff", "--output-file=" + tmp.name], check=True, capture_output=True)
        fcss += "@font-face{font-family:'%s';src:url(data:font/woff;base64,%s) format('woff')}\n" % (fam, base64.b64encode(open(tmp.name, "rb").read()).decode())
html = html.replace("/*FONTS*/", fcss)
html = html.replace("/*CSS*/", (R/"src/style.css").read_text(encoding="utf-8"))
html = html.replace("/*DATA*/", data.replace("</", "<\\/"))
html = html.replace("/*JS*/", (R/"src/bg.js").read_text(encoding="utf-8") + "\n" + (R/"src/engine.js").read_text(encoding="utf-8"))
(R/"index.html").write_text(html, encoding="utf-8")
print("index.html", round(len(html.encode())/1024), "KB /", len(scen), "話")
