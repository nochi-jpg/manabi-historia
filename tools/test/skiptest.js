const SHOTDIR = process.env.SHOT || '/tmp/';   // スクショの保存先（環境変数 SHOT で変えられる）
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + process.argv[2]);
  await p.evaluate(() => { SAVE.stars = { 0: 5, 1: 3 }; SAVE.unlocked = 2; });
  await p.evaluate(() => { playEpisode(1, false); }); await p.waitForTimeout(4500);
  await p.screenshot({ path: SHOTDIR + 'sk1.png' });
  console.log('skip visible', await p.isVisible('.skipbtn'));
  await p.click('.skipbtn'); await p.waitForTimeout(3000);
  console.log('after 3s node', await p.evaluate(() => [S.idx, S.node.t, SKIP]));
  await p.waitForTimeout(6000);
  console.log('after 9s node', await p.evaluate(() => [S.idx, S.node.t, SKIP]));
  await p.screenshot({ path: SHOTDIR + 'sk2.png' });
  // 未クリアの話ではボタンなし
  await p.evaluate(() => { SAVE.stars = { 0: 5 }; location.hash = ''; });
  await p.evaluate(() => { location.reload; playEpisode(2, false); }); await p.waitForTimeout(4500);
  console.log('ep2 skip visible', await p.isVisible('.skipbtn'));
  console.log('ERR', errs); await b.close();
})();
