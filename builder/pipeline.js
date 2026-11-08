/* Life Cosmos — the pipeline that turns a folder of diaries into a universe.
 * Runs entirely in the browser: nothing here sends a byte anywhere.
 * Plain script (no modules) so builder/index.html also works when opened straight from disk.
 */
(function () {
  "use strict";

  // ------------------------------------------------------------------ dictionaries (edit freely)
  const CATEGORIES = [
    { key: "love",      label: "愛與家",   color: "#ff7aa8", arm: 0, kw: ["愛", "家人", "伴侶", "男友", "女友", "老公", "老婆", "結婚", "約會", "孩子", "毛孩"] },
    { key: "life",      label: "生活",     color: "#ffb86b", arm: 0, kw: ["生活", "吃", "買", "搬家", "散步", "早餐", "晚餐", "天氣", "房間"] },
    { key: "diary",     label: "日記",     color: "#ffe08a", arm: 0, kw: [] },
    { key: "thinkings", label: "思索",     color: "#c9a6ff", arm: 0, kw: ["思考", "為什麼", "意義", "反思", "我想", "或許", "也許", "其實"] },
    { key: "travel",    label: "旅行",     color: "#6fb6ff", arm: 1, kw: ["旅行", "出國", "機場", "飛機", "火車", "旅館", "景點", "出差"] },
    { key: "work",      label: "工作",     color: "#a3abc8", arm: 1, kw: ["工作", "上班", "會議", "同事", "主管", "老闆", "專案", "客戶", "加班"] },
    { key: "study",     label: "學習",     color: "#9cf08f", arm: 1, kw: ["學習", "上課", "老師", "學生", "考試", "學校", "作業", "研究", "論文"] },
    { key: "create",    label: "創作",     color: "#7fe0d0", arm: 1, kw: ["創作", "作品", "寫作", "拍攝", "設計", "畫", "錄音", "演出", "展覽"] },
    { key: "screen",    label: "電影與書", color: "#5ee0ff", arm: 1, kw: ["電影", "看書", "閱讀", "影集", "導演", "小說", "戲院"] },
    { key: "tech",      label: "科技",     color: "#8a8dff", arm: 1, kw: ["AI", "程式", "電腦", "手機", "App", "軟體", "ChatGPT", "Claude", "Gemini"] },
  ];

  const THEMES = [
    ["家庭", ["爸爸", "媽媽", "父親", "母親", "家人", "哥哥", "姊姊", "姐姐", "弟弟", "妹妹", "阿嬤", "阿公", "外婆", "奶奶", "爺爺", "兒子", "女兒", "爸媽"]],
    ["愛情", ["戀愛", "喜歡你", "約會", "伴侶", "男友", "女友", "男朋友", "女朋友", "老公", "老婆", "分手", "結婚", "婚禮", "情人"]],
    ["友情", ["朋友", "好友", "聚餐", "聚會", "同學"]],
    ["工作", ["工作", "上班", "會議", "同事", "主管", "老闆", "專案", "客戶", "加班", "離職", "面試", "職場"]],
    ["學習與教學", ["學習", "讀書", "課程", "考試", "老師", "學校", "作業", "研究", "論文", "教學", "學生", "上課"]],
    ["旅行與異鄉", ["旅行", "出國", "機場", "飛機", "火車", "旅館", "出差", "異鄉", "景點", "行李"]],
    ["身體與健康", ["醫院", "生病", "手術", "醫生", "感冒", "運動", "身體", "睡眠", "疼痛", "檢查", "健康", "跑步"]],
    ["死亡與失去", ["過世", "離世", "喪禮", "告別式", "失去", "死亡", "走了", "思念"]],
    ["信仰與靈性", ["上帝", "佛", "菩薩", "教會", "禱告", "祈禱", "冥想", "內觀", "命運", "拜拜", "廟"]],
    ["創作與藝術", ["創作", "作品", "寫作", "拍攝", "設計", "畫畫", "音樂", "錄音", "演出", "展覽", "劇場", "攝影"]],
    ["電影與閱讀", ["電影", "看書", "閱讀", "影集", "導演", "小說", "戲院", "書店"]],
    ["科技與 AI", ["AI", "人工智慧", "程式", "電腦", "手機", "網路", "App", "軟體", "ChatGPT", "Claude", "Gemini", "機器人"]],
    ["毛孩", ["狗", "貓", "毛孩", "寵物", "遛狗", "狗狗", "貓咪"]],
    ["自我探索", ["焦慮", "情緒", "內心", "勇氣", "害怕", "迷惘", "成長", "自我", "原諒自己", "接納"]],
    ["孤獨", ["孤獨", "寂寞", "一個人", "獨處"]],
    ["金錢", ["錢", "存款", "薪水", "房租", "投資", "花費", "貸款"]],
    ["家與城市", ["搬家", "房子", "鄰居", "社區", "城市", "老家", "回家"]],
    ["社會與公共", ["選舉", "政治", "新聞", "社會", "抗議", "公投", "法律", "立法院"]],
    ["時間與記憶", ["回憶", "記得", "小時候", "當年", "那年", "過去", "未來", "十年", "二十年"]],
  ];

  // ties go to the earlier mood, so the more specific feelings come first
  const MOODS = [
    ["難過", ["難過", "傷心", "哭", "失落", "遺憾", "心痛", "低落"]],
    ["焦慮", ["焦慮", "緊張", "擔心", "不安", "壓力", "煩"]],
    ["憤怒", ["生氣", "憤怒", "火大", "不爽", "討厭", "受不了"]],
    ["孤獨", ["孤獨", "寂寞", "一個人"]],
    ["感動", ["感動", "溫暖", "謝謝", "珍惜"]],
    ["希望", ["希望", "期待", "相信", "夢想", "加油"]],
    ["喜悅", ["開心", "快樂", "幸福", "感謝", "興奮", "好玩", "大笑", "太棒"]],
    ["平靜", ["平靜", "安靜", "放鬆", "舒服", "慢慢", "安心", "自在"]],
  ];

  // everyday words that repeat in any diary and name nothing
  const COMMON = new Set(("自己 開始 什麼 喜歡 發現 東西 整理 決定 知道 覺得 時候 可以 一起 現在 今天 明天 昨天 真的 已經 因為 所以 如果 但是 然後 還是 " +
    "這樣 那樣 一樣 一點 一直 一下 起來 出來 回來 下來 看到 聽到 想到 告訴 問題 事情 地方 大家 句話 點點 一點點 間小 終於 突然 其實 好像 應該 " +
    "也許 或許 可能 需要 希望 記得 不知道 開心 第一次 第一 一個 這個 那個 每天 晚上 早上 下午 中午 剛剛 最近 以前 以後 之後 之前 時間 事情 樣子 " +
    "感覺 心情 生活 工作 朋友 家裡 回家 出門 一起去 拍照 照片 窗外 筆記 案子 決定 退休 謝謝妳 謝謝你 我們 他們 你們").split(/\s+/));
  const PLACES = new Set(("台北 臺北 新北 桃園 新竹 苗栗 台中 臺中 彰化 南投 雲林 嘉義 台南 臺南 高雄 屏東 宜蘭 花蓮 台東 臺東 基隆 澎湖 金門 馬祖 墾丁 " +
    "東京 京都 大阪 沖繩 北海道 首爾 釜山 香港 澳門 上海 北京 新加坡 曼谷 清邁 河內 胡志明 吉隆坡 峇里島 紐約 舊金山 洛杉磯 倫敦 巴黎 柏林 " +
    "羅馬 阿姆斯特丹 維也納 布拉格 雪梨 墨爾本 溫哥華 多倫多 愛丁堡").split(/\s+/));
  const PERSON_SHAPE = /^(阿|小|老)[\u3400-\u9fff]$|(哥|姊|姐|媽|爸|叔|姨|伯|師傅|老師|教授|醫生)$/;
  const PLACE_SUFFIX = /(市|縣|區|鄉|鎮|村|路|街|山|島|港|國|州|站|機場|大學|公園|車站|醫院|海邊|夜市)$/;
  const STOP_CHARS = new Set("的了是在我你他她它們這那就也都和而但很還要會能沒不有個一上下來去說到著過把被讓給對從於吧嗎呢啊喔哦呀嗯啦吧得地之其及與或並若如又再才只更最已將被為以所後前裡中時候天年月日".split(""));

  // ------------------------------------------------------------------ helpers
  const CJK = /[㐀-鿿豈-﫿]/;
  const pad = n => String(n).padStart(2, "0");
  const fmtDate = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const validYMD = (y, m, d) => y >= 1900 && y <= 2100 && m >= 1 && m <= 12 && d >= 1 && d <= 31;

  // A small YAML reader for diary frontmatter: `key: value`, `key: [a, b]` and `- item` lists.
  function parseFrontmatter(raw) {
    const text = raw.replace(/^﻿/, "").replace(/\r\n?/g, "\n");
    const m = text.match(/^---\n([\s\S]*?)\n---[ \t]*\n?/);
    if (!m) return { fm: {}, body: text, had: false };
    const fm = {}; let lastKey = null;
    for (const line of m[1].split("\n")) {
      const li = line.match(/^\s*-\s+(.*)$/);
      if (li && lastKey) { if (!Array.isArray(fm[lastKey])) fm[lastKey] = fm[lastKey] ? [fm[lastKey]] : []; fm[lastKey].push(unquote(li[1])); continue; }
      const kv = line.match(/^([A-Za-z_][\w-]*)\s*:\s*(.*)$/);
      if (!kv) continue;
      lastKey = kv[1].toLowerCase(); let v = kv[2].trim();
      if (/^\[.*\]$/.test(v)) v = v.slice(1, -1).split(/[,，、]/).map(s => unquote(s.trim())).filter(Boolean);
      else v = unquote(v);
      fm[lastKey] = v;
    }
    return { fm, body: text.slice(m[0].length), had: true };
  }
  // "..." is JSON-style (what writeFrontmatter produces), '...' is YAML single-quoted; anything else is taken as written
  function unquote(s) {
    s = s.trim();
    if (s.length >= 2 && s[0] === '"' && s[s.length - 1] === '"') { try { return JSON.parse(s); } catch (e) { return s.slice(1, -1); } }
    if (s.length >= 2 && s[0] === "'" && s[s.length - 1] === "'") return s.slice(1, -1).replace(/''/g, "'");
    return s;
  }

  function yamlScalar(v) {
    const s = String(v ?? "");
    return /^[\s]|[\s]$|^[\[\]{}>|*&!%@`#'",?-]|: |#|\n/.test(s) || s === "" ? JSON.stringify(s) : s;
  }
  function writeFrontmatter(fm) {
    const order = ["title", "date", "category", "characters", "places", "themes", "summary", "mood"];
    const keys = [...order.filter(k => k in fm), ...Object.keys(fm).filter(k => !order.includes(k))];
    const lines = keys.map(k => Array.isArray(fm[k]) ? `${k}: [${fm[k].map(x => String(x).replace(/[,\]]/g, " ")).join(", ")}]` : `${k}: ${yamlScalar(fm[k])}`);
    return `---\n${lines.join("\n")}\n---\n`;
  }

  // ------------------------------------------------------------------ 1. read
  /** files: [{path, name, text, lastModified}] → doc records */
  function readDocs(files) {
    return files.map((f, i) => {
      const { fm, body, had } = parseFrontmatter(f.text);
      const folder = f.path.includes("/") ? f.path.split("/").slice(-2, -1)[0] : "";
      return { i, path: f.path, name: f.name, folder, lastModified: f.lastModified || Date.now(), fm, original: { ...fm }, body: body.trim(), hadYaml: had, auto: {} };
    });
  }

  // ------------------------------------------------------------------ 2. fill in the missing YAML with plain rules
  function guessDate(doc) {
    const v = doc.fm.date;
    if (v) { const m = String(v).match(/(\d{4})[-\/.年](\d{1,2})[-\/.月](\d{1,2})/); if (m && validYMD(+m[1], +m[2], +m[3])) return [`${m[1]}-${pad(m[2])}-${pad(m[3])}`, "yaml"]; }
    let m = doc.name.match(/(\d{4})[-_.]?(\d{2})[-_.]?(\d{2})/);
    if (m && validYMD(+m[1], +m[2], +m[3])) return [`${m[1]}-${m[2]}-${m[3]}`, "檔名"];
    m = doc.body.slice(0, 400).match(/(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/) || doc.body.slice(0, 400).match(/(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})/);
    if (m && validYMD(+m[1], +m[2], +m[3])) return [`${m[1]}-${pad(m[2])}-${pad(m[3])}`, "內文"];
    return [fmtDate(new Date(doc.lastModified)), "檔案時間"];
  }
  function guessTitle(doc) {
    if (doc.fm.title) return [doc.fm.title, "yaml"];
    const h = doc.body.match(/^#{1,3}\s+(.+)$/m);
    if (h) return [h[1].trim().slice(0, 40), "標題列"];
    const first = doc.body.split("\n").map(s => s.trim()).find(s => s && !/^\d{4}\s*年.*日[。.]?$/.test(s));
    if (first) { const t = first.replace(/[#*>`_]/g, "").split(/[。！？!?]/)[0].trim(); if (t) return [t.length > 24 ? t.slice(0, 22) + "…" : t, "第一句"]; }
    return [doc.name.replace(/\.[^.]+$/, ""), "檔名"];
  }
  function guessCategory(doc, cats) {
    const v = String(doc.fm.category || "").trim();
    const hit = c => c.key === v.toLowerCase() || c.label === v;
    if (v && cats.some(hit)) return [cats.find(hit).key, "yaml"];
    const fold = doc.folder.toLowerCase();
    const byFolder = cats.find(c => fold && (c.key === fold || c.label === doc.folder));
    if (byFolder) return [byFolder.key, "資料夾"];
    let best = ["diary", 0];
    for (const c of cats) { const n = c.kw.reduce((s, k) => s + countOf(doc.body, k), 0); if (n > best[1]) best = [c.key, n]; }
    return [best[0], best[1] ? "關鍵字" : "預設"];
  }
  function guessSummary(doc) {
    if (doc.fm.summary) return [doc.fm.summary, "yaml"];
    const sentences = doc.body.replace(/^#.*$/gm, "").split(/(?<=[。！？!?])|\n+/).map(s => s.replace(/[#*>`_]/g, "").trim())
      .filter(s => s.length >= 6 && !/^\d{4}\s*年.*日[。.]?$/.test(s));
    const s = sentences[0] || "";
    return [s.length > 40 ? s.slice(0, 38) + "…" : s, "第一句"];
  }
  function guessMood(doc) {
    if (doc.fm.mood) return [doc.fm.mood, "yaml"];
    let best = ["", 0];
    for (const [m, kws] of MOODS) { const n = kws.reduce((s, k) => s + countOf(doc.body, k), 0); if (n > best[1]) best = [m, n]; }
    return [best[0] || "平靜", best[1] ? "關鍵字" : "預設"];
  }
  function countOf(text, word) { let n = 0, i = 0; while ((i = text.indexOf(word, i)) >= 0) { n++; i += word.length; } return n; }

  function enrich(docs, cats = CATEGORIES) {
    for (const d of docs) {
      for (const [field, fn] of [["date", guessDate], ["title", guessTitle], ["category", x => guessCategory(x, cats)], ["summary", guessSummary], ["mood", guessMood]]) {
        const [v, src] = fn(d);
        d.fm[field] = v; d.auto[field] = src;
      }
      for (const k of ["characters", "places", "themes"]) if (d.fm[k] && !Array.isArray(d.fm[k])) d.fm[k] = [d.fm[k]];
    }
    return docs;
  }

  // ------------------------------------------------------------------ 3. candidate names and places (no AI: frequent word shapes)
  function candidates(docs, limit = 80) {
    const N = docs.length, df = new Map(), ctx = new Map();
    for (const d of docs) {
      const seen = new Set(), text = d.body;
      for (const run of text.match(/[㐀-鿿]{2,}/g) || [])
        for (let n = 2; n <= 4; n++) for (let i = 0; i + n <= run.length; i++) {
          const w = run.slice(i, i + n);
          if ([...w].some(ch => STOP_CHARS.has(ch))) continue;
          seen.add(w);
        }
      for (const w of text.match(/\b[A-Z][a-zA-Z]{2,}\b/g) || []) seen.add(w);
      for (const w of PLACES) if (text.includes(w)) seen.add(w);          // known places may contain function characters (京都, 台中)
      for (const w of seen) df.set(w, (df.get(w) || 0) + 1);
      // what follows a word hints at a person (說, 跟我…) or a place (的街, 機場…)
      for (const m of text.matchAll(/([㐀-鿿]{2,3})(說|問|笑|陪|帶|告訴)/g)) ctx.set(m[1], (ctx.get(m[1]) || 0) + 1);
    }
    const minDf = Math.max(2, Math.ceil(N * 0.03)), maxDf = Math.max(3, Math.floor(N * 0.6));
    let list = [...df].filter(([w, n]) => n >= minDf && n <= maxDf);
    // drop fragments: a word whose longer form appears almost as often is part of that longer word
    const dfOf = new Map(list);
    list = list.filter(([w, n]) => PLACES.has(w) || ![...dfOf].some(([u, m]) => u.length === w.length + 1 && u.includes(w) && m >= n * 0.75));
    const known = new Set(THEMES.flatMap(([, k]) => k).concat(CATEGORIES.flatMap(c => c.kw)));
    list = list.filter(([w]) => !known.has(w) && !COMMON.has(w) && !/^(一|第|每|這|那)/.test(w));
    list.sort((a, b) => b[1] * (b[0].length >= 3 ? 1.15 : 1) - a[1] * (a[0].length >= 3 ? 1.15 : 1));
    return list.slice(0, limit).map(([w, n]) => ({ term: w, docs: n,
      guess: PLACES.has(w) || PLACE_SUFFIX.test(w) ? "place" : PERSON_SHAPE.test(w) || (ctx.get(w) || 0) >= 2 ? "person" : "" }));
  }

  // ------------------------------------------------------------------ which people, places and themes one diary holds
  // The single source for both the universe and the YAML written back: what the YAML already lists,
  // plus the people/places the user confirmed and the dictionary themes found in the text.
  function detect(doc, opts) {
    const { people = [], places = [], extraThemes = [], themeOn = null } = opts || {};
    const text = (doc.fm.title || "") + "\n" + doc.body;
    const themes = THEMES.filter(([t]) => !themeOn || themeOn.has(t)).concat(extraThemes.map(t => [t, [t]]));
    const uniq = a => [...new Set(a.map(x => String(x).trim()).filter(Boolean))];
    const lock = doc.lock || {};          // a list the user edited by hand is kept exactly as written
    if (lock.characters || lock.places || lock.themes) {
      const auto = detect({ ...doc, lock: null }, opts);
      return { characters: lock.characters ? uniq(doc.fm.characters || []) : auto.characters,
               places: lock.places ? uniq(doc.fm.places || []) : auto.places,
               themes: lock.themes ? uniq(doc.fm.themes || []) : auto.themes };
    }
    return {
      characters: uniq([...(doc.fm.characters || []), ...people.filter(p => text.includes(p))]),
      places: uniq([...(doc.fm.places || []), ...places.filter(p => text.includes(p))]),
      themes: uniq([...(doc.fm.themes || []), ...themes.filter(([, kws]) => kws.some(k => text.includes(k))).map(([t]) => t)]),
    };
  }
  /** the frontmatter exactly as it will be written into the downloaded file */
  function finalFrontmatter(doc, opts) {
    const found = detect(doc, opts), fm = { ...doc.fm };
    for (const k of ["characters", "places", "themes"]) { if (found[k].length) fm[k] = found[k]; else delete fm[k]; }
    return fm;
  }

  // ------------------------------------------------------------------ 4. build the universe data the viewer reads
  function build(docs, opts) {
    const { people = [], places = [], extraThemes = [], cats = CATEGORIES, author = "", secret = false, themeOn = null } = opts || {};
    const catKeys = new Set(cats.map(c => c.key));
    const rows = docs.map(d => {
      const [Y, M, D] = d.fm.date.split("-").map(Number);
      const y = Y + (M - 1) / 12 + (D - 1) / 365;
      return { d, y, date: d.fm.date };
    }).sort((a, b) => a.y - b.y);

    // entities: themes from the dictionary, people/places the user confirmed, plus YAML lists
    const ents = [], byId = new Map();
    const ent = (type, label) => { const id = type + "_" + label; if (!byId.has(id)) { byId.set(id, ents.length); ents.push({ id, l: label, type, docs: [] }); } return byId.get(id); };
    rows.forEach((r, di) => {
      const found = detect(r.d, opts), hit = new Set();
      found.themes.forEach(t => hit.add(ent("theme", t)));
      found.characters.forEach(p => hit.add(ent("person", p)));
      found.places.forEach(p => hit.add(ent("place", p)));
      r.ents = [...hit]; r.ents.forEach(e => ents[e].docs.push(di));
    });

    // echoes: memories at least three years apart that share specific gravity
    const weight = e => (ents[e].type === "theme" ? 0.6 : 1) / Math.sqrt(ents[e].docs.length);
    const cand = [];
    for (let a = 0; a < rows.length; a++) for (let b = a + 1; b < rows.length; b++) {
      if (Math.abs(rows[a].y - rows[b].y) < 3) continue;
      const shared = rows[a].ents.filter(e => rows[b].ents.includes(e));
      if (shared.length < 2) continue;
      cand.push([shared.reduce((s, e) => s + weight(e), 0), a, b]);
    }
    cand.sort((x, y) => y[0] - x[0]);
    const echoes = cand.slice(0, Math.min(160, rows.length * 1.3 | 0)).map(([s, a, b]) => [a, b, Math.round(Math.min(.9, .45 + s * .35) * 100) / 100]);

    // constellations: the most present people and themes become life chapters
    const chapterEnts = ents.map((e, i) => i).filter(i => ents[i].docs.length >= 3)
      .sort((a, b) => ents[b].docs.length - ents[a].docs.length)
      .slice(0, Math.max(4, Math.min(12, Math.round(rows.length / 4))));   // about one constellation per four memories
    const comms = chapterEnts.map((e, ci) => ({ id: ci, label: (ents[e].type === "person" ? "人｜" : ents[e].type === "place" ? "地｜" : "") + ents[e].l, size: 0, top: [], span: [0, 0] }));
    const other = { id: comms.length, label: "零星的光", size: 0, top: [], span: [0, 0] };
    rows.forEach(r => {
      let best = -1, bs = 0;
      chapterEnts.forEach((e, ci) => { if (r.ents.includes(e)) { const s = 1 / Math.sqrt(ents[e].docs.length); if (s > bs) { bs = s; best = ci; } } });
      r.k = best >= 0 ? best : other.id;
    });
    if (rows.some(r => r.k === other.id)) comms.push(other);
    const palette = ["#7b6cff", "#ff7aa8", "#ffb86b", "#5ee0ff", "#9cf08f", "#c9a6ff", "#ffe08a", "#6fb6ff", "#7fe0d0", "#ff9b7a", "#b8a0ff", "#a3abc8", "#ffd38a"];
    comms.forEach((c, i) => {
      const m = rows.filter(r => r.k === c.id);
      c.size = m.length; c.color = palette[i % palette.length];
      if (m.length) c.span = [Math.floor(m[0].y), Math.floor(m[m.length - 1].y)];
    });
    const keptComms = comms.filter(c => c.size > 0);
    const reidx = new Map(keptComms.map((c, i) => [c.id, i]));      // the viewer indexes constellations by position
    keptComms.forEach((c, i) => { c.id = i; });
    rows.forEach(r => { r.k = reidx.get(r.k); });

    const viewerDocs = rows.map((r, i) => {
      const cat = catKeys.has(r.d.fm.category) ? r.d.fm.category : "diary";
      const chars = r.d.body.replace(/\s/g, "").length;
      return { id: "d" + i, t: r.d.fm.title, d: r.date, y: Math.round(r.y * 1e4) / 1e4, c: cat, s: r.d.fm.summary || "", m: r.d.fm.mood || "",
               f: r.d.path, k: r.k, arm: (cats.find(c => c.key === cat) || {}).arm || 0, ents: r.ents,
               deg: r.ents.length + echoes.filter(([a, b]) => a === i || b === i).length,
               b: secret ? "" : r.d.body, secret: secret || undefined, n: chars };
    });

    // narration: one quiet line per active year
    const years = [...new Set(rows.map(r => Math.floor(r.y)))];
    const eras = years.map(y => {
      const m = rows.filter(r => Math.floor(r.y) === y);
      const cnt = new Map(); m.forEach(r => r.ents.forEach(e => cnt.set(e, (cnt.get(e) || 0) + 1)));
      const top = [...cnt].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([e]) => ents[e].l);
      return { y, label: `${y}`, short: `${y}`, text: `這一年留下 ${m.length} 段記憶${top.length ? "，最常出現：" + top.join("、") : ""}。` };
    }).filter((e, i, arr) => arr.length <= 14 || i % Math.ceil(arr.length / 14) === 0);
    const y0 = Math.floor(rows[0].y), y1 = Math.floor(rows[rows.length - 1].y);
    const who = author ? author + "的" : "";
    const usedCats = cats.filter(c => viewerDocs.some(d => d.c === c.key));
    const inner = usedCats.filter(c => !c.arm).map(c => c.label), outer = usedCats.filter(c => c.arm).map(c => c.label);

    return {
      categories: Object.fromEntries(cats.map(c => [c.key, { label: c.label, color: c.color }])),
      docs: viewerDocs, ents, echoes, comms: keptComms,
      span: [y0, Math.round((rows[rows.length - 1].y + .08) * 1000) / 1000],
      prologue: [`這座宇宙由 ${rows.length} 段記憶組成，從 ${y0} 年到 ${y1} 年。`, "中心是你自己，越往外越接近現在；",
                 `內側旋臂是${inner.join("、") || "生活"}，外側旋臂是${outer.join("、") || "作品與工作"}。`,
                 secret ? "這是公開版：每段記憶的全文都留在作者的電腦裡。" : "這個檔案含有全文，只屬於你。"],
      prologueSig: `—— ${who}宇宙，${fmtDate(new Date())}`,
      eras,
      meta: { title: "一個生命體的宇宙", docTitle: `${who}記憶宇宙`, subtitle: `${author ? author + " · " : ""}${y0} — ${y1} · ${rows.length} 段記憶${secret ? "（公開版：全文秘密）" : ""}`,
              pathPrefix: secret ? null : "", galaxyDesc: `每顆星是一段記憶。中心是你，越往外越接近現在；內側旋臂是${inner.join("、") || "生活"}，外側旋臂是${outer.join("、") || "作品與工作"}。` },
    };
  }

  window.CosmosPipeline = { CATEGORIES, THEMES, readDocs, enrich, candidates, build, detect, finalFrontmatter, parseFrontmatter, writeFrontmatter };
})();
