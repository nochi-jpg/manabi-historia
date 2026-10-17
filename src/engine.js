/* まなびヒストリア エンジン */
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const FAIL = { fail: true };

/* ---------- 話の一覧 ---------- */
const EP_META = [
  ["時をこえて", "現代"], ["縄文のむら", "縄文"], ["弥生のむら", "縄文"], ["古墳のくに", "縄文"],
  ["聖徳太子の国づくり", "夜"], ["大化の改新", "夜"], ["大仏をつくれ！", "夜"], ["貴族のくらし", "夜"],
  ["武士の世へ① 平氏", "夜"], ["武士の世へ② 源頼朝", "夜"], ["元がせめてきた！", "夜"], ["室町文化", "夜"],
  ["戦国① 織田信長", "夜"], ["戦国② 秀吉と家康", "夜"], ["江戸幕府", "江戸"], ["町人の文化と新しい学問", "江戸"],
  ["明治① 開国と明治維新", "夜"], ["明治② 文明開化と憲法", "夜"], ["世界に歩みだした日本", "夜"],
  ["長く続いた戦争", "夜"], ["新しい日本、平和な日本へ", "現代"], ["最終回 未来へ", "時空"],
];
const EP_COUNT = EP_META.length;
// 年表：[時代, 年代, キーマン]
const EP_INFO = {
  0: ["令和", "2023年", "ユウキ"], 1: ["縄文", "約5500年前", "ミナ"], 2: ["弥生", "約2300年前", "卑弥呼"], 3: ["古墳", "3〜7世紀", "ワカタケル大王"],
  4: ["飛鳥", "600年ごろ", "聖徳太子"], 5: ["飛鳥", "645年", "中大兄皇子"], 6: ["奈良", "752年", "聖武天皇"], 7: ["平安", "1000年ごろ", "藤原道長"],
  8: ["平安", "1167年", "平清盛"], 9: ["鎌倉", "1192年", "源頼朝"], 10: ["鎌倉", "1274年", "北条時宗"], 11: ["室町", "1400年ごろ", "足利義政"],
  12: ["戦国", "1575年", "織田信長"], 13: ["安土桃山", "1600年", "豊臣秀吉"], 14: ["江戸", "1635年", "徳川家光"], 15: ["江戸", "1774年", "杉田玄白"],
  16: ["明治", "1868年", "西郷隆盛"], 17: ["明治", "1889年", "福沢諭吉"], 18: ["明治", "1911年", "小村寿太郎"], 19: ["昭和", "1945年", "？"],
  20: ["昭和", "1964年", "？"], 21: ["未来", "20XX年", "ユガミ"],
};
const PAGES = [
  { name: "むかし", sub: "縄文・弥生・古墳", eps: [1, 2, 3] },
  { name: "天皇と貴族", sub: "飛鳥・奈良・平安", eps: [4, 5, 6, 7] },
  { name: "武士の世", sub: "平安の終わり・鎌倉・室町", eps: [8, 9, 10, 11] },
  { name: "天下統一と江戸", sub: "戦国・安土桃山・江戸", eps: [12, 13, 14, 15] },
  { name: "近代・現代", sub: "明治・大正・昭和・令和", eps: [16, 17, 18, 19, 20, 0] },
  { name: "未来", sub: "ユガミが 来た 時代", eps: [21], future: true },
];
const FUTURE_AFTER = 15;   // この話をクリアすると「未来」があらわれる
const pageOf = no => PAGES.findIndex(p => p.eps.includes(no));

/* ---------- 保存 ---------- */
const SKEY = "manabi-historia-v1";
function loadSave() { try { return JSON.parse(localStorage.getItem(SKEY)) || null; } catch (e) { return null; } }
let SAVE = Object.assign({ unlocked: 0, stars: {}, cards: {}, resume: null, opt: { ruby: true, autoRead: false, speed: "normal", blip: true } }, loadSave() || {});
SAVE.opt = Object.assign({ ruby: true, autoRead: false, speed: "normal", blip: true }, SAVE.opt);
function persist() { try { localStorage.setItem(SKEY, JSON.stringify(SAVE)); } catch (e) { } }

/* ---------- 文字の整形（ルビ・キーワード） ---------- */
const esc = s => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const KANJI = "[\\u4E00-\\u9FFF\\u3005\\u30F6]+";
function fmt(t) {
  let s = esc(t);
  s = s.replace(new RegExp(`(${KANJI})《([^》]+)》`, "g"), (m, k, r) => SAVE.opt.ruby ? `<ruby>${k}<rt>${r}</rt></ruby>` : k);
  s = s.replace(/【([^】]+)】/g, '<span class="kw">$1</span>');
  return s;
}
const plain = t => t.replace(/《[^》]+》/g, "").replace(/[【】]/g, "");
const forSpeech = t => t.replace(new RegExp(`(${KANJI})《([^》]+)》`, "g"), "$2").replace(/[【】＊]/g, "");

