/* まなびヒストリア エンジン */
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const FAIL = { fail: true };

/* ---------- 話の一覧 ---------- */
const EP_META = [
  ["プロローグ", "現代"], ["縄文のむら", "縄文"], ["弥生のむら", "縄文"], ["古墳のくに", "縄文"],
  ["聖徳太子の国づくり", "夜"], ["大化の改新", "夜"], ["大仏をつくれ！", "夜"], ["貴族のくらし", "夜"],
  ["武士の世へ① 平氏", "夜"], ["武士の世へ② 源頼朝", "夜"], ["元がせめてきた！", "夜"], ["室町文化", "夜"],
  ["戦国① 織田信長", "夜"], ["戦国② 秀吉と家康", "夜"], ["江戸幕府", "江戸"], ["町人の文化と新しい学問", "江戸"],
  ["明治① 開国と明治維新", "夜"], ["明治② 文明開化と憲法", "夜"], ["世界に歩みだした日本", "夜"],
  ["長く続いた戦争", "夜"], ["新しい日本、平和な日本へ", "現代"], ["最終回 未来へ", "時空"],
];
const EP_COUNT = EP_META.length;

/* ---------- 保存 ---------- */
const SKEY = "manabi-historia-v1";
function loadSave() { try { return JSON.parse(localStorage.getItem(SKEY)) || null; } catch (e) { return null; } }
let SAVE = Object.assign({ unlocked: 0, stars: {}, cards: {}, resume: null, opt: { ruby: true, autoRead: false } }, loadSave() || {});
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
  "ユウキ": { icon: "🧒", side: "L", col: "#f4a261" },
  "本じい": { icon: "📕", side: "L", col: "#e76f8a" },
  "トケイ": { icon: "⏱️", side: "L", col: "#e9c46a" },
  "ユガミ": { icon: "🌑", side: "R", col: "#7b5ea7" },
  "レキシクイ": { icon: "🐟", side: "R", col: "#9b6fd1" },
  "？？？": { icon: "❔", side: "R", col: "#777" },
};
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
        case "人物": { const [n, ic, side] = rest; ep.chars[n] = { icon: ic || "🙂", side: side || "R", col: "#6c8ead" }; break; }
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
function charOf(name, ep) { return (ep && ep.chars[name]) || CHARS[name] || { icon: "🙂", side: "R", col: "#6c8ead" }; }

/* ---------- 村人のシルエット（影絵） ---------- */
const SIL = {
  "おとこ": '<circle cx="50" cy="26" r="14"/><path d="M28 46 Q50 38 72 46 L76 98 L63 98 L61 136 L53 136 L50 106 L47 136 L39 136 L37 98 L24 98Z"/>',
  "おんな": '<circle cx="50" cy="12" r="8"/><circle cx="50" cy="28" r="13"/><path d="M34 46 Q50 40 66 46 L80 134 L20 134Z"/>',
  "としより": '<circle cx="42" cy="38" r="13"/><path d="M30 54 Q46 46 62 56 L70 132 L28 132 Q24 90 30 54Z"/><path d="M74 70 L82 134" stroke="currentColor" stroke-width="5"/><path d="M60 64 L76 72" stroke="currentColor" stroke-width="7" stroke-linecap="round"/>',
  "こども": '<circle cx="50" cy="56" r="13"/><path d="M34 74 Q50 68 66 74 L70 112 L60 112 L58 136 L52 136 L50 118 L48 136 L42 136 L40 112 L30 112Z"/>',
};
const SIL_EYES = { "おとこ": [44, 56, 25], "おんな": [44, 56, 27], "としより": [37, 47, 37], "こども": [45, 55, 55] };
function iconHTML(icon) {
  const m = /^人[:：](.+)$/.exec(icon || "");
  if (!m) return `<div class="picon">${icon}</div>`;
  const t = SIL[m[1]] ? m[1] : "おとこ", [x1, x2, y] = SIL_EYES[t];
  return `<svg class="sil" viewBox="0 0 100 140">${SIL[t]}<g class="eyes"><circle cx="${x1}" cy="${y}" r="3.2"/><circle cx="${x2}" cy="${y}" r="3.2"/></g></svg>`;
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
  el.innerHTML = `<div class="pface" style="--c:${c.col}">${c.icon}</div><div class="pname">${esc(name)}</div>` + (EXPR[expr] ? `<div class="pexpr">${EXPR[expr]}</div>` : "");
  el.classList.toggle("aura", aura);
  el.hidden = false; el.classList.remove("dim"); other.classList.add("dim");
  ports[side] = name;
}
function hidePortraits() { $("#portL").hidden = true; $("#portR").hidden = true; ports.L = ports.R = null; }

