// 第1話を自動で通しプレイ。わざと1回まちがえる。各場面でスクショ
const SHOTDIR = process.env.SHOT || '/tmp/';   // スクショの保存先（環境変数 SHOT で変えられる）
const { chromium } = require('playwright');
const EPN = Number(process.argv[3] || 1);
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1366, height: 768 } });
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text()); });
  await p.goto('file://' + process.argv[2]);
  await p.evaluate(() => { window.BLOG = []; const o = BGM.play.bind(BGM); BGM.play = (k, x) => { const L = window.BLOG; if (L[L.length-1] !== k) L.push(k); return o(k, x); }; });
  const shot = n => p.screenshot({ path: `${SHOTDIR}b${EPN}_${n}.png` });
  await p.waitForTimeout(1300);
  if (await p.$('.inbox input')) { await shot('00name'); await p.fill('.inbox input', 'てすと'); await p.click('text=けってい'); await p.waitForTimeout(300); }   // はじめての 起動：名前
  await shot('00title');
  // じゅもん
  await p.click('text=じゅもんを 入れる'); await p.fill('.inbox input', ({1:'なわめのつぼ',2:'たかゆかのくら',3:'はにわのまもり',4:'いかるがのとう',5:'たいかのよあけ',6:'てんぴょうのはな',7:'じゅうにひとえ',8:'へいけのあかはた',9:'かまくらのやかた',10:'はかたのいしがき',11:'すみえのやまなみ',12:'あづちのてんしゅ',13:'おおさかのしろ',14:'えどのまちなみ',15:'いのうのあしあと',16:'くろふねのけむり',17:'れんがのまち',18:'れんがのまち',19:'せかいへのふなで',20:'せかいへのふなで',21:'そかいのよぞら',22:'あたらしいけんぽう',23:'ときのきりのむこう',24:'えんのとびら',25:'ぎんのとけい',26:'ぎんのとけい'}[EPN])); await p.click('text=けってい');
  await p.waitForTimeout(200); await shot('01spell'); await p.click('.inbox .btn');
  await p.click('text=おはなしを えらぶ'); await p.waitForTimeout(200); await shot('02select');
  await p.evaluate(n => showSelect({no:n}), EPN); await p.waitForTimeout(200); await shot('02b_tl'); await p.click('.tp-btns .btn.red'); await p.waitForTimeout(300);
  const ep = await p.evaluate(n => EPS[n], EPN);
  const tap = async (x, o) => { try { if (typeof x === 'string') await p.click(x, {timeout:2000}); else await x.click({timeout:2000}); } catch (e) {} };
  const pickCard = async (name) => {
    for (let k = 0; k < 3; k++) {
      const k2 = await p.$$eval('.hand .card .cname', (es, n) => es.findIndex(e => { const x = e.cloneNode(true); x.querySelectorAll('rt').forEach(r => r.remove()); return x.textContent.trim() === n; }), name);   // 名前が完全に一致するカード（「大仏」と「大仏づくりの詔」を取りちがえない）
      const loc = k2 >= 0 ? p.locator('.hand .card').nth(k2) : p.locator(`.hand .card:has-text("${name}")`);
      if (await loc.count() && await loc.first().isVisible()) { await tap(loc.first()); return; }
      await tap('.hand .pg-arrow >> nth=1'); await p.waitForTimeout(150);
    }
  };
  const rubyBad = new Set();
  const checkRuby = async () => {
    const bad = await p.evaluate(() => {
      const out = [];
      document.querySelectorAll('rt').forEach(rt => {
        const r = rt.getBoundingClientRect(); if (!r.width) return;
        const box = rt.closest('#talk,.tbox,.banner,.guide,.btn,.claim,.hand-quote,.hand-detail,.hv-detail,.zdetail,.paper,.cardget,.inbox,.log-row,.tag,.big,.t-sub,.t-title,.slot,.fan-title');
        if (!box) return; const b = box.getBoundingClientRect();
        if (r.top < b.top - 1 || r.bottom > b.bottom + 1) out.push((box.className || box.id) + ':' + rt.parentElement.textContent.slice(0, 12));
      });
      return out;
    });
    bad.forEach(x => rubyBad.add(x));
  };
  let shots = new Set(), wrongDone = false, window_backDone = false, window_navTested = false;
  for (let step = 0; step < 2000; step++) {
    await p.waitForTimeout(120); if (step % 3 === 0) await checkRuby();
    const st = await p.evaluate(() => ({
      talk: !document.querySelector('#talk').hidden,
      modal: !document.querySelector('#modal').hidden,
      modalKind: document.querySelector('#modal').firstChild?.className || '',
      node: S && S.node ? S.node.t : null, menu: !S,
      hand: S ? S.hand.slice() : [],
    }));
    if (step % 40 === 0) console.log('DBG', step, JSON.stringify(st), await p.evaluate(() => S && [S.hearts, S.busy, S.idx, window.__ans]));
    if (st.menu) { await p.waitForTimeout(300); await shot('99result'); break; }
    if (st.node && !shots.has(st.node + (st.node==='inv'?await p.evaluate(()=>S.idx):'')) && !st.talk && !st.modal) { shots.add(st.node + (st.node==='inv'?await p.evaluate(()=>S.idx):'')); await p.waitForTimeout(1900); await shot('n_' + st.node); continue; }
    if (st.modal) {
      if (st.modalKind === 'hand') {
        const title = await p.textContent('.hand-title');
        // 正解を探す
        const node = await p.evaluate(() => S.node);
        let ans = null;
        ans = await p.evaluate(() => window.__ans);
        if (ans === 'BACK') { await p.evaluate(() => window.__ans = null); await tap('.hand .btn.sub'); continue; }
        if (!wrongDone) { wrongDone = true; await shot('hand'); const other = (await p.$$eval('.hand .card .cname', es => es.map(e => e.textContent))).find(h => h !== ans); await tap(`.hand .card:has-text("${other}")`); await p.waitForTimeout(150); await shot('hand_detail'); await tap('.hand .btn.red'); continue; }
        try { await pickCard(ans); await tap('.hand .btn.red'); } catch(e) { console.log("FAILCLICK", node.t, JSON.stringify(ans), title); continue; } continue;
      }
      await tap('#modal .btn >> nth=0'); continue;
    }
    if (st.talk) { if (!shots.has('talk')) { shots.add('talk'); await shot('talk'); } await tap('#talk'); continue; }
    if (st.node === 'inv') { const el = await p.$('.prop:not(.done)'); if (el) await tap(el); continue; }
    if (st.node === 'spot') {
      const node = await p.evaluate(() => S.node);
      const props = await p.$$('.prop');
      if (!window_backDone) { window_backDone = true; const i = node.items.findIndex(x => !x.bad); await p.evaluate(() => window.__ans = 'BACK'); await tap(props[i]); continue; }
      for (let i = 0; i < node.items.length; i++) { const it = node.items[i]; if (!it.bad) continue;
        const cls = await props[i].getAttribute('class'); if (cls.includes('fixed')) continue;
        await p.evaluate(a => window.__ans = a, it.card); await tap(props[i]); break; }
      continue; }
    if (st.node === 'testi') {
      const info = await p.evaluate(() => { const c = document.querySelector('.tbox .tcount'); const g = document.querySelector('.guide'); return c && g ? [c.textContent, g.textContent] : null; });
      if (!info) continue;
      const node = await p.evaluate(() => S.node);
      const r = Number(info[1].match(/（(\d+) \//)[1]) - 1; const i = Number(info[0].split('/')[0]) - 1;
      const lieIdx = node.rounds[r].lines.findIndex(x => x.lie);
      if (!window_navTested) { window_navTested = true; await tap('.tnav .btn >> nth=0'); await p.waitForTimeout(400); await shot('testi_prev'); continue; }
      if (i !== lieIdx) { await tap('.tnav .btn >> nth=2'); continue; }
      await p.evaluate(a => window.__ans = a, node.rounds[r].lines[lieIdx].card); await tap('.tnav .btn >> nth=1'); continue;
    }
    if (st.node === 'battle') {
      const claims = await p.$$('.claim');
      const node = await p.evaluate(() => S.node);
      // 今のラウンドのウソを探す
      const texts = await Promise.all(claims.map(c => c.evaluate(e => { const x = e.cloneNode(true); x.querySelectorAll('rt').forEach(r => r.remove()); return x.textContent; })));
      for (const r of node.rounds) for (let i = 0; i < r.length; i++) if (r[i].lie && texts.some(t => t.includes(r[i].text.replace(/《[^》]*》/g, '')))) {
        const idx = texts.findIndex(t => t.includes(r[i].text.replace(/《[^》]*》/g, '')));
        if (idx >= 0) { await p.evaluate(a => window.__ans = a, r[i].card); await tap(claims[idx]); }
      }
      continue;
    }
    if (st.node === 'guard') {   // 記録を守る：まだ 守っていない 記録に 正解の カード
      const recs = await p.$$('.record'); const node = await p.evaluate(() => S.node);
      for (let i = 0; i < recs.length; i++) { const cls = await recs[i].getAttribute('class'); if (cls.includes('safe')) continue;
        await p.evaluate(a => window.__ans = a, node.items[i].card); await tap(recs[i]); break; }
      continue;
    }
    if (st.node === 'sum') { const el = await p.$('.slot:not(.ok)'); if (el) { const a = await el.getAttribute('data-ans'); await p.evaluate(a => window.__ans = a, a); await tap(el); } continue; }
  }
  const save = await p.evaluate(() => JSON.stringify(SAVE));
  console.log('SAVE', save);
  console.log('RUBY_OVERFLOW', JSON.stringify([...rubyBad]));
  console.log('ERR', errs);
  console.log('BGM', JSON.stringify(await p.evaluate(() => window.BLOG)));
  await b.close();
})();
