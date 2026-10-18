/* まなびヒストリア エンジン */
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const FAIL = { fail: true };

/* ---------- 話の一覧 ---------- */
const EP_META = [
  ["時をこえて", "現代"], ["縄文のむら", "縄文"], ["弥生のくに", "弥生"], ["古墳のくに", "古墳"],
  ["聖徳太子の国づくり", "飛鳥"], ["大化の改新", "飛鳥"], ["大仏をつくれ！", "平城京"], ["貴族のくらし", "平安京"],
  ["武士の世へ① 平氏", "夜"], ["武士の世へ② 源頼朝", "夜"], ["元がせめてきた！", "夜"], ["室町文化", "夜"],
  ["戦国① 織田信長", "夜"], ["戦国② 秀吉と家康", "夜"], ["江戸幕府", "江戸"], ["町人の文化と新しい学問", "江戸"],
  ["明治① 開国と明治維新", "夜"], ["明治② 文明開化と憲法", "夜"], ["世界に歩みだした日本", "夜"],
  ["長く続いた戦争", "夜"], ["新しい日本、平和な日本へ", "現代"], ["最終回 未来へ", "時空"],
];
const EP_COUNT = EP_META.length;
// 年表：[時代, 年代, キーマン]
const EP_INFO = {
  0: ["令和", "2023年", "ユウキ"], 1: ["縄文", "約5500年前", "ミナ"], 2: ["弥生", "3世紀ごろ", "卑弥呼"], 3: ["古墳", "5世紀ごろ", "ワカタケル大王"],
  4: ["飛鳥", "600年ごろ", "聖徳太子"], 5: ["飛鳥", "645年", "中大兄皇子"], 6: ["奈良", "752年", "聖武天皇"], 7: ["平安", "1018年", "藤原道長"],
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
/* ★デバッグ用：true のあいだは、すべての話がひらく。公開するときは false にもどす */
const DEBUG_UNLOCK_ALL = true;
const isOpen = no => DEBUG_UNLOCK_ALL || no === 0 || no <= SAVE.unlocked;

/* ---------- 保存 ---------- */
const SKEY = "manabi-historia-v1";
function loadSave() { try { return JSON.parse(localStorage.getItem(SKEY)) || null; } catch (e) { return null; } }
let SAVE = Object.assign({ unlocked: 0, stars: {}, cards: {}, resume: null, opt: { ruby: true, autoRead: false, speed: "normal", blip: true, se: true, bgm: true } }, loadSave() || {});
SAVE.opt = Object.assign({ ruby: true, autoRead: false, speed: "normal", blip: true, se: true, bgm: true }, SAVE.opt);
let SAVE_LOCK = false;   // データを けしたあとは保存しない
function persist() { if (SAVE_LOCK) return; try { localStorage.setItem(SKEY, JSON.stringify(SAVE)); } catch (e) { } }

/* ---------- 文字の整形（ルビ・キーワード） ---------- */
const esc = s => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const KANJI = "[\\u4E00-\\u9FFF\\u3005\\u30F6]+";
/* 自動ふりがな：data/yomi.txt の辞書で、漢字に読みをつける（台本の 漢字《よみ》 が優先） */
const YMAP = {};
(window.YOMI || []).forEach(([k, n, v]) => (YMAP[k[0]] = YMAP[k[0]] || []).push([k, n, v]));
Object.values(YMAP).forEach(a => a.sort((x, y) => y[0].length - x[0].length));
const KJ1 = /[\u4E00-\u9FFF\u3005\u30F6]/;
function autoRuby(s) {
  let out = "", i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (!KJ1.test(ch)) { out += ch; i++; continue; }
    let j = i; while (j < s.length && KJ1.test(s[j])) j++;
    if (s[j] === "《") { out += s.slice(i, j); i = j; continue; }   // 台本でよみを書いたところは そのまま
    const hit = (YMAP[ch] || []).find(e => s.startsWith(e[0], i));
    if (hit && hit[1] > 0) { out += `<ruby>${s.substr(i, hit[1])}<rt>${hit[2]}</rt></ruby>`; i += hit[1]; }
    else { out += ch; i++; }
  }
  return out;
}
/* fmt：セリフ・証言・カードの説明など、ふりがなを入れてよい所に使う
   fmtUI：帯・見出し・ボタンなど高さの決まった所に使う（ふりがなを入れない） */
/* 題名やカード名を「切りのいいところ」で改行する：助詞（の・と・を…）のあとに漢字・カタカナが来るところだけで折り返す
   （例：町人の｜文化と｜新しい学問）。区切りがない名前（漢字だけ等）は、ふつうに折り返す */
