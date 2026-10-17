#!/usr/bin/env python3
"""src/ と scenarios/ をまとめて、1ファイルの index.html を作る（Canva・GitHub Pages 用）"""
import json, base64, pathlib, re
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
            elif len(parts) == 5: text = parts[3]   # 調査：「／」区切りのセリフ
        for seg in (re.split(r"\s*／\s*", text) if text else []):
            seg = re.sub(r"^(.+?)[：:]", "", seg) if re.match(r"^[^＊*]{1,6}[：:]", seg) else seg.lstrip("＊*")
            if width(seg) > 72:
                warn += 1; print(f"⚠ 2行こえ ep{no:02d} {ln}行目（{width(seg):.0f}字ぶん）: {seg[:30]}…")
data = "window.SCENARIO_SRC=" + json.dumps(scen, ensure_ascii=False) + ";\nwindow.UNLOCK_HASHES=" + json.dumps(hashes) + ";"
# 顔グラ：art/名前_表情.webp を window.ART に埋めこむ
art = {}
for f in sorted((R/"art").glob("*.webp")):
    nm, ex = f.stem.rsplit("_", 1)
    art.setdefault(nm, {})[ex] = "data:image/webp;base64," + __import__("base64").b64encode(f.read_bytes()).decode()
data += "\nwindow.ART=" + json.dumps(art) + ";"
# ふりがな辞書（data/yomi.txt）：[ことば, 漢字部分の長さ, よみ]
KJ = re.compile(r"[\u4E00-\u9FFF\u3005\u30F6]")
yomi = []
for line in (R/"data/yomi.txt").read_text(encoding="utf-8").splitlines():
    if not line.strip() or line.startswith("#"): continue
    k, v = line.split("=", 1); n = 0
    while n < len(k) and KJ.match(k[n]): n += 1
    yomi.append([k, n, v])
data += "\nwindow.YOMI=" + json.dumps(yomi, ensure_ascii=False) + ";"
# ふりがなが つかない 漢字が ないか 調べる
ymap = {}
for k, n, v in yomi: ymap.setdefault(k[0], []).append((k, n, v))
for k in ymap: ymap[k].sort(key=lambda t: -len(t[0]))
miss = set()
for src in scen.values():
    for line in src.splitlines():
        if line.startswith(("//", "@", "#")): continue
        t = re.sub(r"[\u4E00-\u9FFF\u3005\u30F6]+《[^》]+》", "", line)
        t = re.sub(r"人[:：](おとこ|おんな|こども|としより)", "", t)
        i = 0
        while i < len(t):
            if KJ.match(t[i]):
                hit = next((e for e in ymap.get(t[i], []) if t.startswith(e[0], i)), None)
                if hit: i += hit[1]; continue
                miss.add(t[i])
            i += 1
if miss: print("⚠ ふりがな辞書にない漢字:", "".join(sorted(miss)))
# あいことば（★5のときだけ表示）：teacher/aikotoba.md の表から。そのままは読めないように 逆順＋base64 にする
ak = {}
for line in (R/"teacher/aikotoba.md").read_text(encoding="utf-8").splitlines():
    m = re.match(r"\|\s*(\d+)\s*\|[^|]*\|[^|]*\|\s*([ぁ-ゖー]+)\s*\|", line)
    if m and int(m.group(1)) > 0: ak[int(m.group(1))] = m.group(2)
data += "\nwindow.AIKOTOBA=" + json.dumps([base64.b64encode(ak.get(i, "")[::-1].encode()).decode() for i in range(1, max(ak) + 1)]) + ";"
# BGM：data/bgm.txt の一覧どおり audio/bgm/〇〇.ogg を埋めこむ（ファイルがない曲は、音なしになる）
bgm, bgm_list = {}, []
for line in (R/"data/bgm.txt").read_text(encoding="utf-8").splitlines():
    if not line.strip() or line.startswith("#"): continue
    key, f, title, ls, ll, use = [x.strip() for x in line.split("|")]
    bgm_list.append(title)
    fp = R/"audio/bgm"/(f + ".ogg")
    if fp.exists(): bgm[key] = {"ls": int(ls) / 44100, "le": (int(ls) + int(ll)) / 44100, "d": base64.b64encode(fp.read_bytes()).decode()}
    else: print("⚠ BGMなし:", key, f)
data += "\nwindow.BGM_DATA=" + json.dumps(bgm, ensure_ascii=False) + ";\nwindow.BGM_TITLES=" + json.dumps(bgm_list, ensure_ascii=False) + ";"
# 効果音：data/se.txt の一覧どおり audio/se/呼び名.ogg を埋めこむ（ないものは合成の音）
se = {}
for line in (R/"data/se.txt").read_text(encoding="utf-8").splitlines():
    if not line.strip() or line.startswith("#"): continue
    key, f, st, du, vol, use = [x.strip() for x in line.split("|")]
    fp = R/"audio/se"/(key + ".ogg")
    if fp.exists(): se[key] = {"v": float(vol), "d": base64.b64encode(fp.read_bytes()).decode()}
data += "\nwindow.SE_DATA=" + json.dumps(se) + ";"
html = (R/"src/template.html").read_text(encoding="utf-8")
# フォント：ゲームで使う字だけにしぼって埋めこむ（OFL）
import base64, subprocess, tempfile
chars = set()
for f in [R/"src/engine.js", R/"src/fx.js", R/"src/template.html", R/"src/bg.js", R/"build.py", R/"data/bgm.txt"]: chars |= set(f.read_text(encoding="utf-8"))
for v in scen.values(): chars |= set(v)
chars |= {chr(c) for c in range(0x20, 0x7f)} | {chr(c) for c in range(0x3041, 0x3097)} | {chr(c) for c in range(0x30a1, 0x30fb)} | set("ー・「」『』、。！？（）…―〜★☆♡◀▶▼")
fcss = ""
for fam, ttf in [("G500", "fonts/ZenKakuGothicNew-Medium.ttf"), ("G700", "fonts/ZenKakuGothicNew-Bold.ttf"), ("G900", "fonts/ZenKakuGothicNew-Black.ttf")]:
    with tempfile.NamedTemporaryFile(suffix=".woff") as tmp:
        subprocess.run(["pyftsubset", str(R/ttf), "--text=" + "".join(sorted(chars)), "--flavor=woff", "--output-file=" + tmp.name], check=True, capture_output=True)
        fcss += "@font-face{font-family:'Gothic';font-weight:%s;src:url(data:font/woff;base64,%s) format('woff')}\n" % (fam[1:], base64.b64encode(open(tmp.name, "rb").read()).decode())
html = html.replace("/*FONTS*/", fcss)
html = html.replace("/*CSS*/", (R/"src/style.css").read_text(encoding="utf-8"))
html = html.replace("/*DATA*/", data.replace("</", "<\\/"))
html = html.replace("/*JS*/", (R/"src/bg.js").read_text(encoding="utf-8") + "\n" + (R/"src/fx.js").read_text(encoding="utf-8") + "\n" + (R/"src/engine.js").read_text(encoding="utf-8"))
(R/"index.html").write_text(html, encoding="utf-8")
print("index.html", round(len(html.encode())/1024), "KB /", len(scen), "話")