/* セリフ */
function waitAdvance() {
  return new Promise(res => {
    catcher.hidden = false;
    const done = () => { catcher.hidden = true; catcher.onclick = null; talk.onclick = null; document.removeEventListener("keydown", key); res(); };
    const key = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); done(); } };
    catcher.onclick = done; talk.onclick = e => { if (!e.target.closest(".speak")) done(); };
    document.addEventListener("keydown", key);
  });
}
async function say(who, expr, text, ep, opt = {}) {
  if (who === "トケイ") who = "";   // トケイは最終回まで話さない
  talk.hidden = false; talk.classList.toggle("dark", !!opt.dark);
  talk.querySelector(".tname").textContent = who && who !== "" ? who : "";
  talk.querySelector(".tname").hidden = !who;
  talk.querySelector(".ttext").innerHTML = fmt(text);
  talk.querySelector(".ttext").classList.toggle("narr", !who);
  talk.querySelector(".speak").onclick = e => { e.stopPropagation(); speak(text); };
  if (!opt.dark && !opt.noPort) showPortrait(who, expr, ep);
  if (SAVE.opt.autoRead) speak(text);
  await waitAdvance();
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
  const e = h("button", "card" + (opts.unknown ? " unknown" : ""), opts.unknown ? `<div class="cicon">？</div><div class="cname">？？？</div>` : `<div class="cicon">${c.icon}</div><div class="cname">${esc(c.name)}</div>`);
  return e;
}
function showCardGet(name) {
  return new Promise(res => {
    const c = CARDS[name];
    const box = h("div", "cardget");
    box.innerHTML = `<div class="cg-title">カードを 手に入れた！</div>`;
    const ce = cardEl(name); ce.classList.add("large"); box.appendChild(ce);
    box.appendChild(h("div", "cg-desc", fmt(c ? c.desc : "")));
    box.appendChild(h("div", "cg-kw", `🔍 調べる キーワード：<b>${esc(c ? c.kw : name)}</b>`));
    box.appendChild(btn("OK", "", () => { closeModal(); res(); }));
    openModal(box);
  });
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
    const row = h("div", "hand-row");
    const detail = h("div", "hand-detail", "カードを えらぶと、説明が 出るよ");
    const btns = h("div", "btnrow");
    const ok = btn("つきつける！", "red", () => { if (sel) { closeModal(); res(sel); } });
    ok.disabled = true;
    let sel = null;
    list.forEach(n => {
      const e = cardEl(n);
      e.onclick = () => {   // 1回目のタップで説明を読む → 「つきつける！」で決定
        sel = n; ok.disabled = false;
        row.querySelectorAll(".card").forEach(c => c.classList.remove("sel")); e.classList.add("sel");
        const c = CARDS[n] || { name: n, desc: "", kw: n };
        detail.innerHTML = `<b>${esc(c.name)}</b>　${fmt(c.desc)}`;
        if (SAVE.opt.autoRead) speak(c.name + "。" + c.desc);
      };
      row.appendChild(e);
    });
    box.appendChild(row); box.appendChild(detail);
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
  const row = h("div", "hand-row");
  S.hand.forEach(n => {
    const e = cardEl(n);
    e.onclick = () => { row.querySelectorAll(".card").forEach(c => c.classList.remove("sel")); e.classList.add("sel");
      const c = CARDS[n]; detail.innerHTML = `<b>${esc(c.name)}</b>　${fmt(c.desc)}<div class="cg-kw">🔍 調べる キーワード：<b>${esc(c.kw)}</b></div>`; };
    row.appendChild(e);
  });
  box.appendChild(row); box.appendChild(detail);
  box.appendChild(btn("とじる", "sub", closeModal));
  openModal(box);
}

