"""ユーフルカのループ素材（〇〇_loop.ogg）を、ゲームに入れる軽い音（モノラル・Opus 18kbps）に作り直す。
使い方： python3 tools/make_bgm.py ダウンロードした素材のフォルダ
できた音は audio/bgm/ に入る（素材の再配布にあたるので、リポジトリには入れない）"""
import sys, subprocess, pathlib
R = pathlib.Path(__file__).resolve().parent.parent
src = pathlib.Path(sys.argv[1])
out = R/"audio/bgm"; out.mkdir(parents=True, exist_ok=True)
for line in (R/"data/bgm.txt").read_text(encoding="utf-8").splitlines():
    if not line.strip() or line.startswith("#"): continue
    f = line.split("|")[1].strip()
    hit = [p for p in src.rglob(f + "_loop.ogg") if "Unity" not in str(p)]
    if not hit: print("みつからない:", f); continue
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(hit[0]), "-ac", "1", "-c:a", "libopus", "-b:a", "18k", "-vbr", "constrained", "-application", "audio", str(out/(f + ".ogg"))], check=True)
    print("OK", f)
