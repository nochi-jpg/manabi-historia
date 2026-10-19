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

# ===== 第7話（貴族のくらし）=====  python3 tools/make_drawn_cards.py --ep7 [明朝フォント]（第7話の絵だけ作る）
# この環境に NotoSerifCJK がないときは、Noto Serif JP（OFL）を渡す：
#   curl -L -o NotoSerifJP.ttf "https://raw.githubusercontent.com/google/fonts/main/ofl/notoserifjp/NotoSerifJP%5Bwght%5D.ttf"
import sys
EP8 = "--ep8" in sys.argv   # 第8話（武士の世へ① 平氏）の絵だけ作る： python3 tools/make_drawn_cards.py --ep8 [明朝フォント]
EP9 = "--ep9" in sys.argv   # 第9話（武士の世へ② 源頼朝）：おくりもの「義経の手紙」
EP10 = "--ep10" in sys.argv   # 第10話（元が せめてきた！）
EP11 = "--ep11" in sys.argv   # 第11話（室町文化）
EP1213 = "--ep12" in sys.argv   # 第12話・第13話（信長・秀吉）
EP1415 = "--ep14" in sys.argv   # 第14話・第15話（家光・玄白）
if "--ep7" in sys.argv or EP8 or EP9 or EP10 or EP11 or EP1213 or EP1415:
    args = [a for a in sys.argv[1:] if a not in ("--ep7", "--ep8", "--ep9", "--ep10", "--ep11", "--ep12", "--ep14")]
    if args:
        SERIF = args[0]; _tt = ImageFont.truetype
        def _black(path, size, *a, **k):
            f = _tt(path, size, *a, **k)
            try: f.set_variation_by_name("Black")
            except Exception: pass
            return f
        ImageFont.truetype = _black
    def seal(im, x=40, y=290, s=52): ImageDraw.Draw(im).rectangle((x, y, x + s, y + s), fill=(188, 40, 30))
    if EP1415:
        def crop_bg2(name, card, box):
            im = Image.open(R/"bgimg"/(name + ".webp")).convert("RGB"); w, h = im.size
            save(im.crop((int(w * box[0]), int(h * box[1]), int(w * box[2]), int(h * box[3]))).resize((W, H), Image.LANCZOS), card)
        def walker(d, x, y, c=(40, 34, 30)):   # 行列の 人（かさと からだ）
            d.ellipse((x - 9, y - 30, x + 9, y - 12), fill=c); d.rectangle((x - 8, y - 12, x + 8, y + 18), fill=c); d.pieslice((x - 16, y - 42, x + 16, y - 20), 180, 360, fill=(90, 70, 50))
        # ---- 第14話 ----
        im = paper(101); vtext(im, ["親藩", "譜代", "外様"], 72, 420, 50, 120); save(im, "大名")
        im = paper(102, (226, 218, 196)); d = ImageDraw.Draw(im)   # 参勤交代：行列
        d.line((0, 300, 512, 260), fill=(160, 140, 110), width=40)
        for k in range(9): walker(d, 30 + k * 52, 290 - k * 4)
        d.rectangle((250, 150, 262, 250), fill=(70, 50, 30)); d.rectangle((262, 150, 300, 200), fill=(30, 30, 30))
        vtext(im, ["参勤交代"], 40, 480, 20, 0); save(im, "参勤交代")
        im = paper(103); vtext(im, ["三代将軍", "家光"], 70, 380, 40, 140); d = ImageDraw.Draw(im)   # 葵の 紋
        d.ellipse((50, 230, 150, 330), outline=(40, 34, 30), width=6)
        for a in (0, 120, 240):
            import math; r = math.radians(a - 90); x, y = 100 + 26 * math.cos(r), 280 + 26 * math.sin(r); d.ellipse((x - 20, y - 20, x + 20, y + 20), fill=(40, 34, 30))
        save(im, "徳川家光")
        im = paper(104, (214, 226, 236)); d = ImageDraw.Draw(im)   # 鎖国：とざされた 港と 2せきの 船（オランダ・中国）
        d.rectangle((0, 250, 512, 380), fill=(120, 150, 190))
        for x, flag in ((90, (220, 80, 60)), (300, (240, 200, 60))):
            d.polygon([(x, 230), (x + 130, 230), (x + 112, 262), (x + 18, 262)], fill=(90, 60, 40)); d.rectangle((x + 62, 140, x + 68, 230), fill=(70, 50, 30)); d.rectangle((x + 68, 146, x + 110, 176), fill=flag)
        vtext(im, ["鎖国"], 60, 470, 20, 0); save(im, "鎖国")
        im = paper(105, (214, 226, 236)); d = ImageDraw.Draw(im)   # 出島：おうぎ形の 島
        d.rectangle((0, 0, 512, 380), fill=(120, 150, 190)); d.pieslice((60, 60, 460, 460), 200, 340, fill=(200, 180, 140))
        for k in range(6): d.rectangle((140 + k * 40, 150, 168 + k * 40, 180), fill=(120, 90, 60))
        d.line((256, 220, 256, 380), fill=(120, 90, 60), width=10); vtext(im, ["出島"], 60, 470, 20, 0); save(im, "出島")
        im = paper(106); vtext(im, ["武士", "百姓", "町人"], 72, 420, 50, 120); seal(im); save(im, "身分")
        im = paper(107, (226, 218, 196)).resize((480, 360)); d = ImageDraw.Draw(im)   # おくりもの：大名行列の 絵
        d.line((0, 290, 480, 250), fill=(170, 150, 120), width=50)
        for k in range(10): walker(d, 24 + k * 46, 282 - k * 4)
        d.rectangle((200, 170, 280, 230), fill=(60, 40, 30)); d.rectangle((210, 230, 220, 270), fill=(60, 40, 30)); d.rectangle((260, 230, 270, 270), fill=(60, 40, 30))
        im.save(R/"art"/"gdaimyo_normal.webp", "WEBP", quality=80)
        # ---- 第15話 ----
        im = paper(108); f_ = Image.open(R/"art"/"genpaku_normal.webp").convert("RGBA").resize((300, 300)); im.paste(f_, (10, 60), f_)   # 先生の 顔グラ
        vtext(im, ["杉田玄白"], 64, 450, 40, 0); save(im, "杉田玄白")
        im = paper(109); vtext(im, ["前野良沢"], 76, 300, 20, 0); seal(im); save(im, "前野良沢")
        im = paper(110, (232, 222, 198)); d = ImageDraw.Draw(im)   # ターヘル・アナトミア：洋書と 体の 図
        d.rectangle((90, 50, 420, 330), fill=(120, 70, 40)); d.rectangle((110, 70, 400, 310), fill=(236, 226, 200))
        d.ellipse((230, 90, 280, 140), outline=(80, 60, 50), width=4); d.line((255, 140, 255, 250), fill=(80, 60, 50), width=4); d.line((205, 170, 305, 170), fill=(80, 60, 50), width=4)
        d.line((255, 250, 220, 300), fill=(80, 60, 50), width=4); d.line((255, 250, 290, 300), fill=(80, 60, 50), width=4)
        fe = ImageFont.truetype(SERIF, 18); d.text((255, 76), "TABULAE ANATOMICAE", font=fe, fill=(60, 40, 30), anchor="mt"); save(im, "ターヘル・アナトミア")
        im = paper(111); d = ImageDraw.Draw(im); fb = ImageFont.truetype(SERIF, 64)
        d.text((256, 120), "A B C", font=fb, fill=(40, 34, 30), anchor="mm"); vtext(im, ["阿蘭陀語"], 44, 470, 30, 0); d.text((240, 250), "Hollandsch", font=ImageFont.truetype(SERIF, 40), fill=(120, 60, 40), anchor="mm"); save(im, "オランダ語")
        im = paper(112); vtext(im, ["蘭学"], 110, 300, 60, 0); seal(im); save(im, "蘭学")
        crop_bg2("江戸の町", "江戸の町人", (.0, .25, .6, .9))
        im = paper(113); vtext(im, ["近松門左衛門"], 54, 300, 10, 0); d = ImageDraw.Draw(im)
        for k in range(7):   # 扇
            import math; a = math.radians(200 + k * 20); d.line((120, 300, 120 + 110 * math.cos(a), 300 + 110 * math.sin(a)), fill=(120, 84, 48), width=4)
        d.pieslice((10, 190, 230, 410), 200, 340, fill=(200, 60, 50)); d.pieslice((60, 240, 180, 360), 200, 340, fill=(236, 226, 200)); save(im, "近松門左衛門")
        im = paper(114); vtext(im, ["古事記", "本居宣長"], 64, 380, 40, 150); seal(im); save(im, "本居宣長")
        print("OK ep14・ep15"); raise SystemExit
    if EP1213:
        def crop_bg(name, card, box=(.1, .1, .9, .9)):   # 先生の 背景を 切りぬいて カードに
            im = Image.open(R/"bgimg"/(name + ".webp")).convert("RGB"); w, h = im.size
            save(im.crop((int(w * box[0]), int(h * box[1]), int(w * box[2]), int(h * box[3]))).resize((W, H), Image.LANCZOS), card)
        def title(seed, cols, size=96, x0=360, gap=170, y0=50, base=(236, 226, 200)):
            im = paper(seed, base); vtext(im, cols, size, x0, y0, gap); return im
        # ---- 第12話 ----
        im = paper(81, (210, 228, 236)); d = ImageDraw.Draw(im)   # 種子島：島と 南蛮船
        d.ellipse((60, 200, 300, 300), fill=(120, 150, 90)); d.polygon([(330, 190), (470, 190), (450, 230), (350, 230)], fill=(90, 60, 40))
        d.rectangle((396, 90, 402, 190), fill=(70, 50, 30)); d.polygon([(402, 96), (452, 140), (402, 170)], fill=(245, 240, 225))
        vtext(im, ["種子島"], 48, 470, 20, 0); save(im, "種子島")
        im = paper(82); d = ImageDraw.Draw(im)   # 足軽：ならんだ やりと 陣笠
        for k in range(5):
            x = 70 + k * 70; d.line((x, 60, x + 10, 340), fill=(70, 50, 30), width=5); d.polygon([(x - 6, 60), (x, 30), (x + 6, 60)], fill=(150, 150, 160))
            d.pieslice((x - 28, 250, x + 34, 300), 180, 360, fill=(40, 34, 30))
        vtext(im, ["足軽"], 80, 450, 60, 0); save(im, "足軽")
        im = title(83, ["武田勝頼"], 70, 300, 0, 30); d = ImageDraw.Draw(im)   # 武田菱
        for (x, y) in ((90, 120), (150, 120), (90, 190), (150, 190)): d.polygon([(x, y - 30), (x + 30, y), (x, y + 30), (x - 30, y)], fill=(40, 34, 30))
        save(im, "武田勝頼")
        im = title(84, ["室町幕府", "おわる"], 70, 360, 120, 40); seal(im); save(im, "室町幕府の終わり")
        im = paper(85, (226, 214, 190)); d = ImageDraw.Draw(im)   # 長篠の戦い：馬防柵と 鉄砲の けむり
        for x in range(40, 480, 50): d.line((x, 170, x, 330), fill=(100, 72, 46), width=6)
        d.line((20, 210, 500, 210), fill=(100, 72, 46), width=5); d.line((20, 280, 500, 280), fill=(100, 72, 46), width=5)
        sm = Image.new("L", im.size, 0); ds = ImageDraw.Draw(sm)
        for x in range(40, 480, 60): ds.ellipse((x - 30, 120, x + 40, 180), fill=170)
        im.paste((240, 240, 240), (0, 0), sm.filter(ImageFilter.GaussianBlur(8))); vtext(im, ["長篠"], 54, 470, 20, 0); save(im, "長篠の戦い")
        crop_bg("安土", "安土城", (.45, .02, .95, .62))
        im = paper(86, (238, 228, 200)); d = ImageDraw.Draw(im)   # 楽市・楽座：制札
        d.rectangle((120, 30, 400, 300), fill=(214, 190, 150), outline=(110, 80, 50), width=6); d.polygon([(100, 40), (260, 0), (420, 40)], fill=(110, 80, 50))
        d.rectangle((250, 300, 270, 370), fill=(110, 80, 50)); vtext(im, ["定", "楽市楽座"], 50, 330, 60, 80); save(im, "楽市・楽座")
        im = title(87, ["ザビエル"], 70, 330, 0, 40); d = ImageDraw.Draw(im)
        d.rectangle((96, 70, 112, 300), fill=(40, 34, 30)); d.rectangle((50, 130, 158, 146), fill=(40, 34, 30)); save(im, "フランシスコ・ザビエル")
        im = paper(88, (232, 226, 214)).resize((480, 360)); d = ImageDraw.Draw(im)   # おくりもの：鉄砲の 玉（鉛）
        for (x, y, r) in ((180, 190, 46), (300, 210, 40), (240, 120, 34)):
            d.ellipse((x - r, y - r, x + r, y + r), fill=(110, 110, 116)); d.ellipse((x - r * .55, y - r * .6, x - r * .1, y - r * .2), fill=(160, 160, 168))
        im.save(R/"art"/"gtamamono_normal.webp", "WEBP", quality=80)
        # ---- 第13話 ----
        im = paper(91, (226, 206, 178)); d = ImageDraw.Draw(im)   # 本能寺の変：炎の 寺
        d.polygon([(80, 200), (260, 120), (440, 200)], fill=(60, 44, 34)); d.rectangle((120, 200, 400, 330), fill=(90, 64, 44))
        for x in range(100, 420, 50): d.polygon([(x, 200), (x + 25, 110 + (x % 3) * 15), (x + 50, 200)], fill=(226, 100, 40))
        vtext(im, ["本能寺"], 46, 480, 20, 0); save(im, "本能寺の変")
        im = title(92, ["明智光秀"], 70, 300, 0, 30); d = ImageDraw.Draw(im)   # 桔梗紋
        for k in range(5):
            import math; a = math.radians(k * 72 - 90); x, y = 110 + 40 * math.cos(a), 160 + 40 * math.sin(a); d.ellipse((x - 26, y - 26, x + 26, y + 26), fill=(60, 80, 150))
        save(im, "明智光秀")
        crop_bg("大阪城", "大阪城", (.15, .05, .75, .75))
        im = paper(93, (226, 214, 170)); d = ImageDraw.Draw(im)   # 検地：田と 竿と 縄
        for k in range(4): d.rectangle((40 + k * 110, 200, 140 + k * 110, 330), fill=(150, 170, 90), outline=(110, 90, 50), width=3)
        d.line((30, 180, 480, 140), fill=(120, 84, 48), width=8); d.line((30, 190, 480, 190), fill=(200, 180, 120), width=3)
        vtext(im, ["検地"], 60, 470, 10, 0); save(im, "検地")
        im = paper(94); d = ImageDraw.Draw(im)   # 刀狩：集められた 刀
        for k in range(6): d.line((60 + k * 40, 330, 120 + k * 40, 60), fill=(60, 56, 54), width=8)
        vtext(im, ["刀狩"], 80, 440, 60, 0); save(im, "刀狩")
        crop_bg("村", "武士と百姓", (.05, .3, .75, .95))
        im = title(95, ["天下", "一つに"], 80, 340, 140, 40); seal(im); save(im, "天下統一")
        im = paper(96, (214, 226, 236)); d = ImageDraw.Draw(im)   # 朝鮮への出兵：海を わたる 船
        for k in range(6): d.arc((-60 + k * 100, 280, 60 + k * 100, 360), 180, 360, fill=(40, 80, 140), width=6)
        for x in (80, 240): d.polygon([(x, 250), (x + 140, 250), (x + 120, 285), (x + 20, 285)], fill=(90, 60, 40)); d.rectangle((x + 66, 160, x + 72, 250), fill=(70, 50, 30))
        vtext(im, ["朝鮮へ"], 50, 470, 20, 0); save(im, "朝鮮への出兵")
        im = Image.new("RGB", (480, 360), (44, 36, 30)); d = ImageDraw.Draw(im)   # おくりもの：黄金の 茶わん
        d.chord((110, 60, 370, 300), 0, 180, fill=(214, 172, 62)); d.rectangle((200, 290, 280, 312), fill=(190, 150, 50))
        d.ellipse((110, 150, 370, 210), fill=(240, 206, 96)); d.ellipse((130, 158, 350, 202), fill=(150, 108, 38))
        d.arc((140, 90, 340, 290), 20, 70, fill=(255, 236, 160), width=6); im.save(R/"art"/"gougon_normal.webp", "WEBP", quality=80)
        print("OK ep12・ep13"); raise SystemExit
    if EP11:
        # 応仁の乱：焼ける 町の けむりと「東軍・西軍」
        im = paper(71, (226, 206, 178)); sm = Image.new("L", im.size, 0); ds = ImageDraw.Draw(sm); random.seed(11)
        for k in range(40):   # 立ちのぼる けむり
            x = random.choice((90, 200, 300)) + random.randint(-30, 30) + k; y = 260 - k * 6
            ds.ellipse((x - 30, y - 22, x + 30, y + 22), fill=150)
        im.paste((90, 84, 80), (0, 0), sm.filter(ImageFilter.GaussianBlur(10)))
        d = ImageDraw.Draw(im)
        for x in range(0, 380, 76):   # 町の 屋根と 炎
            d.polygon([(x, 300), (x + 38, 262), (x + 76, 300)], fill=(60, 44, 34)); d.rectangle((x + 8, 300, x + 68, 380), fill=(80, 60, 44))
            d.polygon([(x + 20, 300), (x + 38, 240), (x + 56, 300)], fill=(222, 96, 40))
        vtext(im, ["東軍", "西軍"], 56, 470, 40, 70); save(im, "応仁の乱")
        # 書院造：先生の 背景「書院」を 切りぬく
        im = Image.open(R/"bgimg"/"書院.webp").convert("RGB"); w, h = im.size
        im = im.crop((int(w * .1), int(h * .12), int(w * .9), int(h * .88))).resize((W, H), Image.LANCZOS); save(im, "書院造")
        print("OK ep11"); raise SystemExit
    if EP10:
        im = paper(61); vtext(im, ["大元"], 110, 300, 40, 0); seal(im); save(im, "元")
        im = paper(62); vtext(im, ["大元皇帝", "忽必烈"], 56, 330, 40, 120); seal(im, 40, 300, 46); save(im, "フビライ・ハン")
        im = paper(63); vtext(im, ["執権"], 110, 300, 60, 0); d = ImageDraw.Draw(im)
        for (x, y) in ((110, 90), (80, 140), (140, 140)): d.polygon([(x, y - 34), (x - 30, y + 16), (x + 30, y + 16)], fill=(40, 34, 30))
        save(im, "執権")
        # 元の国書（蒙古国牒状の はじめ「上天眷命 大蒙古國皇帝 奉書 日本國王」）
        im = paper(64, (240, 232, 210)); vtext(im, ["上天眷命", "大蒙古國皇帝", "奉書", "日本國王"], 40, 440, 30, 90); save(im, "元の国書")
        im = paper(65); vtext(im, ["恩賞"], 110, 330, 60, 0); d = ImageDraw.Draw(im)
        d.rectangle((70, 230, 190, 300), outline=(120, 84, 48), width=6); d.line((70, 250, 190, 250), fill=(120, 84, 48), width=4); save(im, "恩賞")
        im = paper(66); vtext(im, ["承久三年"], 70, 300, 30, 0); d = ImageDraw.Draw(im)
        d.rectangle((60, 40, 66, 340), fill=(70, 50, 30)); d.rectangle((66, 50, 150, 190), fill=(250, 250, 245), outline=(60, 40, 30)); save(im, "承久の乱")
        print("OK ep10"); raise SystemExit
    if EP9:
        # おくりもの：義経の手紙（腰越状のはじめ「左衛門少尉源義経 恐れながら申し上げ候」）。たたんだ あとの 折り目つき
        im = paper(51, (238, 230, 208)).resize((480, 360)); d = ImageDraw.Draw(im)
        for x in (120, 240, 360): d.line((x, 0, x, 360), fill=(214, 202, 172), width=2)
        f = ImageFont.truetype(SERIF, 30); t = Image.new("L", im.size, 0); dt = ImageDraw.Draw(t); random.seed(9)
        cols = ["左衛門少尉源義経", "乍恐申上候", "意趣者被撰御代官", "其一為勅宣之御使", "傾朝敵…"]
        for c, col in enumerate(cols):
            x = 440 - c * 60; y = 24 + (c > 0) * 30
            for ch in col:
                dt.text((x + random.uniform(-1.5, 1.5), y), ch, font=f, fill=255, anchor="mt"); y += 34
        t = t.filter(ImageFilter.GaussianBlur(.7)); im.paste((30, 24, 20), (0, 0), t)
        im.save(R/"art"/"gkoshigoe_normal.webp", "WEBP", quality=80)
        # 壇ノ浦の戦い：海の 上の 船。平氏の 赤い 旗と 源氏の 白い 旗
        im = paper(52, (214, 226, 232)); d = ImageDraw.Draw(im)
        for k in range(7): d.arc((-60 + k * 90, 270, 40 + k * 90, 350), 180, 360, fill=(40, 80, 140), width=6)
        for x0, flag in ((60, (200, 40, 30)), (300, (250, 250, 245))):
            d.polygon([(x0, 230), (x0 + 160, 230), (x0 + 140, 268), (x0 + 20, 268)], fill=(90, 60, 40))
            d.rectangle((x0 + 78, 90, x0 + 84, 230), fill=(70, 50, 30)); d.rectangle((x0 + 84, 96, x0 + 134, 176), fill=flag, outline=(60, 40, 30))
        vtext(im, ["壇ノ浦"], 40, 470, 20, 0); save(im, "壇ノ浦の戦い")
        # 平氏の世：平氏の 赤い 旗と「平家にあらずんば人にあらず」
        im = paper(53); d = ImageDraw.Draw(im)
        d.rectangle((60, 30, 66, 350), fill=(70, 50, 30)); d.rectangle((66, 40, 170, 220), fill=(196, 36, 28))
        vtext(im, ["平家にあらずんば", "人にあらず"], 34, 420, 30, 60); save(im, "平氏の世")
        # 御恩と奉公：将軍 ⇄ 御家人
        im = paper(54); d = ImageDraw.Draw(im); fb = ImageFont.truetype(SERIF, 46); fs = ImageFont.truetype(SERIF, 28)
        for x, t in ((110, "将軍"), (400, "御家人")): d.text((x, 190), t, font=fb, fill=(28, 22, 18), anchor="mm")
        d.line((170, 140, 330, 140), fill=(170, 60, 40), width=6); d.polygon([(330, 128), (352, 140), (330, 152)], fill=(170, 60, 40))
        d.line((180, 240, 340, 240), fill=(40, 70, 130), width=6); d.polygon([(180, 228), (158, 240), (180, 252)], fill=(40, 70, 130))
        d.text((255, 105), "御恩（土地）", font=fs, fill=(170, 60, 40), anchor="mm"); d.text((255, 280), "奉公（いざ鎌倉）", font=fs, fill=(40, 70, 130), anchor="mm")
        save(im, "御恩と奉公")
        # 守護・地頭
        im = paper(55); vtext(im, ["守護", "地頭"], 96, 360, 50, 170); seal(im); save(im, "守護・地頭")
        # 征夷大将軍
        im = paper(56); vtext(im, ["征夷大将軍"], 64, 300, 20, 0); seal(im, 40, 300, 46); save(im, "征夷大将軍")
        # 北条政子：北条氏の 家紋（三つ鱗）と 名
        im = paper(57); d = ImageDraw.Draw(im)
        for (x, y) in ((150, 110), (100, 200), (200, 200)): d.polygon([(x, y - 70), (x - 60, y + 30), (x + 60, y + 30)], fill=(40, 34, 30))
        vtext(im, ["北条政子"], 64, 420, 50, 0); save(im, "北条政子")
        print("OK ep9"); raise SystemExit
    if EP8:
        # 太政大臣：位の 名と 笏（しゃく）
        im = paper(41); vtext(im, ["太政大臣"], 84, 330, 24, 0); d = ImageDraw.Draw(im)
        d.polygon([(130, 40), (166, 40), (172, 330), (124, 330)], fill=(120, 84, 48)); seal(im, 40, 300, 46); save(im, "太政大臣")
        # 大輪田泊：港に 入る 宋の 船と 波
        im = paper(42, (232, 222, 196)); d = ImageDraw.Draw(im)
        for k in range(6): d.arc((-60 + k * 100, 280, 60 + k * 100, 360), 180, 360, fill=(50, 90, 150), width=6)
        d.polygon([(90, 250), (330, 250), (300, 290), (120, 290)], fill=(90, 60, 40))   # 船体
        d.rectangle((205, 120, 213, 250), fill=(70, 50, 30)); d.polygon([(150, 130), (270, 130), (262, 230), (158, 230)], fill=(200, 120, 70))   # 帆
        vtext(im, ["大輪田泊"], 56, 460, 30, 0); save(im, "大輪田泊")
        print("OK ep8"); raise SystemExit
    # 摂政・関白
    im = paper(31); vtext(im, ["摂政", "関白"], 96, 360, 50, 170); seal(im); save(im, "摂政・関白")
    # かな文字：漢字を くずして かなが できた（安→あ、以→い、宇→う）
    im = paper(32, (238, 228, 204)); d = ImageDraw.Draw(im)
    fk = ImageFont.truetype(SERIF, 70); fa = ImageFont.truetype(SERIF, 30)
    for i, (k, kana) in enumerate((("安", "あ"), ("以", "い"), ("宇", "う"))):
        x = 410 - i * 150
        d.text((x, 40), k, font=fk, fill=(70, 60, 50), anchor="mt")
        d.text((x, 140), "↓", font=fa, fill=(170, 60, 40), anchor="mt")
        d.text((x, 200), kana, font=ImageFont.truetype(SERIF, 96), fill=(28, 22, 18), anchor="mt")
    save(im, "かな文字")
    # おくりもの：望月の歌（道長の 字。目が かすんで 少し ふるえている）
    im = paper(33, (240, 232, 212)).resize((480, 360)); d = ImageDraw.Draw(im)
    d.ellipse((24, 24, 150, 150), fill=(250, 244, 222), outline=(214, 196, 150), width=3)   # 満月
    f = ImageFont.truetype(SERIF, 34); t = Image.new("L", im.size, 0); dt = ImageDraw.Draw(t); random.seed(7)
    cols = ["この世をば", "わが世とぞ思ふ", "望月の", "欠けたることも", "なしと思へば"]
    for c, col in enumerate(cols):
        x = 440 - c * 66; y = 26 + (c % 2) * 22
        for ch in col:
            dt.text((x + random.uniform(-2, 2), y), ch, font=f, fill=255, anchor="mt"); y += 36
    t = t.filter(ImageFilter.GaussianBlur(.7)); im.paste((30, 24, 20), (0, 0), t)
    im.save(R/"art"/"gmochizuki_normal.webp", "WEBP", quality=80)
    print("OK ep7"); raise SystemExit

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
