// つなぎ目チェック：時代を選んでから最初の場面まで、50msごとに背景のキーを記録
const SHOTDIR = process.env.SHOT || '/tmp/';   // スクショの保存先（環境変数 SHOT で変えられる）
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + process.argv[2]);
  for (const no of [1, 2, 3, 4, 0]) {
    await p.evaluate(() => { SAVE.stars = { 0: 5 }; SAVE.resume = null; });
    await p.evaluate(n => { showSelect({ no: n }); }, no); await p.waitForTimeout(200);
    await p.click('.tp-btns .btn.red');
    const seen = [];
    for (let k = 0; k < 90; k++) {
      const st = await p.evaluate(() => [CUR_BG, !!document.querySelector('.titlecard:not(.out)'), getComputedStyle(document.querySelector('.titlecard') || document.body).opacity]);
      const key = st[0] + (st[1] ? '(幕)' : '');
      if (seen[seen.length - 1] !== key) seen.push(key);
      if (!st[1] && await p.isVisible('#talk')) break;
      await p.waitForTimeout(50);
    }
    console.log('第' + no + '話:', seen.join(' → '), '最初の場面', await p.evaluate(() => CUR_BG));
    await p.goto('file://' + process.argv[2]);
  }
  console.log('ERR', errs); await b.close();
})();
