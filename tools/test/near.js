const SHOTDIR = process.env.SHOT || '/tmp/';   // スクショの保存先（環境変数 SHOT で変えられる）
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + process.argv[2]);
  await p.evaluate(() => {
    const ep = EPS[3]; const n = JSON.parse(JSON.stringify(ep.nodes.find(x => x.t === "testi"))); n.rounds = [n.rounds[2]];
    S = { no: 3, ep, idx: 0, hearts: 5, hand: ep.cards.slice(), aura: [], disguise: {}, narrow: false, narrowCache: {} }; renderHud(); setBg("古墳");
    runTesti(n);
  });
  await p.waitForTimeout(3500);
  for (let k = 0; k < 3; k++) { await p.click('text=次へ ▶'); await p.waitForTimeout(400); }
  await p.click('text=つきつける！'); await p.waitForTimeout(300);
  for (let k = 0; k < 3; k++) { const l = p.locator('.hand .card:has-text("ワカタケルの")'); if (await l.count() && await l.first().isVisible()) { await l.first().click(); break; } await p.click('.hand .pg-arrow >> nth=1'); await p.waitForTimeout(150); }
  await p.click('.hand .btn.red'); await p.waitForTimeout(1500);
  console.log('talk:', await p.evaluate(() => talk.querySelector('.ttext').textContent.slice(0, 40)), 'hearts', await p.evaluate(() => S.hearts));
  console.log(errs); await b.close();
})();
