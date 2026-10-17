#!/usr/bin/env python3
"""モブの影絵（バストアップ）を作る。
使い方：python3 tools/make_sil.py <イラスト緑花のsiruettoフォルダ> <お年寄り1.png> <お年寄り2.png> ...
出力：art/sil_<種類><番号>.webp（黒い影絵・背景透明・256px）
※素材サイトの規約で素材そのものの再配布は禁止なので、出力は .gitignore して公開リポジトリには入れない。
  ゲーム（index.html）に組みこんで使うのは可。出典は CREDITS に書く。
  素材：イラスト緑花 https://illust-ryokka.jp/ ／ イラストカット https://illustcut.com/"""
import sys, pathlib
import numpy as np
from PIL import Image

OUT = pathlib.Path(__file__).resolve().parent.parent / "art"
RYOKKA = pathlib.Path(sys.argv[1])
OLD = [pathlib.Path(p) for p in sys.argv[2:]]
S = 256
# 種類: [(ファイル, 大きさ)]　こどもは小さめに置いて、大人と見分けられるようにする
SET = {
  "m": [("Silhouette-67.png", 1), ("Silhouette-68.png", 1), ("Silhouette-69.png", 1), ("Silhouette-70.png", 1)],
  "w": [("Silhouette-18.png", 1), ("Silhouette-19.png", 1), ("Silhouette-20.png", 1), ("Silhouette-21.png", 1),
        ("Silhouette-43.png", 1), ("Silhouette-44.png", 1)],
  "c": [("Silhouette-17.png", .78), ("Silhouette-45.png", .78), ("Silhouette-69.png", .74)],
}

def black(im):
    a = np.asarray(im.convert("RGBA"))[:, :, 3]
    out = np.zeros((*a.shape, 4), np.uint8); out[:, :, 3] = a
    return Image.fromarray(out, "RGBA")

def place(fig, scale):
    """影絵を正方形の下はしにそろえて置く（高さ＝正方形の88%×scale）"""
    bb = fig.getchannel("A").point(lambda v: 255 if v > 20 else 0).getbbox()
    fig = fig.crop(bb)
    h = int(S * .88 * scale); w = round(fig.width * h / fig.height)
    if w > S * .96 * scale: w = int(S * .96 * scale); h = round(fig.height * w / fig.width)
    fig = fig.resize((w, h), Image.LANCZOS)
    sq = Image.new("RGBA", (S, S)); sq.paste(fig, ((S - w) // 2, S - h), fig)
    return sq

OUT.mkdir(exist_ok=True)
for kind, items in SET.items():
    for i, (f, sc) in enumerate(items, 1):
        place(black(Image.open(RYOKKA / f)), sc).save(OUT / f"sil_{kind}{i}.webp", "WEBP", quality=90)
# お年寄り：全身の絵から、頭と肩のあたりだけ切りぬく
for i, p in enumerate(OLD, 1):
    fig = black(Image.open(p))
    bb = fig.getchannel("A").point(lambda v: 255 if v > 20 else 0).getbbox()
    fig = fig.crop(bb)
    top = fig.crop((0, 0, fig.width, int(fig.height * .40)))
    big = top.resize((top.width * 4, top.height * 4), Image.LANCZOS)        # 小さい絵なので、大きくしてからふちを整える
    a = np.asarray(big.getchannel("A")); a = np.where(a > 110, 255, 0).astype(np.uint8)
    big.putalpha(Image.fromarray(a))
    place(big, .95).save(OUT / f"sil_o{i}.webp", "WEBP", quality=90)
print("ok")
