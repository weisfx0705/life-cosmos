/* Life Cosmos builder — the page that walks a person from a folder of diaries to their universe. */
(function () {
  "use strict";
  const P = window.CosmosPipeline;
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const TEXT_EXT = /\.(md|markdown|txt)$/i;
  const SKIP = /(^|\/)(\.|__MACOSX)/;

  const FIELDS = ["date", "title", "category", "mood", "summary"];
  const exportPath = d => /\.(txt|docx)$/i.test(d.path) ? d.path.replace(/\.(txt|docx)$/i, ".md") : d.path;
  const pending = d => FIELDS.filter(k => d.auto[k] && d.auto[k] !== "yaml").length;
  const SETTINGS = "cosmos-settings.json";
  const state = { docs: [], cands: [], types: new Map(), skipped: new Set(), showSkipped: false,
                  themeOn: new Set(P.THEMES.map(t => t[0])), html: "", url: "", dirty: false, settings: null };

  // ---------------------------------------------------------------- reading files (folder, zip, docx, md, txt)
  async function fileToRecords(file, path) {
    path = path || file.webkitRelativePath || file.name;
    if (SKIP.test(path)) return [];
    if (file.name === SETTINGS) return [{ settings: JSON.parse(await file.text()) }];
    if (/\.zip$/i.test(path)) return readZip(await file.arrayBuffer(), path.replace(/\.zip$/i, ""));
    if (/\.docx$/i.test(path)) return [{ path, name: file.name, text: await docxText(await file.arrayBuffer()), lastModified: file.lastModified }];
    if (TEXT_EXT.test(path)) return [{ path, name: file.name, text: await file.text(), lastModified: file.lastModified }];
    return [];
  }
  async function docxText(buf) {
    if (!window.mammoth) throw new Error("讀取 .docx 需要網路（mammoth 函式庫）");
    return (await window.mammoth.extractRawText({ arrayBuffer: buf })).value;
  }
  async function readZip(buf, prefix) {
    if (!window.JSZip) throw new Error("讀取 .zip 需要網路（JSZip 函式庫）");
    const zip = await window.JSZip.loadAsync(buf), out = [];
    for (const entry of Object.values(zip.files)) {
      const path = entry.name;
      if (entry.dir || SKIP.test(path)) continue;
      const name = path.split("/").pop(), lm = entry.date ? entry.date.getTime() : Date.now();
      if (name === SETTINGS) { try { out.push({ settings: JSON.parse(await entry.async("string")) }); } catch (e) { /* ignore a broken settings file */ } continue; }
      if (TEXT_EXT.test(path)) out.push({ path, name, text: await entry.async("string"), lastModified: lm });
      else if (/\.docx$/i.test(path)) out.push({ path, name, text: await docxText(await entry.async("arraybuffer")), lastModified: lm });
    }
    return out;
  }
  // folders dragged onto the page
  function walkEntry(entry, path = "") {
    return new Promise(resolve => {
      if (entry.isFile) entry.file(f => fileToRecords(f, path + f.name).then(resolve, () => resolve([])), () => resolve([]));
      else if (entry.isDirectory) {
        const reader = entry.createReader(), all = [];
        const next = () => reader.readEntries(async batch => {
          if (!batch.length) { const nested = await Promise.all(all.map(e => walkEntry(e, path + entry.name + "/"))); resolve(nested.flat()); }
          else { all.push(...batch); next(); }
        }, () => resolve([]));
        next();
      } else resolve([]);
    });
  }

  async function ingest(promise) {
    $("#importStatus").textContent = "讀取中…";
    try {
      const all = (await promise).flat();
      state.settings = (all.find(r => r.settings) || {}).settings || null;
      const records = all.filter(r => r.text && r.text.trim());
      if (!records.length) { $("#importStatus").textContent = "沒有找到 .md、.txt、.docx 或 .zip 檔案。"; return; }
      state.docs = P.enrich(P.readDocs(records));
      $("#importStatus").innerHTML = `讀進 <b>${state.docs.length}</b> 篇日記${state.settings ? "，並套回上次的設定" : ""}`;
      afterImport();
    } catch (e) { $("#importStatus").textContent = "讀取失敗：" + e.message; console.error(e); }
  }

  $("#pickFolder").addEventListener("change", e => ingest(Promise.all([...e.target.files].map(f => fileToRecords(f)))));
  $("#pickFiles").addEventListener("change", e => ingest(Promise.all([...e.target.files].map(f => fileToRecords(f)))));
  const drop = $("#drop");
  ["dragenter", "dragover"].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.add("over"); }));
  ["dragleave", "drop"].forEach(t => drop.addEventListener(t, () => drop.classList.remove("over")));
  drop.addEventListener("drop", e => {
    e.preventDefault();
    const items = [...(e.dataTransfer.items || [])].map(i => i.webkitGetAsEntry && i.webkitGetAsEntry()).filter(Boolean);
    if (items.length) ingest(Promise.all(items.map(en => walkEntry(en))));
    else ingest(Promise.all([...e.dataTransfer.files].map(f => fileToRecords(f))));
  });
  $("#useSamples").addEventListener("click", () => ingest(Promise.resolve((window.SAMPLE_DIARIES || []).map(s => ({ ...s, lastModified: Date.now() })))));

  // ---------------------------------------------------------------- step 2: YAML table
  function afterImport() {
    ["#s2", "#s3", "#s4"].forEach(s => $(s).classList.remove("off"));
    state.skipped = new Set(); state.showSkipped = false;
    renderRows();
    // fields the rules just filled in are not saved yet (fields restored as "unconfirmed" from the settings already are)
    const fresh = state.docs.some(d => Object.values(d.auto).some(v => v !== "yaml"));
    renderCands(); applySettings(state.settings); renderThemes();
    setDirty(fresh);
    $("#result").classList.remove("on");
    $("#s3").scrollIntoView({ behavior: "smooth", block: "start" });   // people and places first, then the YAML review
  }
  function renderRows() {
    const added = state.docs.filter(d => !d.hadYaml).length;
    const filled = state.docs.reduce((n, d) => n + Object.values(d.auto).filter(v => v !== "yaml").length, 0);
    const done = state.docs.filter(d => !pending(d)).length;
    $("#yamlStatus").innerHTML = `${state.docs.length} 篇裡，<b>${added}</b> 篇原本沒有 YAML；這次一共補上 <b>${filled}</b> 個欄位（金色標籤標出來源）。已確認 <b>${done}</b> / ${state.docs.length} 篇。點「全文」打開文章，對照內容確認。`;
    const opts = P.CATEGORIES.map(c => `<option value="${c.key}">${c.label}</option>`).join("");
    const tag = (d, k) => d.auto[k] && d.auto[k] !== "yaml" ? `<span class="tag auto">補上｜${esc(d.auto[k])}</span>` : "";
    state.order = state.docs.slice().sort((a, b) => a.fm.date.localeCompare(b.fm.date)).map(d => d.i);
    $("#rows").innerHTML = state.order.map(i => state.docs[i]).map(d => `
      <tr data-i="${d.i}">
        <td><button class="open" data-open="${d.i}" title="打開全文">全文</button>${statusCell(d)}</td>
        <td><input type="date" data-k="date" value="${esc(d.fm.date)}">${tag(d, "date")}</td>
        <td><input data-k="title" value="${esc(d.fm.title)}">${tag(d, "title")}</td>
        <td><select data-k="category">${opts.replace(`value="${d.fm.category}"`, `value="${d.fm.category}" selected`)}</select>${tag(d, "category")}</td>
        <td><input data-k="mood" value="${esc(d.fm.mood)}">${tag(d, "mood")}</td>
        <td><input data-k="summary" value="${esc(d.fm.summary)}">${tag(d, "summary")}</td>
        <td class="file">${esc(d.path)}</td>
      </tr>`).join("");
  }
  function statusCell(d) { const n = pending(d); return `<span class="st ${n ? "todo" : "ok"}" data-st="${d.i}">${n ? "待確認 " + n : "✓ 已確認"}</span>`; }
  function refreshRow(d) {
    const tr = document.querySelector(`#rows tr[data-i="${d.i}"]`); if (!tr) return;
    for (const k of FIELDS) {
      const el = tr.querySelector(`[data-k="${k}"]`); if (el && el.value !== d.fm[k]) el.value = d.fm[k];
      const tag = el && el.parentElement.querySelector(".tag"); if (tag && (!d.auto[k] || d.auto[k] === "yaml")) tag.remove();
    }
    tr.querySelector(".st").outerHTML = statusCell(d);
    const done = state.docs.filter(x => !pending(x)).length;
    $("#yamlStatus").innerHTML = $("#yamlStatus").innerHTML.replace(/已確認 <b>\d+<\/b>/, `已確認 <b>${done}</b>`);
  }
  $("#rows").addEventListener("click", e => { const b = e.target.closest("[data-open]"); if (b) openReader(+b.dataset.open); });
  $("#rows").addEventListener("change", e => {
    const el = e.target.closest("[data-k]"), tr = e.target.closest("tr"); if (!el || !tr) return;
    const d = state.docs[+tr.dataset.i]; d.fm[el.dataset.k] = el.value; d.auto[el.dataset.k] = "yaml";
    const t = el.parentElement.querySelector(".tag"); if (t) t.remove();
    refreshRow(d); setDirty(true);
  });

  // ---------------------------------------------------------------- the full text, with its YAML on top
  const reader = $("#reader");
  const listFields = ["characters", "places", "themes"];
  const listLabel = { characters: "人物", places: "地方", themes: "主題" };
  function openReader(i) { state.open = i; reader.hidden = false; document.body.classList.add("modal-open"); renderReader(); $("#rd-title").focus(); }
  function closeReader() { reader.hidden = true; document.body.classList.remove("modal-open"); state.open = null; }
  function renderReader() {
    const d = state.docs[state.open], pos = state.order.indexOf(d.i);
    const opts = P.CATEGORIES.map(c => `<option value="${c.key}"${c.key === d.fm.category ? " selected" : ""}>${c.label}</option>`).join("");
    const found = P.detect(d, options(false));
    const src = k => d.auto[k] && d.auto[k] !== "yaml" ? `<span class="tag auto">補上｜${esc(d.auto[k])}</span>` : `<span class="tag">已確認</span>`;
    $("#rd-head").innerHTML = `<span>${pos + 1} / ${state.order.length}</span><span class="path">${esc(d.path)}</span>`;
    $("#rd-form").innerHTML = `
      <label class="w2">標題 ${src("title")}<input id="rd-title" data-f="title" value="${esc(d.fm.title)}"></label>
      <label>日期 ${src("date")}<input type="date" data-f="date" value="${esc(d.fm.date)}"></label>
      <label>分類 ${src("category")}<select data-f="category">${opts}</select></label>
      <label>心情 ${src("mood")}<input data-f="mood" value="${esc(d.fm.mood)}"></label>
      <label class="w3">一句摘要 ${src("summary")}<input data-f="summary" value="${esc(d.fm.summary)}"></label>
      ${listFields.map(k => `<label>${listLabel[k]} <span class="tag">${d.lock && d.lock[k] ? "你寫的" : "依規則判斷"}</span><input data-l="${k}" value="${esc(found[k].join(", "))}" placeholder="用逗號分隔"></label>`).join("")}
      <p class="rule-note">人物與地方：比對你在第 2 步標成「人」「地」的詞（以及手動加入的），這篇有出現就列入；主題：比對內建主題字典的關鍵字。全部在你的瀏覽器裡用規則判斷，不用 AI、不需要任何金鑰。直接在欄位裡改，這篇就照你寫的為準。</p>`;
    drawYaml();
    $("#rd-body").textContent = d.body;
    $("#rd-prev").disabled = pos <= 0; $("#rd-next").disabled = pos >= state.order.length - 1;
    $("#rd-confirm").textContent = pending(d) ? "確認這篇的 YAML" : "✓ 已確認";
  }
  function drawYaml() {
    const d = state.docs[state.open];
    $("#rd-yaml").textContent = P.writeFrontmatter(P.finalFrontmatter(d, options(false)));
  }
  $("#rd-form").addEventListener("input", e => {
    const d = state.docs[state.open], el = e.target;
    if (el.dataset.f) { d.fm[el.dataset.f] = el.value; d.auto[el.dataset.f] = "yaml"; const t = el.parentElement.querySelector(".tag"); if (t) { t.className = "tag"; t.textContent = "已確認"; } }
    if (el.dataset.l) { d.fm[el.dataset.l] = el.value.split(/[,，、]/).map(x => x.trim()).filter(Boolean); d.lock = { ...(d.lock || {}), [el.dataset.l]: true };
      const t = el.parentElement.querySelector(".tag"); if (t) t.textContent = "你寫的"; }
    drawYaml(); refreshRow(d); setDirty(true);
  });
  $("#rd-form").addEventListener("change", e => { if (e.target.tagName === "SELECT") e.target.dispatchEvent(new Event("input", { bubbles: true })); });
  function confirmDoc() { const d = state.docs[state.open]; FIELDS.forEach(k => { d.auto[k] = "yaml"; }); refreshRow(d); setDirty(true); }
  function step(dir) { const pos = state.order.indexOf(state.open) + dir; if (pos >= 0 && pos < state.order.length) { state.open = state.order[pos]; renderReader(); } }
  $("#rd-confirm").addEventListener("click", () => { confirmDoc(); renderReader(); });
  $("#rd-confirm-next").addEventListener("click", () => {
    confirmDoc();
    const pos = state.order.indexOf(state.open);
    const next = state.order.slice(pos + 1).find(i => pending(state.docs[i]));
    if (next != null) { state.open = next; renderReader(); } else { renderReader(); $("#rd-confirm-next").textContent = "全部都確認了"; }
  });
  $("#rd-prev").addEventListener("click", () => step(-1));
  $("#rd-next").addEventListener("click", () => step(1));
  $("#rd-close").addEventListener("click", closeReader);
  reader.addEventListener("click", e => { if (e.target === reader) closeReader(); });
  document.addEventListener("keydown", e => {
    if (reader.hidden) return;
    if (e.key === "Escape") closeReader();
    const typing = /INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName);
    if (!typing && e.key === "ArrowRight") step(1);
    if (!typing && e.key === "ArrowLeft") step(-1);
  });

  // ---------------------------------------------------------------- step 3: people, places, themes
  function renderCands() {
    state.cands = P.candidates(state.docs);
    state.types = new Map(state.cands.filter(c => c.guess).map(c => [c.term, c.guess]));
    // names already listed in YAML count as people
    state.docs.forEach(d => (d.fm.characters || []).forEach(p => state.types.set(p, "person")));
    drawCands();
  }
  function drawCands() {
    const lab = { person: "人", place: "地", theme: "題", skip: "略" };
    const visible = state.cands.filter(c => state.showSkipped || !state.skipped.has(c.term));
    const nSkip = state.cands.filter(c => state.skipped.has(c.term)).length;
    $("#cands").innerHTML = (visible.length ? visible.map(c => {
      const t = state.skipped.has(c.term) ? "skip" : state.types.get(c.term) || "";
      return `<span class="chip${t ? " picked" : ""}${t === "skip" ? " skipped" : ""}" data-term="${esc(c.term)}">${esc(c.term)} <small>${c.docs} 篇</small>
        <span class="seg">${["person", "place", "theme", "skip"].map(k => `<button data-t="${k}" class="${t === k ? "on" : ""}" title="${{ person: "這是人", place: "這是地方", theme: "這是主題", skip: "沒有意義，下次不要再出現" }[k]}">${lab[k]}</button>`).join("")}</span></span>`;
    }).join("") : `<span class="status">${state.cands.length ? "候選詞都標記完了。" : "日記篇數太少，還找不到反覆出現的詞；可以在下面手動加入。"}</span>`)
      + (nSkip ? ` <button class="linkish" id="toggleSkipped">${state.showSkipped ? "收起" : "顯示"}略過的 ${nSkip} 個詞</button>` : "");
  }
  $("#cands").addEventListener("click", e => {
    if (e.target.id === "toggleSkipped") { state.showSkipped = !state.showSkipped; drawCands(); return; }
    const b = e.target.closest("button[data-t]"), chip = e.target.closest(".chip"); if (!b || !chip) return;
    const term = chip.dataset.term, t = b.dataset.t;
    if (t === "skip") { state.skipped.has(term) ? state.skipped.delete(term) : (state.skipped.add(term), state.types.delete(term)); }
    else { state.skipped.delete(term); state.types.get(term) === t ? state.types.delete(term) : state.types.set(term, t); }
    drawCands(); setDirty(true);
  });
  function renderThemes() {
    const counts = new Map(P.THEMES.map(([t, kws]) => [t, state.docs.filter(d => kws.some(k => (d.fm.title + d.body).includes(k))).length]));
    $("#themes").innerHTML = P.THEMES.map(([t]) => `<label><input type="checkbox" data-theme="${esc(t)}" ${state.themeOn.has(t) ? "checked" : ""}> ${esc(t)} <small>${counts.get(t)}</small></label>`).join("");
  }
  $("#themes").addEventListener("change", e => { const t = e.target.dataset.theme; if (!t) return; e.target.checked ? state.themeOn.add(t) : state.themeOn.delete(t); setDirty(true); });
  ["#addPeople", "#addPlaces", "#author"].forEach(sel => $(sel).addEventListener("input", () => state.docs.length && setDirty(true)));
  $("#secret").addEventListener("change", () => state.docs.length && setDirty(true));

  // ---------------------------------------------------------------- settings that travel with the zip
  function collectSettings() {
    return { app: "life-cosmos", version: 1, saved: new Date().toISOString(),
             author: $("#author").value.trim(), secret: $("#secret").checked,
             themesOff: P.THEMES.map(t => t[0]).filter(t => !state.themeOn.has(t)),
             marks: Object.fromEntries(state.types), skipped: [...state.skipped],
             extraPeople: $("#addPeople").value, extraPlaces: $("#addPlaces").value,
             // lists edited by hand in the full-text window stay exactly as written
             locked: Object.fromEntries(state.docs.filter(d => d.lock).map(d => [exportPath(d), Object.keys(d.lock)])),
             // fields filled by the rules that nobody has confirmed yet, with where they came from
             unconfirmed: Object.fromEntries(state.docs.filter(pending).map(d => [exportPath(d),
               Object.fromEntries(FIELDS.filter(k => d.auto[k] && d.auto[k] !== "yaml").map(k => [k, d.auto[k]]))])) };
  }
  function applySettings(st) {
    if (!st || st.app !== "life-cosmos") { state.themeOn = new Set(P.THEMES.map(t => t[0])); return; }
    $("#author").value = st.author || ""; $("#secret").checked = !!st.secret;
    state.themeOn = new Set(P.THEMES.map(t => t[0]).filter(t => !(st.themesOff || []).includes(t)));
    for (const [w, t] of Object.entries(st.marks || {})) state.types.set(w, t);
    state.skipped = new Set(st.skipped || []);
    $("#addPeople").value = st.extraPeople || ""; $("#addPlaces").value = st.extraPlaces || "";
    for (const d of state.docs) {
      const ks = (st.locked || {})[d.path]; if (ks) d.lock = Object.fromEntries(ks.map(k => [k, true]));
      const un = (st.unconfirmed || {})[d.path];
      if (un) for (const [k, srcName] of Object.entries(un)) if (String(d.fm[k] ?? "") !== "") d.auto[k] = srcName;
    }
    renderRows();
    drawCands();
  }

  // ---------------------------------------------------------------- unsaved work: shown on the page, guarded on leaving
  function setDirty(on) {
    state.dirty = !!on;
    const pill = $("#unsaved");
    pill.classList.toggle("on", state.dirty);
    $("#saveState").innerHTML = state.dirty ? `<span class="dirty">● 有還沒下載的修改</span>` : state.docs.length ? `<span class="clean">✓ 修改都已存進下載的 zip</span>` : "";
  }
  window.addEventListener("beforeunload", e => { if (state.dirty) { e.preventDefault(); e.returnValue = ""; } });
  $("#unsaved").addEventListener("click", () => $("#dlYaml").click());

  const listOf = sel => $(sel).value.split(/[,，、\n]/).map(s => s.trim()).filter(Boolean);
  function options(secret) {
    const pick = type => [...state.types].filter(([, t]) => t === type).map(([w]) => w);
    return { people: [...new Set([...pick("person"), ...listOf("#addPeople")])], places: [...new Set([...pick("place"), ...listOf("#addPlaces")])],
             extraThemes: pick("theme"), themeOn: state.themeOn, author: $("#author").value.trim(), secret };
  }

  // ---------------------------------------------------------------- step 4: build, preview, export
  $("#build").addEventListener("click", () => {
    const secret = $("#secret").checked;
    const data = P.build(state.docs, options(secret));
    state.html = window.VIEWER_TEMPLATE.replace("/*__DATA__*/", JSON.stringify(data).replace(/<\//g, "<\\/"));
    if (state.url) URL.revokeObjectURL(state.url);
    state.url = URL.createObjectURL(new Blob([state.html], { type: "text/html" }));
    $("#preview").src = state.url;
    const people = data.ents.filter(e => e.type === "person").length, places = data.ents.filter(e => e.type === "place").length, themes = data.ents.filter(e => e.type === "theme").length;
    $("#stats").innerHTML = [["段記憶", data.docs.length], ["個星座", data.comms.length], ["個人", people], ["個地方", places], ["個主題", themes], ["道回聲", data.echoes.length]]
      .map(([l, v]) => `<div><b>${v}</b>${l}</div>`).join("");
    $("#dlNote").textContent = secret ? "公開版：檔案裡沒有任何全文，可以分享。" : "完整版：檔案裡有你的全文，請只留給自己。";
    $("#result").classList.add("on");
    $("#buildStatus").textContent = "";
    $("#result").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  // write the universe into a fresh tab, so the address bar shows no temporary blob: address
  $("#openFull").addEventListener("click", () => {
    if (!state.html) return;
    const w = window.open("", "_blank");
    if (!w) { window.open(state.url, "_blank"); return; }       // popup refused: fall back to the temporary address
    w.document.open(); w.document.write(state.html); w.document.close();
  });
  $("#dlHtml").addEventListener("click", () => {
    if (!state.html) return;
    const who = $("#author").value.trim();
    download(new Blob([state.html], { type: "text/html" }), `${who ? who + "-" : ""}life-cosmos${$("#secret").checked ? "-public" : ""}.html`);
  });

  // the diaries back, each with a complete YAML header (people, places and themes included)
  $("#dlYaml").addEventListener("click", async () => {
    if (!window.JSZip) { alert("打包 zip 需要網路（JSZip 函式庫）。"); return; }
    const zip = new window.JSZip(), opts = options(false);
    for (const d of state.docs) {
      const fm = P.finalFrontmatter(d, opts);      // exactly what the full-text window previews
      const path = exportPath(d);
      zip.file(path, P.writeFrontmatter(fm) + "\n" + d.body + "\n");
    }
    zip.file(SETTINGS, JSON.stringify(collectSettings(), null, 1));
    download(await zip.generateAsync({ type: "blob" }), "diaries-with-yaml.zip");
    setDirty(false);
  });

  function download(blob, name) {
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
})();
