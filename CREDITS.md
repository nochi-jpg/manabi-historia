# クレジット

- 企画・ゲームデザイン・キャラクターデザイン：のち（まなび堂）
- 音楽：ユーフルカ https://youfulca.com/music_assets/?scene=dungeon_stage
  - 曲名はゲーム内のスタッフロールに表示（data/bgm.txt）
  - ※素材の再配布にあたるので、音のファイル（audio/）はリポジトリに入れていません。作り直すときは `python3 tools/make_bgm.py 素材のフォルダ`
- 効果音：効果音ラボ https://soundeffect-lab.info/
  - 使っている音と場面は data/se.txt。音のファイル（audio/）はリポジトリに入れていません。作り直すときは `python3 tools/make_se.py 素材のフォルダ`
- カードの写真
  - ColBase（国立文化財機構所蔵品統合検索システム） https://colbase.nich.go.jp/ （東京・京都・奈良・九州国立博物館の所蔵品）
  - ウィキメディア・コモンズ、ジャパンサーチ経由の各館（茅ヶ崎市博物館、JOMON ARCHIVES など）
  - 1枚ごとの作者・ライセンス・出典URLは `data/cardimg.txt`。ゲーム内のスタッフロールにも表示
  - CC BY-SA の写真は、縮小・切り抜きしたもの（cardimg/）も同じ CC BY-SA で提供します
- フォント：Zen Kaku Gothic New（SIL Open Font License 1.1）
- モブキャラクターのシルエット素材
  - イラスト緑花 https://illust-ryokka.jp/
  - イラストカット https://illustcut.com/
  - ※素材そのものの再配布は禁止のため、素材ファイル（art/sil_*.webp）はリポジトリに入れていません。
    作り直すときは、素材をダウンロードして `python3 tools/make_sil.py` を実行してください。