/* ---------- 読み上げ ---------- */
function speak(t) {
  try {
    if (!("speechSynthesis" in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(forSpeech(t)); u.lang = "ja-JP"; u.rate = 1.0;
    const v = speechSynthesis.getVoices().find(v => /^ja/.test(v.lang)); if (v) u.voice = v;
    speechSynthesis.speak(u);
  } catch (e) { }
}
const stopSpeak = () => { try { speechSynthesis.cancel(); } catch (e) { } };

/* ---------- 台本の読みこみ ---------- */
const CHARS = {
  "ユウキ": { icon: "人:こども", side: "L", art: "yuuki" },
  "本じい": { icon: "📕", side: "L", art: "honjii" },
  "トケイ": { icon: "⏱️", side: "L", art: "tokei" },
  "ユガミ": { icon: "人:こども", side: "R", art: "yugami" },
  "ミナ": { icon: "人:こども", side: "R", art: "mina" },
  "レキシクイ": { icon: "🐟", side: "R", art: "lexikui" },
  "？？？": { icon: "人:おとこ", side: "R" },
};
const ART_EXP = { "ふつう": "normal", "おどろき": "surprise", "笑顔": "smile", "怒り": "angry", "泣き": "cry" };
/* 顔グラ：画像があれば画像（表情がなければ「ふつう」）、人間はシルエット、それ以外は絵文字 */
function faceHTML(c, expr, key) {
  const A = window.ART || {};
  if (c.art && A[c.art]) {
    const src = A[c.art][ART_EXP[expr]] || A[c.art].normal;
    if (src) return `<img class="fimg" src="${src}" alt="">`;
  }
  if (/^人[:：]/.test(c.icon || "")) return iconHTML(c.icon, key, "silface");
  return `<span class="femoji">${c.icon}</span>`;
}
const EXPR = { "ふつう": "", "おどろき": "❗", "笑顔": "♪", "怒り": "💢" };
const CARDS = {};     // 名前 → カード
const EPS = {};       // 話番号 → 台本データ

const split = s => s.split(/\s*[|｜]\s*/);
function parseDialog(l) {
  if (/^[＊*]/.test(l)) return { who: "", expr: "", text: l.replace(/^[＊*]\s*/, "") };
  const m = l.match(/^([^「（(]+?)\s*(?:[（(](.+?)[）)])?「([\s\S]*)」$/);
  if (m) return { who: m[1].trim(), expr: (m[2] || "ふつう").trim(), text: m[3] };
  return null;
}
function parseScript(no, src) {
  const ep = { no, title: "", nodes: [], cards: [], chars: {} };
  let block = null;
  for (const raw of src.split(/\r?\n/)) {
    const l = raw.trim();
    if (!l || l.startsWith("//")) continue;
    if (l[0] === "#") { ep.title = l.slice(1).trim(); continue; }
    if (l[0] === "@") {
      const [cmd, ...rest] = l.slice(1).trim().split(/\s+/); const arg = rest.join(" ");
      block = null;
      const add = b => { ep.nodes.push(b); block = b; };
      switch (cmd) {
        case "背景": ep.nodes.push({ t: "bg", bg: arg }); break;
        case "人物": { const [n, ic, side] = rest; ep.chars[n] = Object.assign({}, CHARS[n] || {}, { icon: ic || "人:おとこ", side: side || "R" }); break; }
        case "カード": block = { t: "cards" }; break;
        case "調査": add({ t: "inv", items: [], hint: "" }); break;
        case "まちがい探し": add({ t: "spot", items: [], hint: "" }); break;
        case "論破バトル": add({ t: "battle", rounds: [[]], hint: "" }); break;
        case "まとめ": add({ t: "sum", lines: [], hint: "" }); break;
        case "記憶のかけら": add({ t: "frag", title: arg, lines: [] }); break;
        case "クリア": ep.nodes.push({ t: "clear" }); break;
        case "ゆがみ": ep.nodes.push({ t: "warp", text: arg || "歴史が ゆがんだ！" }); break;
        case "ゆがめる": ep.nodes.push({ t: "warp", text: "歴史が ゆがんだ！", who: arg }); break;
        case "もどす": ep.nodes.push({ t: "restore", who: arg }); break;
        case "議論": add({ t: "testi", who: arg, rounds: [{ title: "", lines: [] }], hint: "" }); break;
        default: console.warn("不明な命令", cmd);
      }
      continue;
    }
    if (block) {
      if (block.t === "frag") { block.lines.push(parseDialog(l) || { who: "", expr: "", text: l.replace(/^-\s*/, "") }); continue; }
      if (/^ヒント[：:]/.test(l)) { block.hint = l.replace(/^ヒント[：:]\s*/, ""); continue; }
      if (block.t === "battle" && /^-{3,}$/.test(l)) { block.rounds.push([]); continue; }
      if (block.t === "testi" && /^-{3,}$/.test(l)) { block.rounds.push({ title: "", lines: [] }); continue; }
      if (block.t === "testi" && /^証言[：:]/.test(l)) { block.rounds[block.rounds.length - 1].title = l.replace(/^証言[：:]\s*/, ""); continue; }
      if (block.t === "sum" && /^文[：:]/.test(l)) { block.lines.push(l.replace(/^文[：:]\s*/, "")); continue; }
      if (/^[-・]\s/.test(l)) {
        const p = split(l.replace(/^[-・]\s*/, ""));
        if (block.t === "cards") { const [name, icon, desc, kw] = p; CARDS[name] = { name, icon, desc, kw: kw || name, ep: no }; ep.cards.push(name); }
        else if (block.t === "inv") { const [icon, name, pos, line, card] = p; block.items.push({ icon, name, pos: pos.split(",").map(Number), line, card }); }
        else if (block.t === "spot") { const [kind, icon, name, pos, item, quote, card, fixItem, explain] = p; block.items.push({ bad: /[✕×xX]/.test(kind), icon, name, pos: pos.split(",").map(Number), item, quote, card, fixItem, explain }); }
        else if (block.t === "testi") { const [kind, text, card, retort, reaction] = p; block.rounds[block.rounds.length - 1].lines.push({ lie: /矛盾|ウソ/.test(kind), text, card, retort, reaction }); }
        else if (block.t === "battle") { const [kind, text, card, reply] = p; block.rounds[block.rounds.length - 1].push({ lie: /ウソ/.test(kind), text, card, reply }); }
        continue;
      }
    }
    const d = parseDialog(l);
    if (d) { block = null; ep.nodes.push({ t: "say", ...d }); continue; }
    console.warn("読めない行", l);
  }
  return ep;
}
function charOf(name, ep) { return (ep && ep.chars[name]) || CHARS[name] || { icon: "人:おとこ", side: "R" }; }

/* ---------- 村人のシルエット（影絵） ---------- */
const SIL = {
  "おとこ": '<circle cx="50" cy="26" r="14"/><path d="M28 46 Q50 38 72 46 L76 98 L63 98 L61 136 L53 136 L50 106 L47 136 L39 136 L37 98 L24 98Z"/>',
  "おんな": '<circle cx="50" cy="12" r="8"/><circle cx="50" cy="28" r="13"/><path d="M34 46 Q50 40 66 46 L80 134 L20 134Z"/>',
  "としより": '<circle cx="42" cy="38" r="13"/><path d="M30 54 Q46 46 62 56 L70 132 L28 132 Q24 90 30 54Z"/><path d="M74 70 L82 134" stroke="currentColor" stroke-width="5"/><path d="M60 64 L76 72" stroke="currentColor" stroke-width="7" stroke-linecap="round"/>',
  "こども": '<circle cx="50" cy="56" r="13"/><path d="M34 74 Q50 68 66 74 L70 112 L60 112 L58 136 L52 136 L50 118 L48 136 L42 136 L40 112 L30 112Z"/>',
};
const SIL_EYES = { "おとこ": [44, 56, 25], "おんな": [44, 56, 27], "としより": [37, 47, 37], "こども": [45, 55, 55] };
/* 影絵の素材（art/sil_*.webp）があれば使う。同じ名前の人は、いつも同じ形になる */
const SIL_KIND = { "おとこ": "m", "おんな": "w", "こども": "c", "としより": "o" };
function silPick(type, key) {
  const S2 = (window.ART || {}).sil; if (!S2) return null;
  const k = SIL_KIND[type] || "m", list = Object.keys(S2).filter(x => x[0] === k).sort();
  if (!list.length) return null;
  let hsh = 0; for (const ch of String(key || "")) hsh = (hsh * 31 + ch.codePointAt(0)) >>> 0;
  return S2[list[hsh % list.length]];
}
function iconHTML(icon, key, cls = "") {
  const m = /^人[:：](.+)$/.exec(icon || "");
  if (!m) return `<div class="picon">${icon}</div>`;
  const src = silPick(m[1], key);
  if (src) return `<img class="sil silimg ${cls}" src="${src}" alt="">`;
  const t = SIL[m[1]] ? m[1] : "おとこ", [x1, x2, y] = SIL_EYES[t];
  return `<svg class="sil ${cls}" viewBox="0 0 100 140">${SIL[t]}<g class="eyes"><circle cx="${x1}" cy="${y}" r="3.2"/><circle cx="${x2}" cy="${y}" r="3.2"/></g></svg>`;
}

/* ---------- 画面の基本部品 ---------- */
let stage, layer, bgEl, talk, catcher, modal, fx, hud;
function fit() {
  const s = Math.min(innerWidth / 1600, innerHeight / 900);
  stage.style.transform = `translate(-50%,-50%) scale(${s})`;
}
function setBg(key) { bgEl.classList.remove("warped"); bgEl.innerHTML = ""; bgEl.appendChild(BG.render(key)); }
function clearLayer() { layer.innerHTML = ""; layer.className = ""; }
const btn = (label, cls, on) => { const b = h("button", "btn " + (cls || ""), label); b.onclick = on; return b; };

/* 立ち絵 */
const ports = { L: null, R: null };
function showPortrait(name, expr, ep) {
  const pl = $("#portL"), pr = $("#portR");
  if (!name) { pl.classList.add("dim"); pr.classList.add("dim"); return; }
  const c = charOf(name, ep), side = c.side;
  const el = side === "L" ? pl : pr, other = side === "L" ? pr : pl;
  const aura = !!(S && S.aura && S.aura.includes(name));
  if (aura) expr = "ふつう";   // ゆがめられている間は「ふつう」＋紫のオーラ
  const hasArt = !!(c.art && window.ART && window.ART[c.art]);
  el.innerHTML = `<div class="pface">${faceHTML(c, expr, name)}</div>` + (!hasArt && EXPR[expr] ? `<div class="pexpr">${EXPR[expr]}</div>` : "");
  el.classList.toggle("aura", aura);
  el.hidden = false; el.classList.remove("dim"); other.classList.add("dim");
  ports[side] = name;
}
function hidePortraits() { $("#portL").hidden = true; $("#portR").hidden = true; ports.L = ports.R = null; }

/* セリフ */
/* ---------- 文字送り（ぽぽぽ…） ---------- */
const SPEEDS = { fast: 15, normal: 35, slow: 70 };   // 1文字の間隔（ミリ秒）
let actx = null;
function blip() {
  if (!SAVE.opt.blip) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = "square"; o.frequency.value = 760 + Math.random() * 60;
    g.gain.setValueAtTime(0.035, actx.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + 0.045);
    o.connect(g); g.connect(actx.destination); o.start(); o.stop(actx.currentTime + 0.05);
  } catch (e) { }
}
/* el の中身（ルビ入りのHTML）を1文字ずつ表示する。{ done, finish() } を返す */
function typeIn(el, html, onEnd) {
  el.innerHTML = html;
  const units = [];
  (function walk(node) {
    for (const ch of [...node.childNodes]) {
      if (ch.nodeType === 3) {
        const frag = document.createDocumentFragment();
        for (const c of ch.textContent) { const sp = document.createElement("span"); sp.textContent = c; sp.className = "tw-h"; frag.appendChild(sp); units.push(sp); }
        node.replaceChild(frag, ch);
      } else if (ch.nodeName === "RUBY") { ch.classList.add("tw-h"); units.push(ch); }
      else walk(ch);
    }
  })(el);
  const t = { done: false };
  let i = 0, n = 0, timer = null;
  const end = () => { if (t.done) return; t.done = true; clearInterval(timer); units.forEach(u => u.classList.remove("tw-h")); onEnd && onEnd(); };
  t.finish = end;
  const step = () => {
    if (i >= units.length) return end();
    const u = units[i++]; u.classList.remove("tw-h");
    if (!/[\s、。！？…「」]/.test(u.textContent) && (n++ % 2 === 0)) blip();
  };
  timer = setInterval(step, SPEEDS[SAVE.opt.speed] || SPEEDS.normal);
  if (!units.length) end();
  return t;
}
function waitAdvance(typer) {
  return new Promise(res => {
    catcher.hidden = false;
    const go = () => {
      if (typer && !typer.done) { typer.finish(); return; }   // 表示中ならまず全部出す
      catcher.hidden = true; catcher.onclick = null; talk.onclick = null; document.removeEventListener("keydown", key); res();
    };
    const key = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } };
    catcher.onclick = go; talk.onclick = e => { if (!e.target.closest(".speak")) go(); };
    document.addEventListener("keydown", key);
  });
}
async function say(who, expr, text, ep, opt = {}) {
  if (who === "トケイ") who = "";   // トケイは最終回まで話さない
  talk.hidden = false; talk.classList.toggle("dark", !!opt.dark);
  talk.querySelector(".tname").textContent = who && who !== "" ? who : "";
  talk.querySelector(".tname").hidden = !who;
  const tt = talk.querySelector(".ttext");
  tt.classList.toggle("narr", !who);
  talk.querySelector(".speak").onclick = e => { e.stopPropagation(); speak(text); };
  if (!opt.dark && !opt.noPort) showPortrait(who, expr, ep);
  if (SAVE.opt.autoRead) speak(text);
  talk.classList.add("typing");
  const typer = typeIn(tt, fmt(text), () => talk.classList.remove("typing"));
  await waitAdvance(typer);
  stopSpeak();
}
function hideTalk() { talk.hidden = true; }