/* ---------- プレイ中の状態 ---------- */
let S = null;   // { no, ep, idx, hearts, hand, hint2, failed, narrow, hintLv, node }
const MAX_HEARTS = 5, RETRY_HEARTS = 3;
function renderHud() {
  hud.hidden = !S;
  if (!S) return;
  $("#hearts").innerHTML = Array.from({ length: MAX_HEARTS }, (_, i) => `<span class="heart${i < S.hearts ? "" : " lost"}">${i < S.hearts ? "❤️" : "🤍"}</span>`).join("");
  $("#eptitle").textContent = S.no === 0 ? S.ep.title : `第${S.no}話　${S.ep.title.replace(/^第\d+話\s*/, "")}`;
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
    const upd = () => { info.innerHTML = `🔍 むらを 調べよう（のこり ${n.items.length - got.size}）`; };
    upd();
    n.items.forEach(it => {
      const e = h("button", "prop", `${iconHTML(it.icon)}<div class="plabel">${esc(it.name)}</div>`);
      placeAt(e, it.pos); if (got.has(it.name)) e.classList.add("done");
      e.onclick = async () => {
        if (S.busy) return; S.busy = true;
        try {
          let who = it.name, text = it.line;
          const m = text.match(/^(.+?)[：:](.*)$/);
          if (/^[＊*]/.test(text)) { who = ""; text = text.replace(/^[＊*]\s*/, ""); }
          else if (m && (CHARS[m[1]] || S.ep.chars[m[1]])) { who = m[1]; text = m[2]; }
          else if (!S.ep.chars[who] && !CHARS[who]) who = "";
          await say(who, "ふつう", text, S.ep); hideTalk(); hidePortraits();
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
    const upd = () => { info.innerHTML = `⚠️ ゆがんだ 証言を 見やぶれ！（のこり ${bads - fixed.size}）`; };
    upd();
    n.items.forEach((it, i) => {
      const e = h("button", "prop warped", `${iconHTML(it.icon)}${it.item ? `<div class="pitem">${it.item}</div>` : ""}<div class="plabel">${esc(it.name)}</div>`);
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
      const foe = h("div", "foe", `<div class="foe-face">${charOf("ユガミ").icon}</div><div class="foe-name">ユガミ</div>`);
      const gauge = h("div", "gauge", Array.from({ length: total }, (_, i) => `<span class="seg${i < total - r ? "" : " off"}"></span>`).join(""));
      foe.prepend(gauge); layer.appendChild(foe);
      layer.appendChild(h("div", "guide", `⚔️ ユガミの ウソを 見やぶれ！（${r + 1} / ${total}）`));
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
    layer.appendChild(h("div", "guide", "📝 わかったことを まとめよう"));
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
      layer.appendChild(h("div", "witness" + (aura ? " aura" : ""), `<div class="w-face" style="--c:${c.col}">${c.icon}</div><div class="w-name">${esc(who)}</div>`));
      const round = n.rounds[r];
      layer.appendChild(h("div", "guide", `🗣️ 証言「${esc(round.title || "")}」（${r + 1} / ${n.rounds.length}）`));
      const box = h("div", "tbox");
      box.innerHTML = `<div class="tname">${esc(who)}</div><div class="ttext"></div><div class="tcount"></div>`;
      const sp = h("button", "speak", "🔊"); box.appendChild(sp);
      layer.appendChild(box);
      const nav = h("div", "tnav");
      const prev = btn("◀ 前へ", "sub", () => go(-1));
      const pres = btn("つきつける！", "red", present);
      const next = btn("次へ ▶", "sub", () => go(1));
      box.onclick = e => { if (!e.target.closest(".speak")) go(1); };
      nav.append(prev, pres, next); layer.appendChild(nav);
      const show = () => {
        const line = round.lines[i];
        box.querySelector(".ttext").innerHTML = fmt(line.text);
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
      if (first) banner("", `〜 証言 〜<br>${esc(round.title || "")}`);
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
        case "bg": setBg(n.bg); break;
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
  showResult(no, ep, star);
}

/* ---------- 画面：タイトル ---------- */
function showTitle() {
  S = null; renderHud(); hideTalk(); hidePortraits(); closeModal();
  setBg("現代"); clearLayer(); layer.className = "menu";
  layer.appendChild(h("div", "logo", `<div class="logo-sub">時をこえて 歴史を まもれ</div><div class="logo-main">まなびヒストリア</div>`));
  const col = h("div", "menu-col");
  col.appendChild(btn("おはなしを えらぶ", "", showSelect));
  col.appendChild(btn("カードずかん", "", showZukan));
  col.appendChild(btn("じゅもんを 入れる", "", enterSpell));
  col.appendChild(btn("せってい", "", showSettings));
  layer.appendChild(col);
  layer.appendChild(h("div", "credit", "企画・ゲームデザイン・キャラクターデザイン　のち（まなび堂）"));
}

/* ---------- 画面：話をえらぶ ---------- */
function showSelect() {
  S = null; renderHud(); setBg("夜"); clearLayer(); layer.className = "menu";
  const total = Object.values(SAVE.stars).reduce((a, b) => a + b, 0);
  const top = h("div", "topbar");
  top.appendChild(btn("もどる", "sub", showTitle));
  top.appendChild(h("div", "topttl", "おはなしを えらぶ"));
  top.appendChild(btn(`★ ${total}`, "sub", showClearList));
  layer.appendChild(top);
  const grid = h("div", "epgrid");
  EP_META.forEach(([title], no) => {
    const open = no <= SAVE.unlocked, ready = !!EPS[no];
    const st = SAVE.stars[no] || 0;
    const t = h("button", "eptile" + (open ? "" : " locked") + (ready ? "" : " notready"),
      `<div class="epno">${no === 0 ? "プロローグ" : "第" + no + "話"}</div><div class="eptt">${open ? esc(title) : "？？？"}</div><div class="epst">${open ? (ready ? "★".repeat(st) + "☆".repeat(MAX_HEARTS - st) : "じゅんび中") : "🔒"}</div>`);
    t.onclick = async () => {
      if (!open) return alertBox("この おはなしは まだ ひらいていないよ。<br>先生から「かいほうの じゅもん」を 聞こう！");
      if (!ready) return alertBox("この おはなしは じゅんび中です。");
      if (no > 0 && !SAVE.stars[no - 1] && EPS[no - 1]) {
        await alertBox("前の おはなしから 遊ぶのが おすすめだよ。");
      }
      if (SAVE.resume && SAVE.resume.no === no) {
        const box = h("div", "inbox"); box.appendChild(h("div", "in-msg", "とちゅうから つづけますか？"));
        const row = h("div", "btnrow");
        row.appendChild(btn("つづきから", "", () => { closeModal(); playEpisode(no, true); }));
        row.appendChild(btn("はじめから", "sub", () => { closeModal(); playEpisode(no, false); }));
        box.appendChild(row); openModal(box);
      } else playEpisode(no, false);
    };
    grid.appendChild(t);
  });
  layer.appendChild(grid);
}

/* ---------- 画面：クリア一覧（先生に見せる） ---------- */
function showClearList() {
  const total = Object.values(SAVE.stars).reduce((a, b) => a + b, 0);
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
  row.appendChild(btn("おはなしを えらぶ", "", showSelect));
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
  const grid = h("div", "zgrid");
  names.forEach(n => {
    const got = !!SAVE.cards[n];
    const e = cardEl(n, { unknown: !got });
    e.onclick = () => {
      if (!got) return;
      const c = CARDS[n];
      alertBox(`<div class="zk-icon">${c.icon}</div><div class="zk-name">${esc(c.name)}</div><div class="zk-desc">${fmt(c.desc)}</div><div class="cg-kw">🔍 調べる キーワード：<b>${esc(c.kw)}</b></div>`);
    };
    grid.appendChild(e);
  });
  layer.appendChild(grid);
}

/* ---------- 画面：せってい ---------- */
function showSettings() {
  S = null; renderHud(); setBg("夜"); clearLayer(); layer.className = "menu";
  const top = h("div", "topbar");
  top.appendChild(btn("もどる", "sub", showTitle));
  top.appendChild(h("div", "topttl", "せってい"));
  top.appendChild(h("div", "spacer"));
  layer.appendChild(top);
  const col = h("div", "menu-col");
  const tog = (label, key) => btn(`${label}：${SAVE.opt[key] ? "ON" : "OFF"}`, "", () => { SAVE.opt[key] = !SAVE.opt[key]; persist(); showSettings(); });
  col.appendChild(tog("ふりがな", "ruby"));
  col.appendChild(tog("自動で 読み上げ", "autoRead"));
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
