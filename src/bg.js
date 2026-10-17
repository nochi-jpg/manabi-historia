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
    弥生: { ground: "#2a2410", draw(svg) {
      const d = sky(svg, "skyY", [[0, "#7fb3d6"], [.6, "#cfe3d8"], [1, "#f5ecc8"]]);
      glow(d, "sunY", "#fffbe6");
      el("circle", { cx: 300, cy: 420, r: 220, fill: "url(#sunY)" }, svg);
      el("path", { d: "M0 540 Q300 470 620 520 T1200 500 T1600 530 V900 H0Z", fill: "#8fae7a", opacity: .7 }, svg);
      const fld = el("g", {}, svg);   // 実った田んぼ
      el("path", { d: "M0 620 Q400 590 800 610 T1600 600 V900 H0Z", fill: "#d8b24a" }, fld);
      for (let x = 0; x < 1600; x += 26) el("path", { d: `M${x} 640 q6 -18 12 0`, stroke: "#b8902c", "stroke-width": 3, fill: "none" }, fld);
      const n = el("g", { fill: "#2a2410" }, svg);
      el("path", { d: "M0 740 Q400 715 800 730 T1600 720 V900 H0Z" }, n);
      for (let x = 0; x < 1600; x += 22) el("rect", { x, y: 690 + Math.sin(x / 90) * 6, width: 8, height: 60 }, n);   // さく
      el("rect", { x: 0, y: 738, width: 1600, height: 8 }, n);
      const tower = (x, s) => { const g = el("g", { transform: `translate(${x},735) scale(${s})` }, n);   // 物見やぐら
        el("path", { d: "M-50 0 L-34-210 L-26-210 L-40 0Z M50 0 L34-210 L26-210 L40 0Z" }, g);
        el("rect", { x: -60, y: -230, width: 120, height: 26 }, g); el("path", { d: "M-70-226 L0-290 L70-226Z" }, g);
        el("path", { d: "M-44-120 L44-60 M44-120 L-44-60", stroke: "#2a2410", "stroke-width": 8 }, g); };
      tower(1180, 1); tower(260, .8);
      const kura = (x, s) => { const g = el("g", { transform: `translate(${x},735) scale(${s})` }, n);   // 高床倉庫
        [-60, -20, 20, 60].forEach(px => el("rect", { x: px - 6, y: -90, width: 12, height: 90 }, g));
        el("rect", { x: -80, y: -150, width: 160, height: 60 }, g); el("path", { d: "M-110-140 L0-230 L110-140Z" }, g); };
      kura(560, 1); kura(800, .85);
      person(n, 960, 760, 1, "#2a2410", true);
    } },
    宮殿: { ground: "#0d0805", draw(svg) {
      const d = sky(svg, "skyP", [[0, "#140c08"], [1, "#2c1a10"]]);
      glow(d, "lampP", "#ffb35c");
      el("circle", { cx: 800, cy: 420, r: 520, fill: "url(#lampP)", opacity: .45 }, svg);
      const w = el("g", { fill: "#0d0805" }, svg);
      [120, 420, 1180, 1480].forEach(x => el("rect", { x: x - 22, y: 0, width: 44, height: 900 }, w));   // 柱
      el("rect", { x: 0, y: 0, width: 1600, height: 70 }, w); el("rect", { x: 0, y: 760, width: 1600, height: 140 }, w);
      for (let x = 470; x < 1140; x += 14) el("rect", { x, y: 90, width: 5, height: 560, fill: "#c99a5b", opacity: .5 }, svg);   // すだれ
      el("rect", { x: 460, y: 80, width: 690, height: 18, fill: "#5a3a1c" }, svg);
      el("rect", { x: 460, y: 640, width: 690, height: 14, fill: "#5a3a1c" }, svg);
      [300, 1300].forEach(x => { el("circle", { cx: x, cy: 600, r: 70, fill: "url(#lampP)" }, svg); el("rect", { x: x - 8, y: 600, width: 16, height: 160, fill: "#0d0805" }, svg); });
    } },
    古墳: { ground: "#1d2410", draw(svg) {
      const d = sky(svg, "skyK", [[0, "#5d86b5"], [.6, "#c9d8c0"], [1, "#efe2b8"]]);
      glow(d, "sunK", "#fff8e0");
      el("circle", { cx: 1300, cy: 380, r: 240, fill: "url(#sunK)" }, svg);
      el("path", { d: "M0 560 Q400 500 800 540 T1600 520 V900 H0Z", fill: "#8aa275", opacity: .7 }, svg);
      const m = el("g", { fill: "#4f6a3a" }, svg);   // 大きな前方後円墳（横から）
      el("path", { d: "M160 650 Q200 560 330 540 L520 520 Q600 430 760 420 Q930 420 1010 520 Q1060 590 1080 650Z" }, m);
      el("path", { d: "M200 650 Q240 580 340 565 L530 548 Q610 470 760 462 Q900 462 970 545 Q1010 600 1030 650Z", fill: "#5f7d45" }, m);
      for (let x = 230; x < 1040; x += 34) el("rect", { x, y: 640 - Math.max(0, 70 - Math.abs(x - 760) / 6), width: 8, height: 14, fill: "#c98a4b" }, svg);   // はにわの列
      const n = el("g", { fill: "#1d2410" }, svg);
      el("path", { d: "M0 740 Q400 715 800 730 T1600 720 V900 H0Z" }, n);
      [1180, 1290, 1400, 1500].forEach((x, i) => { person(n, x, 745, .9, "#1d2410", false); el("path", { d: `M${x - 30} ${640} q30 -20 60 0 l-8 30 h-44z` }, n); });   // 土を運ぶ人々
      person(n, 120, 760, 1, "#1d2410", true);
    } },
    飛鳥: { ground: "#1f1a14", draw(svg) {
      const d = sky(svg, "skyA", [[0, "#8fb4d8"], [.6, "#e8dcc4"], [1, "#f6e3b4"]]);
      glow(d, "sunA", "#fff6dc");
      el("circle", { cx: 360, cy: 360, r: 220, fill: "url(#sunA)" }, svg);
      el("path", { d: "M0 540 Q300 440 640 500 T1240 470 T1600 510 V900 H0Z", fill: "#9fb08a", opacity: .7 }, svg);
      const n = el("g", { fill: "#1f1a14" }, svg);
      el("path", { d: "M0 740 Q400 715 800 730 T1600 720 V900 H0Z" }, n);
      const roof = (cx, y, w) => el("path", { d: `M${cx - w / 2 - 30} ${y} Q${cx - w / 2} ${y - 6} ${cx - w / 2 + 10} ${y - 30} L${cx + w / 2 - 10} ${y - 30} Q${cx + w / 2} ${y - 6} ${cx + w / 2 + 30} ${y}Z` }, n);
      const pag = (cx, base) => { let y = base, w = 170;   // 五重塔
        for (let i = 0; i < 5; i++) { el("rect", { x: cx - w / 2 + 18, y: y - 52, width: w - 36, height: 52 }, n); roof(cx, y - 52, w); y -= 82; w -= 22; }
        el("rect", { x: cx - 4, y: y - 90, width: 8, height: 100 }, n); };
      pag(1120, 735);
      el("rect", { x: 560, y: 600, width: 330, height: 135 }, n); roof(725, 600, 330); roof(725, 530, 250); el("rect", { x: 640, y: 530, width: 170, height: 70 }, n);   // 金堂
      el("rect", { x: 0, y: 700, width: 1600, height: 14 }, n); for (let x = 0; x < 1600; x += 160) el("rect", { x, y: 680, width: 12, height: 50 }, n);   // 回廊
      person(n, 260, 760, 1, "#1f1a14", false);
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
    if (key !== "夜" && key !== "時空" && key !== "宮殿") {
      const g = el("g", { transform: "translate(0,-120)" });
      [...svg.childNodes].slice(2).forEach(c => g.appendChild(c)); svg.appendChild(g);
      el("rect", { x: 0, y: H - 130, width: W, height: 130, fill: sc.ground }, svg);
    }
    return svg;
  }
  return { render, keys: Object.keys(scenes) };
})();