/* 効果 */
function bigText(text, cls) { const e = h("div", "big " + (cls || ""), text); fx.appendChild(e); setTimeout(() => e.remove(), 1400); }
function shake() { stage.classList.remove("shake"); void stage.offsetWidth; stage.classList.add("shake"); }
function banner(text, html) { const e = h("div", "banner" + (html ? " tall" : ""), html || fmt(text)); fx.appendChild(e); setTimeout(() => e.remove(), 1800); }

/* モーダル */
function openModal(content, cls) { modal.innerHTML = ""; modal.className = "modal " + (cls || ""); modal.appendChild(content); modal.hidden = false; }
function closeModal() { modal.hidden = true; modal.innerHTML = ""; }

function cardEl(name, opts = {}) {
  const c = CARDS[name] || { name, icon: "？" };
  const e = h("button", "card" + (opts.unknown ? " unknown" : ""), opts.unknown ? `<div class="cicon">？</div><div class="cname">？？？</div>` : `<div class="cicon">${c.icon}</div><div class="cname${[...c.name].length > 6 ? " long" : ""}">${esc(c.name)}</div>`);
  return e;
}
function showCardGet(name) {
  return new Promise(res => {
    const c = CARDS[name];
    const box = h("div", "cardget");
    box.innerHTML = `<div class="cg-title">カードを 手に入れた！</div>`;
    const ce = cardEl(name); ce.classList.add("large"); box.appendChild(ce);
    box.appendChild(h("div", "cg-desc", fmt(c ? c.desc : "")));
    box.appendChild(h("div", "cg-kw", `調べる キーワード：<b>${esc(c ? c.kw : name)}</b>`));
    box.appendChild(btn("OK", "", () => { closeModal(); res(); }));
    openModal(box);
  });
}
/* カードをページ送りで並べる（逆転裁判の法廷記録ふう。スクロールバーは使わない） */
function pager(names, opts) {
  const per = opts.perPage || 8, cols = opts.cols || 8;
  const wrap = h("div", "pager");
  const prev = h("button", "pg-arrow", "◀"), next = h("button", "pg-arrow", "▶");
  const grid = h("div", "pg-grid"); grid.style.gridTemplateColumns = `repeat(${cols}, var(--card-w))`;
  const dots = h("div", "pg-dots");
  const pages = Math.max(1, Math.ceil(names.length / per));
  let page = 0, selName = null;
  const draw = () => {
    grid.innerHTML = "";
    names.slice(page * per, page * per + per).forEach(n => {
      const e = cardEl(n, { unknown: opts.unknown && opts.unknown(n) });
      if (n === selName) e.classList.add("sel");
      e.onclick = () => { selName = n; grid.querySelectorAll(".card").forEach(c => c.classList.remove("sel")); e.classList.add("sel"); opts.onTap && opts.onTap(n); };
      grid.appendChild(e);
    });
    for (let k = grid.children.length; k < per; k++) grid.appendChild(h("div", "card blank"));   // 空きわくで大きさを固定
    prev.disabled = page === 0; next.disabled = page >= pages - 1;
    dots.innerHTML = pages > 1 ? Array.from({ length: pages }, (_, k) => `<span class="dot${k === page ? " on" : ""}"></span>`).join("") : "";
  };
  prev.onclick = () => { if (page > 0) { page--; draw(); } };
  next.onclick = () => { if (page < pages - 1) { page++; draw(); } };
  const row = h("div", "pg-row"); row.append(prev, grid, next);
  wrap.append(row, dots);
  draw();
  return wrap;
}

/* 手札からカードを選ぶ。キャンセルで null */
function chooseCard(title, correct, quote) {
  return new Promise(res => {
    let list = S.hand.slice();
    if (S.narrow) {
      // 議論・論破：その証言のまとまり全体で同じ3まい（どの証言で開いても同じなので、答えがばれない）
      if (S.narrowSet) list = S.narrowSet;
      else if (correct) list = S.narrowCache[correct] || (S.narrowCache[correct] = pick3(correct));
    }
    const box = h("div", "hand");
    if (quote) box.appendChild(h("div", "hand-quote", `<b>${esc(quote.who)}</b>「${fmt(quote.text)}」`));
    box.appendChild(h("div", "hand-title", fmt(title)));
    const detail = h("div", "hand-detail", "カードを えらぶと、説明が 出るよ");
    const btns = h("div", "btnrow");
    const ok = btn("つきつける！", "red", () => { if (sel) { closeModal(); res(sel); } });
    ok.disabled = true;
    let sel = null;
    const pg = pager(list, { perPage: 8, cols: 4, onTap: n => {   // 1回目のタップで説明を読む → 「つきつける！」で決定
      sel = n; ok.disabled = false;
      const c = CARDS[n] || { name: n, desc: "", kw: n };
      detail.innerHTML = `<b>${esc(c.name)}</b>　${fmt(c.desc)}`;
      if (SAVE.opt.autoRead) speak(c.name + "。" + c.desc);
    } });
    box.appendChild(pg); box.appendChild(detail);
    btns.appendChild(btn("もどる", "sub", () => { stopSpeak(); closeModal(); res(null); }));
    btns.appendChild(ok);
    box.appendChild(btns);
    openModal(box, "bottom");
  });
}
function pick3(correct) {
  const others = S.hand.filter(n => n !== correct).sort(() => Math.random() - .5).slice(0, 2);
  return [correct, ...others].sort(() => Math.random() - .5);
}
function confirmBox(html, yes, no) {
  return new Promise(res => {
    const box = h("div", "inbox"); box.appendChild(h("div", "in-msg", html));
    const row = h("div", "btnrow");
    row.appendChild(btn(no || "やめる", "sub", () => { closeModal(); res(false); }));
    row.appendChild(btn(yes || "はい", "red", () => { closeModal(); res(true); }));
    box.appendChild(row); openModal(box);
  });
}
function inputBox(title, placeholder) {
  return new Promise(res => {
    const box = h("div", "inbox");
    box.appendChild(h("div", "in-title", esc(title)));
    const inp = h("input"); inp.placeholder = placeholder || ""; inp.autocomplete = "off"; box.appendChild(inp);
    const row = h("div", "btnrow");
    row.appendChild(btn("けってい", "", () => { closeModal(); res(inp.value); }));
    row.appendChild(btn("やめる", "sub", () => { closeModal(); res(null); }));
    box.appendChild(row);
    openModal(box); setTimeout(() => inp.focus(), 50);
    inp.onkeydown = e => { if (e.key === "Enter") { closeModal(); res(inp.value); } };
  });
}
function alertBox(html) {
  return new Promise(res => { const box = h("div", "inbox"); box.appendChild(h("div", "in-msg", html)); box.appendChild(btn("OK", "", () => { closeModal(); res(); })); openModal(box); });
}

