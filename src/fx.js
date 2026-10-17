/* まなびヒストリア 演出（効果音・画面効果）
   効果音はすべて WebAudio で合成する（音のファイルは使わない） */
'use strict';
const SE = (() => {
  let ctx = null;
  const ac = () => (ctx = ctx || new (window.AudioContext || window.webkitAudioContext)());
  const on = () => { try { return typeof SAVE === "undefined" || SAVE.opt.se !== false; } catch (e) { return true; } };
  function tone(f, t0, dur, type = "sine", vol = .15, f2 = null) {
    const c = ac(), o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, c.currentTime + t0);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, c.currentTime + t0 + dur);
    g.gain.setValueAtTime(0.0001, c.currentTime + t0);
    g.gain.exponentialRampToValueAtTime(vol, c.currentTime + t0 + .01);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + t0 + dur);
    o.connect(g); g.connect(c.destination); o.start(c.currentTime + t0); o.stop(c.currentTime + t0 + dur + .02);
  }
  function noise(t0, dur, vol = .2, freq = 1200, type = "bandpass", f2 = null) {
    const c = ac(), len = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const s = c.createBufferSource(); s.buffer = buf;
    const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(freq, c.currentTime + t0);
    if (f2) fl.frequency.exponentialRampToValueAtTime(f2, c.currentTime + t0 + dur);
    const g = c.createGain(); g.gain.setValueAtTime(vol, c.currentTime + t0); g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + t0 + dur);
    s.connect(fl); fl.connect(g); g.connect(c.destination); s.start(c.currentTime + t0); s.stop(c.currentTime + t0 + dur);
  }
  const P = {
    click() { tone(1800, 0, .03, "square", .04); },
    card() { [880, 1175, 1568, 2093].forEach((f, i) => tone(f, i * .07, .25, "triangle", .1)); },
    whoosh() { noise(0, .35, .25, 400, "bandpass", 3000); },
    whooshOut() { noise(0, .3, .2, 2500, "bandpass", 300); },
    stamp() { tone(140, 0, .12, "square", .12, 70); noise(0, .08, .15, 800); },
    found() { [660, 880, 1320].forEach((f, i) => tone(f, i * .09, .35, "triangle", .12)); },
    drum() { tone(90, 0, .45, "sine", .5, 45); noise(0, .15, .2, 300, "lowpass"); },
    testimony() { tone(110, 0, .5, "sine", .45, 55); noise(0, .5, .12, 300, "bandpass", 3000); [523, 659, 784].forEach((f, i) => tone(f, .25 + i * .05, .6, "sawtooth", .05)); },
    tame() { tone(60, 0, .5, "sine", .3, 40); },
    objection() { noise(0, .25, .5, 2000, "bandpass", 500); tone(70, 0, .6, "sine", .6, 35); [392, 523, 659, 784].forEach(f => tone(f, .02, .7, "sawtooth", .06)); },
    ronpaBig() { noise(0, .5, .6, 3000, "bandpass", 200); tone(55, 0, 1.2, "sine", .7, 30); [262, 392, 523, 659, 784].forEach(f => tone(f, .05, 1.1, "sawtooth", .07)); },
    wrong() { tone(300, 0, .25, "square", .1, 140); tone(220, .12, .3, "square", .08, 100); },
    bounce() { tone(500, 0, .12, "square", .08, 900); },
    heart() { noise(0, .18, .35, 1500); tone(180, 0, .3, "triangle", .2, 80); },
    heartbeat() { tone(70, 0, .12, "sine", .35, 50); tone(70, .2, .12, "sine", .28, 50); },
    doku() { tone(55, 0, .3, "sine", .45, 40); },
    warp() {
      const c = ac(), o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain(), lfo = c.createOscillator(), lg = c.createGain();
      o.type = "sawtooth"; o2.type = "sawtooth"; o.frequency.value = 55; o2.frequency.value = 58.5;
      lfo.frequency.value = 6; lg.gain.value = 20; lfo.connect(lg); lg.connect(o.frequency);
      const fl = c.createBiquadFilter(); fl.type = "lowpass"; fl.frequency.setValueAtTime(300, c.currentTime); fl.frequency.linearRampToValueAtTime(1600, c.currentTime + 1.2);
      g.gain.setValueAtTime(.0001, c.currentTime); g.gain.exponentialRampToValueAtTime(.25, c.currentTime + .3); g.gain.exponentialRampToValueAtTime(.0001, c.currentTime + 2.2);
      o.connect(fl); o2.connect(fl); fl.connect(g); g.connect(c.destination);
      [o, o2, lfo].forEach(x => { x.start(); x.stop(c.currentTime + 2.3); });
      noise(.2, 1.4, .12, 3000, "highpass");
    },
    growl() {
      const c = ac(), o = c.createOscillator(), g = c.createGain(), lfo = c.createOscillator(), lg = c.createGain(), fl = c.createBiquadFilter();
      o.type = "sawtooth"; o.frequency.setValueAtTime(90, c.currentTime); o.frequency.linearRampToValueAtTime(60, c.currentTime + 1.3);
      lfo.frequency.value = 28; lg.gain.value = 30; lfo.connect(lg); lg.connect(o.frequency);
      fl.type = "lowpass"; fl.frequency.value = 700;
      g.gain.setValueAtTime(.0001, c.currentTime); g.gain.exponentialRampToValueAtTime(.35, c.currentTime + .15); g.gain.exponentialRampToValueAtTime(.0001, c.currentTime + 1.4);
      o.connect(fl); fl.connect(g); g.connect(c.destination); [o, lfo].forEach(x => { x.start(); x.stop(c.currentTime + 1.5); });
      noise(0, 1.2, .15, 250, "lowpass");
    },
    omen() { noise(0, .25, .25, 4000, "highpass"); tone(1200, 0, .3, "sine", .05, 3000); },
    restore() { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * .08, .7, "triangle", .1)); noise(0, .8, .08, 6000, "highpass"); },
    shatter() { noise(0, .5, .4, 5000, "highpass"); [2400, 3100, 1900].forEach((f, i) => tone(f, i * .04, .3, "triangle", .05)); },
    vanish() { noise(0, 1.2, .2, 2000, "bandpass", 200); },
    tick() { tone(2400, 0, .02, "square", .05); },
    swish() { noise(0, .22, .18, 800, "bandpass", 4000); },
    star() { tone(1320, 0, .25, "triangle", .12); tone(1980, .04, .25, "triangle", .06); },
    starGold() { [1047, 1319, 1568, 2093].forEach((f, i) => tone(f, i * .06, .6, "triangle", .1)); },
    timewarp() { noise(0, 1.4, .2, 300, "bandpass", 5000); [400, 600, 900, 1350].forEach((f, i) => tone(f, i * .25, .5, "sine", .07)); },
    thud() { tone(120, 0, .2, "sine", .3, 60); },
  };
  return { play(name) { if (!on()) return; try { P[name] && P[name](); } catch (e) { } } };
})();

/* 画面効果 */
const FX = {
  shake(level = "m") { const s = document.getElementById("stage"); s.classList.remove("shake", "shake-l", "shake-s"); void s.offsetWidth; s.classList.add(level === "l" ? "shake-l" : level === "s" ? "shake-s" : "shake"); },
  flash(color = "#fff", ms = 260) {   // フラッシュは1回ずつ（1秒に3回以下になるよう、呼ぶ側で間をあける）
    const e = document.createElement("div"); e.className = "flash"; e.style.background = color; e.style.animationDuration = ms + "ms";
    document.getElementById("fx").appendChild(e); setTimeout(() => e.remove(), ms + 50);
  },
  add(cls, html, ms) { const e = document.createElement("div"); e.className = cls; if (html) e.innerHTML = html; document.getElementById("fx").appendChild(e); if (ms) setTimeout(() => e.remove(), ms); return e; },
  lines(ms = 900, color) { const e = FX.add("speedlines", "", ms); if (color) e.style.setProperty("--lc", color); return e; },
};
