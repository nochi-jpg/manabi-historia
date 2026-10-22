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
    m = re.fullmatch(r"ep(\d+)([ab]?)", f.stem); n = int(m.group(1))
    # 中の 番号は 通し番号：17a=17・17b=18・18a=19・18b=20・19=21・20=22 …（第17・18話は 前編・後編）
    no = n if n <= 16 else 17 + (n - 17) * 2 + (m.group(2) == "b") if n <= 18 else n + 2
    scen[no] = f.read_text(encoding="utf-8")
# 2行チェック：セリフ・証言が セリフ枠2行（約37字×2）を こえていないか
def width(t):
    t = re.sub(r"《[^》]+》", "", t).replace("【", "").replace("】", "").replace("｛", "").replace("｝", "")
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
# 前の index.html から、手元にない素材（音・シルエットなど、リポジトリに入れていないもの）を引きつぐ
OLD = {}
if (R/"index.html").exists():
    _old = (R/"index.html").read_text(encoding="utf-8")
    for _k in ("ART", "BGM_DATA", "SE_DATA"):
        _m = re.search(r"window\." + _k + r"=(\{.*?\});(?=\n|</script>)", _old, re.S)
        if _m:
            try: OLD[_k] = json.loads(_m.group(1))
            except Exception: pass
# 顔グラ：art/名前_表情.webp を window.ART に埋めこむ
art = {}
for f in sorted((R/"art").glob("*.webp")):
    nm, ex = f.stem.rsplit("_", 1)
    art.setdefault(nm, {})[ex] = "data:image/webp;base64," + __import__("base64").b64encode(f.read_bytes()).decode()
for _nm, _ex in OLD.get("ART", {}).items():   # 手元にない絵は前の index.html から（むかしの 影絵 sil は 使わない。2026-10-22 先生）
    if _nm == "sil": continue
    for _e, _v in _ex.items(): art.setdefault(_nm, {}).setdefault(_e, _v)
data += "\nwindow.ART=" + json.dumps(art) + ";"
# 背景：bgimg/場面の名前.webp（先生の絵。台本の @背景 の名前と同じ）。ないものは src/bg.js で描く
bgimg = {f.stem: "data:image/webp;base64," + __import__("base64").b64encode(f.read_bytes()).decode() for f in sorted((R/"bgimg").glob("*.webp"))}
data += "\nwindow.BGIMG=" + json.dumps(bgimg, ensure_ascii=False) + ";"
# カードの写真：cardimg/カード名.webp（一覧と出典は data/cardimg.txt）
cimg, ccred = {}, []
for line in (R/"data/cardimg.txt").read_text(encoding="utf-8").splitlines():
    if not line.strip() or line.startswith("#"): continue
    p = [x.strip() for x in line.split("|")]
    f = R/"cardimg"/(p[0] + ".webp")
    if f.exists():
        cimg[p[0]] = ["data:image/webp;base64," + base64.b64encode(f.read_bytes()).decode(), "cover"]
        ccred.append([p[0], p[4], p[3]])
for f in sorted((R/"cardimg").glob("*.webp")):   # 一覧にない絵（tools/make_drawn_cards.py で描いたもの）も入れる。クレジットはなし
    if f.stem not in cimg: cimg[f.stem] = ["data:image/webp;base64," + base64.b64encode(f.read_bytes()).decode(), "cover"]
data += "\nwindow.CARDIMG=" + json.dumps(cimg, ensure_ascii=False) + ";\nwindow.CARDIMG_CREDITS=" + json.dumps(ccred, ensure_ascii=False) + ";"
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
                if hit: i += len(hit[0]) if "|" in hit[2] else hit[1]; continue
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
bgm, bgm_list, bgm_list2 = {}, [], []
bgm_list_all = bgm_list
for line in (R/"data/bgm.txt").read_text(encoding="utf-8").splitlines():
    if "Wingless Seraph" in line: bgm_list = bgm_list2   # ここから下は Wingless Seraph の 曲（スタッフロールで 分けて 出す）
    if not line.strip() or line.startswith("#"): continue
    key, f, title, ls, ll, use = [x.strip() for x in line.split("|")]
    bgm_list.append(title)
    fp = R/"audio/bgm"/(f + ".ogg")
    if fp.exists(): bgm[key] = {"ls": int(ls) / 44100, "le": (int(ls) + int(ll)) / 44100, "d": base64.b64encode(fp.read_bytes()).decode()}
    elif key in OLD.get("BGM_DATA", {}): bgm[key] = OLD["BGM_DATA"][key]   # audio/ がないときは前の index.html から
    else: print("⚠ BGMなし:", key, f)
data += "\nwindow.BGM_DATA=" + json.dumps(bgm, ensure_ascii=False) + ";\nwindow.BGM_TITLES=" + json.dumps([t for t in bgm_list_all if t not in bgm_list2], ensure_ascii=False) + ";\nwindow.BGM_TITLES2=" + json.dumps(bgm_list2, ensure_ascii=False) + ";"
# 効果音：data/se.txt の一覧どおり audio/se/呼び名.ogg を埋めこむ（ないものは合成の音）
se = {}
for line in (R/"data/se.txt").read_text(encoding="utf-8").splitlines():
    if not line.strip() or line.startswith("#"): continue
    key, f, st, du, vol, use = [x.strip() for x in line.split("|")]
    fp = R/"audio/se"/(key + ".ogg")
    if fp.exists(): se[key] = {"v": float(vol), "d": base64.b64encode(fp.read_bytes()).decode()}
    elif key in OLD.get("SE_DATA", {}): se[key] = OLD["SE_DATA"][key]
data += "\nwindow.SE_DATA=" + json.dumps(se) + ";"
html = (R/"src/template.html").read_text(encoding="utf-8")
# フォント：ゲームで使う字だけにしぼって埋めこむ（OFL）
import base64, subprocess, tempfile
chars = set()
for f in [R/"src/engine.js", R/"src/fx.js", R/"src/template.html", R/"src/bg.js", R/"build.py", R/"data/bgm.txt", R/"data/cardimg.txt"]: chars |= set(f.read_text(encoding="utf-8"))
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