/* 手札をいつでも見る（法廷記録） */
function showHandViewer() {
  if (!S || S.busy || !modal.hidden || !talk.hidden) return;
  const box = h("div", "inbox wide");
  box.appendChild(h("div", "in-title", `もっている カード（${S.hand.length}まい）`));
  const detail = h("div", "hv-detail", S.hand.length ? "カードを タップすると 説明が 見られるよ" : "まだ カードを もっていないよ");
  const pg = pager(S.hand, { perPage: 8, cols: 4, onTap: n => {
    const c = CARDS[n]; detail.innerHTML = `<b>${esc(c.name)}</b>　${fmt(c.desc)}<div class="cg-kw">調べる キーワード：<b>${esc(c.kw)}</b></div>`; } });
  box.appendChild(pg); box.appendChild(detail);
  box.appendChild(btn("とじる", "sub", closeModal));
  openModal(box);
}

/* ---------- プレイ中の状態 ---------- */
let S = null;   // { no, ep, idx, hearts, hand, hint2, failed, narrow, hintLv, node }
const MAX_HEARTS = 5, RETRY_HEARTS = 3;
function renderHud() {
  hud.hidden = !S;
  if (!S) return;
  const hv = on => `<svg class="heart" viewBox="0 0 24 22"><path d="M12 21C-6 9 4-4 12 4C20-4 30 9 12 21Z" fill="${on ? "#d8392f" : "#3a322c"}" stroke="${on ? "#f4ead2" : "#6b5a45"}" stroke-width="1.6"/></svg>`;
  $("#hearts").innerHTML = Array.from({ length: MAX_HEARTS }, (_, i) => hv(i < S.hearts)).join("");
  $("#tagNo").textContent = S.no === 0 ? "プロローグ" : `第${S.no}話`;
  $("#tagTitle").textContent = S.ep.title.replace(/^(第\d+話|プロローグ)\s*/, "");
  const hb = $("#hintBtn"), n = S.node;
  const interactive = n && ["inv", "spot", "testi", "battle", "sum"].includes(n.t);
  hb.hidden = !interactive;
  const canJump = !!(S.hintCtx && S.hintCtx.jump);
  let label = "ヒント", dis = false;
  if (n && n.t !== "inv") {
    if (S.hintLv === 1) label = "しぼる ♡−1";
    else if (S.hintLv === 2 && canJump) label = "さらにしぼる ♡−1";
    else if (S.hintLv >= 2) { label = "しぼりこみ中"; dis = true; }
  }
  hb.textContent = label; hb.disabled = dis;
  $("#cardBtn").hidden = !S.hand.length;
}
/* 証言のまとまり（ラウンド）が変わるたびに、しぼりこみをリセット */
function newRound(ctx) {
  S.hintCtx = ctx || null; S.narrow = false; S.narrowSet = null; S.narrowCache = {};
  if (S.hintLv > 1) S.hintLv = 1;
  renderHud();
}
async function loseHeart(who, expr, msg) {
  S.hearts = Math.max(0, S.hearts - 1); shake(); renderHud();
  await say(who, expr, msg, S.ep);
  if (S.hearts <= 0) throw FAIL;
}
async function onHint() {
  if (!S || !S.node || S.busy) return;
  const n = S.node, ctx = S.hintCtx || {};
  S.busy = true;
  let fail = false;
  try {
    if (S.hintLv === 0 || n.t === "inv") {
      await say("本じい", "ふつう", n.hint || "教科書で キーワードを 調べてみるのじゃ", S.ep);
      S.hintLv = Math.max(S.hintLv, 1);
    } else if (S.hintLv === 1) {
      if (await confirmBox("♡を 1つ 使って、つきつける カードを<br><b>3まいに しぼりますか？</b>", "しぼる")) {
        S.hearts--; shake(); S.narrow = true; S.hintLv = 2;
        if (ctx.correct) S.narrowSet = pick3(ctx.correct);
        renderHud();
        await say("本じい", "ふつう", "よし、つきつける カードを 3まいに しぼってやろう", S.ep);
        if (S.hearts <= 0) fail = true;
      }
    } else if (S.hintLv === 2 && ctx.jump) {
      if (await confirmBox("♡を もう 1つ 使って、<br><b>あやしい ところを 教えて もらいますか？</b>", "教えてもらう")) {
        S.hearts--; shake(); S.hintLv = 3; renderHud();
        await say("本じい", "ふつう", "しかたないのう。あやしい ところに しるしを つけてやろう", S.ep);
        ctx.jump();
        if (S.hearts <= 0) fail = true;
      }
    }
  } finally { S.busy = false; hideTalk(); hidePortraits(); renderHud(); }
  if (fail && S.rej) S.rej(FAIL);
}

/* ---------- 場面：調査 ---------- */
function placeAt(e, pos) { e.style.left = pos[0] + "%"; e.style.top = pos[1] + "%"; }
function runInv(n) {
  return new Promise((res, rej) => {
    S.rej = rej;
    clearLayer(); hideTalk(); hidePortraits();
    const got = new Set(n.items.filter(it => S.hand.includes(it.card)).map(it => it.name));
    const info = h("div", "guide"); layer.appendChild(info);
    const upd = () => { info.innerHTML = `むらを 調べよう（のこり ${n.items.length - got.size}）`; };
    upd();
    n.items.forEach(it => {
      const e = h("button", "prop", `${iconHTML(it.icon, it.name)}<div class="plabel">${esc(it.name)}</div>`);
      placeAt(e, it.pos); if (got.has(it.name)) e.classList.add("done");
      e.onclick = async () => {
        if (S.busy) return; S.busy = true;
        try {
          // 「／」で区切って何行でも話せる。「名前：」で話す人を変える（＊はナレーション）
          const base = (S.ep.chars[it.name] || CHARS[it.name]) ? it.name : "";
          for (const seg of it.line.split(/\s*／\s*/)) {
            let who = base, text = seg;
            const m = seg.match(/^(.+?)[：:](.*)$/);
            if (/^[＊*]/.test(seg)) { who = ""; text = seg.replace(/^[＊*]\s*/, ""); }
            else if (m && (CHARS[m[1]] || S.ep.chars[m[1]])) { who = m[1]; text = m[2]; }
            await say(who, "ふつう", text, S.ep);
          }
          hideTalk(); hidePortraits();
          if (it.card && !S.hand.includes(it.card)) { S.hand.push(it.card); renderHud(); await showCardGet(it.card); }
          got.add(it.name); e.classList.add("done"); upd();
        } catch (er) { S.busy = false; return rej(er); }
        S.busy = false;
        if (got.size >= n.items.length) { await sleep(300); res(); }
      };
      layer.appendChild(e);
    });
    if (got.size >= n.items.length) res();
  });
}

