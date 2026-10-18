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
    const IMG = (window.BGIMG || {})[key];   // 先生の 背景の絵（bgimg/）
    if (IMG) { const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: "xMidYMid slice" }); el("image", { href: IMG, x: 0, y: 0, width: W, height: H, preserveAspectRatio: "xMidYMid slice" }, svg); return svg; }
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
  // 満月の 欠け（@背景 満月の屋敷）。絵の 月に 重ねて、ゆがむと 紫の 影に 食われて 欠ける
  function moon() {
    const MX = 806, MY = 108, MR = 58;   // bgimg/満月の屋敷 の 月の 位置
    const svg = el("svg", { class: "moonlayer", viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: "xMidYMid slice" });
    const d = el("defs", {}, svg); glow(d, "moonHalo", "#c890ff");
    el("clipPath", { id: "moonClip" }, d).appendChild(el("circle", { cx: MX, cy: MY, r: MR }));
    el("circle", { class: "halo", cx: MX, cy: MY, r: MR * 3, fill: "url(#moonHalo)" }, svg);
    const g = el("g", { "clip-path": "url(#moonClip)" }, svg);
    el("circle", { class: "bite", cx: MX, cy: MY, r: MR + 4, fill: "#2a0c46" }, g);
    return svg;
  }
  return { render, moon, keys: Object.keys(scenes) };
})();