function phr(t) {
  const ch = [...(t || "")]; let out = "", any = false;
  ch.forEach((c, i) => {
    if (i > 0 && (/[のとをにでがはへやも、・]/.test(ch[i - 1]) && /[^ぁ-ゖ、。！？・ー）」]/.test(c) || ch[i - 1] === " ")) { out += "<wbr>"; any = true; }
    out += esc(c);
  });
  return any ? `<span class="kp">${out}</span>` : out;
}
function fmtUI(t) { return esc(t).replace(new RegExp(`(${KANJI})《[^》]+》`, "g"), "$1").replace(/【([^】]+)】/g, '<span class="kw">$1</span>').replace(/[｛｝]/g, ""); }
function fmt(t) {
  let s = esc(t);
  if (SAVE.opt.ruby) s = autoRuby(s);
  s = s.replace(new RegExp(`(${KANJI})《([^》]+)》`, "g"), (m, k, r) => SAVE.opt.ruby ? `<ruby>${k}<rt>${r}</rt></ruby>` : k);
  s = s.replace(/【([^】]+)】/g, '<span class="kw">$1</span>');
  s = s.replace(/｛([^｝]+)｝/g, '<span class="tq">$1</span>');   // 証言の「カードに関係する文」（黄色）
  return s;
}
const plain = t => t.replace(/《[^》]+》/g, "").replace(/[【】｛｝]/g, "");
const forSpeech = t => t.replace(new RegExp(`(${KANJI})《([^》]+)》`, "g"), "$2").replace(/[【】｛｝＊]/g, "");

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
  "卑弥呼": { icon: "人:おんな", side: "R", art: "himiko" },
  "弟": { icon: "人:おとこ", side: "R", art: "otouto" },
  "ワカタケル大王": { icon: "人:おとこ", side: "R", art: "wakatakeru" },
  "聖徳太子": { icon: "人:おとこ", side: "R", art: "shotoku" },
  "中大兄皇子": { icon: "人:おとこ", side: "R", art: "nakanooe" },
  "中臣鎌足": { icon: "人:おとこ", side: "L", art: "kamatari" },
  "聖武天皇": { icon: "人:おとこ", side: "R", art: "shoumu" },
  "光明皇后": { icon: "人:おんな", side: "L", art: "koumyou" },
  "行基": { icon: "人:としより", side: "R", art: "gyouki" },
  "藤原道長": { icon: "人:おとこ", side: "R", art: "michinaga" },   // 1018年は @変装 藤原道長 old（年をとった 道長）
  "藤式部": { icon: "人:おんな", side: "L", art: "fujishikibu" },
  "レキシクイ": { icon: "🐟", side: "R", art: "lexikui" },
  "？？？": { icon: "人:おとこ", side: "R" },
};
const ART_EXP = { "ふつう": "normal", "おどろき": "surprise", "笑顔": "smile", "怒り": "angry", "泣き": "cry" };
/* 顔グラ：画像があれば画像（表情がなければ「ふつう」）、人間はシルエット、それ以外は絵文字 */
function faceHTML(c, expr, key) {
  const A = window.ART || {};
  if (c.art && A[c.art]) {
    const dz = S && S.disguise && S.disguise[key];   // 変装中（@変装）はその絵
    const src = (dz && A[c.art][dz]) || A[c.art][ART_EXP[expr]] || A[c.art].normal;
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
        case "背景": ep.nodes.push({ t: "bg", bg: rest[0] || arg, tint: rest[1] || "" }); break;   // @背景 飛鳥 夕焼け（色は 朝／夕焼け／夜。なしで ふつう）
        case "時ワープ": ep.nodes.push({ t: "tjump", from: Number(rest[0]), to: Number(rest[1]), bg: rest[2] || "", tint: rest[3] || "" }); break;   // @時ワープ 643 645 飛鳥 夕焼け
        case "人物": { const [n, ic, side, art] = rest; ep.chars[n] = Object.assign({}, CHARS[n] || {}, { icon: ic || "人:おとこ", side: side || "R" }, art ? { art } : {}); break; }   // 4つめ＝顔グラ（名のる前の ？？？ に使う）
        case "カード": block = { t: "cards" }; break;
        case "調査": add({ t: "inv", items: [], hint: "" }); break;
        case "まちがい探し": add({ t: "spot", items: [], hint: "" }); break;
        case "論破バトル": add({ t: "battle", rounds: [[]], hint: "" }); break;
        case "まとめ": add({ t: "sum", lines: [], hint: "" }); break;
        case "記憶のかけら": add({ t: "frag", title: arg, lines: [] }); break;
        case "クリア": ep.nodes.push({ t: "clear" }); break;
        case "画像": ep.nodes.push({ t: "pic", key: rest[0] || "", fx: rest[1] || "" }); break;
        case "ゆがみ": ep.nodes.push({ t: "warp", text: arg || "歴史が ゆがみはじめる……！" }); break;
        case "ゆがめる": ep.nodes.push({ t: "warp", text: "歴史が ゆがみはじめる……！", who: arg }); break;
        case "きざし": ep.nodes.push({ t: "omen" }); break;
        case "退場": ep.nodes.push({ t: "exit", who: arg }); break;
        case "旅立ち": ep.nodes.push({ t: "depart" }); break;
        case "もどす": ep.nodes.push({ t: "restore", who: arg }); break;
        case "変装": ep.nodes.push({ t: "disguise", who: rest[0] || "", look: rest[1] || "" }); break;   // @変装 卑弥呼 hood ／ @変装 卑弥呼（もどす）
        case "たいせつ": { const [key, name, desc] = split(arg); ep.gift = { key, name, desc }; break; }   // その話のおくりもの（ずかんの「たいせつ」）
        case "SE": ep.nodes.push({ t: "se", key: rest[0] || "", times: Number(rest[1]) || 1 }); break;   // @SE taiko 3 ＝3回
        case "BGM": ep.nodes.push({ t: "bgm", key: arg }); break;
        case "スタッフロール": ep.nodes.push({ t: "staff", key: arg }); break;
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
        else if (block.t === "testi") {
          const [kind, text, card, retort, reaction, nearS] = p;   // 6つめ：おしいカード「カード名＝本じいのセリフ」（♡はへらない）
          const near = {}; (nearS || "").split(/\s*；\s*/).forEach(x => { const m = x.match(/^(.+?)[＝=](.+)$/); if (m) near[m[1].trim()] = m[2].trim(); });
          block.rounds[block.rounds.length - 1].lines.push({ lie: /矛盾|ウソ/.test(kind), text, card, retort, reaction, near });
        }
        else if (block.t === "battle") { const [kind, text, card, reply, foeLine] = p; block.rounds[block.rounds.length - 1].push({ lie: /ウソ/.test(kind), text, card, reply, foeLine }); }
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
  const g = /^画[:：](.+)$/.exec(icon || "");   // 「画:iconflag」＝ art の絵（白いシルエット）
  if (g && window.ART && window.ART[g[1]]) return `<img class="sil silimg picon-img ${cls}" src="${window.ART[g[1]].normal}" alt="">`;
  const m = /^人[:：](.+)$/.exec(icon || "");
  if (!m) return `<div class="picon">${icon}</div>`;
  const src = silPick(m[1], key);
  if (src) return `<img class="sil silimg ${cls}" src="${src}" alt="">`;
  const t = SIL[m[1]] ? m[1] : "おとこ", [x1, x2, y] = SIL_EYES[t];
  return `<svg class="sil ${cls}" viewBox="0 0 100 140">${SIL[t]}<g class="eyes"><circle cx="${x1}" cy="${y}" r="3.2"/><circle cx="${x2}" cy="${y}" r="3.2"/></g></svg>`;
}

/* ---------- 画面の基本部品 ---------- */
let stage, layer, bgEl, talk, catcher, modal, fx, hud;
/* ---------- 画面の拡大縮小・スマホの全画面（まなびバトルと同じしくみ） ---------- */
// Canva の枠（iframe）の中では、じっさいに見えている範囲に合わせる
const IN_FRAME = (() => { try { return window.self !== window.top; } catch (e) { return true; } })();
let VIS = null;
function fit() {
  const v = window.visualViewport, W = v ? v.width : innerWidth, H = v ? v.height : innerHeight;
  let x = 0, y = 0, w = W, hh = H;
  if (VIS && (VIS.h < H - 2 || VIS.w < W - 2)) ({ x, y, w, h: hh } = VIS);
  const s = Math.min(w / 1600, hh / 900);
  stage.style.left = (x + w / 2) + "px"; stage.style.top = (y + hh / 2) + "px";
  stage.style.transform = `translate(-50%,-50%) scale(${s})`;
}
// スマホ・タブレット（iOS / Android）だけ全画面。パソコンでは何もしない。せっていでオフにもできる
const UA = navigator.userAgent || "";
const IS_IOS = /iPhone|iPad|iPod/.test(UA) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const MOBILE = IS_IOS || /Android/i.test(UA);
const fsEl = () => document.fullscreenElement || document.webkitFullscreenElement;
const fsCan = () => { const d = document.documentElement; return !!(d.requestFullscreen || d.webkitRequestFullscreen); };
function fsEnter() {
  if (!MOBILE || SAVE.opt.full === false || fsEl() || !fsCan()) return;
  const d = document.documentElement;
  try {
    const p = d.requestFullscreen ? d.requestFullscreen({ navigationUI: "hide" }) : d.webkitRequestFullscreen();
    if (p && p.then) p.then(() => { try { const o = screen.orientation; if (o && o.lock) o.lock("landscape").catch(() => { }); } catch (e) { } }).catch(() => { });
  } catch (e) { }
}
function fsExit() { try { if (fsEl()) (document.exitFullscreen || document.webkitExitFullscreen).call(document); } catch (e) { } }
function setupScreen() {
  if (MOBILE) document.documentElement.classList.add("mob");
  if (IN_FRAME && window.IntersectionObserver) {
    try {
      new IntersectionObserver(es => { const r = es[es.length - 1].intersectionRect; VIS = r.width > 50 && r.height > 50 ? { x: r.left, y: r.top, w: r.width, h: r.height } : null; fit(); },
        { threshold: Array.from({ length: 101 }, (_, i) => i / 100) }).observe(document.getElementById("vp"));
    } catch (e) { }
  }
  addEventListener("orientationchange", () => setTimeout(fit, 300));
  if (window.visualViewport) visualViewport.addEventListener("resize", fit);
  document.addEventListener("fullscreenchange", fit); document.addEventListener("webkitfullscreenchange", fit);
  // 全画面は「タップしたとき」にしか始められない（ブラウザのきまり）→ タップのたびに、全画面でなければもどす
  if (MOBILE) document.addEventListener("pointerup", fsEnter, true);
  setTimeout(fit, 100);
}
let CUR_BG = "夜";
function setBg(key, fade, tint) {
  if (fade && CUR_BG !== key && bgEl.firstChild) {   // 場面の中の背景がわり：前の背景を上に重ねて、ふわっと消す
    const old = bgEl.cloneNode(true); old.removeAttribute("id"); old.classList.add("bg-old");
    bgEl.parentNode.insertBefore(old, bgEl.nextSibling); setTimeout(() => old.remove(), 600);
  }
  CUR_BG = key; bgEl.classList.remove("warped", "restoring"); bgEl.innerHTML = ""; bgEl.appendChild(BG.render(key));
  if (key === "平安京") bgEl.appendChild(BG.moon());   // 夜だけ 見える 月
  setTint(tint);
}
function setTint(t) { if (t) bgEl.dataset.tint = t; else delete bgEl.dataset.tint; }   // 背景の時間帯の色（朝／夕焼け／夜）
/* ゆがみの度合い（0〜1）。背景がくもり、ひびが広がる */
const CRACKS = ["M0 120 L140 170 L210 140 L330 230", "M1600 80 L1460 150 L1380 120 L1250 260", "M0 420 L120 380 L170 430 L280 360",
  "M1600 430 L1480 400 L1430 450 L1320 380", "M620 0 L680 90 L640 140 L720 230", "M1100 0 L1060 80 L1110 130 L1040 210"];   // セリフのまどに重ならない位置
function setWarpLevel(v) {
  bgEl.style.setProperty("--wl", v);
  let c = bgEl.querySelector(".cracks");
  if (v <= 0) { if (c) c.remove(); return; }
  if (!c) {
    c = document.createElementNS("http://www.w3.org/2000/svg", "svg"); c.setAttribute("class", "cracks"); c.setAttribute("viewBox", "0 0 1600 900");
    c.innerHTML = CRACKS.map(d => `<path d="${d}"/>`).join(""); bgEl.appendChild(c);
  }
  [...c.children].forEach((pth, i) => pth.style.opacity = v > i / CRACKS.length ? 1 : 0);
}
let HB = null;   // 心拍音のくり返し
function clearLayer() { layer.innerHTML = ""; layer.className = ""; stage.classList.remove("testi-on", "battle-on", "danger"); if (HB) { clearInterval(HB); HB = null; } }
const btn = (label, cls, on) => { const b = h("button", "btn " + (cls || ""), label); b.onclick = on; return b; };

/* 場面の中央に出す画像（@画像 名前 [光る]）。名前は art の名前（tokei など）。空なら消す */
const PIC_FX = { "光る": "glow" };
function showPic(key, fx) {
  const el = $("#pic"); if (!el) return;
  const A = (window.ART || {})[key];
  if (!key || !A) { el.innerHTML = ""; return; }
  el.innerHTML = `<img class="picimg ${PIC_FX[fx] || ""}" src="${A.normal || Object.values(A)[0]}" alt="">`;
}
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
  const entering = el.hidden || el.classList.contains("leave") || ports[side] !== name;
  el.innerHTML = (aura ? AURA_HTML : "") + `<div class="pface">${faceHTML(c, expr, name)}</div>` + (!hasArt && EXPR[expr] ? `<div class="pexpr">${EXPR[expr]}</div>` : "");
  el.classList.toggle("aura", aura);
  el.classList.remove("leave", "jump", "tremble", "vanish", "glitch", "lexi");   // lexi（レキシクイの紫）は毎回はずす
  el.hidden = false; el.classList.remove("dim"); other.classList.add("dim");
  if (entering) { el.classList.remove("enter"); void el.offsetWidth; el.classList.add("enter"); }
  else if (expr === "おどろき" || expr === "怒り") { void el.offsetWidth; el.classList.add(expr === "おどろき" ? "jump" : "tremble"); }   // 表情に合わせて動く
  ports[side] = name;
}
const AURA_HTML = `<div class="aura-fx">${"<i></i>".repeat(10)}</div>`;
function hidePortraits(fade) {
  const ps = [$("#portL"), $("#portR")];
  if (fade) {
    ps.forEach(e => { if (!e.hidden) e.classList.add("leave"); });
    setTimeout(() => ps.forEach(e => { if (e.classList.contains("leave")) { e.hidden = true; e.classList.remove("leave"); } }), 320);
  } else ps.forEach(e => { e.hidden = true; e.classList.remove("leave", "lexi"); });
  ports.L = ports.R = null;
}

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
    g.gain.setValueAtTime(0.09, actx.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + 0.045);
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
  const base = SPEEDS[SAVE.opt.speed] || SPEEDS.normal;
  const end = () => { if (t.done) return; t.done = true; clearTimeout(timer); units.forEach(u => u.classList.remove("tw-h")); onEnd && onEnd(); };
  t.finish = end;
  const step = () => {
    if (i >= units.length) return end();
    const u = units[i++]; u.classList.remove("tw-h");
    const ch = u.textContent;
    if (!/[\s、。！？…「」―]/.test(ch) && (n++ % 2 === 0)) blip();
    timer = setTimeout(step, /[…―]/.test(ch) ? base * 5 : /[。！？]/.test(ch) && i < units.length ? base * 4 : base);   // 間（ま）をとる
  };
  timer = setTimeout(step, base);
  if (!units.length) end();
  return t;
}
/* ---------- 既読スキップ：クリアした話だけ。セリフを高速で送る。調査・証言・選択肢では自動でオフ ---------- */
let SKIP = false, ADV = null;
const canSkip = () => !!(S && SAVE.stars[S.no] > 0);   // 調査・証言のとちゅうのセリフでも使える（選ぶ画面にもどると自動でオフ）
function setSkip(on) {
  SKIP = !!on && canSkip();
  const b = $(".skipbtn"); if (b) { b.classList.toggle("on", SKIP); b.textContent = SKIP ? "スキップ中 ■" : "スキップ ▶▶"; }
}
function waitAdvance(typer) {
  return new Promise(res => {
    catcher.hidden = false;
    let timer = null;
    const done = () => { clearTimeout(timer); ADV = null; catcher.hidden = true; catcher.onclick = null; talk.onclick = null; document.removeEventListener("keydown", key); res(); };
    const go = () => {
      if (SKIP) { setSkip(false); clearTimeout(timer); return; }   // スキップ中にタップ → 早送りを止める
      if (typer && !typer.done) { typer.finish(); return; }   // 表示中ならまず全部出す
      done();
    };
    const key = e => { if (!modal.hidden) return; if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } };
    catcher.onclick = go; talk.onclick = e => { if (!e.target.closest(".skipbtn")) go(); };
    document.addEventListener("keydown", key);
    ADV = () => { if (typer) typer.finish(); timer = setTimeout(done, 70); };   // スキップ：すぐ全部出して、すぐ次へ
    if (SKIP) ADV();
  });
}
async function say(who, expr, text, ep, opt = {}) {
  if (who === "トケイ") who = "";   // トケイは最終回まで話さない
  talk.hidden = false; talk.classList.toggle("dark", !!opt.dark);
  talk.querySelector(".tname").textContent = who && who !== "" ? who : "";
  talk.querySelector(".tname").hidden = !who;
  const tt = talk.querySelector(".ttext");
  tt.classList.toggle("narr", !who);
  tt.classList.toggle("inner", /^（[\s\S]*）$/.test(text.trim()));   // （ ）は心の声
  logPush(who, text);
  stage.classList.add("talking");
  if (opt.noPort) { $("#portL").classList.add("dim"); $("#portR").classList.add("dim"); }
  if (!opt.dark && !opt.noPort) {
    if (who === "ユガミ" && ports.R !== "ユガミ") { FX.add("vignette", "", 1800); SE.play("drum"); FX.shake("m"); }   // ユガミ登場
    if (who === "レキシクイ") { SE.play("growl"); FX.shake("l"); FX.flash("rgba(150,60,255,.55)", 320); }
    showPortrait(who, expr, ep);
    if (who === "レキシクイ") { const pe = $("#portR"); pe.classList.add("lexi"); }
  }
  const sb = talk.querySelector(".skipbtn"); sb.hidden = !canSkip(); if (!canSkip()) setSkip(false);
  if (SAVE.opt.autoRead && !SKIP) speak(text);
  talk.classList.add("typing");
  const typer = typeIn(tt, fmt(text), () => talk.classList.remove("typing"));
  await waitAdvance(typer);
  stopSpeak();
}
function hideTalk() { talk.hidden = true; stage.classList.remove("talking"); if (S && S.noSkip && SKIP) setSkip(false); }   // 調査・証言・バトルの画面にもどったらスキップを止める