/* ---------- 場面：まちがい探し（証言につきつける） ---------- */
function runSpot(n) {
  return new Promise((res, rej) => {
    clearLayer(); hideTalk(); hidePortraits();
    bgEl.classList.add("warped");
    const fixed = new Set();
    const bads = n.items.filter(i => i.bad).length;
    const info = h("div", "guide"); layer.appendChild(info);
    const upd = () => { info.innerHTML = `ゆがんだ 証言を 見やぶれ（のこり ${bads - fixed.size}）`; };
    upd();
    n.items.forEach((it, i) => {
      const e = h("button", "prop warped", `${iconHTML(it.icon, it.name)}${it.item ? `<div class="pitem">${it.item}</div>` : ""}<div class="plabel">${esc(it.name)}</div>`);
      placeAt(e, it.pos);
      e.onclick = async () => {
        if (S.busy || fixed.has(i)) return; S.busy = true;
        try {
          const pick = await chooseCard("この 証言と 矛盾する カードを つきつけろ！", it.bad ? it.card : null, { who: it.name, text: it.quote });
          if (pick && it.bad && pick === it.card) {
            fixed.add(i); bigText("矛盾 はっけん！", "ronpa"); shake(); await sleep(900);
            e.classList.remove("warped"); e.classList.add("fixed");
            const pi = e.querySelector(".pitem"); if (pi && it.fixItem) pi.textContent = it.fixItem;
            if (it.explain) await say("本じい", "笑顔", it.explain, S.ep);
            upd();
          } else if (pick && it.bad) {
            await loseHeart("ユガミ", "笑顔", "ハハハ、そのカードでは 矛盾して いないぞ！");
          } else if (pick) {
            await loseHeart("本じい", "おどろき", "むむ……その 証言は、この時代と 矛盾して いないようじゃ");
          }
          hideTalk(); hidePortraits();
        } catch (er) { S.busy = false; return rej(er); }
        S.busy = false;
        if (fixed.size >= bads) {
          await sleep(300);
          layer.querySelectorAll(".prop.warped").forEach(p => p.classList.remove("warped"));
          bgEl.classList.remove("warped"); bigText("ただしい 歴史に もどった！", "good"); await sleep(1300);
          res();
        }
      };
      layer.appendChild(e);
    });
  });
}

/* ---------- 場面：論破バトル ---------- */
function runBattle(n) {
  return new Promise((res, rej) => {
    S.rej = rej;
    let r = 0;
    const total = n.rounds.length;
    const draw = () => {
      clearLayer(); hideTalk(); hidePortraits();
      layer.className = "battle";
      const foe = h("div", "foe", `<div class="foe-face">${faceHTML(charOf("ユガミ"), "笑顔")}</div><div class="foe-name">ユガミ</div>`);
      const gauge = h("div", "gauge", Array.from({ length: total }, (_, i) => `<span class="seg${i < total - r ? "" : " off"}"></span>`).join(""));
      foe.prepend(gauge); layer.appendChild(foe);
      layer.appendChild(h("div", "guide", `ユガミの ウソを 見やぶれ（${r + 1} / ${total}）`));
      const list = h("div", "claims");
      const claimEls = [];
      const lie = n.rounds[r].find(x => x.lie);
      newRound({ correct: lie && lie.card, jump: () => { const k = n.rounds[r].findIndex(x => x.lie); if (claimEls[k]) claimEls[k].classList.add("suspect"); } });
      n.rounds[r].forEach((c, i) => {
        const e = h("button", "claim", `<span class="q">「</span>${fmt(c.text)}<span class="q">」</span>`);
        e.onclick = async () => {
          if (S.busy) return; S.busy = true;
          try {
            const pick = await chooseCard("ウソだと 思ったら、矛盾する カードを つきつけろ！", c.lie ? c.card : null, { who: "ユガミ", text: c.text });
            if (pick && !c.lie) {
              await loseHeart("ユガミ", "笑顔", "フフ……それは ほんとうの ことだ。");
            } else if (pick) {
              if (pick === c.card) {
                bigText("論破！", "ronpa"); shake(); await sleep(900);
                if (c.reply) await say("ユウキ", "怒り", c.reply, S.ep);
                r++;
                if (r >= total) { S.busy = false; hideTalk(); return res(); }
                await say("ユガミ", "怒り", "くっ……まだだ！", S.ep);
                S.busy = false; return draw();
              } else {
                await loseHeart("ユガミ", "笑顔", "ハハハ！ そんな カードで オレの 歴史は くずせないぞ！");
              }
            }
            hideTalk(); hidePortraits();
          } catch (er) { S.busy = false; return rej(er); }
          S.busy = false;
        };
        claimEls.push(e); list.appendChild(e);
      });
      layer.appendChild(list);
    };
    draw();
  });
}

/* ---------- 場面：まとめ ---------- */
function runSum(n) {
  return new Promise((res, rej) => {
    S.rej = rej;
    clearLayer(); hideTalk(); hidePortraits();
    layer.appendChild(h("div", "guide", "わかったことを まとめよう"));
    newRound(null);
    const paper = h("div", "paper");
    const slots = [];
    n.lines.forEach(line => {
      const p = h("p");
      line.split(/(［[^］]+］)/).forEach(part => {
        const m = part.match(/^［(.+)］$/);
        if (m) { const s = h("button", "slot", "？"); s.dataset.ans = m[1]; slots.push(s); p.appendChild(s); }
        else if (part) p.appendChild(h("span", "", fmt(part)));
      });
      paper.appendChild(p);
    });
    layer.appendChild(paper);
    let filled = 0;
    slots.forEach(s => s.onclick = async () => {
      if (S.busy || s.classList.contains("ok")) return; S.busy = true;
      try {
        const pick = await chooseCard("ここに 入る カードは？", s.dataset.ans);
        if (pick === s.dataset.ans) { s.textContent = pick; s.classList.add("ok"); filled++; }
        else if (pick) await loseHeart("本じい", "おどろき", "うーむ、そこには 入らないようじゃ");
        hideTalk(); hidePortraits();
      } catch (er) { S.busy = false; return rej(er); }
      S.busy = false;
      if (filled >= slots.length) { bigText("まとめ かんせい！", "good"); await sleep(900); res(); }
    });
  });
}

/* ---------- 演出：歴史がゆがむ ---------- */
async function runWarp(n) {
  hideTalk();
  if (n.who && !S.aura.includes(n.who)) S.aura.push(n.who);
  const f = h("div", "warpfx"); fx.appendChild(f);
  shake(); await sleep(400); bgEl.classList.add("warped"); shake();
  banner(n.text); await sleep(1900); f.remove();
}

async function runRestore(n) {
  S.aura = S.aura.filter(x => x !== n.who);
  bgEl.classList.remove("warped");
  bigText("ただしい 歴史に もどった！", "good"); await sleep(1200);
}

