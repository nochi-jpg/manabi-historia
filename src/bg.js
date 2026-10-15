/* 影絵背景（すべてコードで描く） */
const BG = (() => {
  const NS = "http://www.w3.org/2000/svg", W = 1600, H = 900;
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const el = (t, a, p) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; };
  function sky(svg, id, stops) {
    const d = el("defs", {}, svg); const g = el("linearGradient", { id, x1: 0, y1: 0, x2: 0, y2: 1 }, d);
    stops.forEach(([o, c]) => el("stop", { offset: o, "stop-color": c }, g));
    el("rect", { width: W, height: H, fill: `url(#${id})` }, svg); return d;
  }
  function glow(defs, id, color) { const g = el("radialGradient", { id }, defs); el("stop", { offset: 0, "stop-color": color, "stop-opacity": .9 }, g); el("stop", { offset: 1, "stop-color": color, "stop-opacity": 0 }, g); }
  function person(p, x, y, s, fill, spear) {
    const g = el("g", { transform: `translate(${x},${y}) scale(${s})`, fill }, p);
    el("circle", { cx: 0, cy: -118, r: 14 }, g);
    el("path", { d: "M-14-100 Q0-108 14-100 L20-50 L12-50 L10 0 L2 0 L0-40 L-2 0 L-10 0 L-12-50 L-20-50Z" }, g);
    if (spear) el("path", { d: "M18-96 L70-170 L74-167 L22-93Z M70-170 L82-186 L76-166Z" }, g);
  }
  const scenes = {
    縄文: { ground: "#3d1f12", draw(svg) {
      const d = sky(svg, "skyJ", [[0, "#f08a4b"], [.55, "#f7c376"], [1, "#fbe7b5"]]);
      glow(d, "sunJ", "#fff4cf"); glow(d, "fireJ", "#ffb347");
      el("circle", { cx: 1150, cy: 520, r: 260, fill: "url(#sunJ)" }, svg);
      el("circle", { cx: 1150, cy: 520, r: 90, fill: "#fff1c9" }, svg);
      el("path", { d: "M0 560 Q220 450 440 530 T880 500 T1300 470 T1600 520 V900 H0Z", fill: "#d58a57", opacity: .75 }, svg);
      const f = el("g", { fill: "#9a5634" }, svg);
      el("path", { d: "M0 640 Q400 600 800 630 T1600 610 V900 H0Z" }, f);
      for (let x = -20; x < 1640; x += 38 + rnd() * 30) { const h = 90 + rnd() * 110, w = 40 + rnd() * 30, y = 630 - rnd() * 20;
        el("path", { d: `M${x} ${y} Q${x - w * .6} ${y - h * .5} ${x} ${y - h} Q${x + w * .6} ${y - h * .5} ${x} ${y}Z` }, f); }
      const n = el("g", { fill: "#3d1f12" }, svg);
      el("path", { d: "M0 760 Q300 700 640 730 T1200 720 T1600 740 V900 H0Z" }, n);
      el("path", { d: "M1320 735 Q1400 660 1500 735Z" }, n);
      const hut = (x, y, s) => { const g = el("g", { transform: `translate(${x},${y}) scale(${s})` }, n);
        el("path", { d: "M-120 0 Q-80-70-12-160 L12-160 Q80-70 120 0Z" }, g);
        el("path", { d: "M-20-150 L-40-195 M20-150 L40-195 M-6-160 L-14-200 M6-160 L14-200", stroke: "#3d1f12", "stroke-width": 6 }, g);
        el("path", { d: "M-24 0 L-24-40 Q0-56 24-40 L24 0Z", fill: "#f7c376", opacity: .35 }, g); };
      hut(330, 735, 1); hut(620, 728, .8); hut(900, 740, 1.1);
      el("path", { d: "M900 545 q-20-40 10-80 t0-90", stroke: "#fff", fill: "none", "stroke-width": 10, opacity: .35, "stroke-linecap": "round" }, svg);
      el("circle", { cx: 760, cy: 745, r: 80, fill: "url(#fireJ)" }, svg);
      el("path", { d: "M745 750 Q750 715 760 700 Q770 715 775 750Z", fill: "#ffcf6b" }, svg);
      person(n, 140, 760, 1, "#3d1f12", true);
    } },
    江戸: { ground: "#0a1122", draw(svg) {
      const d = sky(svg, "skyE", [[0, "#0f1a36"], [.6, "#34508a"], [1, "#8fa8d4"]]);
      glow(d, "lanE", "#ffb04a"); glow(d, "moonE", "#f6efd6");
      el("circle", { cx: 1460, cy: 300, r: 160, fill: "url(#moonE)", opacity: .6 }, svg);
      el("circle", { cx: 1460, cy: 300, r: 58, fill: "#f6efd6" }, svg);
      for (let i = 0; i < 40; i++) el("circle", { cx: rnd() * W, cy: 120 + rnd() * 380, r: 1 + rnd() * 1.8, fill: "#fff", opacity: .5 + rnd() * .5 }, svg);
      el("path", { d: "M380 600 L700 330 Q740 300 780 330 L1100 600Z", fill: "#4a6699" }, svg);
      el("path", { d: "M640 380 L700 330 Q740 300 780 330 L840 380 L800 372 L770 392 L740 370 L705 392 L680 372Z", fill: "#dfe7f5" }, svg);
      const c = el("g", { fill: "#1d2c52" }, svg);
      el("path", { d: "M0 660 Q400 630 800 650 T1600 640 V900 H0Z" }, c);
      el("path", { d: "M1040 660 L1080 560 L1320 560 L1360 660Z" }, c);
      const tier = (cx, y, w) => { el("rect", { x: cx - w / 2, y: y - 60, width: w, height: 60 }, c);
        el("path", { d: `M${cx - w / 2 - 40} ${y - 55} Q${cx - w / 2 - 10} ${y - 62} ${cx - w / 2 + 5} ${y - 90} L${cx + w / 2 - 5} ${y - 90} Q${cx + w / 2 + 10} ${y - 62} ${cx + w / 2 + 40} ${y - 55}Z` }, c); };
      tier(1200, 560, 200); tier(1200, 470, 150); tier(1200, 380, 100);
      el("path", { d: "M1160 290 L1180 270 L1220 270 L1240 290Z" }, c);
      const n = el("g", { fill: "#0a1122" }, svg);
      el("rect", { x: 0, y: 760, width: W, height: 140 }, n);
      let x = -10; while (x < W) { const w = 110 + rnd() * 80, h = 60 + rnd() * 40;
        el("rect", { x, y: 760 - h, width: w, height: h }, n);
        el("path", { d: `M${x - 12} ${760 - h + 4} L${x + w / 2} ${760 - h - 42} L${x + w + 12} ${760 - h + 4}Z` }, n);
        if (rnd() > .4) { const lx = x + w * .3; el("circle", { cx: lx, cy: 740, r: 46, fill: "url(#lanE)" }, svg);
          el("rect", { x: lx - 9, y: 726, width: 18, height: 28, rx: 8, fill: "#ffc76b" }, svg); }
        x += w + 6; }
    } },
    現代: { ground: "#170c22", draw(svg) {
      const d = sky(svg, "skyM", [[0, "#2a1b4f"], [.5, "#b8507a"], [1, "#f7b26a"]]);
      glow(d, "sunM", "#ffd9a0");
      el("circle", { cx: 420, cy: 600, r: 280, fill: "url(#sunM)" }, svg);
      el("circle", { cx: 420, cy: 600, r: 100, fill: "#ffe2b5" }, svg);
      const f = el("g", { fill: "#8a4a7c", opacity: .75 }, svg);
      let x = 0; while (x < W) { const w = 50 + rnd() * 70, h = 120 + rnd() * 220; el("rect", { x, y: 640 - h, width: w, height: h + 10 }, f); x += w + 4; }
      const t = el("g", { fill: "#4a2758" }, svg);
      el("path", { d: "M1240 640 L1280 380 L1290 220 L1296 150 L1300 150 L1306 220 L1316 380 L1356 640 L1330 640 L1298 410 L1266 640Z" }, t);
      el("rect", { x: 1266, y: 350, width: 64, height: 26, rx: 6 }, t); el("rect", { x: 1278, y: 250, width: 40, height: 18, rx: 5 }, t);
      const m = el("g", { fill: "#3a2050" }, svg); x = -20;
      while (x < W) { const w = 90 + rnd() * 90, h = 140 + rnd() * 170;
        if (x < 1200 || x > 1380) { el("rect", { x, y: 720 - h, width: w, height: h + 10 }, m);
          for (let wy = 720 - h + 16; wy < 700; wy += 26) for (let wx = x + 12; wx < x + w - 14; wx += 22) if (rnd() > .6) el("rect", { x: wx, y: wy, width: 10, height: 12, fill: "#ffd479", opacity: .85 }, svg); }
        x += w + 14; }
      const n = el("g", { fill: "#170c22" }, svg);
      el("rect", { x: 0, y: 790, width: W, height: 110 }, n);
      el("rect", { x: 0, y: 690, width: W, height: 14 }, n);
      for (let px = 60; px < W; px += 220) el("rect", { x: px, y: 700, width: 18, height: 100 }, n);
      el("rect", { x: 700, y: 634, width: 620, height: 52, rx: 20 }, n);
      for (let wx = 730; wx < 1290; wx += 46) el("rect", { x: wx, y: 646, width: 28, height: 18, rx: 3, fill: "#ffe9a8", opacity: .9 }, svg);
      el("rect", { x: 180, y: 720, width: 420, height: 80 }, n);
      el("rect", { x: 350, y: 690, width: 80, height: 40 }, n);
      [140, 700, 1260].forEach(px => { el("rect", { x: px, y: 610, width: 10, height: 180 }, n); el("rect", { x: px - 24, y: 624, width: 58, height: 6 }, n); });
      el("path", { d: "M140 628 Q420 668 705 628 Q985 668 1265 628 Q1430 655 1600 640", stroke: "#170c22", "stroke-width": 3, fill: "none" }, svg);
    } },
    夜: { ground: "#05060c", draw(svg) { sky(svg, "skyN", [[0, "#05060c"], [1, "#1b1d33"]]);
      for (let i = 0; i < 60; i++) el("circle", { cx: rnd() * W, cy: rnd() * 700, r: .8 + rnd() * 1.6, fill: "#fff", opacity: .3 + rnd() * .5 }, svg); } },
    時空: { ground: "#120a26", draw(svg) {
      const d = el("defs", {}, svg); const g = el("radialGradient", { id: "warp", cx: .5, cy: .45, r: .8 }, d);
      [[0, "#fff6d6"], [.15, "#b98cff"], [.5, "#3b1d7a"], [1, "#0b0620"]].forEach(([o, c]) => el("stop", { offset: o, "stop-color": c }, g));
      el("rect", { width: W, height: H, fill: "url(#warp)" }, svg);
      for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; el("path", { d: `M800 400 L${800 + Math.cos(a) * 1200} ${400 + Math.sin(a) * 1200}`, stroke: "#fff", "stroke-width": 2 + rnd() * 3, opacity: .15 + rnd() * .2 }, svg); }
    } },
  };
  function render(key) {
    seed = 7;
    const sc = scenes[key] || scenes["夜"];
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: "xMidYMid slice" });
    sc.draw(svg);
    // セリフ枠に隠れないよう、景色を上へずらす（空はそのまま）
    if (key !== "夜" && key !== "時空") {
      const g = el("g", { transform: "translate(0,-120)" });
      [...svg.childNodes].slice(2).forEach(c => g.appendChild(c)); svg.appendChild(g);
      el("rect", { x: 0, y: H - 130, width: W, height: 130, fill: sc.ground }, svg);
    }
    return svg;
  }
  return { render, keys: Object.keys(scenes) };
})();
