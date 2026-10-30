#!/usr/bin/env python3
"""Canva 配信版を作る（GitHub版が できてから）。
使い方： python3 build.py → python3 tools/make_canva.py  → canva.html（20MB 以内・ダウンロード配布用）。--10mb で canva_10mb.html（Canva に じかに 上げる用・音質が 落ちる）
index.html の 画像・音を 軽く して、window.CANVA=true（クレジット K.nom・1日 5シナリオの スタミナ）を 入れる。
軽く した ものは .cache_canva/ に 覚えておくので、2回目からは 速い。"""
import re, json, base64, hashlib, io, pathlib, subprocess, tempfile
from PIL import Image
R = pathlib.Path(__file__).resolve().parent.parent
CACHE = R/".cache_canva"; CACHE.mkdir(exist_ok=True)
import sys
SMALL = "--10mb" in sys.argv   # Canva に じかに 上げる 10MB 版（音質は かなり 落ちる）。ふだんは 20MB 版（音は GitHub版と 同じ）
LIMIT = (10 if SMALL else 20) * 1000 * 1000
# 大きさと 画質（LIMIT に おさまるよう ここで 調整する）。音の kbps が None なら 作りなおさない（GitHub版と 同じ 音）
if SMALL:
    BG, FACE, PIC, CARD = (800, 446, 30), (240, 40), (360, 45), (224, 166, 30)
    BGM_KBPS, SE_KBPS = "7k", "16k"
else:
    BG, FACE, PIC, CARD = (1120, 625, 44), (300, 58), (440, 58), (256, 190, 46)
    BGM_KBPS, SE_KBPS = None, None

def cached(key, make):
    fp = CACHE/(hashlib.md5(key.encode()).hexdigest() + ".b64")
    if not fp.exists(): fp.write_text(make())
    return fp.read_text()

def img(uri, w, h, q, fit="contain"):
    def make():
        im = Image.open(io.BytesIO(base64.b64decode(uri.split(",", 1)[1])))
        im = im.convert("RGBA") if im.mode in ("RGBA", "LA", "P") else im.convert("RGB")
        if fit == "cover":
            s = max(w / im.width, h / im.height)
            im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
            l, t = (im.width - w) // 2, (im.height - h) // 2; im = im.crop((l, t, l + w, t + h))
        else:
            im.thumbnail((w, h), Image.LANCZOS)
        b = io.BytesIO(); im.save(b, "WEBP", quality=q, method=6)
        return "data:image/webp;base64," + base64.b64encode(b.getvalue()).decode()
    return cached(f"img{w}x{h}q{q}{fit}" + uri[-200:] + str(len(uri)), make)

def audio(b64, kbps):
    def make():
        with tempfile.TemporaryDirectory() as d:
            src, dst = pathlib.Path(d)/"a.ogg", pathlib.Path(d)/"b.ogg"
            src.write_bytes(base64.b64decode(b64))
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(src), "-ac", "1", "-c:a", "libopus", "-b:a", kbps, "-vbr", "constrained", "-application", "audio", str(dst)], check=True)
            return base64.b64encode(dst.read_bytes()).decode()
    return cached(f"aud{kbps}" + b64[-200:] + str(len(b64)), make)

html = (R/"index.html").read_text(encoding="utf-8")
def block(name):
    m = re.search(r"window\." + name + r"=(\{.*?\});(?=\n|</script>)", html, re.S)
    return m, json.loads(m.group(1))
def put(name, obj):
    global html
    m, _ = block(name)
    html = html[:m.start(1)] + json.dumps(obj, ensure_ascii=False) + html[m.end(1):]

_, art = block("ART")
for nm, ex in art.items():
    for e, v in ex.items():
        if not isinstance(v, str) or not v.startswith("data:image"): continue
        big = bool(re.match(r"^(frag|title|objlogo|nafuda|radio|inoshishi|niguruma|iconflag|g(?!enpaku|youki))", nm))   # 顔グラ 以外の 大きい 絵
        ex[e] = img(v, PIC[0], PIC[0], PIC[1]) if big else img(v, FACE[0], FACE[0], FACE[1])
put("ART", art)
_, bg = block("BGIMG")
put("BGIMG", {k: img(v, BG[0], BG[1], BG[2], "cover") for k, v in bg.items()})
_, ci = block("CARDIMG")
put("CARDIMG", {k: [img(v[0], CARD[0], CARD[1], CARD[2], "cover"), v[1]] for k, v in ci.items()})
_, bgm = block("BGM_DATA")
put("BGM_DATA", {k: dict(v, d=audio(v["d"], BGM_KBPS)) if BGM_KBPS else v for k, v in bgm.items()})
_, se = block("SE_DATA")
put("SE_DATA", {k: dict(v, d=audio(v["d"], SE_KBPS)) if SE_KBPS else v for k, v in se.items()})
if SMALL: html = re.sub(r"@font-face\{font-family:'Gothic';font-weight:900;[^}]*\}\n?", "", html)   # いちばん 太い 字は のぞく（700で 代わりに 出る）
html = html.replace("<script>window.SCENARIO_SRC=", "<script>window.CANVA=true;\nwindow.SCENARIO_SRC=", 1)
assert "window.CANVA=true" in html
(R/("canva_10mb.html" if SMALL else "canva.html")).write_text(html, encoding="utf-8")
n = len(html.encode())
print("canva_10mb.html" if SMALL else "canva.html", round(n / 1e6, 2), "MB", "OK" if n <= LIMIT else "⚠ 上限を こえています（上の 大きさ・画質を 下げる）")