/* ---------- バックログ ---------- */
let LOG = [];
function logPush(who, text) {
  const last = LOG[LOG.length - 1];
  if (last && last.who === who && last.text === text) return;
  LOG.push({ who: who || "", text }); if (LOG.length > 200) LOG.shift();
}
function showLog() {
  if (!modal.hidden) return;
  const box = h("div", "inbox wide logbox");
  box.appendChild(h("div", "in-title", "これまでの おはなし"));
  const list = h("div", "log-list"), bar = h("div", "log-bar");
  const prev = h("button", "pg-arrow sq", "◀"), next = h("button", "pg-arrow sq", "▶"), pn = h("div", "log-pn");
  const rowHTML = l => `<div class="log-row"><span class="log-who${[...(l.who || "")].length > 7 ? " small" : ""}">${esc(l.who || "")}</span><span class="log-text${l.who ? "" : " narr"}">${fmt(l.text)}</span></div>`;
  bar.append(prev, pn, next);
  const close = btn("とじる", "sub log-close", closeModal);
  box.append(list, bar, close);   // ページ送り（上）と とじる（下）をたてに
  openModal(box);
  // 行の高さを実際に測って、はみ出さないようにページを分ける（スクロールなし）
  const pages = [];
  if (!LOG.length) pages.push(`<div class="log-row">まだ ないよ</div>`);
  else {
    list.innerHTML = LOG.map(rowHTML).join("");
    const H = list.clientHeight, rows = [...list.children];
    let cur = [], used = 0;
    rows.forEach((r, i) => {
      const rh = r.offsetHeight + 6;
      if (cur.length && used + rh > H) { pages.push(cur.join("")); cur = []; used = 0; }
      cur.push(rowHTML(LOG[i])); used += rh;
    });
    if (cur.length) pages.push(cur.join(""));
  }
  let page = pages.length - 1;
  const draw = () => { list.innerHTML = pages[page]; prev.disabled = page === 0; next.disabled = page >= pages.length - 1; pn.textContent = `${page + 1} / ${pages.length}`; };
  prev.onclick = () => { if (page > 0) { page--; draw(); } }; next.onclick = () => { if (page < pages.length - 1) { page++; draw(); } };
  draw();
}

/* 効果 */
function bigText(text, cls) { const e = h("div", "big " + (cls || ""), text); fx.appendChild(e); setTimeout(() => e.remove(), 1400); }
function shake(l) { FX.shake(l); }
function banner(text, html) { const e = h("div", "banner" + (html ? " tall" : ""), html || fmtUI(text)); fx.appendChild(e); setTimeout(() => e.remove(), 1800); }

/* モーダル */
function openModal(content, cls) { setSkip(false); modal.innerHTML = ""; modal.className = "modal " + (cls || ""); modal.appendChild(content); modal.hidden = false; stage.classList.add("modal-on"); }
function closeModal() { modal.hidden = true; modal.innerHTML = ""; stage.classList.remove("modal-on"); }

/* カードの絵：写真（window.CARDIMG）があれば写真、なければ絵文字 */
function cardIcon(c) {
  const im = window.CARDIMG && window.CARDIMG[c.name];
  return im ? `<div class="cicon ph"><img src="${im[0]}" alt="" style="object-fit:${im[1] || "cover"}"></div>` : `<div class="cicon">${c.icon}</div>`;
}
function cardEl(name, opts = {}) {
  const c = CARDS[name] || { name, icon: "？" };
  const e = h("button", "card" + (opts.unknown ? " unknown" : ""), opts.unknown ? `<div class="cicon">？</div><div class="cname">？？？</div>` : `${cardIcon(c)}<div class="cname${[...c.name].length > 6 ? " long" : ""}">${phr(c.name)}</div>`);
  return e;
}
function showCardGet(name) {
  return new Promise(res => {
    const c = CARDS[name];
    const box = h("div", "cardget slide");
    box.innerHTML = `<div class="cg-title">カードを 手に入れた！</div>`;
    const ce = cardEl(name); ce.classList.add("large", "shine"); box.appendChild(ce);
    box.appendChild(h("div", "cg-desc", fmt(c ? c.desc : "")));
    box.appendChild(h("div", "cg-kw", `調べる キーワード：<b>${esc(c ? c.kw : name)}</b>`));
    let closing = false;
    box.appendChild(btn("OK", "", async () => {
      if (closing) return; closing = true;
      box.classList.add("out"); SE.play("whooshOut"); await sleep(380); closeModal(); res();
    }));
    openModal(box, "cardslide");
    SE.play("whoosh"); setTimeout(() => SE.play("card"), 300);
  });
}
/* カードを ユウキの手もと（左下）から相手へ投げる。ok=false なら はじかれる */
function stagePos(el) {
  const sr = stage.getBoundingClientRect(), k = sr.width / 1600, r2 = el.getBoundingClientRect();
  return { x: (r2.left - sr.left + r2.width / 2) / k, y: (r2.top - sr.top + r2.height / 2) / k };
}
async function throwCard(name, target, ok) {
  const c = CARDS[name] || { icon: "？", name };
  const fc = FX.add("flycard", `${cardIcon(c)}<div class="cname">${esc(c.name)}</div>`);
  const to = target ? stagePos(target) : { x: 1200, y: 360 };
  fc.style.left = "300px"; fc.style.top = "700px";
  SE.play("swish");
  await sleep(30);
  fc.style.left = (to.x - (ok ? 170 : 40)) + "px"; fc.style.top = to.y + "px"; fc.classList.add("go");
  await sleep(360);
  if (ok) { FX.flash("#fff", 200); fc.classList.add("hit"); if (target) { target.classList.remove("recoil"); void target.offsetWidth; target.classList.add("recoil"); } }
  else {
    SE.play("bounce"); fc.classList.add("bounced"); fc.style.left = "1700px"; fc.style.top = "-200px";
    if (target) { target.classList.remove("tilt"); void target.offsetWidth; target.classList.add("tilt"); }
  }
  setTimeout(() => fc.remove(), 700);
  await sleep(ok ? 250 : 450);
}
/* 矛盾発見！：タメ → ユウキのカットイン → フラッシュ・揺れ・集中線 */
/* 「矛盾発見！！」のロゴ（art/objlogo）。なければ文字 */
function objLogo(cls, life) {
  const A = window.ART && window.ART.objlogo;
  if (A) FX.add("big obj objimg " + (cls || ""), `<img src="${A.normal}" alt="矛盾発見！！">`, life);
  else FX.add("big ronpa obj " + (cls || ""), "矛盾 発見！", life);
}
function yuukiCutin() {   // ユウキの顔が入った赤い帯（矛盾発見・論破）
  const img = window.ART && window.ART.yuuki ? `<img src="${window.ART.yuuki.angry || window.ART.yuuki.normal}" alt="">` : "";
  FX.add("cutin", `<div class="ci-band"><div class="ci-lines"></div>${img}</div>`, 1700); SE.play("whoosh");
}
async function objection(text) {
  stopSpeak(); SE.play("tame");
  FX.add("dimmer", "", 1500); await sleep(450);
  yuukiCutin();
  await sleep(450);
  FX.flash("#fff", 240); FX.shake("l"); FX.lines(1300); SE.play("objection"); SE.play("shatter");   // 矛盾発見：金属の音＋ガラスが割れる音（論破バトルと同じ）
  objLogo("", 1200);
  await sleep(1350);
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
  setSkip(false);
  return new Promise(res => {
    let list = S.hand.slice();
    if (S.narrow) {
      // 議論・論破：その証言のまとまり全体で同じ3まい（どの証言で開いても同じなので、答えがばれない）
      if (S.narrowSet) list = S.narrowSet;
      else if (correct) list = S.narrowCache[correct] || (S.narrowCache[correct] = pick3(correct));
    }
    const box = h("div", "hand");
    if (quote) box.appendChild(h("div", "hand-quote", `<b>${esc(quote.who)}</b>「${fmt(quote.text)}」`));
    box.appendChild(h("div", "hand-title", fmtUI(title)));
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
  if (!S || !modal.hidden) return;
  if (S.busy && talk.hidden) return;   // 演出のとちゅうは開かない（セリフの待ちなら開ける）
  SE.play("hand");
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
  let label = "ヒント", cost = "", dis = false;
  if (n && n.t !== "inv") {
    if (S.hintLv === 1) { label = "しぼる"; cost = "♡−1"; }
    else if (S.hintLv === 2 && canJump) { label = "さらにしぼる"; cost = "♡−1"; }
    else if (S.hintLv >= 2) { label = "しぼりこみ中"; dis = true; }
  }
  hb.innerHTML = `<span class="hb-main${[...label].length > 4 ? " s" : ""}">${label}</span>${cost ? `<span class="hb-cost">${cost}</span>` : ""}`; hb.disabled = dis;
  $("#cardBtn").hidden = !S.hand.length;
  stage.classList.toggle("danger", S.hearts === 1 && !!S.node && ["testi", "battle"].includes(S.node.t));   // 赤い ふちは 証言・論破バトルの 間だけ
}
/* ♡を1つへらす演出（赤いフラッシュ・揺れ・ハートが割れて落ちる） */
function spendHeart() {
  S.hearts = Math.max(0, S.hearts - 1);
  const hs = document.querySelectorAll("#hearts .heart"), lost = hs[S.hearts];
  if (lost) { const cl = lost.cloneNode(true); const r2 = stagePos(lost); cl.classList.add("heart-fall"); cl.style.left = (r2.x - 17) + "px"; cl.style.top = (r2.y - 15) + "px"; $("#fx").appendChild(cl); setTimeout(() => cl.remove(), 1000); }
  FX.flash("rgba(255,40,60,.45)", 300); FX.shake("m"); SE.play("heart");
  renderHud();
}
/* 証言のまとまり（ラウンド）が変わるたびに、しぼりこみをリセット */
function newRound(ctx) {
  S.hintCtx = ctx || null; S.narrow = false; S.narrowSet = null; S.narrowCache = {};
  if (S.hintLv > 1) S.hintLv = 1;
  renderHud();
}
async function loseHeart(who, expr, msg, opt) {
  spendHeart();
  await say(who, expr, msg, S.ep, opt);
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
        spendHeart(); S.narrow = true; S.hintLv = 2;
        if (ctx.correct) S.narrowSet = pick3(ctx.correct);
        renderHud();
        await say("本じい", "ふつう", "よし、つきつける カードを 3まいに しぼってやろう", S.ep);
        if (S.hearts <= 0) fail = true;
      }
    } else if (S.hintLv === 2 && ctx.jump) {
      if (await confirmBox("♡を もう 1つ 使って、<br><b>あやしい ところを 教えて もらいますか？</b>", "教えてもらう")) {
        spendHeart(); S.hintLv = 3; renderHud();
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
    const warping = S.aura.length > 0;   // ゆがみが進んでいる間の調査
    const els = [];
    const upd = () => {
      const left = n.items.length - got.size;
      info.innerHTML = warping ? `<b>いそげ！</b>歴史が ゆがみきる 前に 調べよう（のこり ${left}）` : `調べよう（のこり ${left}）`;
      els.forEach((e, k) => e.classList.toggle("last", left === 1 && !got.has(n.items[k].name)));
      if (warping) setWarpLevel(.3 + .6 * got.size / n.items.length);
    };
    n.items.forEach(it => {
      // 人でない調べものは、手に入るカードの写真を出す（写真がなければ絵文字）
      // 「写真:カード名」でほかのカードの写真、「絵:🏯」で絵文字のまま
      const CI = window.CARDIMG || {}, ic = it.icon || "";
      let photo = /^写真[:：]/.test(ic) ? CI[ic.replace(/^写真[:：]/, "")] : (!/^(人|絵|画)[:：]/.test(ic) && it.card && CI[it.card]);
      if (/^絵[:：]/.test(ic)) it.icon = ic.replace(/^絵[:：]/, "");
      const e = h("button", "prop" + (photo ? " photo" : ""), `${photo ? `<div class="pphoto"><img src="${photo[0]}" alt=""></div>` : iconHTML(it.icon, it.name)}<div class="plabel${[...it.name].length > 6 ? " long" : ""}">${esc(it.name)}</div>`);
      placeAt(e, it.pos); if (got.has(it.name)) e.classList.add("done");
      els.push(e);
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
          if (!got.has(it.name)) { got.add(it.name); e.classList.add("done", "stamped"); SE.play("stamp"); }
          upd();
        } catch (er) { S.busy = false; return rej(er); }
        if (got.size >= n.items.length) { await sleep(500); await cardsComplete(n.items.map(x => x.card).filter(Boolean)); S.busy = false; return res(); }
        S.busy = false;
      };
      layer.appendChild(e);
    });
    upd();
    if (got.size >= n.items.length) res();
  });
}

