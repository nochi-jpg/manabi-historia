"""効果音ラボの素材（mp3）を、ゲームに入れる軽い音（モノラル・Opus）に作り直す。
使い方： python3 tools/make_se.py 素材のフォルダ  → audio/se/呼び名.ogg（リポジトリには入れない）"""
import sys, subprocess, pathlib
R = pathlib.Path(__file__).resolve().parent.parent
src = pathlib.Path(sys.argv[1]); out = R/"audio/se"; out.mkdir(parents=True, exist_ok=True)
for line in (R/"data/se.txt").read_text(encoding="utf-8").splitlines():
    if not line.strip() or line.startswith("#"): continue
    key, f, st, du, vol, use = [x.strip() for x in line.split("|")]
    hit = list(src.rglob(f + ".mp3"))
    if not hit: print("みつからない:", f); continue
    st, du = float(st), float(du)
    af = []
    if du > 0:   # 切り出す音は、さいごをフェードアウト（長いものは1秒、短いものは0.05秒）
        fo = 1.0 if du >= 3 else .05
        af.append(f"afade=t=out:st={du - fo}:d={fo}")
    cmd = ["ffmpeg", "-v", "error", "-y", "-ss", str(st), "-i", str(hit[0])] + (["-t", str(du)] if du > 0 else []) + (["-af", ",".join(af)] if af else []) + ["-ac", "1", "-c:a", "libopus", "-b:a", "40k", str(out/(key + ".ogg"))]
    subprocess.run(cmd, check=True)
print("OK", len(list(out.glob("*.ogg"))))
