const SHOTDIR = process.env.SHOT || '/tmp/';   // スクショの保存先（環境変数 SHOT で変えられる）
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + process.argv[2]);
  await p.mouse.click(10, 10);
  const r = await p.evaluate(async () => {
    const out = {};
    for (const [D, k] of [...Object.keys(BGM_DATA).map(k => [BGM_DATA, k]), ...Object.keys(SE_DATA).map(k => [SE_DATA, k])]) {
      const bin = atob(D[k].d), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
      try { const buf = await SE.ac().decodeAudioData(u.buffer); out[k] = [buf.duration.toFixed(2), (D[k].le||0).toFixed(2)]; } catch (e) { out[k] = 'ERR ' + e; }
    }
    return { out, key: BGM.key, st: SE.ac().state };
  });
  console.log(JSON.stringify(r)); console.log('ERR', errs);
  await b.close();
})();