/* 調査で集めたカードを扇形に並べて「カードが そろった！」 */
async function cardsComplete(names) {
  const box = FX.add("fan", "", 2000);
  const k = names.length, mid = (k - 1) / 2;
  names.forEach((nm, i) => {
    const c = CARDS[nm] || { icon: "？", name: nm };
    const e = h("div", "fan-card", `${cardIcon(c)}<div class="cname">${esc(c.name)}</div>`);
    e.style.setProperty("--r", ((i - mid) * 9) + "deg"); e.style.setProperty("--x", ((i - mid) * 120) + "px"); e.style.setProperty("--y", (Math.abs(i - mid) * 14) + "px");
    e.style.animationDelay = (i * 60) + "ms"; box.appendChild(e);
  });
  box.appendChild(h("div", "fan-title", "カードが そろった！"));
  SE.play("found");
  await sleep(1900);
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
      const e = h("button", "prop warped", `${iconHTML(it.icon, it.name)}${it.item ? `<div class="pitem">${it.item}</div>` : ""}<div class="plabel${[...it.name].length > 6 ? " long" : ""}">${esc(it.name)}</div>`);
      placeAt(e, it.pos);
      e.onclick = async () => {
        if (S.busy || fixed.has(i)) return; S.busy = true;
        try {
          const pick = await chooseCard("この 証言と 矛盾する カードを つきつけろ！", it.bad ? it.card : null, { who: it.name, text: it.quote });
          if (pick && it.bad && pick === it.card) {
            fixed.add(i); bigText("矛盾 発見！", "ronpa"); shake(); await sleep(900);
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
/* 背景：左＝正しい歴史（青白い影絵）、右＝ゆがんだ歴史（紫）。論破するたびに境目を右へ押し返す */
function battleBg(split, opt = {}) {
  let b = bgEl.querySelector(".bbg");
  if (!b) {
    b = h("div", "bbg");
    const L = h("div", "bb-l"), R = h("div", "bb-r");
    L.appendChild(BG.render(CUR_BG)); R.appendChild(BG.render(CUR_BG));
    R.appendChild(h("div", "bb-vortex")); R.appendChild(h("div", "bb-eyes", "<i></i><i></i>")); R.appendChild(h("div", "bb-noise"));
    b.append(L, R, h("div", "bb-edge"));
    bgEl.appendChild(b);
    b.classList.add("split-in"); SE.play("swish");
  }
  b.style.setProperty("--split", split + "%");
  if (opt.win) b.classList.add("win");
}
// ユガミのセリフ（台本の5つ目の欄で、話ごとに変えられる）
const FOE_HIT = ["……ほう。少しは やるようだな。だが、次は どうだ！", "くっ……！ まだだ、まだ 終わらない！", "ちっ……生意気な やつめ……！"];
const FOE_TAUNT = ["ハハハ！ そんな カードで オレの 歴史は くずせないぞ！", "見当ちがいだな。よく 考えて みろ。", "フン、それが 証拠の つもりか？"];
let tauntN = 0;
function runBattle(n) {
  return new Promise((res, rej) => {
    S.rej = rej;
    let r = subStart();
    const total = n.rounds.length;
    const splitOf = k => 42 + (100 - 42) * k / total * .8;
    const draw = () => {
      clearLayer(); hideTalk(); hidePortraits();
      layer.className = "battle"; stage.classList.add("battle-on"); stage.classList.toggle("danger", S.hearts === 1);
      battleBg(splitOf(r));
      const foe = h("div", "foe mist" + (total - r), `<div class="foe-face">${faceHTML(charOf("ユガミ"), "笑顔")}</div><div class="foe-name">ユガミ</div>`);
      const gauge = h("div", "gauge", Array.from({ length: total }, (_, i) => `<span class="seg${i < total - r ? "" : " off"}"></span>`).join(""));
      foe.prepend(gauge); layer.appendChild(foe);
      const face = foe.querySelector(".foe-face");
      const foeSay = async (expr, text) => {   // 左に顔を出さず、右のユガミの表情だけかえて話す
        face.innerHTML = faceHTML(charOf("ユガミ"), expr);
        await say("ユガミ", expr, text, S.ep, { noPort: true });
        face.innerHTML = faceHTML(charOf("ユガミ"), "笑顔");
      };
      const taunt = () => FOE_TAUNT[(tauntN++) % FOE_TAUNT.length];
      layer.appendChild(h("div", "guide", `ユガミの ウソを 見やぶれ（${r + 1} / ${total}）`));
      const list = h("div", "claims");
      const claimEls = [];
      const lie = n.rounds[r].find(x => x.lie);
      newRound({ correct: lie && lie.card, jump: () => { const k = n.rounds[r].findIndex(x => x.lie); if (claimEls[k]) { claimEls[k].classList.add("suspect"); SE.play("doku"); } } });
      n.rounds[r].forEach((c, i) => {
        logPush("ユガミ", c.text);
        const e = h("button", "claim", `<span class="q">「</span>${fmt(c.text)}<span class="q">」</span>`);
        e.style.animationDelay = (i * 220) + "ms"; setTimeout(() => SE.play("thud"), i * 220 + 150);   // 1つずつ降ってくる
        e.onclick = async () => {
          if (S.busy) return; S.busy = true;
          try {
            const pick = await chooseCard("ウソだと 思ったら、矛盾する カードを つきつけろ！", c.lie ? c.card : null, { who: "ユガミ", text: c.text });
            if (pick && !c.lie) {
              await throwCard(pick, e, false);
              face.innerHTML = faceHTML(charOf("ユガミ"), "笑顔");
              await loseHeart("ユガミ", "笑顔", "フフ……それは ほんとうの ことだ。", { noPort: true });
            } else if (pick) {
              if (pick === c.card) {
                await throwCard(pick, e, true);
                shatter(e); e.style.visibility = "hidden";
                const last = r + 1 >= total;
                if (last) {   // さいごの1本：スロー → ユウキのカットイン → ドン
                  FX.add("dimmer slow", "", 1600); await sleep(500);
                  yuukiCutin(); await sleep(450);
                  FX.flash("#fff", 300); FX.shake("l"); FX.lines(1500); if (SE.has("objection")) { SE.play("objection"); SE.play("shatter"); } else SE.play("ronpaBig");
                  objLogo("huge", 1200);
                  battleBg(100, { win: true }); SE.play("shatter");
                  face.classList.add("recoil"); await sleep(1500);
                } else {
                  yuukiCutin(); await sleep(450);
                  FX.flash("#fff", 220); FX.shake("l"); FX.lines(1000); SE.play("objection");
                  objLogo("", 1200);
                  face.classList.remove("recoil"); void face.offsetWidth; face.classList.add("recoil");
                  battleBg(splitOf(r + 1)); await sleep(1100);
                }
                if (c.reply) await say("ユウキ", "怒り", c.reply, S.ep);
                r++; subSave(r);
                if (r >= total) { S.busy = false; hideTalk(); const bb = bgEl.querySelector(".bbg"); if (bb) bb.remove(); return res(); }
                await foeSay(r === 1 ? "おどろき" : "怒り", c.foeLine || FOE_HIT[(r - 1) % FOE_HIT.length]);
                S.busy = false; return draw();
              } else {
                await throwCard(pick, e, false);
                face.innerHTML = faceHTML(charOf("ユガミ"), "笑顔");
                await loseHeart("ユガミ", "笑顔", taunt(), { noPort: true });
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
/* ウインドウがガラスのように割れる */
function shatter(el) {
  const p0 = stagePos(el), w = el.offsetWidth, hh = el.offsetHeight;
  for (let k = 0; k < 14; k++) {
    const sh = FX.add("shard", "", 900);
    sh.style.left = (p0.x - w / 2 + Math.random() * w) + "px"; sh.style.top = (p0.y - hh / 2 + Math.random() * hh) + "px";
    sh.style.setProperty("--dx", (Math.random() * 500 - 150) + "px"); sh.style.setProperty("--dy", (Math.random() * 400 - 200) + "px"); sh.style.setProperty("--rot", (Math.random() * 720 - 360) + "deg");
  }
  SE.play("shatter");
}

/* ---------- 場面：まとめ ---------- */
/* まとめ完成：うめた言葉が順に光る → 紙がかがやく → 「まとめ かんせい！」のハンコ → 光の粒 */
async function sumComplete(paper) {
  await sleep(300);
  const oks = [...paper.querySelectorAll(".slot.ok")];
  for (const o of oks) { o.classList.add("glow"); SE.play("star"); await sleep(260); }
  paper.classList.add("done"); FX.flash("rgba(255,230,150,.55)", 320); FX.shake("s"); SE.play("starGold");
  const st = FX.add("sum-stamp", "まとめ<br>かんせい！", 2400);
  for (let k = 0; k < 40; k++) {
    const c = FX.add("confetti", "", 2200);
    c.style.left = (200 + Math.random() * 1200) + "px"; c.style.top = "-30px";
    c.style.background = ["#ffd166", "#ff8fa3", "#8ecae6", "#b9fbc0", "#fff"][k % 5];
    c.style.setProperty("--dx", (Math.random() * 300 - 150) + "px"); c.style.setProperty("--rot", (Math.random() * 900) + "deg");
    c.style.animationDelay = (Math.random() * 500) + "ms";
  }
  setTimeout(() => SE.play("found"), 450);
  await sleep(2300);
}
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
      if (filled >= slots.length) { await sumComplete(paper); res(); }
    });
  });
}

/* ---------- 演出：歴史がゆがむ ---------- */
async function runWarp(n) {
  hideTalk();
  if (n.who && !S.aura.includes(n.who)) S.aura.push(n.who);
  if (n.who) showPortrait(n.who, "ふつう", S.ep);
  const pe = n.who ? $(charOf(n.who, S.ep).side === "L" ? "#portL" : "#portR") : null;
  SE.play("warp");
  FX.add("warp-invert", "", 900); FX.shake("m");
  if (pe) pe.classList.add("glitch");
  FX.add("glitchbars", "<i></i><i></i><i></i><i></i><i></i><i></i>", 1500);
  await sleep(800);
  FX.flash("rgba(160,80,255,.7)", 300); FX.shake("l");
  bgEl.classList.add("warped"); setWarpLevel(.25);
  if (pe) pe.classList.remove("glitch");
  banner(n.text); await sleep(1900);
}
async function runRestore(n) {
  const pe = n.who ? $(charOf(n.who, S.ep).side === "L" ? "#portL" : "#portR") : null;
  S.aura = S.aura.filter(x => x !== n.who);
  if (n.who) showPortrait(n.who, "ふつう", S.ep);
  // オーラがくだけ散る → 白い光 → 左から右へ色がもどる
  if (pe) { const p0 = stagePos(pe); for (let k = 0; k < 16; k++) { const sh = FX.add("shard purple", "", 1000); sh.style.left = (p0.x - 120 + Math.random() * 240) + "px"; sh.style.top = (p0.y - 120 + Math.random() * 240) + "px"; sh.style.setProperty("--dx", (Math.random() * 600 - 300) + "px"); sh.style.setProperty("--dy", (Math.random() * 600 - 300) + "px"); sh.style.setProperty("--rot", (Math.random() * 720 - 360) + "deg"); } }
  SE.play("shatter"); await sleep(250);
  FX.add("whiteout", "", 1300); SE.play("restore");
  bgEl.classList.add("restoring"); await sleep(1300);
  bgEl.classList.remove("warped", "restoring"); setWarpLevel(0);
  bigText("歴史の ゆがみを 止めた！", "good"); await sleep(1300);
}
async function runOmen() {   // ゆがむ前のきざし：画面のすみに紫のひびが一瞬走る
  SE.play("omen"); FX.add("omen", `<svg viewBox="0 0 1600 900"><path d="M1600 40 L1450 120 L1500 170 L1330 260 L1390 300 L1250 380"/><path d="M0 860 L140 780 L100 740 L260 660"/></svg>`, 900);
  await sleep(700);
}
async function runExit(n) {   // 退場：紫の粒になって消える
  const c = charOf(n.who, S.ep), pe = $(c.side === "L" ? "#portL" : "#portR");
  if (pe.hidden || ports[c.side] !== n.who) showPortrait(n.who, "怒り", S.ep);
  pe.classList.add("vanish"); SE.play("vanish");
  const p0 = stagePos(pe);
  for (let k = 0; k < 24; k++) { const d = FX.add("dust", "", 1500); d.style.left = (p0.x - 140 + Math.random() * 280) + "px"; d.style.top = (p0.y - 140 + Math.random() * 280) + "px"; d.style.animationDelay = (Math.random() * 400) + "ms"; }
  await sleep(1300); pe.hidden = true; pe.classList.remove("vanish"); ports[c.side] = null;
}
async function runDepart() {   // 旅立ち：文字盤のように回りながら白くなる
  hideTalk(); hidePortraits(true);
  SE.play("timewarp"); FX.add("timewarp", "<div class=\"tw-dial\"></div>", 1900);
  await sleep(1800);
}

/* 同じ話の中で 時が進む（@時ワープ 643 645 飛鳥 夕焼け）
   トケイが あらわれ、針が 回りだす → 年と季節が カウントされ、空の色が 朝・昼・夕・夜と めぐる（だんだん速く）
   → 針が ゆっくりになって 止まる → 無音 → ブラックアウト → 新しい 背景（時間帯の色）で 明ける → 「〇年後」 */
const yearLabel = y => y > 0 ? y + "年" : "約" + Math.round((2023 - y) / 100) * 100 + "年前";   // 紀元前は「約〇年前」
async function runTimeJump(n) {
  hideTalk(); hidePortraits(true); showPic("");
  const fast = SKIP, back = n.to < n.from;   // back＝むかしへ さかのぼる（話の はじまり）。針を 逆に 回す
  const A = window.ART && window.ART.tokei;
  const ov = FX.add("tj", `<div class="tj-sky"></div><div class="tj-ring"></div><div class="tj-tokei">${A ? `<img src="${A.nohands || A.normal}" alt="">` : ""}<i class="tj-h"></i><i class="tj-m"></i></div><div class="tj-year"><b></b><span></span></div>`);
  if (back) ov.classList.add("back");
  const sky = ov.querySelector(".tj-sky"), yb = ov.querySelector(".tj-year b"), ys = ov.querySelector(".tj-year span");
  const hm = ov.querySelector(".tj-m"), hh = ov.querySelector(".tj-h");
  BGM.stop(.8); SE.play("tick"); await sleep(fast ? 100 : 700);
  ov.classList.add("on"); SE.play("timewarp"); await sleep(fast ? 100 : 900);
  BGM.play("封印");
  const SEASON = ["春", "夏", "秋", "冬"], SKYC = ["sky-am", "sky-noon", "sky-pm", "sky-night"];
  const steps = [];
  if (back) {   // さかのぼりは 年が 多いので、はじめは ゆっくり → だんだん 大きく とぶ（季節は 逆まわり）
    const M = 26; for (let k = 0; k < M; k++) { const t = k / M; steps.push([Math.round(n.from - (n.from - n.to) * t * t), SEASON[3 - k % 4]]); }
    steps.push([n.to, "春"]);
  } else { for (let y = n.from; y < n.to; y++) for (const se of SEASON) steps.push([y, se]); steps.push([n.to, "春"]); }
  let ang = 0, spd = 2, run = true;   // 針の速さ（1フレームの角度）
  const dir = back ? -1 : 1;
  const spin = () => { if (!run) return; ang += spd * dir; hm.style.transform = `rotate(${ang}deg)`; hh.style.transform = `rotate(${ang / 12}deg)`; requestAnimationFrame(spin); };
  requestAnimationFrame(spin);
  const N = steps.length;
  for (let k = 0; k < N; k++) {
    const [y, se] = steps[k];
    yb.textContent = yearLabel(y); ys.textContent = se;
    sky.className = "tj-sky " + SKYC[(back ? 3 - k % 4 : k % 4)];
    SE.play("tick");
    const left = N - 1 - k;   // のこり 3つは ゆっくり（止まる前のため）
    const t = fast ? 40 : left < 3 ? [520, 360, 240][left] : Math.max(70, 460 - k * 45);
    spd = fast ? 30 : left < 3 ? [3, 6, 10][left] : Math.min(40, 4 + k * 3);
    if (k === Math.floor(N / 2) && !fast) { FX.lines(1600); FX.shake("s"); }
    await sleep(t);
  }
  run = false; ov.classList.add("stop"); BGM.stop(.2);   // ぴたりと 止まる → 無音
  SE.play("drum"); FX.shake("s"); yb.classList.add("land");
  await sleep(fast ? 200 : 1300);
  const bo = FX.add("tj-black", "");   // ブラックアウト
  await sleep(fast ? 150 : 900);
  ov.remove();
  if (n.bg) setBg(n.bg, false, n.tint); else setTint(n.tint);
  await sleep(fast ? 100 : 700);
  bo.classList.add("out"); setTimeout(() => bo.remove(), 1300);
  await sleep(fast ? 200 : 900);
  const d = Math.abs(n.to - n.from);
  banner("", `<div class="tj-ban"><b>${yearLabel(n.to)}</b><span>${back ? (n.to > 0 ? d + "年前" : "") : d + "年後"}</span></div>`);
  SE.play("found");
  await sleep(fast ? 300 : 1900);
}
/* 話の はじまり：2023年から その時代へ さかのぼる（時ワープを 逆まわしで） */
const EP_START = { 1: -3500, 2: 239, 3: 470, 4: 600, 5: 643, 6: 745, 7: 1008 };
function epStartYear(no) { if (EP_START[no] != null) return EP_START[no]; const m = /(\d+)/.exec(EP_INFO[no][1]); return m ? Number(m[1]) : null; }

/* ---------- 場面：議論（証言に矛盾をつきつける） ---------- */
async function testiOpening(title) {
  FX.add("t-dim", "", 1900);
  FX.add("t-bars", "<i></i><i></i>", 1900);
  await sleep(250);
  FX.add("t-lines", "<i></i><i></i><i></i><i></i>", 1500); SE.play("testimony");
  await sleep(300);
  FX.add("t-title", "〜 証言開始 〜", 1300);
  await sleep(500); FX.flash("#fff", 220);
  await sleep(500);
  FX.add("t-sub", esc(title), 900);
  await sleep(800);
}
function runTesti(n) {
  return new Promise((res, rej) => {
    S.rej = rej;
    const who = n.who, c = charOf(who, S.ep);
    let r = subStart(), i = 0;
    const draw = async (first) => {
      clearLayer(); hideTalk(); hidePortraits();
      layer.className = "testi"; stage.classList.add("testi-on"); stage.classList.toggle("danger", S.hearts === 1);
      BGM.play(r === n.rounds.length - 1 && n.rounds.length > 1 ? "最後の証言" : "証言");
      const aura = S.aura.includes(who);
      const wit = h("div", "witness" + (aura ? " aura" : ""), (aura ? AURA_HTML : "") + `<div class="w-face">${faceHTML(c, "ふつう", who)}</div><div class="w-name">${esc(who)}</div>`);
      layer.appendChild(wit);
      const wface = wit.querySelector(".w-face");
      const round = n.rounds[r];
      layer.appendChild(h("div", "guide", `証言「${esc(round.title || "")}」（${r + 1} / ${n.rounds.length}）`));
      const box = h("div", "tbox");
      box.innerHTML = `<div class="tname">${esc(who)}</div><div class="ttext"></div><div class="tcount"></div>`;
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
        if (suspect && i === lieIdx) SE.play("doku");
        logPush(who, line.text);
        prev.disabled = i === 0;
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
          if (pick) await throwCard(pick, wface, line.lie && pick === line.card);
          if (pick && line.lie && pick === line.card) {
            await objection("矛盾 発見！");
            if (line.retort) await say("ユウキ", "怒り", line.retort, S.ep);
            if (line.reaction) await say(who, "おどろき", line.reaction, S.ep, { noPort: true });
            r++; i = 0; subSave(r);
            S.busy = false;
            if (r >= n.rounds.length) { hideTalk(); return res(); }
            return draw();
          } else if (pick && line.near && line.near[pick]) {   // おしい：♡はへらさず、本じいがヒントを出して証言にもどる
            for (const seg of line.near[pick].split(/\s*／\s*/)) await say("本じい", "ふつう", seg, S.ep);   // 「／」で区切って何行でも
            hideTalk(); hidePortraits();
          } else if (pick) {
            await loseHeart("本じい", "おどろき", line.lie ? "むむ……その カードでは、矛盾を 説明 できんようじゃ" : "むむ……その 証言には、おかしな ところは ないようじゃ");
            hideTalk(); hidePortraits();
          }
        } catch (er) { S.busy = false; return rej(er); }
        S.busy = false;
      }
      // 証言開始の演出（どの証言でも、はじめにタイトルを出す）
      S.busy = true;
      await testiOpening(round.title || "");
      S.busy = false;
      show();
      if (r === n.rounds.length - 1 && n.rounds.length > 1) HB = setInterval(() => SE.play("heartbeat"), 1250);   // さいごの証言は心拍音
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
  const fa = window.ART && window.ART["frag" + S.no];   // 記憶のかけらの絵：art/frag話数_normal.webp
  layer.appendChild(h("div", "frag-pic" + (fa ? " has" : ""), `${fa ? `<img src="${fa.normal}" alt="">` : "<div>🖼️</div>"}<div class="frag-cap">記憶のかけら「${esc(n.title)}」</div>`));
  layer.appendChild(h("div", "film"));
  for (const l of n.lines) await say(l.who, l.expr, l.text, S.ep, { dark: true });
  hideTalk();
  FX.add("shard-get", "", 1600); SE.play("star"); await sleep(1500);
  renderHud();
}

/* ---------- 話の進行 ---------- */
/* 議論・論破バトルの「何パート目まで進んだか」も保存する（ちゅうだんしても、そのパートから再開） */
const subStart = () => (S.sub && S.sub.idx === S.idx ? S.sub.r : 0);
function subSave(r) {
  S.sub = { idx: S.idx, r };
  if (!SAVE.resume || SAVE.resume.idx !== S.idx) return;
  Object.assign(SAVE.resume, { sub: S.sub, hearts: S.hearts, hand: S.hand.slice(), hint2: S.hint2, failed: S.failed }); persist();
}
function checkpoint() {
  SAVE.resume = { no: S.no, idx: S.idx, hearts: S.hearts, hand: S.hand.slice(), aura: S.aura.slice(), hint2: S.hint2, failed: S.failed, sub: S.sub && S.sub.idx === S.idx ? S.sub : null };
  persist();
}
async function playEpisode(no, resume) {
  const ep = EPS[no];
  S = { no, ep, idx: 0, hearts: MAX_HEARTS, hand: [], aura: [], hint2: false, failed: false, narrow: false, narrowSet: null, narrowCache: {}, hintCtx: null, hintLv: 0, node: null, busy: false };
  if (resume && SAVE.resume && SAVE.resume.no === no) Object.assign(S, SAVE.resume, { no, ep });
  // 再開時は直前の背景を復元
  let bg = EP_META[no][1];
  let tint = ""; for (let i = 0; i < S.idx; i++) if (ep.nodes[i].t === "bg" || (ep.nodes[i].t === "tjump" && ep.nodes[i].bg)) { bg = ep.nodes[i].bg; tint = ep.nodes[i].tint; }
  if (!resume) {   // はじめから：最初のセリフより前に @背景 があれば、それを最初から出す（別の背景が一瞬見えないように）
    for (const n of ep.nodes) { if (n.t === "bg") { bg = n.bg; break; } if (!["bgm", "se", "pic", "disguise"].includes(n.t)) break; }
  }
  S.disguise = {}; for (let i = 0; i < S.idx; i++) if (ep.nodes[i].t === "disguise") S.disguise[ep.nodes[i].who] = ep.nodes[i].look || null;
  setBg(bg, false, tint); if (S.aura.length) { bgEl.classList.add("warped"); setWarpLevel(.6); } clearLayer(); renderHud();
  LOG = [];
  if (!resume) {
    BGM.stop(.6); await titleCard(no);
    const y0 = no > 0 && no < 21 ? epStartYear(no) : null;
    if (y0 != null && y0 < 2023) { setBg("時空"); await runTimeJump({ from: 2023, to: y0, bg, tint }); }
    BGM.play(no === 0 ? "学校" : "町");
  }
  else { const k = prevBgm(ep, S.idx); BGM.play(k && k !== "なし" ? k : null); }
  while (S.idx < ep.nodes.length) {
    const n = ep.nodes[S.idx];
    S.node = n; S.hintLv = 0; S.rej = null; newRound(null);
    stage.classList.toggle("danger", S.hearts === 1 && ["testi", "battle"].includes(n.t));
    const interactive = ["inv", "spot", "testi", "battle", "sum", "frag"].includes(n.t);
    S.noSkip = ["inv", "spot", "testi", "battle", "sum"].includes(n.t); if (S.noSkip) setSkip(false);
    if (interactive) checkpoint();
    const snap = { hand: S.hand.slice() };
    autoBgm(n);
    try {
      switch (n.t) {
        case "se": for (let k = 0; k < n.times; k++) setTimeout(() => SE.play(n.key), k * 1900); break;
        case "disguise": S.disguise[n.who] = n.look || null; break;
        case "bgm": BGM.play(n.key && n.key !== "なし" ? n.key : null); break;
        case "staff": await runStaffRoll(n.key); break;
        case "bg": hidePortraits(true); setBg(n.bg, true, n.tint); showPic(""); break;
        case "tjump": await runTimeJump(n); break;
        case "omen": await runOmen(); break;
        case "exit": await runExit(n); break;
        case "depart": await runDepart(); break;
        case "pic": showPic(n.key, n.fx); break;
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
        S.hearts = RETRY_HEARTS; S.failed = true; S.hand = snap.hand; S.sub = null; renderHud();   // ゲームオーバーは場面の最初から
        continue;
      }
      throw e;
    }
    if (!["say", "bg", "pic", "omen", "exit", "bgm", "se", "disguise", "tjump"].includes(n.t)) { hideTalk(); clearLayer(); showPic(""); }
    S.idx++;
  }
  return finishEpisode();
}
/* BGM の自動切りかえ。すぐ前（背景・画像をはさんでもよい）に「@BGM」があれば、そちらを優先する */
function prevBgm(ep, idx) {
  for (let i = idx - 1; i >= 0; i--) { const t = ep.nodes[i].t; if (t === "bgm") return ep.nodes[i].key || "なし"; if (t !== "bg" && t !== "pic" && t !== "se") return null; }
  return null;
}
const AUTO_BGM = { tjump: null, battle: "バトル", sum: "日常", frag: "一方", restore: "封印", omen: "神殿", warp: "神殿", exit: null, depart: null };
function autoBgm(n) {
  const isInv = n.t === "inv" || n.t === "spot";
  if (!isInv && !(n.t in AUTO_BGM)) return;
  if (prevBgm(S.ep, S.idx)) return;
  if (isInv) return BGM.play(S.ep.nodes.slice(0, S.idx).some(x => x.t === "warp") ? "調査2" : "調査1");
  if (AUTO_BGM[n.t]) BGM.play(AUTO_BGM[n.t]); else BGM.stop(1.5);
}
/* 話のはじまり：タイトルと、年がスロットのように巻きもどる */
async function titleCard(no) {
  const [era, year] = EP_INFO[no];
  const tc = FX.add("titlecard", `<div class="tc-no">${no === 0 ? "プロローグ" : "第" + no + "話"}</div><div class="tc-tt">${esc(EP_META[no][0])}</div><div class="tc-year"></div><div class="tc-era">${esc(era)}</div>`);
  const yEl = tc.querySelector(".tc-year");
  const seq = ["2023年"];
  if (no !== 0) seq[0] = year;   // 年の カウントは このあとの さかのぼり（時ワープ）で 見せる
  for (let k = 0; k < seq.length; k++) { yEl.textContent = seq[k]; if (k < seq.length - 1) { SE.play("tick"); await sleep(k === 0 ? 700 : 110); } }
  SE.play("drum"); yEl.classList.add("land"); FX.shake("s");
  await sleep(1500);
  tc.classList.add("out"); await sleep(500); tc.remove();
}
function finishEpisode() {
  setSkip(false); showPic("");
  bgEl.classList.remove("warped"); stage.classList.remove("danger");
  hideTalk(); hidePortraits(); clearLayer();
  const no = S.no;
  // ★＝クリア時の♡の数。1度でもゲームオーバーになったら★1
  let star = S.failed ? 1 : Math.max(1, Math.min(MAX_HEARTS, S.hearts));
  if (no === 0) star = MAX_HEARTS;
  SAVE.stars[no] = Math.max(SAVE.stars[no] || 0, star);
  SAVE.last = no; SEL_TOUCHED = false;   // 次に年表をひらいたとき、この話にカーソルを合わせる
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
  showPic("");
  S = null; renderHud(); hideTalk(); hidePortraits(); closeModal();
  bgEl.classList.remove("warped"); bgEl.innerHTML = ""; clearLayer(); layer.className = "menu title-white";
  BGM.play("図書館");
  const logo = window.ART && window.ART.title && window.ART.title.logo;
  layer.appendChild(h("div", "tlogo", logo ? `<img src="${logo}" alt="まなびヒストリア">` : `<div class="logo-main">まなびヒストリア</div>`));
  const col = h("div", "tmenu");
  [["おはなしを えらぶ", () => showSelect()], ["カードずかん", () => showZukan()], ["じゅもんを 入れる", enterSpell], ["せってい", showSettings]]
    .forEach(([t, f]) => { const b = h("button", "titem", esc(t)); b.onclick = f; col.appendChild(b); });
  layer.appendChild(col);
  layer.appendChild(h("div", "credit", "企画・ゲームデザイン・キャラクターデザイン　のち（まなび堂）"));
}

/* ---------- 画面：話をえらぶ（年表） ---------- */
const futureOpen = () => !!(SAVE.flags && SAVE.flags.future);
let SEL = { page: 4, no: 0 }, SEL_TOUCHED = false;
function showSelect(opt = {}) {
  if (opt.no != null) SEL = { page: pageOf(opt.no), no: opt.no };
  else if (!SAVE.stars[0]) SEL = { page: 4, no: 0 };
  else if (!SEL_TOUCHED && SAVE.last != null && pageOf(SAVE.last) >= 0) SEL = { page: pageOf(SAVE.last), no: SAVE.last };   // 起動したては、直前にクリアした話から
  if (SAVE.stars[FUTURE_AFTER] && !futureOpen() && !opt.noFuture) return playFuture();
  drawTimeline(SEL.page, SEL.no);
}
let TL_LAST = null;
function drawTimeline(pi, sel, fx2 = {}) {
  S = null; renderHud(); showPic(""); setBg("夜"); clearLayer(); layer.className = "menu timeline";
  BGM.play("図書館");
  const page = PAGES[pi];
  const total = Object.entries(SAVE.stars).reduce((a, [k, v]) => a + (k === "0" ? 0 : v), 0);
  const top = h("div", "topbar");
  top.appendChild(btn("もどる", "", showTitle));
  top.appendChild(h("div", "topttl", "年表"));
  top.appendChild(btn(`★ ${total}`, "rt", showClearList));
  layer.appendChild(top);
  layer.appendChild(h("div", "tl-head", `<div class="tl-name">${esc(page.name)}</div><div class="tl-sub">${esc(page.sub)}</div>`));
  const maxPage = futureOpen() ? PAGES.length - 1 : PAGES.length - 2;
  const go = d => { const np = pi + d; if (np < 0 || np > maxPage) return; SEL = { page: np, no: PAGES[np].eps[d > 0 ? 0 : PAGES[np].eps.length - 1] }; SEL_TOUCHED = true; drawTimeline(SEL.page, SEL.no); };
  const L = h("button", "tl-arrow l", "◀"), R = h("button", "tl-arrow r", "▶");
  L.disabled = pi === 0; R.disabled = pi >= maxPage;
  L.onclick = () => go(-1); R.onclick = () => go(1);
  layer.append(L, R);
  // 線とノード
  const X0 = 150, X1 = 1450, n = page.eps.length, step = (X1 - X0) / n;
  const xs = page.eps.map((_, i) => X0 + step * (i + .5));
  const line = h("div", "tl-line" + (page.future ? " future" : "")); layer.appendChild(line);
  const cleared = page.eps.map(no => no !== 0 && !!SAVE.stars[no]);   // プロローグはつながない（線は第1話から）
  let litTo = -1; cleared.forEach((c, i) => { if (c) litTo = i; });
  const nextLit = PAGES.slice(pi + 1).some(p => p.eps.some(no => no !== 0 && SAVE.stars[no]));   // 先のページにクリアした話がある → 右はしまで つなぐ
  if (nextLit) litTo = n - 1;
  if (litTo >= 0) { const lit = h("div", "tl-lit"); lit.style.width = ((nextLit ? X1 : xs[litTo]) - X0 + 2) + "px"; layer.appendChild(lit); }
  page.eps.forEach((no, i) => {
    const [era, year] = EP_INFO[no];
    const open = isOpen(no), ready = !!EPS[no], st = SAVE.stars[no] || 0;
    const nd = h("button", "tl-node" + (no === sel ? " sel" : "") + (open ? "" : " locked") + (st ? " done" : "") + (page.future ? " future" : "") + (fx2.flick && fx2.flick.includes(no) ? " flick" : ""),
      `<div class="tl-era">${esc(era)}</div><div class="tl-year">${esc(year)}</div><div class="tl-dot"></div><div class="tl-no">${no === 0 ? "プロローグ" : "第" + no + "話"}</div><div class="tl-tt">${open && ready ? phr(EP_META[no][0]) : "？？？？？"}</div><div class="tl-st">${no === 0 ? (st ? "クリア" : "") : open && ready ? "★".repeat(st) + "<i>" + "☆".repeat(MAX_HEARTS - st) + "</i>" : open ? "じゅんび中" : "🔒"}</div>`);
    nd.style.left = xs[i] + "px";
    nd.onclick = () => { SEL = { page: pi, no }; SEL_TOUCHED = true; drawTimeline(pi, no); };
    layer.appendChild(nd);
    if (no === sel) {
      const tk = h("div", "tl-tokei", window.ART && window.ART.tokei ? `<img src="${window.ART.tokei.normal}" alt="">` : "⏱️");
      const from = TL_LAST && TL_LAST.page === pi && TL_LAST.x !== xs[i] && !fx2.noPanel ? TL_LAST.x : null;
      tk.style.left = (from ?? xs[i]) + "px"; layer.appendChild(tk);
      if (from != null) { requestAnimationFrame(() => requestAnimationFrame(() => { tk.classList.add("move"); tk.style.left = xs[i] + "px"; })); SE.play("swish"); }
      TL_LAST = { page: pi, x: xs[i] };
    }
  });
  if (pi === PAGES.length - 2 && !futureOpen()) { R.hidden = true; layer.appendChild(h("div", "tl-fog", "？？？")); }
  if (fx2.noPanel) return;
  // 下のパネル
  const no = sel, [era, year, key] = EP_INFO[no], open = isOpen(no), ready = !!EPS[no], st = SAVE.stars[no] || 0;
  const panel = h("div", "tl-panel");
  panel.innerHTML = `<div class="tp-l"><div class="tp-no">${no === 0 ? "プロローグ" : "第" + no + "話"}　<span>${esc(era)}・${esc(year)}</span></div>
    <div class="tp-tt">${open && ready ? esc(EP_META[no][0]) : "？？？？？"}</div><div class="tp-key">${open && no > 0 && key !== "？" ? "重要人物：" + esc(key) : "&nbsp;"}</div></div>
    <div class="tp-r"><div class="tp-st">${no === 0 ? (st ? "クリア" : "") : open && ready ? "★".repeat(st) + "<i>" + "☆".repeat(MAX_HEARTS - st) + "</i>" : ""}</div></div>`;
  const br = h("div", "tp-btns");
  if (!open) br.appendChild(btn("じゅもんを 入れる", "", enterSpell));
  else if (!ready) br.appendChild(btn("じゅんび中", "", () => { }));
  else {
    if (SAVE.resume && SAVE.resume.no === no) br.appendChild(btn("つづきから", "red startbtn", () => playEpisode(no, true)));
    br.appendChild(btn(SAVE.resume && SAVE.resume.no === no ? "はじめから" : "はじめる", (SAVE.resume && SAVE.resume.no === no ? "" : "red") + " startbtn", () => playEpisode(no, false)));
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
    SE.play("tick");
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
async function showResult(no, ep, star) {
  setBg("夜"); clearLayer(); layer.className = "menu";
  const box = h("div", "result");
  BGM.play("図書館");
  box.appendChild(h("div", "res-title", no === 0 ? "プロローグ クリア！" : `第${no}話 クリア！`));
  const stars = h("div", "res-star", Array.from({ length: MAX_HEARTS }, () => `<span class="rs">☆</span>`).join(""));
  box.appendChild(stars);
  const note = h("div", "res-note", "");
  box.appendChild(note);
  const ak = h("div", "res-ak"); box.appendChild(ak);
  const row = h("div", "btnrow");
  row.appendChild(btn("カードずかん", "sub", () => showZukan()));
  row.appendChild(btn("おはなしを えらぶ", "", () => showSelect()));
  box.appendChild(row);
  layer.appendChild(box);
  row.style.visibility = "hidden";
  await sleep(500);
  const ss = stars.querySelectorAll(".rs");
  for (let k = 0; k < star; k++) { ss[k].textContent = "★"; ss[k].classList.add("on"); SE.play("star"); await sleep(260); }
  if (star === MAX_HEARTS) {
    stars.classList.add("gold"); SE.play("starGold"); FX.flash("rgba(255,220,120,.5)", 300);
    note.textContent = "パーフェクト！";
    const w = aikotobaOf(no);
    if (w) { await sleep(600); ak.innerHTML = `<div class="ak-label">あいことば</div><div class="ak-word">${esc(w)}</div><div class="ak-note">メモしておこう！ この話の ★5を もどすときに 使えるよ</div>`; ak.classList.add("rise"); SE.play("found"); }
  } else note.textContent = "クリアした ときの ♡の 数が ★に なるよ（ゲームオーバーに なると ★1）。★5で あいことばが 出るよ";
  row.style.visibility = "";
}

/* ---------- 画面：ずかん ---------- */
let ZTAB = null, ZTPAGE = 0;
function showZukan(tab) {
  BGM.play("図書館"); S = null; renderHud(); setBg("夜"); clearLayer(); layer.className = "menu";
  const names = Object.keys(CARDS);
  const have = names.filter(n => SAVE.cards[n]).length;
  const top = h("div", "topbar");
  top.appendChild(btn("もどる", "sub", showTitle));
  top.appendChild(h("div", "topttl", `カードずかん　${have} / ${names.length}`));
  top.appendChild(h("div", "spacer"));
  layer.appendChild(top);
  // 上のタブ：時代ごと ＋「たいせつ」
  const eps = Object.keys(EPS).map(Number).filter(no => no > 0 && EPS[no].cards.length).sort((a, b) => a - b);
  if (tab !== undefined) ZTAB = tab;
  if (ZTAB == null || (ZTAB !== "gift" && !eps.includes(ZTAB))) ZTAB = eps[0];
  const PER = 8, tpages = Math.max(1, Math.ceil(eps.length / PER));
  if (ZTAB !== "gift") ZTPAGE = Math.floor(eps.indexOf(ZTAB) / PER);
  const tabs = h("div", "ztabs");
  const seen = {};
  const label = no => { const era = EP_INFO[no][0]; seen[era] = (seen[era] || 0) + 1; return seen[era] > 1 ? era + "②" : era; };
  const labels = {}; eps.forEach(no => labels[no] = label(no));
  if (tpages > 1) { const l = btn("◀", "ztab-arrow", () => { ZTPAGE = Math.max(0, ZTPAGE - 1); drawTabs(); }); tabs.appendChild(l); }
  const tabRow = h("div", "ztab-row"); tabs.appendChild(tabRow);
  if (tpages > 1) { const r = btn("▶", "ztab-arrow", () => { ZTPAGE = Math.min(tpages - 1, ZTPAGE + 1); drawTabs(); }); tabs.appendChild(r); }
  const drawTabs = () => {
    tabRow.innerHTML = "";
    eps.slice(ZTPAGE * PER, ZTPAGE * PER + PER).forEach(no => {
      const got = EPS[no].cards.filter(n => SAVE.cards[n]).length;
      const b = btn(`${esc(labels[no])}<small>${got}/${EPS[no].cards.length}</small>`, "ztab" + (ZTAB === no ? " on" : ""), () => showZukan(no));
      tabRow.appendChild(b);
    });
  };
  drawTabs();
  tabs.appendChild(btn("たいせつ", "ztab gift" + (ZTAB === "gift" ? " on" : ""), () => showZukan("gift")));
  layer.appendChild(tabs);
  const zb = h("div", "zbody"); layer.appendChild(zb);
  const zd = h("div", "zdetail", "カードを タップすると、説明が 出るよ");
  if (ZTAB === "gift") {   // たいせつ：各話の さいごに もらった もの
    zd.innerHTML = "おはなしの さいごに もらった たいせつな ものだよ";
    const grid = h("div", "pg-grid gift-grid"); grid.style.gridTemplateColumns = "repeat(4, 220px)";
    eps.forEach(no => {
      const g = EPS[no].gift; if (!g) return;
      const got = (SAVE.stars[no] || 0) > 0, A = window.ART && window.ART[g.key];
      const e = h("button", "card large gift" + (got ? "" : " unknown"), got ? `<div class="cicon ph">${A ? `<img src="${A.normal}" alt="" style="object-fit:contain">` : "🎁"}</div><div class="cname${[...g.name].length > 6 ? " long" : ""}">${phr(g.name)}</div>` : `<div class="cicon">？</div><div class="cname">第${no}話</div>`);
      e.onclick = () => { grid.querySelectorAll(".card").forEach(c => c.classList.remove("sel")); e.classList.add("sel"); zd.innerHTML = got ? `<b>${esc(g.name)}</b>　${fmt(g.desc)}` : `第${no}話を クリアすると 手に入るよ`; };
      grid.appendChild(e);
    });
    zb.appendChild(grid);
  } else {
    const list = EPS[ZTAB].cards;
    zb.appendChild(pager(list, { perPage: 12, cols: 6, unknown: n => !SAVE.cards[n], onTap: n => {
      if (!SAVE.cards[n]) { zd.innerHTML = "まだ 手に入れて いない カードだよ"; return; }
      const c = CARDS[n];
      zd.innerHTML = `<b>${esc(c.name)}</b>　${fmt(c.desc)}<div class="cg-kw">調べる キーワード：<b>${esc(c.kw)}</b></div>`;
    } }));
  }
  layer.appendChild(zd);
}

/* ---------- 画面：せってい ---------- */
function showSettings() {
  BGM.play("図書館"); S = null; renderHud(); setBg("夜"); clearLayer(); layer.className = "menu";
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
  col.appendChild(tog("効果音", "se"));
  col.appendChild(tog("BGM", "bgm"));
  if (MOBILE) col.appendChild(btn(`スマホで 全画面：${SAVE.opt.full === false ? "OFF" : "ON"}`, "", () => { SAVE.opt.full = SAVE.opt.full === false; persist(); if (SAVE.opt.full === false) fsExit(); showSettings(); }));
  col.appendChild(btn("あいことばを 入れる（★5を もどす）", "", enterAikotoba));
  col.appendChild(btn("スタッフロール", "", async () => { await runStaffRoll(); showSettings(); }));
  col.appendChild(btn("データを けす", "danger", deleteData));
  layer.appendChild(col);
}

/* ---------- スタッフロール（エンディングで「@スタッフロール 曲の呼び名」。せっていからも見られる） ---------- */
const STAFF = [
  ["", "まなびヒストリア", "big"],
  ["企画・ゲームデザイン", "のち（まなび堂）"],
  ["キャラクターデザイン", "のち（まなび堂）"],
  ["音楽", "ユーフルカ"],
  ["", "__SONGS__"],
  ["", "https://youfulca.com/music_assets/?scene=dungeon_stage", "url"],
  ["シルエット素材", "イラスト緑花　https://illust-ryokka.jp/"],
  ["", "イラストカット　https://illustcut.com/"],
  ["効果音", "効果音ラボ　https://soundeffect-lab.info/"],
  ["カードの写真", "ColBase（国立文化財機構）　https://colbase.nich.go.jp/"],
  ["", "ウィキメディア・コモンズ　ほか"],
  ["", "__CARDS__"],
  ["フォント", "Zen Kaku Gothic New（SIL Open Font License 1.1）"],
  ["", "あそんで くれて ありがとう！", "big"],
];
function runStaffRoll(key) {
  return new Promise(res => {
    if (key) BGM.play(key);
    const songs = (window.BGM_TITLES || []).map(t => `<div class="sr-song">「${esc(t)}」</div>`).join("");
    const cards = (window.CARDIMG_CREDITS || []).map(([n, by, lic]) => `<div class="sr-song small">${esc(n)}：${esc(by)}（${esc(lic)}）</div>`).join("");
    const inner = STAFF.map(([role, name, cls]) => name === "__SONGS__" ? `<div class="sr-songs">${songs}</div>` : name === "__CARDS__" ? `<div class="sr-songs">${cards}</div>` :
      `<div class="sr-item ${cls || ""}">${role ? `<div class="sr-role">${esc(role)}</div>` : ""}<div class="sr-name">${esc(name)}</div></div>`).join("");
    const el = h("div", "staffroll", `<div class="sr-inner">${inner}</div><div class="sr-skip">タップで とばす</div>`);
    stage.appendChild(el);
    const box = el.querySelector(".sr-inner");
    requestAnimationFrame(() => {
      const dist = box.offsetHeight + 900, sec = Math.max(30, dist / 60);
      box.animate([{ transform: "translateY(900px)" }, { transform: `translateY(${-box.offsetHeight}px)` }], { duration: sec * 1000, easing: "linear", fill: "forwards" }).onfinish = done;
    });
    let fin = false;
    function done() { if (fin) return; fin = true; el.classList.add("out"); setTimeout(() => { el.remove(); res(); }, 600); }
    el.onclick = done;
  });
}

/* ---------- データを けす（はじめから やりなおす） ---------- */
async function deleteData() {
  const total = Object.entries(SAVE.stars).reduce((a, [k, v]) => a + (k === "0" ? 0 : v), 0);
  const cards = Object.keys(SAVE.cards).length;
  const ok1 = await confirmBox(`<div class="del-box"><div class="del-title">本当に データを けしますか？</div><div class="del-list">
    つぎの ものが すべて なくなります。<br>
    ・クリアした おはなしと ★（いまの ★ ${total}こ）<br>
    ・集めた カード（${cards}まい）<br>
    ・とちゅうの セーブ、ひらいた おはなし<br>
    ・せってい（文字の 速さ、BGM など）</div>
    <div class="del-note">★5の あいことばを メモして いれば、あとで ★5を もどせます</div></div>`, "けす", "やめる");
  if (!ok1) return;
  const p2 = confirmBox(`<div class="del-box"><div class="del-title"><span class="dbg">さ</span>いごの かくにんです。</div>けした データは、もとに もどせません。<br>ほんとうに けしますか？</div>`, "けす", "やめる");
  // デバッグ用：「さ」を20回おすと、全話★5・全部既読・全カードで タイトルへ
  let taps = 0; const dbg = modal.querySelector(".dbg");
  if (dbg) dbg.onclick = e => { e.stopPropagation(); if (++taps >= 20) { closeModal(); debugAllClear(); } };
  const ok2 = await p2;
  if (!ok2) return;
  try { localStorage.removeItem(SKEY); } catch (e) { }
  SAVE_LOCK = true;   // このあと保存されないように
  await alertBox("データを けしました。<br>タイトルに もどります。");
  location.reload();
}

function debugAllClear() {
  Object.keys(EPS).forEach(k => SAVE.stars[k] = MAX_HEARTS);   // ★5（クリア済み＝既読スキップもできる）
  Object.keys(CARDS).forEach(n => SAVE.cards[n] = 1);
  SAVE.unlocked = EP_COUNT - 1; SAVE.resume = null; persist();
  showTitle(); banner("デバッグ：全話★5・全カード");
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

/* ---------- あいことば（★5の話を もどす） ---------- */
const AK = (window.AIKOTOBA || []).map(x => { try { return [...decodeURIComponent(escape(atob(x)))].reverse().join(""); } catch (e) { return ""; } });
const aikotobaOf = no => AK[no - 1] || "";
async function enterAikotoba() {
  const v = await inputBox("あいことばを 入れてね", "ひらがなで 入力");
  if (v == null) return;
  const w = normKana(v).replace(/[・･]/g, "");
  const no = AK.indexOf(w) + 1;
  if (no > 0) {
    SAVE.stars[no] = MAX_HEARTS; SAVE.unlocked = Math.max(SAVE.unlocked, Math.min(no, EP_COUNT - 1));
    if (EPS[no]) EPS[no].cards.forEach(c => SAVE.cards[c] = 1);
    persist();
    await alertBox(`あいことばが ひかった！<br><b>第${no}話</b>を ★5に もどしたよ！`);
  } else await alertBox("あいことばが ちがうようだ……<br>もう一度 たしかめてね。");
}

/* ---------- 起動 ---------- */
function boot() {
  stage = $("#stage"); layer = $("#layer"); bgEl = $("#bg"); talk = $("#talk"); catcher = $("#catch"); modal = $("#modal"); fx = $("#fx"); hud = $("#hud");
  for (const k in (window.SCENARIO_SRC || {})) EPS[k] = parseScript(Number(k), window.SCENARIO_SRC[k]);
  $("#hintBtn").onclick = onHint;
  $("#cardBtn").onclick = showHandViewer;
  $("#logBtn").onclick = showLog;
  $(".skipbtn").onclick = e => { e.stopPropagation(); const on = !SKIP; setSkip(on); if (SKIP && ADV) ADV(); };
  stage.addEventListener("pointerdown", e => { BGM.unlock(); const b = e.target.closest("button"); if (b && b.id !== "cardBtn") SE.play(b.classList.contains("startbtn") ? "start" : S ? "decide" : "cursor"); });
  $("#menuBtn").onclick = async () => {
    if (!S || S.busy) return;
    const box = h("div", "inbox"); box.appendChild(h("div", "in-msg", "おはなしを ちゅうだんしますか？<br><small>場面の はじめから 再開できます</small>"));
    const row = h("div", "btnrow");
    row.appendChild(btn("ちゅうだんする", "", () => { closeModal(); SE.play("save"); setTimeout(() => location.reload(), 900); }));
    row.appendChild(btn("つづける", "sub", closeModal));
    box.appendChild(row); openModal(box);
  };
  addEventListener("resize", fit); setupScreen(); fit();
  showTitle();
}
addEventListener("DOMContentLoaded", boot);
