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
EP17 = "--ep17" in sys.argv   # 第17話〜第20話・第23話（明治〜戦後・防災）：写真が ない 26枚。字は 使わず 図形だけ
if "--ep7" in sys.argv or EP8 or EP9 or EP10 or EP11 or EP1213 or EP1415 or EP17:
    args = [a for a in sys.argv[1:] if a not in ("--ep7", "--ep8", "--ep9", "--ep10", "--ep11", "--ep12", "--ep14", "--ep17")]
    if args:
        SERIF = args[0]; _tt = ImageFont.truetype
        def _black(path, size, *a, **k):
            f = _tt(path, size, *a, **k)
            try: f.set_variation_by_name("Black")
            except Exception: pass
            return f
        ImageFont.truetype = _black
    def seal(im, x=40, y=290, s=52): ImageDraw.Draw(im).rectangle((x, y, x + s, y + s), fill=(188, 40, 30))
    if EP17:
        import math
        INK, WOOD, RED, GOLD = (40, 34, 30), (120, 84, 48), (196, 50, 40), (214, 172, 62)
        NUM = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"   # 数字（6・3・9/1）だけに 使う
        def rgba(w, h): im_ = Image.new("RGBA", (w, h), (0, 0, 0, 0)); return im_, ImageDraw.Draw(im_)
        def put(im, item, cx, cy, ang=0):   # 部品を まわして 置く
            r = item.rotate(ang, expand=True, resample=Image.BICUBIC); im.paste(r, (int(cx - r.width / 2), int(cy - r.height / 2)), r)
        def glow(im, box, col, blur=18, a=200):   # ぼんやり 光る（火・けむり・ほこり）
            m = Image.new("L", im.size, 0); ImageDraw.Draw(m).ellipse(box, fill=a); im.paste(col, (0, 0), m.filter(ImageFilter.GaussianBlur(blur)))
        def sky(im, top, bot, y1=H):   # 上から 下へ 色が かわる 空
            d = ImageDraw.Draw(im)
            for y in range(y1): t = y / y1; d.line((0, y, W, y), fill=tuple(int(a + (b - a) * t) for a, b in zip(top, bot)))
        def star(d, x, y, r, col, ang=-90):
            d.polygon([(x + (r if k % 2 == 0 else r * .42) * math.cos(math.radians(ang + k * 36)), y + (r if k % 2 == 0 else r * .42) * math.sin(math.radians(ang + k * 36))) for k in range(10)], fill=col)
        def flag_jp(w, h):   # 日の丸
            f_, d = rgba(w, h); d.rectangle((0, 0, w - 1, h - 1), fill=(250, 250, 245), outline=INK, width=2); r = h * .3; d.ellipse((w / 2 - r, h / 2 - r, w / 2 + r, h / 2 + r), fill=RED); return f_
        def flag_uk(w, h):   # イギリスの 旗（条約の 相手の 国の 代表）
            f_, d = rgba(w, h); B, Wt = (30, 50, 110), (250, 250, 245); d.rectangle((0, 0, w, h), fill=B)
            for a, b in (((0, 0), (w, h)), ((w, 0), (0, h))): d.line((a, b), fill=Wt, width=int(h * .22)); d.line((a, b), fill=RED, width=int(h * .08))
            d.rectangle((w * .4, 0, w * .6, h), fill=Wt); d.rectangle((0, h * .34, w, h * .66), fill=Wt)
            d.rectangle((w * .45, 0, w * .55, h), fill=RED); d.rectangle((0, h * .41, w, h * .59), fill=RED); d.rectangle((0, 0, w - 1, h - 1), outline=INK, width=2); return f_
        def crate(im, x, y, flag):   # 荷物の 箱（旗の しるしつき）。x,y＝箱の 下の まんなか
            d = ImageDraw.Draw(im); d.rectangle((x - 40, y - 56, x + 40, y), fill=(196, 150, 96), outline=(100, 70, 40), width=3)
            d.line((x - 40, y - 28, x + 40, y - 28), fill=(150, 108, 64), width=3); im.paste(flag, (int(x - flag.width / 2), int(y - 28 - flag.height / 2)), flag)
        def balance(im, cx, top, tilt=0., L=150):   # てんびん。tilt＝かたむき（＋で 右が 下がる）。皿の 位置を かえす
            d = ImageDraw.Draw(im); d.rectangle((cx - 7, top, cx + 7, top + 230), fill=WOOD); d.polygon([(cx - 70, top + 250), (cx + 70, top + 250), (cx + 46, top + 226), (cx - 46, top + 226)], fill=WOOD)
            dx, dy = L * math.cos(tilt), L * math.sin(tilt); pans = []
            d.line((cx - dx, top + 12 - dy, cx + dx, top + 12 + dy), fill=WOOD, width=12)
            for sx, sy in ((cx - dx, top + 12 - dy), (cx + dx, top + 12 + dy)):
                py = sy + 96; d.line((sx, sy, sx - 52, py), fill=INK, width=3); d.line((sx, sy, sx + 52, py), fill=INK, width=3)
                d.chord((sx - 64, py - 24, sx + 64, py + 24), 0, 180, fill=GOLD, outline=(120, 90, 30), width=2); pans.append((sx, py))
            d.ellipse((cx - 14, top - 2, cx + 14, top + 26), fill=GOLD, outline=(120, 90, 30), width=2); return pans
        def arrow(d, pts, col=RED, w=10):   # 矢印（さいごの 2点の 向きに 先を つける）
            d.line(pts, fill=col, width=w, joint="curve"); (x0, y0), (x1, y1) = pts[-2], pts[-1]; a = math.atan2(y1 - y0, x1 - x0); s = w * 2.4
            d.polygon([(x1 + s * math.cos(a), y1 + s * math.sin(a)), (x1 + s * math.cos(a + 2.4), y1 + s * math.sin(a + 2.4)), (x1 + s * math.cos(a - 2.4), y1 + s * math.sin(a - 2.4))], fill=col)
        def curve(p0, c, p1, n=24): return [((1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * c[0] + t * t * p1[0], (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * c[1] + t * t * p1[1]) for t in (k / n for k in range(n + 1))]
        # 地図の 形（経度,緯度。だいたいの 海岸線）。日本は 赤っぽく ぬる
        LAND = {
            "本州": [(130.9, 34.0), (131.4, 34.4), (132.4, 35.3), (133.1, 35.5), (134.2, 35.6), (135.3, 35.7), (136.0, 35.8), (136.7, 36.9), (137.3, 37.5), (137.0, 36.8), (138.2, 37.1), (139.0, 37.9), (139.6, 38.7), (140.0, 39.9), (140.0, 40.6), (140.3, 41.2), (141.4, 41.4), (141.5, 40.5), (141.9, 39.6), (141.6, 38.4), (141.0, 38.2), (141.0, 37.0), (140.6, 36.3), (140.8, 35.7), (140.2, 35.1), (139.8, 35.0), (139.1, 35.1), (138.8, 34.6), (138.3, 34.6), (137.0, 34.6), (136.8, 34.3), (136.3, 33.5), (135.8, 33.4), (135.1, 33.9), (135.3, 34.6), (134.5, 34.7), (133.5, 34.4), (132.4, 34.3), (131.5, 33.9)],
            "九州": [(130.9, 33.9), (131.5, 33.6), (131.9, 33.0), (131.6, 32.2), (131.3, 31.4), (130.7, 31.0), (130.2, 31.3), (130.3, 32.0), (129.8, 32.8), (129.6, 33.3), (130.3, 33.6)],
            "四国": [(132.0, 33.4), (132.6, 32.8), (133.5, 33.5), (134.2, 33.3), (134.7, 34.1), (134.0, 34.4), (133.0, 34.1), (132.7, 33.9)],
            "北海道": [(140.1, 41.4), (141.2, 41.8), (141.7, 42.6), (143.2, 42.0), (143.8, 42.9), (145.6, 43.3), (145.2, 44.0), (144.3, 44.0), (141.9, 45.5), (141.6, 45.2), (141.4, 43.8), (141.4, 43.2), (140.5, 43.2), (139.9, 42.6)],
            "大陸": [(80, 60), (141.0, 60), (141.4, 53.2), (140.5, 51.0), (140.3, 48.5), (138.5, 46.8), (137.0, 45.0), (135.0, 43.4), (132.0, 43.0), (130.6, 42.4), (129.7, 40.8), (127.5, 39.8), (128.6, 38.4), (129.4, 37.0), (129.5, 36.0), (129.3, 35.3), (128.5, 34.8), (127.5, 34.6), (126.3, 34.5), (126.5, 35.5), (126.5, 36.9), (126.1, 37.7), (125.1, 38.6), (124.3, 39.9), (122.4, 39.5), (121.2, 38.8), (121.9, 40.0), (121.0, 40.8), (119.6, 39.9), (118.5, 39.0), (117.7, 38.9), (118.0, 38.0), (118.9, 37.4), (119.8, 37.2), (120.7, 37.8), (122.5, 37.4), (121.0, 36.6), (120.2, 35.9), (119.3, 35.0), (120.3, 34.3), (121.0, 32.5), (121.9, 31.6), (121.9, 30.9), (121.8, 30.0), (122.0, 29.2), (121.0, 28.0), (120.0, 26.7), (119.5, 25.5), (118.6, 24.6), (117.5, 23.8), (116.5, 22.9), (114.8, 22.6), (113.5, 22.2), (112.0, 21.7), (110.5, 21.0), (110.2, 20.3), (109.7, 21.5), (108.5, 21.6), (106.5, 20.2), (105.8, 19.0), (106.5, 17.5), (108.0, 16.0), (108.9, 15.5), (109.3, 12.0), (109.0, 11.4), (107.0, 10.4), (105.0, 8.6), (104.8, 10.2), (103.0, 10.7), (102.5, 12.2), (101.0, 12.7), (100.0, 13.4), (99.2, 10.5), (100.3, 8.4), (101.3, 6.9), (102.3, 6.1), (103.4, 4.5), (103.5, 2.5), (104.2, 1.4), (103.4, 1.3), (101.3, 2.8), (100.4, 4.2), (100.3, 6.5), (98.3, 7.9), (98.6, 10.0), (98.2, 13.0), (97.7, 16.5), (94.5, 16.0), (93.5, 19.5), (92.0, 21.5), (80, 22)],
            "台湾": [(121.0, 25.2), (121.9, 25.0), (121.6, 24.0), (120.9, 22.0), (120.2, 22.6), (120.1, 23.5)],
            "海南島": [(110.5, 20.0), (111.0, 19.6), (109.6, 18.2), (108.6, 19.1), (109.2, 19.9)],
            "樺太": [(142.0, 46.0), (143.5, 46.5), (143.0, 49.0), (144.6, 49.0), (143.0, 51.0), (143.2, 53.5), (142.7, 54.4), (142.2, 53.0), (141.7, 51.5), (142.0, 48.0), (141.8, 46.6)],
            "カムチャツカ": [(156.7, 51.0), (158.5, 52.9), (160.0, 54.0), (162.0, 56.0), (163.0, 60.0), (155.6, 60.0), (155.6, 55.0)],
            "スマトラ": [(95.3, 5.6), (97.5, 5.2), (100.4, 2.2), (103.7, -1.0), (106.0, -3.2), (105.8, -5.8), (104.5, -5.9), (102.3, -4.0), (100.4, -1.0), (98.7, 1.7)],
            "ジャワ": [(105.2, -6.8), (106.1, -5.9), (108.3, -6.3), (110.4, -6.9), (112.6, -6.9), (114.4, -7.7), (114.6, -8.7), (111.0, -8.2), (108.0, -7.8)],
            "ボルネオ": [(109.0, 1.5), (109.6, 2.0), (111.0, 1.6), (113.0, 3.2), (115.0, 5.0), (116.0, 6.0), (117.2, 7.0), (119.2, 5.3), (118.0, 4.0), (117.8, 1.0), (116.5, -2.5), (116.0, -3.8), (114.5, -4.0), (111.8, -3.4), (110.2, -2.9), (110.0, -1.0), (109.0, 0.0)],
            "スラウェシ": [(119.0, -3.0), (119.5, -5.6), (120.4, -5.5), (120.6, -2.6), (121.9, -4.8), (122.8, -4.4), (121.3, -1.6), (123.4, -0.8), (121.0, -0.6), (120.6, 0.4), (124.9, 1.6), (124.3, 0.4), (120.2, -0.2), (119.8, -1.5)],
            "ルソン": [(120.6, 18.5), (122.3, 18.4), (122.2, 16.3), (121.6, 15.8), (121.6, 14.2), (124.1, 13.0), (123.0, 13.0), (120.6, 13.9), (120.0, 14.8), (120.0, 16.5)],
            "フィリピン中": [(122.0, 11.8), (123.2, 10.6), (125.3, 11.2), (125.6, 10.0), (124.0, 9.6), (122.4, 9.5)],
            "ミンダナオ": [(122.0, 7.0), (123.5, 8.6), (126.0, 9.3), (126.6, 7.3), (125.5, 5.7), (124.0, 6.5)],
            "ニューギニア": [(131.0, -1.0), (134.0, -0.8), (135.5, -3.3), (138.0, -1.6), (141.0, -2.6), (145.8, -5.3), (147.7, -6.7), (150.2, -10.6), (147.5, -10.1), (146.0, -8.0), (143.5, -9.0), (141.0, -9.2), (139.0, -8.1), (138.0, -8.4), (137.8, -5.5), (135.0, -4.4), (132.8, -4.0), (132.0, -2.8)],
            "オーストラリア": [(113.5, -22.0), (114.2, -21.8), (116.7, -20.6), (121.0, -19.5), (122.3, -18.0), (123.6, -16.3), (125.0, -14.6), (127.0, -13.9), (129.0, -14.9), (130.2, -13.2), (131.0, -12.2), (132.6, -11.5), (136.0, -12.0), (136.6, -13.0), (135.4, -15.0), (137.8, -16.4), (140.6, -17.6), (141.6, -15.0), (141.5, -12.6), (142.5, -10.7), (143.5, -13.8), (145.4, -14.9), (146.3, -19.0), (149.0, -21.5), (150.8, -22.6), (153.0, -25.0), (153.5, -35.0), (113.0, -35.0)],
        }
        JP = ("本州", "九州", "四国", "北海道")
        def amap(lon0, lon1, lat0, lat1, keys, extra=()):   # 地図（海を ぬって、陸を かさねる）
            im = Image.new("RGB", (W, H), (156, 194, 222)); d = ImageDraw.Draw(im)
            def P(lo, la): return ((lo - lon0) / (lon1 - lon0) * W, (lat1 - la) / (lat1 - lat0) * H)
            for nm in keys: d.polygon([P(*p) for p in LAND[nm]], fill=(226, 120, 96) if nm in JP else (232, 220, 182), outline=(120, 104, 84), width=2)
            for lo, la, r in extra: x, y = P(lo, la); d.ellipse((x - r, y - r * .7, x + r, y + r * .7), fill=(232, 220, 182), outline=(120, 104, 84))   # 小さな 島
            return im, d, P
        # ---- 第17話 前編 ----
        im = paper(201); d = ImageDraw.Draw(im)   # 徴兵令：軍服の 帽子と 名簿（はんこの ついた 名前の 行）
        d.rectangle((272, 40, 474, 340), fill=(246, 240, 224), outline=INK, width=3); d.rectangle((272, 40, 474, 76), fill=(70, 62, 56))
        for k in range(7):
            y = 92 + k * 35; d.line((282, y + 28, 464, y + 28), fill=(200, 188, 164), width=2)
            d.rounded_rectangle((292, y + 6, 352 + (k * 37) % 70, y + 18), 5, fill=(120, 110, 100)); d.ellipse((428, y, 452, y + 24), outline=RED, width=4)
        d.ellipse((50, 86, 250, 150), fill=(36, 42, 72)); d.rectangle((64, 118, 236, 222), fill=(36, 42, 72))   # 帽子（こい 紺）
        d.rectangle((64, 190, 236, 222), fill=(190, 40, 34)); d.chord((56, 182, 244, 262), 0, 180, fill=(20, 20, 24)); star(d, 150, 152, 22, (232, 192, 64)); save(im, "徴兵令")
        # ---- 第17話 後編 ----
        im = paper(202); d = ImageDraw.Draw(im)   # 自由民権運動：演説台と メガホン、聞きに 来た 人々（影）
        d.rectangle((140, 150, 372, 168), fill=(96, 66, 40)); d.polygon([(160, 168), (352, 168), (338, 300), (174, 300)], fill=WOOD); d.rectangle((196, 190, 316, 270), outline=(96, 66, 40), width=5)
        a = math.atan2(-60, 110); ca, sa = math.cos(a), math.sin(a); nx, ny, wx, wy = 236, 140, 236 + 110 * ca, 140 + 110 * sa
        d.polygon([(nx - 9 * sa, ny + 9 * ca), (wx - 40 * sa, wy + 40 * ca), (wx + 40 * sa, wy - 40 * ca), (nx + 9 * sa, ny - 9 * ca)], fill=(220, 220, 214), outline=INK, width=3)
        d.ellipse((wx - 16, wy - 40, wx + 16, wy + 40), fill=(150, 150, 146), outline=INK, width=3)   # メガホンの 口
        for k in range(3): r = 40 + k * 30; d.arc((wx - r, wy - r, wx + r, wy + r), -80, 20, fill=RED, width=6)
        for k, x in enumerate(range(10, 530, 56)): y = 318 + (k % 2) * 10; d.ellipse((x - 18, y, x + 18, y + 36), fill=(70, 60, 56)); d.pieslice((x - 34, y + 30, x + 34, y + 110), 180, 360, fill=(70, 60, 56))
        save(im, "自由民権運動")
        im = paper(203); d = ImageDraw.Draw(im)   # ドイツの憲法：あつい 本と ドイツの 旗の 色
        d.rectangle((242, 66, 256, 334), fill=(240, 232, 210), outline=(150, 130, 100)); d.rectangle((70, 60, 246, 340), fill=(128, 38, 34)); d.rectangle((70, 60, 92, 340), fill=(90, 26, 24))
        d.rectangle((108, 92, 228, 308), outline=GOLD, width=5); d.ellipse((136, 150, 200, 214), outline=GOLD, width=6); star(d, 168, 182, 18, GOLD)
        d.rectangle((326, 40, 334, 350), fill=WOOD)
        for k, c in enumerate(((30, 30, 30), (250, 250, 246), (210, 40, 34))): d.rectangle((334, 54 + k * 34, 476, 88 + k * 34), fill=c)   # そのころの ドイツ帝国の 旗（黒・白・赤）
        d.rectangle((334, 54, 476, 156), outline=INK, width=2)
        save(im, "ドイツの憲法")
        im = paper(204); d = ImageDraw.Draw(im)   # 内閣：上から 見た 会議の 机と いす
        chairs = [(x, y) for x in (170, 230, 290, 350) for y in (92, 288)] + [(78, 190), (434, 190)]
        for x, y in chairs: d.rounded_rectangle((x - 24, y - 22, x + 24, y + 22), 10, fill=(150, 56, 46), outline=(90, 30, 24), width=3)
        d.rounded_rectangle((100, 120, 412, 260), 60, fill=WOOD, outline=(80, 54, 30), width=4)
        for x, y in chairs:
            px, py = x + (0 if x not in (78, 434) else (38 if x == 78 else -38)), (y + 52 if y == 92 else y - 52 if y == 288 else y)
            d.rectangle((px - 14, py - 18, px + 14, py + 18), fill=(246, 240, 224))
        save(im, "内閣")
        # ---- 第18話 前編 ----
        im = paper(205); balance(im, 190, 70, 0, 120); d = ImageDraw.Draw(im)   # 治外法権：日本の はかりに ×（外国人を さばけない）
        d.rectangle((402, 50, 410, 340), fill=WOOD); im.paste(flag_uk(110, 70), (410, 60))
        for a_, b_ in (((90, 90), (290, 300)), ((290, 90), (90, 300))): d.line((a_, b_), fill=(220, 40, 30), width=26)
        save(im, "治外法権")
        im = paper(206); (l, r) = balance(im, 256, 64, .26); crate(im, l[0], l[1], flag_jp(48, 32)); crate(im, r[0], r[1], flag_uk(48, 32)); save(im, "関税自主権")   # かたむいた てんびん
        im = paper(207); d = ImageDraw.Draw(im)   # 条約改正：2まいの 条約の 紙と 握手
        for x0, fl in ((44, flag_jp(54, 36)), (290, flag_uk(54, 36))):
            d.rectangle((x0, 30, x0 + 178, 270), fill=(248, 244, 230), outline=INK, width=3); im.paste(fl, (x0 + 62, 46))
            for k in range(5): d.line((x0 + 22, 108 + k * 26, x0 + 156 - (k % 2) * 30, 108 + k * 26), fill=(150, 140, 126), width=6)
            d.ellipse((x0 + 120, 226, x0 + 152, 258), fill=RED)
        SK, SKL = (238, 196, 160), (160, 110, 76)
        d.polygon([(0, 380), (0, 300), (170, 268), (190, 330), (60, 380)], fill=(44, 50, 80)); d.polygon([(512, 380), (512, 300), (342, 268), (322, 330), (452, 380)], fill=(90, 90, 96))   # 左右の そで
        d.polygon([(166, 266), (182, 262), (200, 330), (186, 334)], fill=(250, 250, 245)); d.polygon([(346, 266), (330, 262), (312, 330), (326, 334)], fill=(250, 250, 245))
        d.rounded_rectangle((246, 270, 334, 330), 22, fill=SK, outline=SKL, width=3)   # 右の 手
        d.rounded_rectangle((180, 268, 266, 332), 22, fill=SK, outline=SKL, width=3)   # 左の 手
        for k in range(4): d.rounded_rectangle((236 + k * 17, 276 + k * 2, 254 + k * 17, 334 - k * 3), 8, fill=SK, outline=SKL, width=3)   # 右の 手の 指（左の 手を にぎる）
        d.rounded_rectangle((196, 254, 286, 278), 12, fill=SK, outline=SKL, width=3); save(im, "条約改正")   # 左の 手の 親指
        im = paper(208); d = ImageDraw.Draw(im); random.seed(208)   # 賠償金：銀貨の 箱
        d.polygon([(110, 196), (402, 196), (380, 96), (132, 96)], fill=(96, 62, 34), outline=(70, 44, 24), width=3)
        coins = sorted(((random.uniform(126, 386), 0) for _ in range(70)))
        coins = sorted(((x, 200 - 50 * math.sin(math.pi * (x - 110) / 292) + random.uniform(0, 34)) for x, _ in coins), key=lambda c: c[1])
        for x, y in coins: d.ellipse((x - 20, y - 9, x + 20, y + 9), fill=(204, 206, 212), outline=(110, 112, 122), width=2); d.ellipse((x - 10, y - 5, x + 2, y - 1), fill=(240, 240, 244))
        d.rectangle((104, 196, 408, 336), fill=(150, 100, 56), outline=(80, 54, 30), width=4)
        for x in (150, 362): d.rectangle((x - 10, 196, x + 10, 336), fill=(120, 110, 100))
        d.rectangle((240, 214, 272, 252), fill=GOLD, outline=(120, 90, 30), width=2)
        for x, y in ((60, 350), (440, 344), (470, 358)): d.ellipse((x - 20, y - 9, x + 20, y + 9), fill=(204, 206, 212), outline=(110, 112, 122), width=2)
        save(im, "賠償金")
        # ---- 第18話 後編 ----
        im = paper(209); d = ImageDraw.Draw(im)   # 戦争の負担：家の 上に のしかかる 重い 税の 袋
        d.rectangle((0, 330, 512, 380), fill=(170, 150, 110)); d.rectangle((176, 256, 336, 330), fill=(230, 214, 180), outline=(110, 80, 50), width=3)
        d.rectangle((236, 280, 276, 330), fill=(110, 80, 50)); d.polygon([(150, 262), (256, 222), (362, 262)], fill=(96, 70, 52))
        BG_, BL_ = (196, 168, 112), (120, 90, 50)
        d.polygon([(234, 72), (216, 42), (240, 50), (256, 36), (272, 50), (296, 42), (278, 72)], fill=BG_, outline=BL_, width=3)   # 袋の 口（しぼった 上）
        d.polygon([(232, 92), (280, 92), (330, 150), (182, 150)], fill=BG_); d.ellipse((136, 110, 376, 262), fill=BG_, outline=BL_, width=4)
        d.polygon([(232, 92), (280, 92), (326, 146), (186, 146)], fill=BG_); d.line((232, 92, 186, 146), fill=BL_, width=4); d.line((280, 92, 326, 146), fill=BL_, width=4)
        d.rounded_rectangle((222, 66, 290, 94), 10, fill=(120, 84, 48))   # しばった ひも
        d.ellipse((212, 150, 300, 238), fill=GOLD, outline=(120, 90, 30), width=5); d.ellipse((232, 170, 280, 218), outline=(160, 120, 40), width=4)   # お金の しるし
        for x in (112, 400): arrow(d, [(x, 150), (x, 250)], RED, 10)
        save(im, "戦争の負担")
        im = paper(210); (l, r) = balance(im, 256, 64, 0); crate(im, l[0], l[1], flag_jp(48, 32)); crate(im, r[0], r[1], flag_uk(48, 32)); d = ImageDraw.Draw(im)   # 関税自主権の回復：まっすぐな てんびんと 鍵
        d.ellipse((34, 262, 106, 334), outline=GOLD, width=16); d.rectangle((104, 290, 236, 306), fill=GOLD)
        for x in (196, 222): d.rectangle((x, 306, x + 12, 330), fill=GOLD)
        d.ellipse((34, 262, 106, 334), outline=(140, 100, 30), width=2); save(im, "関税自主権の回復")
        # ---- 第19話（戦争は 地図と 矢印だけ）----
        im, d, P = amap(103, 147, 19, 47, ["大陸", "台湾", "海南島", "本州", "九州", "四国", "北海道", "樺太"])   # 日中戦争：北京の 近くで はじまり、中国の 中へ
        arrow(d, curve(P(116.6, 39.2), P(117.5, 35.0), P(114.6, 31.6)), RED, 9); arrow(d, curve(P(129.6, 32.4), P(125.5, 30.6), P(122.6, 31.2)), RED, 9)
        arrow(d, curve(P(121.0, 31.4), P(119.8, 32.3), P(117.4, 31.7)), RED, 9); star(d, *P(116.4, 39.9), 20, (250, 220, 60))
        save(im, "日中戦争")
        im, d, P = amap(92, 210, -28, 54, list(LAND), [(204.5, 19.6, 6), (203.6, 20.8, 4), (202.0, 21.45, 4), (200.5, 22.05, 3)])   # 太平洋戦争：ハワイと 東南アジアへ
        arrow(d, curve(P(141.5, 36.5), P(172, 44), P(198.6, 24.6)), RED, 8); arrow(d, curve(P(130.5, 31.0), P(118.5, 22.0), P(107.5, 9.5)), RED, 8)
        for lo, la in ((202.0, 21.4), (102.2, 6.1)): star(d, *P(lo, la), 16, (250, 220, 60))
        save(im, "太平洋戦争")
        im = Image.new("RGB", (W, H), (156, 194, 222)); d = ImageDraw.Draw(im)   # 沖縄戦：沖縄本島に 海から 上陸
        def P(lo, la): return ((lo - 127.25) / 1.5 * W, (26.95 - la) * H)
        oki = [(128.26, 26.87), (128.33, 26.78), (128.28, 26.65), (128.18, 26.55), (128.03, 26.50), (127.95, 26.42), (127.97, 26.32), (127.90, 26.27), (127.85, 26.20), (127.80, 26.14), (127.72, 26.08), (127.66, 26.10), (127.65, 26.20), (127.68, 26.26), (127.73, 26.32), (127.75, 26.40), (127.84, 26.45), (127.87, 26.52), (127.84, 26.56), (127.75, 26.60), (127.88, 26.72), (127.98, 26.66), (128.05, 26.70), (128.14, 26.80)]
        d.polygon([P(*p) for p in oki], fill=(150, 186, 110), outline=(80, 100, 60), width=3)
        for lo, la, r in ((127.80, 26.71, 9), (127.32, 26.20, 7), (127.36, 26.16, 5)): x, y = P(lo, la); d.ellipse((x - r * 1.5, y - r, x + r * 1.5, y + r), fill=(150, 186, 110), outline=(80, 100, 60), width=2)
        for la in (26.30, 26.36, 26.42): arrow(d, [P(127.36, la + .04), P(127.66, la)], RED, 9)
        save(im, "沖縄戦")
        im = paper(211); d = ImageDraw.Draw(im)   # 配給：切符と 米の 袋
        d.rectangle((36, 70, 276, 320), fill=(244, 236, 214), outline=INK, width=3); d.rectangle((36, 70, 276, 110), fill=(150, 60, 50))
        for i in range(3):
            for j in range(4):
                x, y = 52 + i * 74, 122 + j * 48
                for k in range(0, 66, 10): d.line((x + k, y, x + k + 5, y), fill=(130, 120, 100), width=2); d.line((x + k, y + 40, x + k + 5, y + 40), fill=(130, 120, 100), width=2)
                if (i + j) % 3 == 0: d.ellipse((x + 18, y + 6, x + 46, y + 34), outline=RED, width=4)
        d.polygon([(318, 150), (466, 150), (488, 330), (296, 330)], fill=(200, 176, 130), outline=(130, 104, 70), width=3)
        d.ellipse((312, 128, 472, 172), fill=(250, 248, 240), outline=(130, 104, 70), width=3)
        random.seed(211)
        for _ in range(40): x, y = random.uniform(330, 452), random.uniform(138, 162); d.ellipse((x - 4, y - 2, x + 4, y + 2), fill=(214, 208, 190))
        d.line((316, 200, 470, 200), fill=(150, 120, 80), width=4); save(im, "配給")
        im = paper(212); d = ImageDraw.Draw(im)   # 戦争の記録：写真・手紙（便せん）・日記
        ph, dp = rgba(190, 150); dp.rectangle((0, 0, 189, 149), fill=(246, 242, 230)); dp.rectangle((12, 12, 177, 137), fill=(200, 176, 140)); dp.rectangle((12, 100, 177, 137), fill=(150, 124, 92))
        dp.polygon([(40, 100), (40, 70), (75, 48), (110, 70), (110, 100)], fill=(110, 86, 62)); dp.ellipse((128, 50, 166, 92), fill=(120, 100, 70)); dp.rectangle((144, 88, 150, 104), fill=(110, 86, 62)); put(im, ph, 130, 110, 8)
        lt, dl = rgba(170, 210); dl.rectangle((0, 0, 169, 209), fill=(250, 248, 240), outline=(150, 140, 120))
        for k in range(1, 7): dl.line((k * 24, 12, k * 24, 198), fill=(214, 120, 110), width=2)
        put(im, lt, 390, 130, -7)
        bk, db = rgba(300, 170); db.rounded_rectangle((0, 0, 299, 169), 10, fill=(60, 90, 70)); db.rectangle((10, 8, 289, 160), fill=(246, 240, 224)); db.line((150, 8, 150, 160), fill=(120, 100, 80), width=3)
        for k in range(6): db.line((24, 32 + k * 22, 134, 32 + k * 22), fill=(170, 160, 140), width=2); db.line((166, 32 + k * 22, 276, 32 + k * 22), fill=(170, 160, 140), width=2)
        put(im, bk, 256, 280, 0); save(im, "戦争の記録")
        # ---- 第20話 ----
        im = paper(213); d = ImageDraw.Draw(im)   # 国民主権：投票箱に 1まいの 票
        d.polygon([(140, 176), (372, 176), (402, 140), (170, 140)], fill=(210, 170, 116), outline=(110, 76, 40), width=3); d.polygon([(372, 176), (402, 140), (402, 300), (372, 336)], fill=(150, 108, 64), outline=(110, 76, 40), width=3)
        d.rectangle((140, 176, 372, 336), fill=(186, 140, 90), outline=(110, 76, 40), width=3); d.rectangle((162, 196, 350, 316), outline=(150, 108, 64), width=4); d.rectangle((244, 236, 268, 266), fill=(140, 140, 150))
        d.polygon([(222, 162), (310, 162), (318, 154), (230, 154)], fill=(50, 36, 26))   # 票を 入れる 口
        d.rectangle((240, 34, 302, 158), fill=(252, 252, 248), outline=INK, width=2)   # 票（口に 半分 入っている）
        for x in (258, 284): d.line((x, 52, x, 140), fill=(160, 160, 170), width=4)
        arrow(d, [(340, 50), (340, 120)], RED, 8); save(im, "国民主権")
        im = paper(214); d = ImageDraw.Draw(im)   # 基本的人権の尊重：手を つなぐ 人の 形（大人も 子どもも）
        d.ellipse((96, 30, 416, 350), fill=(244, 222, 190))
        ppl = [(70, 1., (220, 110, 90)), (166, .78, (240, 180, 70)), (256, 1., (110, 170, 110)), (346, .78, (90, 140, 200)), (442, 1., (170, 110, 180))]
        for i, (x, s, c) in enumerate(ppl):
            hy, sy = 330 - 230 * s, 330 - 190 * s
            if i < 4: nx_, ns = ppl[i + 1][0], ppl[i + 1][1]; d.line((x + 20 * s, sy + 26, (x + nx_) / 2, 330 - 110 * min(s, ns), nx_ - 20 * ns, 330 - 190 * ns + 26), fill=c, width=14, joint="curve")
        for i, (x, s, c) in enumerate(ppl):
            hy, sy = 330 - 230 * s, 330 - 190 * s
            d.ellipse((x - 24 * s, hy - 24 * s, x + 24 * s, hy + 24 * s), fill=c); d.rounded_rectangle((x - 24 * s, sy, x + 24 * s, 330 - 70 * s), 14, fill=c)
            d.rectangle((x - 18 * s, 330 - 80 * s, x - 5 * s, 330), fill=c); d.rectangle((x + 5 * s, 330 - 80 * s, x + 18 * s, 330), fill=c)
        save(im, "基本的人権の尊重")
        im = Image.new("RGB", (W, H), (206, 230, 244)); d = ImageDraw.Draw(im); fn = ImageFont.truetype(NUM, 56)   # 6・3制：小学校（6年）と 中学校（3年）
        d.rectangle((0, 300, 512, 380), fill=(140, 180, 100))
        for (x0, x1, top, tx, n) in ((20, 300, 170, 160, "6"), (330, 492, 200, 411, "3")):
            d.rectangle((x0, top, x1, 300), fill=(244, 236, 216), outline=(130, 110, 90), width=3); d.rectangle((x0 - 6, top - 10, x1 + 6, top), fill=(160, 70, 50))
            for i in range((x1 - x0 - 20) // 44):
                for j in range(2): d.rectangle((x0 + 18 + i * 44, top + 18 + j * 46, x0 + 46 + i * 44, top + 48 + j * 46), fill=(130, 170, 210))
            d.rectangle((tx - 44, top - 100, tx + 44, top), fill=(244, 236, 216), outline=(130, 110, 90), width=3); d.polygon([(tx - 54, top - 100), (tx, top - 140), (tx + 54, top - 100)], fill=(160, 70, 50))
            d.ellipse((tx - 38, top - 90, tx + 38, top - 14), fill=(255, 255, 255), outline=(130, 110, 90), width=4); d.text((tx, top - 52), n, font=fn, fill=(40, 60, 120), anchor="mm")
            d.rectangle((tx - 20, 250, tx + 20, 300), fill=(150, 108, 64))
        save(im, "6・3制")
        im = paper(215); d = ImageDraw.Draw(im)   # 高度経済成長：上がる グラフと テレビ・冷蔵庫
        for k in range(5): d.rectangle((186 + k * 44, 320 - 50 - k * 50, 218 + k * 44, 320), fill=(120, 170, 210))
        d.line((156, 340, 410, 340), fill=INK, width=4); arrow(d, [(176, 260), (240, 220), (300, 160), (380, 70)], RED, 10)
        d.line((112, 166, 80, 112), fill=INK, width=4); d.line((112, 166, 146, 108), fill=INK, width=4)   # テレビの アンテナ
        d.rounded_rectangle((26, 164, 196, 300), 10, fill=(150, 100, 56), outline=(80, 54, 30), width=3); d.rounded_rectangle((40, 178, 152, 286), 18, fill=(100, 120, 130)); d.arc((52, 186, 120, 250), 190, 260, fill=(220, 230, 236), width=5)
        for y in (196, 232): d.ellipse((162, y, 184, y + 22), fill=(220, 210, 190))
        for x in (44, 178): d.line((x, 300, x - 6 * (1 if x < 100 else -1), 340), fill=(80, 54, 30), width=6)
        d.rounded_rectangle((398, 120, 490, 344), 18, fill=(246, 246, 240), outline=(140, 140, 140), width=3); d.line((398, 196, 490, 196), fill=(140, 140, 140), width=3)
        d.rectangle((474, 140, 482, 180), fill=(170, 170, 170)); d.rectangle((474, 212, 482, 262), fill=(170, 170, 170)); save(im, "高度経済成長")
        im = paper(216); d = ImageDraw.Draw(im)   # 東京オリンピック：赤い 日の 丸と 聖火の トーチ
        d.ellipse((136, 30, 376, 270), fill=(206, 44, 36))
        d.polygon([(220, 196), (292, 196), (268, 356), (244, 356)], fill=(200, 200, 206), outline=(110, 110, 120), width=3)
        for y in (240, 290): d.line((226 + (y - 196) * .15, y, 286 - (y - 196) * .15, y), fill=(150, 150, 160), width=5)
        glow(im, (196, 50, 316, 210), (255, 236, 160), 16, 230); d = ImageDraw.Draw(im)
        d.polygon([(204, 194), (214, 130), (236, 150), (256, 70), (276, 148), (298, 126), (308, 194)], fill=(244, 140, 40))
        d.polygon([(226, 194), (238, 150), (256, 120), (274, 150), (286, 194)], fill=(255, 220, 90)); d.ellipse((206, 182, 306, 206), fill=(150, 150, 160), outline=(110, 110, 120), width=3)
        save(im, "東京オリンピック")
        im = Image.new("RGB", (W, H)); sky(im, (176, 170, 150), (214, 206, 180), 300); d = ImageDraw.Draw(im)   # 公害：けむりを 出す 工場と よごれた 川
        sm = Image.new("L", im.size, 0); ds = ImageDraw.Draw(sm)
        for cx in (110, 170, 230):
            for k in range(7): ds.ellipse((cx + k * 26 - 26 - k * 3, 70 - k * 12 - 22 - k * 3, cx + k * 26 + 26 + k * 3, 70 - k * 12 + 22 + k * 3), fill=210)
        im.paste((70, 66, 64), (0, 0), sm.filter(ImageFilter.GaussianBlur(8))); d = ImageDraw.Draw(im)
        for cx, top in ((110, 70), (170, 56), (230, 78)): d.rectangle((cx - 13, top, cx + 13, 200), fill=(120, 96, 86)); d.rectangle((cx - 13, top + 14, cx + 13, top + 24), fill=(200, 200, 196))
        d.rectangle((40, 200, 340, 286), fill=(126, 122, 120))
        for x in range(40, 340, 60): d.polygon([(x, 200), (x + 60, 200), (x + 60, 170)], fill=(100, 96, 96))
        for x in range(60, 330, 44): d.rectangle((x, 226, x + 26, 250), fill=(80, 78, 80))
        d.rectangle((0, 286, 512, 304), fill=(130, 130, 90)); d.polygon([(0, 304), (512, 296), (512, 380), (0, 380)], fill=(118, 104, 70))
        d.rectangle((300, 266, 360, 280), fill=(90, 90, 92)); d.polygon([(348, 280), (360, 280), (378, 326), (342, 326)], fill=(60, 54, 40))
        random.seed(217)
        for _ in range(14): x, y = random.uniform(0, 512), random.uniform(318, 372); d.ellipse((x - 34, y - 5, x + 34, y + 5), fill=(84, 74, 50))
        for _ in range(10): x, y = random.uniform(0, 512), random.uniform(314, 372); d.ellipse((x - 10, y - 4, x + 10, y + 4), fill=(200, 196, 160))
        save(im, "公害")
        # ---- 第23話（防災）----
        im = Image.new("RGB", (W, H)); sky(im, (20, 26, 64), (60, 70, 120)); d = ImageDraw.Draw(im); random.seed(223)   # 稲むらの火：夜の 高台の 稲むらに 火
        for _ in range(30): x, y = random.uniform(0, 512), random.uniform(0, 150); d.ellipse((x - 1.5, y - 1.5, x + 1.5, y + 1.5), fill=(240, 240, 220))
        d.rectangle((0, 250, 512, 380), fill=(34, 60, 110))
        for k in range(4): d.arc((300 + k * 60, 254, 360 + k * 60, 290), 180, 360, fill=(200, 220, 240), width=4)
        d.polygon([(0, 150), (120, 168), (250, 214), (360, 270), (380, 380), (0, 380)], fill=(46, 62, 44))
        for x, y, fire in ((70, 170, True), (165, 196, True), (262, 232, False)):
            if fire: glow(im, (x - 80, y - 150, x + 80, y + 20), (255, 150, 60), 26, 210); d = ImageDraw.Draw(im)
            d.polygon([(x - 44, y + 6), (x - 38, y - 30), (x - 22, y - 58), (x, y - 70), (x + 22, y - 58), (x + 38, y - 30), (x + 44, y + 6)], fill=(212, 170, 80), outline=(150, 112, 50))   # 稲の たばを つんだ 稲むら
            for k in (-22, 0, 22): d.line((x + k * .5, y - 62 + abs(k), x + k, y + 6), fill=(170, 130, 56), width=3)
            if fire: d.polygon([(x - 36, y - 40), (x - 30, y - 100), (x - 12, y - 82), (x, y - 140), (x + 14, y - 86), (x + 32, y - 106), (x + 36, y - 40), (x, y - 56)], fill=(244, 120, 36)); d.polygon([(x - 18, y - 50), (x - 8, y - 92), (x, y - 108), (x + 8, y - 90), (x + 18, y - 50), (x, y - 62)], fill=(255, 214, 90))
        save(im, "稲むらの火")
        im = Image.new("RGB", (W, H)); sky(im, (170, 210, 236), (226, 238, 244), 190); d = ImageDraw.Draw(im)   # 津波の石碑：海を 見おろす 石碑
        d.rectangle((0, 170, 512, 260), fill=(80, 136, 190))
        for k in range(8): d.arc((-20 + k * 70, 186 + (k % 2) * 18, 40 + k * 70, 214 + (k % 2) * 18), 180, 360, fill=(230, 240, 250), width=4)
        d.polygon([(0, 250), (512, 230), (512, 380), (0, 380)], fill=(126, 166, 86))
        d.polygon([(206, 66), (292, 54), (318, 96), (312, 318), (200, 318), (192, 100)], fill=(156, 156, 150), outline=(96, 96, 92), width=4)
        d.polygon([(224, 104), (290, 96), (294, 288), (222, 288)], fill=(138, 138, 132)); d.rectangle((176, 312, 336, 342), fill=(130, 128, 120), outline=(90, 90, 86), width=3)
        for x in (242, 260, 278): d.line((x, 120, x, 270), fill=(112, 112, 106), width=5)
        save(im, "津波の石碑")
        im = paper(224, (222, 214, 196)); d = ImageDraw.Draw(im); random.seed(224)   # 関東大震災：くずれた れんがと ひびわれた 地面
        d.rectangle((0, 290, 512, 380), fill=(156, 126, 92))
        d.polygon([(250, 290), (232, 316), (262, 330), (236, 356), (258, 380), (272, 380), (252, 356), (280, 330), (250, 316), (266, 290)], fill=(60, 44, 34))
        br = Image.new("RGB", im.size, (176, 82, 60)); db = ImageDraw.Draw(br)
        for j in range(12):
            y = 290 - (j + 1) * 20
            for i in range(-1, 7): x = 40 + i * 44 + (22 if j % 2 else 0); db.rectangle((x, y, x + 44, y + 20), outline=(226, 210, 186), width=3)
        m = Image.new("L", im.size, 0); ImageDraw.Draw(m).polygon([(40, 290), (40, 110), (84, 110), (84, 130), (128, 130), (128, 170), (172, 170), (172, 210), (216, 210), (216, 250), (250, 250), (250, 290)], fill=255); im.paste(br, (0, 0), m)
        glow(im, (200, 150, 500, 300), (236, 228, 214), 24, 160); d = ImageDraw.Draw(im)
        for _ in range(26):
            x = random.uniform(260, 490); y = 290 - random.uniform(0, 70) * (1 - (x - 260) / 260); a = random.uniform(-.6, .6)
            pts = [(x + dx * math.cos(a) - dy * math.sin(a), y + dx * math.sin(a) + dy * math.cos(a)) for dx, dy in ((-20, -9), (20, -9), (20, 9), (-20, 9))]
            d.polygon(pts, fill=(176, 82, 60), outline=(120, 56, 40))
        save(im, "関東大震災")
        im = paper(225); d = ImageDraw.Draw(im); fn = ImageFont.truetype(NUM, 110)   # 防災の日：9月1日の カレンダー
        d.rectangle((136, 52, 376, 344), fill=(252, 250, 244), outline=(120, 110, 100), width=3); d.rectangle((136, 52, 376, 118), fill=(200, 50, 40))
        for x in (196, 316): d.ellipse((x - 12, 34, x + 12, 70), outline=(80, 80, 86), width=6)
        d.text((256, 232), "9/1", font=fn, fill=(40, 34, 30), anchor="mm"); save(im, "防災の日")
        im = Image.new("RGB", (W, H), (226, 236, 204)); d = ImageDraw.Draw(im)   # ハザードマップ：あぶない 所の 色分けと にげる 道
        d.polygon([(300, 0), (512, 0), (512, 200), (440, 170), (380, 110)], fill=(190, 176, 136)); d.polygon([(390, 0), (512, 0), (512, 150), (456, 120), (420, 60)], fill=(240, 150, 80))   # 山と 土砂くずれの 所（オレンジ）
        for p_ in ((0, 150, 512, 150), (170, 0, 170, 380), (350, 150, 350, 380)): d.line(p_, fill=(255, 255, 255), width=8)   # 道
        rv = [(x, 296 + 16 * math.sin(x / 70)) for x in range(-20, 540, 10)]   # 川と 水に つかる 所（水色）
        m = Image.new("L", im.size, 0); ImageDraw.Draw(m).line(rv, fill=110, width=170, joint="curve"); im.paste((90, 160, 230), (0, 0), m)
        m = Image.new("L", im.size, 0); ImageDraw.Draw(m).line(rv, fill=110, width=90, joint="curve"); im.paste((60, 120, 220), (0, 0), m); d = ImageDraw.Draw(im)
        d.line(rv, fill=(40, 100, 190), width=26, joint="curve")
        for x, y in ((200, 238), (226, 250), (290, 232), (318, 246), (440, 120), (470, 160), (60, 190), (100, 196)): d.rectangle((x - 10, y - 10, x + 10, y + 10), fill=(120, 110, 104))   # 家
        d.rounded_rectangle((50, 30, 130, 110), 14, fill=(40, 150, 80)); d.polygon([(68, 72), (90, 50), (112, 72)], fill=(255, 255, 255)); d.rectangle((76, 72, 104, 94), fill=(255, 255, 255))   # にげる 場所（みどり）
        arrow(d, curve((212, 222), (170, 160), (142, 104)), (30, 130, 70), 10); arrow(d, curve((300, 214), (230, 110), (146, 76)), (30, 130, 70), 10)
        save(im, "ハザードマップ")
        im = Image.new("RGB", (W, H), (240, 230, 206)); d = ImageDraw.Draw(im)   # 避難訓練：つくえの 上の ヘルメットと、校庭へ にげる みどりの 矢印
        d.rectangle((0, 300, 512, 380), fill=(196, 160, 112))
        for x in range(0, 512, 64): d.line((x, 300, x - 30, 380), fill=(176, 140, 96), width=3)   # 教室の ゆか
        d.rectangle((326, 40, 486, 300), fill=(150, 110, 70)); d.rectangle((340, 54, 472, 300), fill=(176, 214, 240)); d.rectangle((340, 200, 472, 300), fill=(130, 180, 90))   # 出口の むこうの 校庭
        d.rectangle((420, 150, 426, 200), fill=(120, 120, 120)); d.line((396, 160, 450, 160), fill=(120, 120, 120), width=4)   # 鉄棒
        d.rectangle((60, 196, 256, 214), fill=(200, 160, 100), outline=(120, 84, 48), width=2); d.rectangle((80, 214, 236, 244), fill=(150, 150, 156))   # つくえ
        for x in (84, 230): d.rectangle((x, 244, x + 8, 314), fill=(130, 130, 136))
        d.chord((104, 108, 212, 220), 180, 360, fill=(250, 210, 50), outline=(170, 130, 20), width=3); d.rectangle((150, 112, 166, 164), fill=(255, 230, 120))   # ヘルメット
        d.ellipse((92, 154, 224, 178), fill=(240, 196, 40), outline=(170, 130, 20), width=3)
        d.polygon([(220, 110), (300, 110), (300, 82), (350, 130), (300, 178), (300, 150), (220, 150)], fill=(40, 150, 80), outline=(255, 255, 255))   # みどりの 矢印（非常口の 色）
        save(im, "避難訓練")
        print("OK ep17〜ep23"); raise SystemExit
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
