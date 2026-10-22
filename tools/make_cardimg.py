"""カードの写真を作る。data/cardimg.txt の一覧どおりに画像をダウンロードし、
cardimg/カード名.webp（256×190）にする。使い方： python3 tools/make_cardimg.py [キャッシュのフォルダ]
fit： cover＝箱いっぱいに切り抜く／top＝coverの 上より（肖像の 顔が 切れない）／pad＝全体が入るように、まわりを画像のふちの色でうめる
crop：左,上,右,下（0〜1の割合）で先に切り抜く（なくてもよい）"""
import sys, pathlib, urllib.request, hashlib, io, time
from PIL import Image
R = pathlib.Path(__file__).resolve().parent.parent
CACHE = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else R/".cache_cardimg"; CACHE.mkdir(parents=True, exist_ok=True)
OUT = R/"cardimg"; OUT.mkdir(exist_ok=True)
W, H = 256, 190
UA = {"User-Agent": "ManabiHistoria/1.0 (school history game)"}
def fetch(u):
    fp = CACHE/(hashlib.md5(u.encode()).hexdigest() + ".img")
    if not fp.exists():
        for k in range(5):
            try: fp.write_bytes(urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=60).read()); break
            except Exception as e:
                if k == 4: raise
                time.sleep(30 if "429" in str(e) else 3)
    return Image.open(io.BytesIO(fp.read_bytes())).convert("RGB")
LIST = pathlib.Path(sys.argv[2]) if len(sys.argv) > 2 else None   # 2つめ：新しい 行だけの 一覧（ほかは 作りなおさない）
JOBS = [(LIST or R/"data/cardimg.txt", lambda n: OUT/(n + ".webp"), (256, 190)),   # カード
        (R/"data/giftimg.txt", lambda n: R/"art"/(n + "_normal.webp"), (480, 360))]   # おくりもの（@画像 呼び名 で出す）
if LIST: JOBS = JOBS[:1]   # 一覧を わたした ときは カードだけ
for listf, dest, (W, H) in JOBS:
  for line in listf.read_text(encoding="utf-8").splitlines():
    if not line.strip() or line.startswith("#"): continue
    p = [x.strip() for x in line.split("|")]
    name, url, fit, crop = p[0], p[1], p[5], p[6] if len(p) > 6 else ""
    im = fetch(url)
    if crop:
        a = [float(v) for v in crop.split(",")]; w, h = im.size
        im = im.crop((int(a[0]*w), int(a[1]*h), int(a[2]*w), int(a[3]*h)))
    if fit == "pad":
        w, h = im.size; s = min(W*.92/w, H*.92/h)
        im = im.resize((max(1, int(w*s)), max(1, int(h*s))), Image.LANCZOS)
        px = [im.getpixel(xy) for xy in [(1, 1), (im.width-2, 1), (1, im.height-2), (im.width-2, im.height-2)]]
        bg = tuple(sorted(c[i] for c in px)[2] for i in range(3))
        cv = Image.new("RGB", (W, H), bg); cv.paste(im, ((W-im.width)//2, (H-im.height)//2)); im = cv
    else:
        w, h = im.size; s = max(W/w, H/h)
        im = im.resize((int(w*s+.5), int(h*s+.5)), Image.LANCZOS)
        l, t = (im.width-W)//2, ((im.height-H)//2 if fit != "top" else int((im.height-H)*.04)); im = im.crop((l, t, l+W, t+H))
    im.save(dest(name), "WEBP", quality=62 if W < 300 else 75, method=6)
print("OK", len(list(OUT.glob("*.webp"))), "枚", sum(f.stat().st_size for f in OUT.glob("*.webp"))//1024, "KB")