/* ---------- 場面：議論（証言に矛盾をつきつける） ---------- */
function runTesti(n) {
  return new Promise((res, rej) => {
    S.rej = rej;
    const who = n.who, c = charOf(who, S.ep);
    let r = 0, i = 0;
    const draw = (first) => {
      clearLayer(); hideTalk(); hidePortraits();
      layer.className = "testi";
      const aura = S.aura.includes(who);
      layer.appendChild(h("div", "witness" + (aura ? " aura" : ""), `<div class="w-face">${faceHTML(c, "ふつう", who)}</div><div class="w-name">${esc(who)}</div>`));
      const round = n.rounds[r];
      layer.appendChild(h("div", "guide", `証言「${esc(round.title || "")}」（${r + 1} / ${n.rounds.length}）`));
      const box = h("div", "tbox");
      box.innerHTML = `<div class="tname">${esc(who)}</div><div class="ttext"></div><div class="tcount"></div>`;
      const sp = h("button", "speak", "🔊"); box.appendChild(sp);
      layer.appendChild(box);
      const nav = h("div", "tnav");
      const prev = btn("◀ 前へ", "sub", () => go(-1));
      const pres = btn("つきつける！", "red", present);
      const next = btn("次へ ▶", "sub", () => go(1));
      box.onclick = e => { if (e.target.closest(".speak")) return; if (typer && !typer.done) typer.finish(); else go(1); };
      nav.append(prev, pres, next); layer.appendChild(nav);
      let typer = null;
      const show = () => {
        const line = round.lines[i];
        if (typer) typer.finish();
        typer = typeIn(box.querySelector(".ttext"), fmt(line.text));
        box.querySelector(".tcount").textContent = `${i + 1} / ${round.lines.length}`;
        box.classList.toggle("suspect", suspect && i === lieIdx);
        prev.disabled = i === 0;
        sp.onclick = () => speak(line.text);
        if (SAVE.opt.autoRead) speak(line.text);
        box.classList.remove("flip"); void box.offsetWidth; box.classList.add("flip");
      };
      const go = async d => {
        if (S.busy) return;
        if (d > 0 && i === round.lines.length - 1) {   // さいごの証言のあと：本じいが話して最初にもどる
          S.busy = true;
          try { await say("本じい", "ふつう", "証言は ここまでじゃ。矛盾は 見つかったかのう？ もう一度、最初から 聞いてみるのじゃ", S.ep); }
          finally { hideTalk(); hidePortraits(); S.busy = false; }
          i = 0; show(); return;
        }
        if (d < 0 && i === 0) return;
        i += d; show();
      };
      const lieIdx = round.lines.findIndex(x => x.lie);
      let suspect = false;
      newRound({ correct: round.lines[lieIdx] && round.lines[lieIdx].card, jump: () => { suspect = true; i = lieIdx; show(); } });
      async function present() {
        if (S.busy) return; S.busy = true;
        const line = round.lines[i];
        try {
          const pick = await chooseCard("この 証言と 矛盾する カードを つきつけろ！", line.lie ? line.card : null, { who, text: line.text });
          if (pick && line.lie && pick === line.card) {
            stopSpeak(); bigText("矛盾 はっけん！", "ronpa"); shake(); await sleep(1000);
            if (line.retort) await say("ユウキ", "怒り", line.retort, S.ep);
            if (line.reaction) await say(who, "おどろき", line.reaction, S.ep, { noPort: true });
            r++; i = 0;
            S.busy = false;
            if (r >= n.rounds.length) { hideTalk(); return res(); }
            return draw();
          } else if (pick) {
            await loseHeart("本じい", "おどろき", line.lie ? "むむ……その カードでは、矛盾を 説明 できんようじゃ" : "むむ……その 証言には、おかしな ところは ないようじゃ");
            hideTalk(); hidePortraits();
          }
        } catch (er) { S.busy = false; return rej(er); }
        S.busy = false;
      }
      show();
      banner("", `〜 証言 〜<br>${esc(round.title || "")}`);   // どの証言でも、はじめにタイトルを出す
    };
    draw(true);
  });
}

/* ---------- 場面：記憶のかけら ---------- */
async function runFrag(n) {
  clearLayer(); hideTalk(); hidePortraits(); hud.hidden = true;
  layer.className = "frag";
  const t = h("div", "frag-head", "一方 そのころ……");
  layer.appendChild(t); await sleep(1400);
  layer.appendChild(h("div", "frag-pic", `<div>🖼️</div><div class="frag-cap">記憶のかけら「${esc(n.title)}」</div>`));
  for (const l of n.lines) await say(l.who, l.expr, l.text, S.ep, { dark: true });
  hideTalk(); renderHud();
}

/* ---------- 話の進行 ---------- */
function checkpoint() {
  SAVE.resume = { no: S.no, idx: S.idx, hearts: S.hearts, hand: S.hand.slice(), aura: S.aura.slice(), hint2: S.hint2, failed: S.failed };
  persist();
}
async function playEpisode(no, resume) {
  const ep = EPS[no];
  S = { no, ep, idx: 0, hearts: MAX_HEARTS, hand: [], aura: [], hint2: false, failed: false, narrow: false, narrowSet: null, narrowCache: {}, hintCtx: null, hintLv: 0, node: null, busy: false };
  if (resume && SAVE.resume && SAVE.resume.no === no) Object.assign(S, SAVE.resume, { no, ep });
  // 再開時は直前の背景を復元
  let bg = EP_META[no][1];
  for (let i = 0; i < S.idx; i++) if (ep.nodes[i].t === "bg") bg = ep.nodes[i].bg;
  setBg(bg); if (S.aura.length) bgEl.classList.add("warped"); clearLayer(); renderHud();
  while (S.idx < ep.nodes.length) {
    const n = ep.nodes[S.idx];
    S.node = n; S.hintLv = 0; S.rej = null; newRound(null);
    const interactive = ["inv", "spot", "testi", "battle", "sum", "frag"].includes(n.t);
    if (interactive) checkpoint();
    const snap = { hand: S.hand.slice() };
    try {
      switch (n.t) {
        case "bg": setBg(n.bg); hidePortraits(); break;
        case "say": await say(n.who, n.expr, n.text, ep); break;
        case "inv": await runInv(n); break;
        case "spot": await runSpot(n); break;
        case "battle": await runBattle(n); break;
        case "sum": await runSum(n); break;
        case "frag": await runFrag(n); break;
        case "warp": await runWarp(n); break;
        case "restore": await runRestore(n); break;
        case "testi": await runTesti(n); break;
        case "clear": return finishEpisode();
      }
    } catch (e) {
      if (e === FAIL) {
        closeModal(); hideTalk(); S.busy = false;
        bigText("ゲームオーバー", "bad"); await sleep(1500);
        await say("本じい", "おどろき", "しっかりするのじゃ！ ♡3つで、この場面の 最初から やりなおすぞ", ep);
        S.hearts = RETRY_HEARTS; S.failed = true; S.hand = snap.hand; renderHud();
        continue;
      }
      throw e;
    }
    if (n.t !== "say" && n.t !== "bg") { hideTalk(); clearLayer(); }
    S.idx++;
  }
  return finishEpisode();
}
function finishEpisode() {
  bgEl.classList.remove("warped");
  hideTalk(); hidePortraits(); clearLayer();
  const no = S.no;
  // ★＝クリア時の♡の数。1度でもゲームオーバーになったら★1
  let star = S.failed ? 1 : Math.max(1, Math.min(MAX_HEARTS, S.hearts));
  if (no === 0) star = MAX_HEARTS;
  SAVE.stars[no] = Math.max(SAVE.stars[no] || 0, star);
  S.ep.cards.forEach(c => SAVE.cards[c] = 1);
  S.hand.forEach(c => SAVE.cards[c] = 1);
  SAVE.resume = null; persist();
  const ep = S.ep; S = null; renderHud();
  if (no === 0) {   // プロローグのあとは、じゅもんなしで第1話へ。年表をさかのぼる演出
    SAVE.unlocked = Math.max(SAVE.unlocked, 1); persist();
    return playRewind();
  }
  showResult(no, ep, star);
}

/* ---------- 画面：タイトル ---------- */
function showTitle() {
  S = null; renderHud(); hideTalk(); hidePortraits(); closeModal();
  bgEl.classList.remove("warped"); bgEl.innerHTML = ""; clearLayer(); layer.className = "menu title-white";
  const logo = window.ART && window.ART.title && window.ART.title.logo;
  layer.appendChild(h("div", "tlogo", logo ? `<img src="${logo}" alt="まなびヒストリア">` : `<div class="logo-main">まなびヒストリア</div>`));
  const col = h("div", "tmenu");
  [["おはなしを えらぶ", () => showSelect()], ["カードずかん", showZukan], ["じゅもんを 入れる", enterSpell], ["せってい", showSettings]]
    .forEach(([t, f]) => { const b = h("button", "titem", esc(t)); b.onclick = f; col.appendChild(b); });
  layer.appendChild(col);
  layer.appendChild(h("div", "credit", "企画・ゲームデザイン・キャラクターデザイン　のち（まなび堂）"));
}

