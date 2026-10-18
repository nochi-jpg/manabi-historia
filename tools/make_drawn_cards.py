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

# ===== 第5話（大化の改新） =====
def seal(im, x=40, y=290, s=52):
    ImageDraw.Draw(im).rectangle((x, y, x + s, y + s), fill=(188, 40, 30))
# 大化の改新：改新の詔
im = paper(11); vtext(im, ["改新之詔", "大化二年", "春正月"], 48, 420, 40, 120); seal(im); save(im, "大化の改新")
# 唐の学問：論語のはじめ
im = paper(12, (230, 222, 196)); vtext(im, ["論語", "学而時習之", "不亦説乎"], 46, 420, 34, 118); seal(im); save(im, "唐の学問")
# 唐：大きな国の名
im = paper(13, (238, 214, 190)); d = ImageDraw.Draw(im); d.rectangle((150, 30, 362, 350), outline=(160, 40, 30), width=8)
vtext(im, ["大唐"], 120, 256, 60, 0); save(im, "唐")
# 蘇我入鹿
im = paper(14); vtext(im, ["蘇我大臣", "入鹿"], 64, 380, 40, 150); seal(im); save(im, "蘇我入鹿")
# 公地公民：田んぼ＋文字
im = paper(15); d = ImageDraw.Draw(im)
for i in range(4):
    for j in range(2): d.rectangle((40 + i * 110, 250 + j * 60, 140 + i * 110, 300 + j * 60), fill=(120, 160, 70), outline=(90, 70, 40), width=3)
vtext(im, ["公地", "公民"], 70, 330, 20, 150); save(im, "公地公民")
# 税のしくみ：租・調・庸
im = paper(16); vtext(im, ["租", "調", "庸"], 120, 420, 90, 160)
f = ImageFont.truetype(SERIF, 28); d = ImageDraw.Draw(im)
for x, t in ((420, "稲"), (260, "特産物"), (100, "布")): d.text((x, 300), t, font=f, fill=(120, 40, 30), anchor="mt")
save(im, "税のしくみ")
# 難波の都：海と宮
im = paper(17); d = ImageDraw.Draw(im)
for k in range(5): d.arc((-40 + k * 120, 300, 80 + k * 120, 380), 180, 360, fill=(50, 90, 150), width=6)
d.polygon([(150, 170), (362, 170), (330, 130), (182, 130)], fill=(60, 45, 35)); d.rectangle((180, 170, 332, 250), fill=(170, 50, 35))
vtext(im, ["難波宮"], 54, 470, 30, 0); save(im, "難波の都")
# 藤原氏：藤の花
im = paper(18); d = ImageDraw.Draw(im); random.seed(4)
for x in range(60, 300, 48):
    for k in range(8): r = 14 - k; d.ellipse((x - r + random.randint(-3, 3), 30 + k * 26 - r, x + r, 30 + k * 26 + r), fill=(150 + k * 6, 110 + k * 8, 200))
vtext(im, ["藤原"], 90, 410, 60, 0); save(im, "藤原氏")
print("OK")

# ===== 第6話（大仏をつくれ！） =====
# 大仏づくりの詔：「一枝の草、一把の土を持ちて像を助け造らむと情願する者あらば…」
im = paper(21); vtext(im, ["造大仏詔", "一枝之草", "一把之土"], 46, 420, 40, 120); seal(im); save(im, "大仏づくりの詔")
# 多くの人々：大仏の型へ 銅を 運ぶ 人々
im = paper(22, (232, 220, 192)); d = ImageDraw.Draw(im)
d.ellipse((150, 20, 362, 232), fill=(150, 110, 70))   # 大仏の 光背
d.ellipse((206, 50, 306, 150), fill=(110, 80, 50)); d.rounded_rectangle((176, 140, 336, 300), 40, fill=(110, 80, 50))   # 大仏
def man(x, y, s=1):
    c = (50, 40, 30); d.ellipse((x - 9 * s, y - 62 * s, x + 9 * s, y - 44 * s), fill=c)
    d.polygon([(x - 12 * s, y - 42 * s), (x + 12 * s, y - 42 * s), (x + 16 * s, y), (x - 16 * s, y)], fill=c)
    d.rectangle((x - 26 * s, y - 52 * s, x + 26 * s, y - 40 * s), fill=(160, 80, 50))   # かついだ 銅
for i, x in enumerate(range(30, 512, 56)): man(x, 360 - (i % 2) * 10, .9 + (i % 3) * .1)
save(im, "多くの人々")
# おくりもの：開眼の綱（はなだ色の 綱）
im = paper(23, (238, 230, 210)).resize((480, 360)); d = ImageDraw.Draw(im)
import math
for k in range(3):   # 3本を よりあわせた 綱
    pts = [(40 + t * 4, 180 + math.sin(t / 9 + k * 2.1) * 26 + (t - 50) * .6) for t in range(101)]
    d.line(pts, fill=(70 + k * 20, 120 + k * 15, 170 + k * 10), width=22, joint="curve")
for x in (40, 440): d.ellipse((x - 14, 150 + (x - 240) * .12, x + 14, 210 + (x - 240) * .12), fill=(80, 130, 180))
im.save(R/"art"/"gtsuna_normal.webp", "WEBP", quality=80)
