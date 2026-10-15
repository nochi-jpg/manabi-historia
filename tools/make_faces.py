#!/usr/bin/env python3
"""キャラの元画像（横長・白背景・名前の文字入り）から、正方形の顔グラ（背景透明）を作る。
使い方：python3 tools/make_faces.py <元画像のフォルダ>
同じキャラの表情どうしは、同じ切り出し位置にそろえる（表情を切りかえても顔がずれない）"""
import sys, pathlib
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

SRC = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else pathlib.Path(".")
OUT = pathlib.Path(__file__).resolve().parent.parent / "art"
W = 1920   # 横幅をそろえてから処理する
# キャラ名: (絵がある側 "L"/"R", {表情: 元ファイル})
CHARS = {
  "yuuki":  ("R", {"ふつう": "58d270f4-image.png", "怒り": "dd3c84c9-image.jpg", "おどろき": "7609b177-image.jpg", "笑顔": "60bd63d8-image.jpg"}),
  "honjii": ("L", {"ふつう": "91f7d027-image.jpg", "怒り": "964606d0-image.jpg", "笑顔": "a1dc1c69-image.png"}),
  "yugami": ("L", {"ふつう": "0ba936c5-image.png", "おどろき": "2b8ee998-image.jpg", "笑顔": "ef7da7f5-image.jpg", "怒り": "2c3b7c90-image.jpg"}),
  "mina":   ("L", {"ふつう": "caa940f8-image.jpg", "笑顔": "297aba3f-image.png"}),
  "tokei":  ("L", {"ふつう": "196b438e-image.png"}),
}
EXP = {"ふつう": "normal", "おどろき": "surprise", "笑顔": "smile", "怒り": "angry"}

def load(f):
    im = Image.open(SRC / f).convert("RGB")
    h = round(im.height * W / im.width)
    return im.resize((W, h), Image.LANCZOS)

def bbox(arr, side):
    half = arr.shape[1] // 2
    sub = arr[:, half:] if side == "R" else arr[:, :half]
    ink = (sub.min(axis=2) < 225)
    lab, n = ndimage.label(ink)
    if n == 0: raise SystemExit("絵が見つからない")
    sizes = ndimage.sum(ink, lab, range(1, n + 1))
    big = lab == (int(np.argmax(sizes)) + 1)
    big = ndimage.binary_dilation(big, iterations=8) & ink | big   # 近くの細い線も入れる
    ys, xs = np.where(ink & ndimage.binary_dilation(big, iterations=40))
    off = half if side == "R" else 0
    return xs.min() + off, ys.min(), xs.max() + off, ys.max()

def to_alpha(im):
    a = np.asarray(im).astype(int)
    white = (a.min(axis=2) > 246)
    lab, n = ndimage.label(white)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bg = np.isin(lab, list(border))
    alpha = np.where(bg, 0, 255).astype(np.uint8)
    alpha = np.asarray(Image.fromarray(alpha).filter(ImageFilter.GaussianBlur(1.2)))
    rgba = np.dstack([a.astype(np.uint8), alpha])
    return Image.fromarray(rgba, "RGBA")

OUT.mkdir(exist_ok=True)
for name, (side, exps) in CHARS.items():
    ims = {e: load(f) for e, f in exps.items()}
    boxes = [bbox(np.asarray(im), side) for im in ims.values()]
    x0 = min(b[0] for b in boxes); y0 = min(b[1] for b in boxes); x1 = max(b[2] for b in boxes); y1 = max(b[3] for b in boxes)
    size = max(x1 - x0, y1 - y0) + 40
    cx = (x0 + x1) // 2
    bottom = y1 + 10
    left, top = cx - size // 2, bottom - size
    for e, im in ims.items():
        canvas = Image.new("RGB", (size, size), (255, 255, 255))
        canvas.paste(im.crop((max(left, 0), max(top, 0), min(left + size, im.width), min(top + size, im.height))), (max(-left, 0), max(-top, 0)))
        face = to_alpha(canvas).resize((512, 512), Image.LANCZOS)
        out = OUT / f"{name}_{EXP[e]}.webp"
        face.save(out, "WEBP", quality=88, method=6)
        print(out.name, out.stat().st_size // 1024, "KB")