/* ---------- 画面：話をえらぶ（年表） ---------- */
const futureOpen = () => !!(SAVE.flags && SAVE.flags.future);
let SEL = { page: 4, no: 0 };
function showSelect(opt = {}) {
  if (opt.no != null) SEL = { page: pageOf(opt.no), no: opt.no };
  else if (!SAVE.stars[0]) SEL = { page: 4, no: 0 };
  if (SAVE.stars[FUTURE_AFTER] && !futureOpen() && !opt.noFuture) return playFuture();
  drawTimeline(SEL.page, SEL.no);
}
function drawTimeline(pi, sel, fx2 = {}) {
  S = null; renderHud(); setBg("夜"); clearLayer(); layer.className = "menu timeline";
  const page = PAGES[pi];
  const total = Object.entries(SAVE.stars).reduce((a, [k, v]) => a + (k === "0" ? 0 : v), 0);
  const top = h("div", "topbar");
  top.appendChild(btn("もどる", "", showTitle));
  top.appendChild(h("div", "topttl", "年表"));
  top.appendChild(btn(`★ ${total}`, "rt", showClearList));
  layer.appendChild(top);
  layer.appendChild(h("div", "tl-head", `<div class="tl-name">${esc(page.name)}</div><div class="tl-sub">${esc(page.sub)}</div>`));
  const maxPage = futureOpen() ? PAGES.length - 1 : PAGES.length - 2;
  const go = d => { const np = pi + d; if (np < 0 || np > maxPage) return; SEL = { page: np, no: PAGES[np].eps[d > 0 ? 0 : PAGES[np].eps.length - 1] }; drawTimeline(SEL.page, SEL.no); };
  const L = h("button", "tl-arrow l", "◀"), R = h("button", "tl-arrow r", "▶");
  L.disabled = pi === 0; R.disabled = pi >= maxPage;
  L.onclick = () => go(-1); R.onclick = () => go(1);
  layer.append(L, R);
  // 線とノード
  const X0 = 150, X1 = 1450, n = page.eps.length, step = (X1 - X0) / n;
  const xs = page.eps.map((_, i) => X0 + step * (i + .5));
  const line = h("div", "tl-line" + (page.future ? " future" : "")); layer.appendChild(line);
  const cleared = page.eps.map(no => !!SAVE.stars[no]);
  let litTo = -1; cleared.forEach((c, i) => { if (c) litTo = i; });
  if (PAGES.slice(pi + 1).some(p => p.eps.some(no => no !== 0 && SAVE.stars[no]))) litTo = n - 1;
  if (litTo >= 0) { const lit = h("div", "tl-lit"); lit.style.width = (xs[litTo] - X0 + 2) + "px"; layer.appendChild(lit); }
  page.eps.forEach((no, i) => {
    const [era, year] = EP_INFO[no];
    const open = no <= SAVE.unlocked || (no === 0), ready = !!EPS[no], st = SAVE.stars[no] || 0;
    const nd = h("button", "tl-node" + (no === sel ? " sel" : "") + (open ? "" : " locked") + (st ? " done" : "") + (page.future ? " future" : "") + (fx2.flick && fx2.flick.includes(no) ? " flick" : ""),
      `<div class="tl-era">${esc(era)}</div><div class="tl-year">${esc(year)}</div><div class="tl-dot"></div><div class="tl-no">${no === 0 ? "プロローグ" : "第" + no + "話"}</div><div class="tl-tt">${open ? esc(EP_META[no][0]) : "？？？"}</div><div class="tl-st">${no === 0 ? (st ? "クリア" : "") : open && ready ? "★".repeat(st) + "<i>" + "☆".repeat(MAX_HEARTS - st) + "</i>" : open ? "じゅんび中" : "🔒"}</div>`);
    nd.style.left = xs[i] + "px";
    nd.onclick = () => { SEL = { page: pi, no }; drawTimeline(pi, no); };
    layer.appendChild(nd);
    if (no === sel) {
      const tk = h("div", "tl-tokei", window.ART && window.ART.tokei ? `<img src="${window.ART.tokei.normal}" alt="">` : "⏱️");
      tk.style.left = xs[i] + "px"; layer.appendChild(tk);
    }
  });
  if (pi === PAGES.length - 2 && !futureOpen()) { R.hidden = true; layer.appendChild(h("div", "tl-fog", "？？？")); }
  if (fx2.noPanel) return;
  // 下のパネル
  const no = sel, [era, year, key] = EP_INFO[no], open = no <= SAVE.unlocked || no === 0, ready = !!EPS[no], st = SAVE.stars[no] || 0;
  const panel = h("div", "tl-panel");
  panel.innerHTML = `<div class="tp-l"><div class="tp-no">${no === 0 ? "プロローグ" : "第" + no + "話"}　<span>${esc(era)}・${esc(year)}</span></div>
    <div class="tp-tt">${open ? esc(EP_META[no][0]) : "？？？"}</div><div class="tp-key">${open && no > 0 && key !== "？" ? "キーマン：" + esc(key) : "&nbsp;"}</div></div>
    <div class="tp-r"><div class="tp-st">${no === 0 ? (st ? "クリア" : "") : open && ready ? "★".repeat(st) + "<i>" + "☆".repeat(MAX_HEARTS - st) + "</i>" : ""}</div></div>`;
  const br = h("div", "tp-btns");
  if (!open) br.appendChild(btn("じゅもんを 入れる", "", enterSpell));
  else if (!ready) br.appendChild(btn("じゅんび中", "", () => { }));
  else {
    if (SAVE.resume && SAVE.resume.no === no) br.appendChild(btn("つづきから", "red", () => playEpisode(no, true)));
    br.appendChild(btn(SAVE.resume && SAVE.resume.no === no ? "はじめから" : "はじめる", SAVE.resume && SAVE.resume.no === no ? "" : "red", () => playEpisode(no, false)));
  }
  if (!ready && open) br.firstChild.disabled = true;
  panel.querySelector(".tp-r").appendChild(br);
  layer.appendChild(panel);
}
/* プロローグのあと：2023年から縄文まで、年表をさかのぼる */
async function playRewind() {
  const order = [];
  for (let pi = PAGES.length - 2; pi >= 0; pi--) for (let i = PAGES[pi].eps.length - 1; i >= 0; i--) order.push([pi, PAGES[pi].eps[i]]);
  const yr = h("div", "rewind-year"); 
  for (let k = 0; k < order.length; k++) {
    const [pi, no] = order[k];
    drawTimeline(pi, no, { noPanel: true, flick: PAGES[pi].eps });
    layer.classList.add("rewinding");
    yr.textContent = EP_INFO[no][1]; layer.appendChild(yr);
    blip();
    await sleep(k === 0 ? 1200 : Math.max(140, 420 - k * 25));
  }
  drawTimeline(0, 1, { noPanel: true });
  banner("縄文時代へ");
  await sleep(1800);
  SEL = { page: 0, no: 1 };
  drawTimeline(0, 1);
}
/* 15話のあと：2023年の先の霧が晴れて、20XX年（ユガミの時代）があらわれる */
async function playFuture() {
  drawTimeline(PAGES.length - 2, 0, { noPanel: true });
  const fog = layer.querySelector(".tl-fog"); if (fog) fog.classList.add("shake");
  await sleep(1400);
  banner("時の 霧が 晴れていく……");
  await sleep(1900);
  SAVE.flags = Object.assign({}, SAVE.flags, { future: true }); persist();
  drawTimeline(PAGES.length - 1, 21, { noPanel: true });
  layer.classList.add("future-in");
  bigText("20XX年", "ronpa");
  await sleep(1600);
  banner("ユガミが 来た 時代");
  await sleep(1900);
  SEL = { page: PAGES.length - 1, no: 21 };
  drawTimeline(SEL.page, 21);
}

/* ---------- 画面：クリア一覧（先生に見せる） ---------- */
function showClearList() {
  const total = Object.entries(SAVE.stars).reduce((a, [k, v]) => a + (k === "0" ? 0 : v), 0);
  const rows = EP_META.map(([t], no) => SAVE.stars[no] ? `<tr><td>${no === 0 ? "プロローグ" : "第" + no + "話"}</td><td>${esc(t)}</td><td class="st">${"★".repeat(SAVE.stars[no])}</td></tr>` : "").join("");
  alertBox(`<div class="cl-title">クリア一覧</div><table class="cl">${rows || "<tr><td>まだ クリアした おはなしは ありません</td></tr>"}</table><div class="cl-total">★の 合計　${total}</div>`);
}

/* ---------- 画面：けっか ---------- */
function showResult(no, ep, star) {
  setBg("夜"); clearLayer(); layer.className = "menu";
  const box = h("div", "result");
  box.appendChild(h("div", "res-title", no === 0 ? "プロローグ クリア！" : `第${no}話 クリア！`));
  box.appendChild(h("div", "res-star", "★".repeat(star) + "<span class='off'>" + "☆".repeat(MAX_HEARTS - star) + "</span>"));
  box.appendChild(h("div", "res-note", star === MAX_HEARTS ? "パーフェクト！" : "クリアした ときの ♡の 数が ★に なるよ（ゲームオーバーに なると ★1）"));
  box.appendChild(h("div", "res-pass", `ふっかつの じゅもん<br><b>${makePassword()}</b>`));
  const row = h("div", "btnrow");
  row.appendChild(btn("カードずかん", "sub", showZukan));
  row.appendChild(btn("おはなしを えらぶ", "", () => showSelect()));
  box.appendChild(row);
  layer.appendChild(box);
}

