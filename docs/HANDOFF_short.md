# 引継書（短縮版）— まなびヒストリア

新しいチャットはこれだけ読めばOK。くわしいことは `docs/HANDOFF_next_chat.md`（全部の決まり）・`STORY.md`（設計）・`SCRIPT_GUIDE.md`（台本の書き方と**見直しチェックリスト**）・`MEMO.md`（日ごとの決定）を**必要なときだけ**開く。

## 相手と話し方
- 小学校の先生（のち先生）。プログラミングはほぼ未経験。**返事はいつも日本語**、短く箇条書き。質問は選べる形で3つまで
- 「まだ実装しないで」と言われたら実装しない。先生がOKを出したものはいじらない
- 時代考証の指摘がまちがっていそうなら、根拠をそえてやさしく提案。指摘された種類の問題は、ほかの場所でも探してつぶす

## 進め方（トークン節約）
1. プロット → 台本の下書きを `docs/drafts/epNN_draft.txt` にファイルで出す → 先生が番号で直し → 「OK」で一括実装
2. 実装：素材（顔グラ `tools/make_faces.py`・カード写真）→ `scenarios/epNN.txt` → `python3 build.py`（⚠をなくす）→ `python3 tools/yomi_missing.py`（足りない読みを data/yomi.txt に）→ テスト → commit（日本語一文）→ push。最後に「GitHub Pagesへの反映は1〜2分」
3. テスト：`mkdir -p /tmp/pw && cd /tmp/pw && npm i playwright@1.56.1` → `NODE_PATH=/tmp/pw/node_modules PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node tools/test/play3.js "$PWD/index.html" 話数`（RUBY_OVERFLOW [] と ERR [] ならOK。新しい話は play3.js のじゅもん表に足す）
4. push は add_repo（access:"push"）→ `/home/claude/manabi-historia` に clone して作業
5. `index.html` は消さない（音・影絵は再配布できないので、今の index.html から引きつぐ）
6. 写真：ジャパンサーチAPI（文字だけ）で探す → 候補は1枚の一覧画像で1回だけ確認。ColBaseは `image/slideshow/` と `curl -L`。ないものは描いた絵（make_drawn_cards.py）。make_cardimg.py は新しい行だけの一覧で動かす

## 台本のいちばん大事な決まり
- ひらがな多め・文節ごとに半角スペース。1吹き出し2行まで。絵文字は使わない（モブは影絵 `人:おとこ` など）
- 時代に合わない物・言葉を言わせない。今の言い方は本じいが補足
- 「論破」→「矛盾発見」。本じいは「おしい！」と言わない。答えは言わず「調べるキーワード」と「見るもの」
- **証言は `｛カードに関係する文｝白い気持ちの文`**。矛盾は黄色（｛ ｝）の中だけ。ウソは決め手の一文をもつカード1枚とだけ矛盾
- ユウキの性別がわかる言葉を使わない。ユガミの前で「遥」を出さない。まだ名のっていない名前で呼ばない
- 1話の型：タイムスリップ → 重要人物と絆（長め）→ 調査①（6枚）→ ゆがみ → 調査②（6枚）→ 議論 3パート×4証言 → 論破バトル → まとめ → おくりもの → 記憶のかけら

## いまの進み具合
- 完成：第0〜5話。**次は第6話（大仏をつくれ！・752年・聖武天皇）**。記憶のかけら＝母と二人で大仏を見に行った旅の写真。あいことばは teacher/aikotoba.md（第6話＝だいぶつのてのひら）
- 公開前：`src/engine.js` の `DEBUG_UNLOCK_ALL = true` → false
