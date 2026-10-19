#!/usr/bin/env python3
"""キャラの元画像（1920×1080・背景透明・1枚に表情がいくつか並んだもの）から、正方形の顔グラを作る。
使い方：python3 tools/make_faces.py <元画像のフォルダ>
元画像：1.png=ユガミ 2.png=ユウキ 3.png=ミナ 4.png=本じい＋トケイ
同じキャラの表情どうしは、同じ大きさ・同じ基準（絵の上はし・左右の中心）でそろえる"""
import sys, pathlib
import numpy as np
from PIL import Image
from scipy import ndimage

SRC = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else pathlib.Path(".")
SET7 = "--set7" in sys.argv   # 7まいめ（1〜3.png=源義経・源頼朝（大人）・北条政子。右に 名前の 文字）
SET6 = "--set6" in sys.argv   # 6まいめ（1.png に 4人：清盛（若）・清盛（出家後）・重盛・頼朝（少年））
SET5 = "--set5" in sys.argv or SET6   # 5まいめ（1〜3.png=藤式部・藤原道長・年をとった道長）
SET4 = "--set4" in sys.argv or SET5   # 4まいめ（1〜3.png=光明皇后・行基・聖武天皇）
SET3 = "--set3" in sys.argv or SET4   # 3まいめ（1〜2.png=中大兄皇子・中臣鎌足）
SET2 = "--set2" in sys.argv or SET3 or SET7   # 2まいめの素材（1〜4.png=卑弥呼・弟・ワカタケル・太子、6.png=顔なしトケイ）
OUT = pathlib.Path(__file__).resolve().parent.parent / "art"
# ファイル: [(キャラ, 表情)]（並び順＝上の段から、左から）
SHEETS = {
  "1.png": [("yugami", "surprise"), ("yugami", "smile"), ("yugami", "normal"), ("yugami", "angry"), ("yugami", "cry")],
  "2.png": [("yuuki", "smile"), ("yuuki", "surprise"), ("yuuki", "normal"), ("yuuki", "angry")],
  "3.png": [("mina", "smile"), ("mina", "normal")],
  "4.png": [("honjii", "normal"), ("tokei", "normal"), ("honjii", "angry"), ("honjii", "smile")],
}

def parts(path):
    im = Image.open(path).convert("RGBA")
    a = np.asarray(im)[:, :, 3] > 20
    lab, n = ndimage.label(ndimage.binary_dilation(a, iterations=6))
    objs = [(s, k + 1) for k, s in enumerate(ndimage.find_objects(lab)) if (s[0].stop - s[0].start) * (s[1].stop - s[1].start) > 20000]
    objs.sort(key=lambda t: (t[0][0].start // 200, t[0][1].start))
    out = []
    for s, k in objs:   # その絵の部分だけを残す（となりの表情が入りこまないように）
        one = im.copy(); m = np.asarray(one).copy(); m[lab != k, 3] = 0
        out.append((Image.fromarray(m, "RGBA"), (s[1].start, s[0].start, s[1].stop, s[0].stop)))
    return out

if SET2:   # 文字のラベル（小さい部分）は parts() の大きさの条件で落ちる
    SHEETS = {"1.png": [("himiko", "normal")], "2.png": [("otouto", "normal")], "3.png": [("wakatakeru", "normal")], "4.png": [("shotoku", "normal")], "6.png": [("tokei", "normal")]}
if SET3:
    SHEETS = {"1.png": [("nakanooe", "normal")], "2.png": [("kamatari", "normal")]}
if SET4:
    SHEETS = {"1.png": [("koumyou", "normal")], "2.png": [("gyouki", "normal")], "3.png": [("shoumu", "normal")]}
if SET5:
    SHEETS = {"1.png": [("fujishikibu", "normal")], "2.png": [("michinaga", "normal")], "3.png": [("michinaga", "old")]}
if SET6:
    SHEETS = {"1.png": [("kiyomori", "normal"), ("kiyomori", "nyudo"), ("shigemori", "normal"), ("yoritomo", "normal")]}
if SET7:
    SHEETS = {"1.png": [("yoshitsune", "normal")], "2.png": [("yoritomo2", "normal")], "3.png": [("masako", "normal")]}
crops = {}
for f, names in SHEETS.items():
    ps = parts(SRC / f)
    if SET6: ps = sorted([q for q in ps if q[1][1] < 560], key=lambda t: t[1][0])   # 下の 名前の 文字は のぞく
    elif SET2: ps = [max(ps, key=lambda t: (t[1][2] - t[1][0]) * (t[1][3] - t[1][1]))]   # いちばん大きい絵だけ
    assert len(ps) == len(names), (f, len(ps))
    for (ch, ex), (im, b) in zip(names, ps):
        crops.setdefault(ch, []).append((ex, im, b))

OUT.mkdir(exist_ok=True)
for ch, items in crops.items():
    size = max(max(b[2] - b[0], b[3] - b[1]) for _, _, b in items) + 24
    for ex, im, (x0, y0, x1, y1) in items:
        cx = (x0 + x1) // 2
        left, top = cx - size // 2, y0 - 12
        if ch in ("honjii", "tokei"):   # 顔の中心で正方形の中央に
            top = (y0 + y1) // 2 - size // 2
        sq = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        sq.paste(im.crop((left, top, left + size, top + size)), (0, 0))
        sq.resize((512, 512), Image.LANCZOS).save(OUT / f"{ch}_{ex}.webp", "WEBP", quality=88)
        print(ch, ex)