/* ---------- 画面：ずかん ---------- */
function showZukan() {
  S = null; renderHud(); setBg("夜"); clearLayer(); layer.className = "menu";
  const names = Object.keys(CARDS);
  const have = names.filter(n => SAVE.cards[n]).length;
  const top = h("div", "topbar");
  top.appendChild(btn("もどる", "sub", showTitle));
  top.appendChild(h("div", "topttl", `カードずかん　${have} / ${names.length}`));
  top.appendChild(h("div", "spacer"));
  layer.appendChild(top);
  const zb = h("div", "zbody"); layer.appendChild(zb);
  const zd = h("div", "zdetail", "カードを タップすると、説明が 出るよ");
  zb.appendChild(pager(names, { perPage: 16, cols: 8, unknown: n => !SAVE.cards[n], onTap: n => {
    if (!SAVE.cards[n]) { zd.innerHTML = "まだ 手に入れて いない カードだよ"; return; }
    const c = CARDS[n];
    zd.innerHTML = `<b>${esc(c.name)}</b>　${fmt(c.desc)}<div class="cg-kw">調べる キーワード：<b>${esc(c.kw)}</b></div>`;
  } }));
  layer.appendChild(zd);
}

/* ---------- 画面：せってい ---------- */
function showSettings() {
  S = null; renderHud(); setBg("夜"); clearLayer(); layer.className = "menu";
  const top = h("div", "topbar");
  top.appendChild(btn("もどる", "sub", showTitle));
  top.appendChild(h("div", "topttl", "せってい"));
  top.appendChild(h("div", "spacer"));
  layer.appendChild(top);
  const col = h("div", "settings");
  const tog = (label, key) => btn(`${label}：${SAVE.opt[key] ? "ON" : "OFF"}`, "", () => { SAVE.opt[key] = !SAVE.opt[key]; persist(); showSettings(); });
  col.appendChild(tog("ふりがな", "ruby"));
  col.appendChild(tog("自動で 読み上げ", "autoRead"));
  const SPN = { fast: "はやい", normal: "ふつう", slow: "ゆっくり" }, order = ["fast", "normal", "slow"];
  col.appendChild(btn(`文字の 速さ：${SPN[SAVE.opt.speed] || "ふつう"}`, "", () => { SAVE.opt.speed = order[(order.indexOf(SAVE.opt.speed) + 1) % 3]; persist(); showSettings(); }));
  col.appendChild(tog("文字の 音（ぽぽぽ）", "blip"));
  col.appendChild(btn("ふっかつの じゅもんを 見る", "", () => alertBox(`いまの ふっかつの じゅもん<br><b class="pw">${makePassword()}</b><br><small>セーブが 消えたときに 使うよ。メモしておこう！</small>`)));
  col.appendChild(btn("ふっかつの じゅもんを 入れる", "", restoreFromPassword));
  layer.appendChild(col);
}

/* ---------- かいほうの じゅもん ---------- */
const normKana = s => (s || "").trim().replace(/\s+/g, "").replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60));
function fnv(s) { let x = 2166136261; for (const ch of "mh:" + s) { x ^= ch.codePointAt(0); x = Math.imul(x, 16777619) >>> 0; } return x.toString(36); }
async function enterSpell() {
  const v = await inputBox("かいほうの じゅもんを 入れてね", "ひらがなで 入力");
  if (v == null) return;
  const hs = fnv(normKana(v));
  const no = (window.UNLOCK_HASHES || []).indexOf(hs);
  if (no > 0) {
    SAVE.unlocked = Math.max(SAVE.unlocked, no); persist();
    await alertBox(`じゅもんが ひかった！<br><b>第${no}話</b>まで ひらいたよ！`);
  } else await alertBox("じゅもんが ちがうようだ……");
}

/* ---------- ふっかつの じゅもん（開放＋★） ---------- */
const PW_MASK = [19, 7, 28, 3, 22, 11, 30, 14, 5, 25, 9, 17, 2, 27, 12];
const PW_LEN = 15;
const PW_CH = "あいうえおかきくけこさしすせそたちつてとなにのはひふへほまみむも"; // 32文字（見まちがえやすい字はのぞく）
function makePassword() {
  let v = BigInt(Math.min(SAVE.unlocked, 31));
  for (let i = 0; i < EP_COUNT; i++) v |= BigInt(Math.min(SAVE.stars[i] || 0, 7)) << BigInt(5 + i * 3);
  const digits = [];
  for (let i = 0; i < PW_LEN; i++) { digits.push(Number(v & 31n)); v >>= 5n; }
  const sum = digits.reduce((a, d, i) => (a + d * (i + 3)) % 32, 7);
  const s = [...digits.map((d, i) => d ^ PW_MASK[i]), sum].map(d => PW_CH[d]).join("");
  return s.slice(0, 4) + "・" + s.slice(4, 8) + "・" + s.slice(8, 12) + "・" + s.slice(12);
}
function readPassword(str) {
  const s = normKana(str).replace(/[・･\-ー]/g, "");
  if (s.length !== PW_LEN + 1) return null;
  const d = [...s].map(c => PW_CH.indexOf(c));
  if (d.some(x => x < 0)) return null;
  for (let i = 0; i < PW_LEN; i++) d[i] ^= PW_MASK[i];
  const sum = d.slice(0, PW_LEN).reduce((a, x, i) => (a + x * (i + 3)) % 32, 7);
  if (sum !== d[PW_LEN]) return null;
  let v = 0n; for (let i = PW_LEN - 1; i >= 0; i--) v = (v << 5n) | BigInt(d[i]);
  const unlocked = Number(v & 31n), stars = {};
  for (let i = 0; i < EP_COUNT; i++) { const s2 = Number((v >> BigInt(5 + i * 3)) & 7n); if (s2 > MAX_HEARTS) return null; if (s2) stars[i] = s2; }
  if (unlocked >= EP_COUNT) return null;
  return { unlocked, stars };
}
async function restoreFromPassword() {
  const v = await inputBox("ふっかつの じゅもんを 入れてね", "例：あいうえ・かきくけ・こさしす・せそた");
  if (v == null) return;
  const r = readPassword(v);
  if (!r) return alertBox("じゅもんが ちがうようだ……<br>もう一度 たしかめてね。");
  SAVE.unlocked = Math.max(SAVE.unlocked, r.unlocked);
  for (const k in r.stars) {
    SAVE.stars[k] = Math.max(SAVE.stars[k] || 0, r.stars[k]);
    if (EPS[k]) EPS[k].cards.forEach(c => SAVE.cards[c] = 1);
  }
  persist();
  await alertBox("ふっかつ した！");
  showSettings();
}

/* ---------- 起動 ---------- */
function boot() {
  stage = $("#stage"); layer = $("#layer"); bgEl = $("#bg"); talk = $("#talk"); catcher = $("#catch"); modal = $("#modal"); fx = $("#fx"); hud = $("#hud");
  for (const k in (window.SCENARIO_SRC || {})) EPS[k] = parseScript(Number(k), window.SCENARIO_SRC[k]);
  $("#hintBtn").onclick = onHint;
  $("#cardBtn").onclick = showHandViewer;
  $("#menuBtn").onclick = async () => {
    if (!S || S.busy) return;
    const box = h("div", "inbox"); box.appendChild(h("div", "in-msg", "おはなしを ちゅうだんしますか？<br><small>場面の はじめから 再開できます</small>"));
    const row = h("div", "btnrow");
    row.appendChild(btn("ちゅうだんする", "", () => { closeModal(); location.reload(); }));
    row.appendChild(btn("つづける", "sub", closeModal));
    box.appendChild(row); openModal(box);
  };
  addEventListener("resize", fit); fit();
  showTitle();
}
addEventListener("DOMContentLoaded", boot);
