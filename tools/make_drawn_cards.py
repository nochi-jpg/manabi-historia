"""写真が見つからないカードの絵を、ゲームの中で描いて作る（cardimg/カード名.webp）
冠位十二階・十七条の憲法・隋への国書"""
import pathlib, random
from PIL import Image, ImageDraw, ImageFont, ImageFilter
R = pathlib.Path(__file__).resolve().parent.parent
SERIF = "/usr/share/fonts/opentype/noto/NotoSerifCJK-Black.ttc"
W, H = 512, 380
def paper(seed=1, base=(236, 226, 200)):
    random.seed(seed); im = Image.new("RGB", (W, H), base); d = ImageDraw.Draw(im)
    for _ in range(4000):
        x, y = random.randrange(W), random.randrange(H); c = random.randint(205, 232)
        d.line((x, y, x + random.randint(2, 16), y + random.randint(-2, 2)), fill=(c, c - 8, c - 32))
    return im.filter(ImageFilter.GaussianBlur(.7))
def vtext(im, cols, size, x0, y0, gap):   # たて書き（右から左へ）
    d = ImageDraw.Draw(im); f = ImageFont.truetype(SERIF, size)
    t = Image.new("L", im.size, 0); dt = ImageDraw.Draw(t)
    x = x0
    for col in cols:
        y = y0
        for ch in col:
            dt.text((x, y), ch, font=f, fill=255, anchor="mt"); y += size * 1.05
        x -= gap
    t = t.filter(ImageFilter.GaussianBlur(.8)); im.paste((28, 22, 18), (0, 0), t)
def save(im, name):
    im = im.resize((256, 190), Image.LANCZOS); im.save(R/"cardimg"/(name + ".webp"), "WEBP", quality=70)

# 十七条の憲法：第一条「和を以て貴しと為し…」
im = paper(3); vtext(im, ["十七條憲法", "一曰以和為貴", "無忤為宗"], 44, 430, 40, 120)
d = ImageDraw.Draw(im); d.rectangle((40, 290, 92, 342), fill=(188, 40, 30)); save(im, "十七条の憲法")

# 隋への国書：「日出づる処の天子、書を日没する処の天子に致す。恙無きや」
im = paper(5, (232, 220, 190)); vtext(im, ["日出處天子", "致書日沒處", "天子無恙"], 46, 420, 34, 118)
save(im, "隋への国書")

# 冠位十二階：冠の色（紫・青・赤・黄・白・黒の こい／うすい）
im = Image.new("RGB", (W, H), (240, 233, 214)); d = ImageDraw.Draw(im)
cols = [("徳", (92, 40, 120)), ("仁", (40, 70, 150)), ("礼", (180, 40, 40)), ("信", (210, 170, 40)), ("義", (245, 245, 240)), ("智", (40, 40, 40))]
f = ImageFont.truetype(SERIF, 26); fs = ImageFont.truetype(SERIF, 30)
def light(c): return tuple(int(v + (255 - v) * .45) for v in c)
for i, (nm, c) in enumerate(cols):
    for j, (pre, cc) in enumerate((("大", c), ("小", light(c)))):
        x = 22 + i * 82; y = 40 + j * 160
        d.rounded_rectangle((x + 8, y + 40, x + 70, y + 92), 10, fill=cc, outline=(60, 50, 40), width=2)   # 冠の本体
        d.ellipse((x + 22, y + 10, x + 56, y + 52), fill=cc, outline=(60, 50, 40), width=2)               # 上のふくらみ
        d.rectangle((x + 4, y + 88, x + 74, y + 98), fill=(60, 50, 40))                                    # ふち
        d.text((x + 39, y + 104), pre + nm, font=f, fill=(40, 30, 20), anchor="mt")
save(im, "冠位十二階")
print("OK")
