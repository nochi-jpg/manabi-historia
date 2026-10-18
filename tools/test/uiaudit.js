// 下まわりのUIをスクショ＋はみ出し検出
const SHOTDIR = process.env.SHOT || '/tmp/';   // スクショの保存先（環境変数 SHOT で変えられる）
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + process.argv[2]);
  const over = async (tag) => p.evaluate((tag) => {
    // 枠(親)の外に子がはみ出していないか：.zdetail .hand .inbox .cardget .result .tbox
    const out = [];
    document.querySelectorAll('.zdetail,.hand,.inbox,.cardget,.result,#talk,.tl-panel,.sum,.tbox').forEach(box => {
      if (!box.offsetParent && box.id !== 'talk') return;
      const R = box.getBoundingClientRect(); if (!R.width) return;
      box.querySelectorAll('*').forEach(el => {
        const r = el.getBoundingClientRect(); if (!r.width || !r.height) return;
        if (r.bottom > R.bottom + 1 || r.right > R.right + 1 || r.top < R.top - 1) out.push(tag + ': ' + box.className + ' > ' + el.tagName + '.' + el.className + ' ' + Math.round(r.bottom - R.bottom));
      });
    });
    return out.slice(0, 8);
  }, tag);
  await p.evaluate(() => { Object.keys(CARDS).forEach(n => SAVE.cards[n] = 1); SAVE.stars[0] = 5; });
  await p.click('text=カードずかん'); await p.waitForTimeout(300);
  await p.click('.card:has-text("中国の歴史書")').catch(()=>{});
  // 2ページ目にあるとき
  for (let k = 0; k < 3; k++) { if (await p.locator('.card:has-text("中国の歴史書")').isVisible()) break; await p.click('.pg-arrow >> nth=1'); await p.waitForTimeout(150); }
  await p.click('.card:has-text("中国の歴史書")'); await p.waitForTimeout(200);
  console.log(await over('zukan')); await p.screenshot({ path: SHOTDIR + 'ua1.png' });
  await p.evaluate(() => { showTitle(); }); await p.evaluate(() => showSelect({ no: 3 })); await p.waitForTimeout(300);
  await p.screenshot({ path: SHOTDIR + 'ua2.png' }); console.log(await over('tl'));
  await p.click('.tp-btns .btn.red'); await p.waitForTimeout(80); await p.screenshot({ path: SHOTDIR + 'ua3.png' });
  await p.waitForTimeout(4000);
  await p.evaluate(() => { S.hand = Object.keys(CARDS).slice(24, 36); S.narrow = false; chooseCard("この 証言と 矛盾する カードを つきつけろ！", null, { who: "ワカタケル大王", text: "わしの 名を きざんだ 剣は、東の はての 豪族にしか おくって おらぬ。" }); });
  await p.waitForTimeout(300); await p.click('.hand .card >> nth=0'); await p.waitForTimeout(200);
  console.log(await over('choose')); await p.screenshot({ path: SHOTDIR + 'ua4.png' });
  console.log('ERR', errs); await b.close();
})();
