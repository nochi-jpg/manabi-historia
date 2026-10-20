#!/usr/bin/env python3
"""モブの アイコン（先生の 絵）を 1人ずつ 切りわける。
使い方：python3 tools/make_mobs.py <元画像の フォルダ>
元画像：1〜8.png（1920×1080・背景透明・4人×2だん。下に 時代の 文字）→ art/mob<シート><番号>_normal.webp（256px）
番号は 上の だんの 左から 1〜4、下の だんの 左から 5〜8。どの アイコンが だれかは data/mob_icons.txt"""
import sys, pathlib
import numpy as np
from PIL import Image
from scipy import ndimage

SRC = pathlib.Path(sys.argv[1])
OUT = pathlib.Path(__file__).resolve().parent.parent / "art"
for sh in range(1, 9):
    im = Image.open(SRC / f"{sh}.png").convert("RGBA")
    A = np.asarray(im).copy()
    a = A[:, :, 3] > 20
    lab, n = ndimage.label(ndimage.binary_dilation(a, iterations=4))
    big = [s for s in ndimage.find_objects(lab) if (s[0].stop - s[0].start) > 150]   # 下の 文字は 小さいので のぞく
    X0, X1 = min(s[1].start for s in big), max(s[1].stop for s in big)
    Y0, Y1 = min(s[0].start for s in big), max(s[0].stop for s in big)
    cw, ch = (X1 - X0) / 4, (Y1 - Y0) / 2   # 4人×2だんの マス目で 切る（となりと くっついた 絵も 分けられる）
    for i in range(8):
        r, c = divmod(i, 4)
        cx0, cy0 = int(X0 + c * cw), int(Y0 + r * ch)
        cell = A[cy0:int(cy0 + ch), cx0:int(cx0 + cw)].copy()
        cl, cn = ndimage.label(ndimage.binary_dilation(cell[:, :, 3] > 20, iterations=3))   # となりの 絵の 切れはしを 消す（いちばん 大きい かたまりだけ）
        if cn > 1: big1 = np.argmax(ndimage.sum(np.ones_like(cl), cl, range(1, cn + 1))) + 1; cell[cl != big1, 3] = 0
        ys, xs = np.nonzero(cell[:, :, 3] > 20)
        y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        size = max(x1 - x0, y1 - y0) + 16
        cx = (x0 + x1) // 2
        sq = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        sq.paste(Image.fromarray(cell, "RGBA").crop((cx - size // 2, y1 - size + 8, cx - size // 2 + size, y1 + 8)), (0, 0))   # 下（胸）を そろえる
        sq.resize((256, 256), Image.LANCZOS).save(OUT / f"mob{sh}{i + 1}_normal.webp", "WEBP", quality=85)
print("OK")
