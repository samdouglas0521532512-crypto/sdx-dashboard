/* SDX Members Dashboard: My Notion (under ADMIN).
   Everything here is saved to the logged-in person's own journal rows, so only that login can read it.
   No Notion data lives in this file: it is brought in from the export bundle on the Import screen. */
(function () {
  "use strict";
  var P = window.SDX_PAGES = window.SDX_PAGES || {};
  function X() { return window.SDX; }
  function esc(s) { return X().esc(s); }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function sb() { return X().sb; }
  function uid() { return X().state.session.user.id; }

  var LIBS = {
    zip: "https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js",
    md: "https://cdn.jsdelivr.net/npm/marked@12.0.2/marked.min.js",
    clean: "https://cdn.jsdelivr.net/npm/dompurify@3.1.6/dist/purify.min.js"
  };
  var loaded = {};
  function lib(k) {
    if (loaded[k]) return loaded[k];
    loaded[k] = new Promise(function (ok, bad) { var s = document.createElement("script"); s.src = LIBS[k]; s.onload = ok; s.onerror = function () { bad(new Error("Couldn't load " + k)); }; document.head.appendChild(s); });
    return loaded[k];
  }

  // ---------- data ----------
  var N = null; // { meta, pages: {nid: row}, tables: {nid: row} }
  async function load(force) {
    if (N && !force) return null;
    var all = [], from = 0;
    while (true) {
      var r = await sb().from("journal_items").select("id,data").eq("kind", "notion").range(from, from + 199);
      if (r.error) return r.error;
      all = all.concat(r.data || []);
      if (!r.data || r.data.length < 200) break;
      from += 200;
    }
    N = { meta: null, pages: {}, tables: {} };
    all.forEach(function (row) {
      var d = row.data || {};
      if (d.type === "meta") N.meta = d;
      else if (d.type === "page") N.pages[d.nid] = d;
      else if (d.type === "table") N.tables[d.nid] = d;
    });
    return null;
  }

  // ---------- markdown ----------
  function md(text) {
    var html = window.marked.parse(text || "", { gfm: true, breaks: false });
    html = window.DOMPurify.sanitize(html, { ADD_ATTR: ["target"] });
    return html;
  }

  // ---------- shared bits ----------
  function head(a, b, sub) {
    return '<div style="display:flex;flex-direction:column;gap:8px"><div class="eyebrow">ADMIN · PRIVATE TO YOU</div><h1 class="title">' + esc(a) + (b ? ' <span class="metal-text">' + esc(b) + "</span>" : "") + "</h1>" + (sub ? '<div class="note">' + sub + "</div>" : "") + "</div>";
  }
  function crumb(name) {
    return '<div class="note" style="font-size:13px;margin-bottom:-10px"><a href="#/notion" class="muted">My Notion</a> / <span style="color:#e6e8eb">' + esc(name) + "</span></div>";
  }
  var STYLE = '<style>' +
    '.nmd{line-height:1.6;color:#d9dbde;font-size:15px}.nmd h1,.nmd h2,.nmd h3{color:#fff;margin:22px 0 8px}.nmd h1{font-size:24px}.nmd h2{font-size:19px}.nmd h3{font-size:16px}' +
    '.nmd a{color:#e6e8eb;text-decoration:underline}.nmd img{max-width:100%;border-radius:12px;border:1px solid #26272a;margin:8px 0;display:block}' +
    '.nmd hr{border:0;border-top:1px solid #26272a;margin:18px 0}.nmd ul,.nmd ol{padding-left:22px}.nmd li{margin:3px 0}.nmd input[type=checkbox]{margin-right:8px;accent-color:#c9ccd1}.nmd li:has(>input[type=checkbox]){list-style:none;margin-left:-18px}' +
    '.nmd table{border-collapse:collapse;margin:10px 0;display:block;overflow-x:auto}.nmd td,.nmd th{border:1px solid #26272a;padding:6px 10px;text-align:left}.nmd details{background:#0b0b0c;border:1px solid #26272a;border-radius:12px;padding:10px 14px;margin:8px 0}.nmd summary{cursor:pointer;font-weight:600;color:#fff}' +
    '.nmd aside{display:block;background:#0b0b0c;border:1px solid #26272a;border-radius:12px;padding:12px 14px;margin:10px 0}' +
    '.ntab{width:100%;border-collapse:collapse;font-size:13px}.ntab th{position:sticky;top:0;background:#0b0b0c;text-align:left;padding:10px;border-bottom:1px solid #26272a;cursor:pointer;white-space:nowrap;color:#c9ccd1}' +
    '.ntab td{padding:9px 10px;border-bottom:1px solid #18191b;vertical-align:top;max-width:340px}.ntab tr.open-row{cursor:pointer}.ntab tr.open-row:hover td{background:#0e0f10}' +
    '.nthumb{height:46px;border-radius:8px;border:1px solid #26272a;margin:2px 4px 2px 0;cursor:zoom-in}.nlist a{display:flex;justify-content:space-between;gap:12px;padding:12px 4px;border-top:1px solid #18191b;color:#e6e8eb;text-decoration:none}.nlist a:hover{color:#fff}' +
    '.nzoom{position:fixed;inset:0;background:rgba(0,0,0,.88);display:flex;align-items:center;justify-content:center;z-index:999;padding:24px}.nzoom img{max-width:100%;max-height:100%;border-radius:12px}' +
    '</style>';

  function zoomHandlers(root) {
    $$("img", root).forEach(function (im) {
      im.style.cursor = "zoom-in";
      im.onclick = function () { var z = document.createElement("div"); z.className = "nzoom"; z.innerHTML = '<img src="' + esc(im.src) + '" alt="">'; z.onclick = function () { z.remove(); }; document.body.appendChild(z); };
    });
  }

  // ---------- result stats for any table with an R column ----------
  function rColumn(cols) {
    var pick = null;
    cols.forEach(function (c) { if (!pick && /^(r|rr result|result \(r\)|r result|total r|p\/l \(r\)|r multiple)$/i.test(c.trim())) pick = c; });
    return pick;
  }
  function numOf(v) { var n = parseFloat(String(v || "").replace(/[^0-9.\-]/g, "")); return isNaN(n) ? null : n; }
  function stats(t) {
    var c = rColumn(t.cols); if (!c) return "";
    var w = 0, l = 0, be = 0, tot = 0, n = 0;
    t.rows.forEach(function (r) { var v = numOf(r[c]); if (v == null) return; n++; tot += v; if (v > 0) w++; else if (v < 0) l++; else be++; });
    if (!n) return "";
    var wr = w + l ? Math.round(w / (w + l) * 1000) / 10 + "%" : "—";
    function tile(k, v, cls) { return '<div class="tile"><span class="k">' + esc(k) + '</span><span class="v ' + (cls || "") + '">' + esc(v) + "</span></div>"; }
    tot = Math.round(tot * 100) / 100;
    return '<div class="tiles" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:12px">' +
      tile("Trades", n) + tile("Wins", w) + tile("Losses", l) + tile("Breakeven", be) + tile("Win rate", wr) + tile("Total R", (tot > 0 ? "+" : "") + tot + "R", tot > 0 ? "pos" : tot < 0 ? "neg" : "") + "</div>" +
      '<div class="note" style="font-size:12px">Win rate is wins ÷ (wins + losses). Breakevens don\'t count.</div>';
  }

  function cell(v) {
    v = String(v == null ? "" : v);
    if (/^https?:\/\/\S+\.(png|jpe?g|gif|webp)(\s+https?:\/\/\S+\.(png|jpe?g|gif|webp))*$/i.test(v.trim()))
      return v.trim().split(/\s+/).map(function (u) { return '<img class="nthumb" src="' + esc(u) + '" alt="">'; }).join("");
    if (/^#\/notion\//.test(v)) return '<a href="' + esc(v) + '">Open</a>';
    return esc(v);
  }

  // ---------- views ----------
  var TS = {}; // per-table search and sort
  function viewTable(page, t) {
    var st = TS[t.nid] || (TS[t.nid] = { q: "", sort: null, dir: 1, open: null });
    var cols = t.cols.filter(function (c) { return c; });
    function draw() {
      var rows = t.rows.map(function (r, i) { return { r: r, i: i }; });
      if (st.q) { var q = st.q.toLowerCase(); rows = rows.filter(function (x) { return cols.some(function (c) { return String(x.r[c] || "").toLowerCase().indexOf(q) > -1; }); }); }
      if (st.sort) rows.sort(function (a, b) {
        var A = a.r[st.sort] || "", B = b.r[st.sort] || "", nA = numOf(A), nB = numOf(B);
        if (nA != null && nB != null && /^[\s\-+$£%.0-9R]*$/.test(A + B)) return (nA - nB) * st.dir;
        var dA = Date.parse(A), dB = Date.parse(B);
        if (!isNaN(dA) && !isNaN(dB)) return (dA - dB) * st.dir;
        return String(A).localeCompare(String(B)) * st.dir;
      });
      var body = rows.map(function (x) {
        var has = !!x.r._page;
        return '<tr class="' + (has ? "open-row" : "") + '" data-i="' + x.i + '">' + cols.map(function (c) { return "<td>" + cell(x.r[c]) + "</td>"; }).join("") + (has ? '<td><span class="tag">Notes</span></td>' : "<td></td>") + "</tr>" +
          (st.open === x.i ? '<tr><td colspan="' + (cols.length + 1) + '"><div class="nmd" style="padding:8px 4px 14px">' + md(x.r._page) + "</div></td></tr>" : "");
      }).join("");
      $("#nt-body", page).innerHTML = '<div class="note" style="font-size:12px;margin:0 0 8px">' + rows.length + " of " + t.rows.length + " rows</div>" +
        '<section class="card scroll-x" style="max-height:70vh;overflow:auto"><table class="ntab"><thead><tr>' +
        cols.map(function (c) { return '<th data-c="' + esc(c) + '">' + esc(c) + (st.sort === c ? (st.dir > 0 ? " ▲" : " ▼") : "") + "</th>"; }).join("") + "<th></th></tr></thead><tbody>" + body + "</tbody></table></section>";
      $$("th[data-c]", page).forEach(function (th) { th.onclick = function () { var c = th.getAttribute("data-c"); if (st.sort === c) st.dir = -st.dir; else { st.sort = c; st.dir = 1; } draw(); }; });
      $$("tr.open-row", page).forEach(function (tr) { tr.onclick = function (e) { if (e.target.tagName === "IMG" || e.target.tagName === "A") return; var i = +tr.getAttribute("data-i"); st.open = st.open === i ? null : i; draw(); }; });
      zoomHandlers($("#nt-body", page));
    }
    page.innerHTML = STYLE + '<div style="display:flex;flex-direction:column;gap:18px">' + crumb(t.title) + head(t.title, "", t.rows.length + " rows from Notion") + stats(t) +
      '<input class="input" id="nt-q" placeholder="Search this table" value="' + esc(st.q) + '"><div id="nt-body"></div></div>';
    $("#nt-q", page).oninput = function (e) { st.q = e.target.value; draw(); };
    draw();
  }

  function viewPage(page, p) {
    var props = p.props && Object.keys(p.props).length ? '<section class="card pad" style="display:grid;grid-template-columns:max-content 1fr;gap:6px 18px;font-size:14px">' +
      Object.keys(p.props).map(function (k) { return '<span class="muted">' + esc(k) + "</span><span>" + esc(p.props[k]) + "</span>"; }).join("") + "</section>" : "";
    page.innerHTML = STYLE + '<div style="display:flex;flex-direction:column;gap:18px">' + crumb(p.title) + head(p.title) + props +
      '<section class="card pad"><div class="nmd" id="np-md">' + (p.md ? md(p.md) : '<span class="muted">This page is empty in Notion.</span>') + "</div></section></div>";
    zoomHandlers(page);
  }

  function viewHome(page) {
    var root = N.meta && N.pages[N.meta.root];
    var looseT = Object.keys(N.tables).map(function (k) { return N.tables[k]; }).filter(function (t) { return t.loose; }).sort(function (a, b) { return a.title.localeCompare(b.title); });
    var looseP = Object.keys(N.pages).map(function (k) { return N.pages[k]; }).filter(function (p) { return p.loose; }).sort(function (a, b) { return a.title.localeCompare(b.title); });
    function list(items, kind) {
      return '<div class="nlist">' + items.map(function (x) { return '<a href="#/notion/' + kind + "/" + esc(x.nid) + '"><span>' + esc(x.title || "Untitled") + '</span><span class="muted">' + (kind === "t" ? x.rows.length + " rows" : "") + "</span></a>"; }).join("") + "</div>";
    }
    var when = N.meta && N.meta.importedAt ? new Date(N.meta.importedAt).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "";
    page.innerHTML = STYLE + '<div style="display:flex;flex-direction:column;gap:18px">' +
      head("My", "Notion", "Your whole Notion journal, saved to your login only. Imported " + esc(when) + ".") +
      (root ? '<section class="card pad"><div class="nmd">' + md(root.md) + "</div></section>" : "") +
      '<details class="card pad"><summary style="cursor:pointer;font-weight:700">Other tables (' + looseT.length + ")</summary>" + list(looseT, "t") + "</details>" +
      '<details class="card pad"><summary style="cursor:pointer;font-weight:700">Other pages (' + looseP.length + ")</summary>" + list(looseP, "p") + "</details>" +
      '<div><a class="btn btn-ghost" href="#/notion/import">Import again</a></div></div>';
    zoomHandlers(page);
  }

  // ---------- import ----------
  function viewImport(page, again) {
    page.innerHTML = STYLE + '<div style="display:flex;flex-direction:column;gap:18px;max-width:720px">' + (again ? crumb("Import") : "") +
      head("Import", "Notion", "Pick the SDX_Notion_Import.zip file. Your pages, tables and screenshots are saved to your login only. Nobody else's account can read them.") +
      '<section class="card pad" style="display:flex;flex-direction:column;gap:14px">' +
      '<input type="file" id="ni-file" accept=".zip" class="input" style="padding-top:12px">' +
      (again ? '<div class="note" style="font-size:13px">Importing again replaces what\'s in My Notion now.</div>' : "") +
      '<button class="btn btn-metal" id="ni-go">Import</button><div class="note" id="ni-msg"></div></section></div>';
    $("#ni-go", page).onclick = function () { run(page); };
  }

  async function run(page) {
    var f = $("#ni-file", page).files[0], msg = $("#ni-msg", page), go = $("#ni-go", page);
    if (!f) { msg.textContent = "Pick the zip file first."; return; }
    go.disabled = true;
    function say(t) { msg.textContent = t; }
    try {
      say("Opening the file…");
      await lib("zip");
      var z = await window.JSZip.loadAsync(f);
      var jf = z.file("notion.json"); if (!jf) throw new Error("This isn't the SDX Notion import file.");
      var B = JSON.parse(await jf.async("string"));
      var keys = B.assets || [], urls = {}, done = 0;
      var base = uid() + "/notion/";
      async function up(k) {
        var file = z.file("assets/" + k); if (!file) return;
        var blob = await file.async("blob");
        var ext = k.split(".").pop().toLowerCase(), type = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : "image/" + ext;
        var r = await sb().storage.from("journal").upload(base + k, blob, { upsert: true, contentType: type });
        if (r.error && !/exists/i.test(r.error.message || "")) throw r.error;
        urls[k] = sb().storage.from("journal").getPublicUrl(base + k).data.publicUrl;
        done++; say("Uploading screenshots… " + done + " of " + keys.length);
      }
      for (var i = 0; i < keys.length; i += 5) await Promise.all(keys.slice(i, i + 5).map(up));
      function fix(s) { return typeof s === "string" ? s.replace(/asset:([0-9a-f]{16}\.[a-z]+)/g, function (m, k) { return urls[k] || m; }) : s; }

      var items = [{ type: "meta", root: B.root, importedAt: new Date().toISOString(), pages: Object.keys(B.pages).length, tables: Object.keys(B.tables).length }];
      Object.keys(B.pages).forEach(function (k) { var p = B.pages[k]; items.push({ type: "page", nid: k, title: p.title, props: p.props || {}, md: fix(p.md), loose: !!p.loose }); });
      Object.keys(B.tables).forEach(function (k) {
        var t = B.tables[k];
        var rows = t.rows.map(function (r) { var o = {}; Object.keys(r).forEach(function (c) { o[c] = fix(r[c]); }); return o; });
        items.push({ type: "table", nid: k, title: t.title, cols: t.cols, rows: rows, loose: !!t.loose });
      });

      say("Clearing the old copy…");
      var del = await sb().from("journal_items").delete().eq("kind", "notion");
      if (del.error) throw del.error;
      for (var j = 0; j < items.length; j += 25) {
        var batch = items.slice(j, j + 25).map(function (d, n) { return { user_id: uid(), kind: "notion", data: d, sort: j + n }; });
        var ins = await sb().from("journal_items").insert(batch);
        if (ins.error) throw ins.error;
        say("Saving pages and tables… " + Math.min(j + 25, items.length) + " of " + items.length);
      }
      N = null;
      say("Done.");
      if (location.hash === "#/notion") P.notion(page, []); else location.hash = "#/notion";
    } catch (e) {
      go.disabled = false;
      say("Import stopped: " + (e.message || e));
    }
  }

  // ---------- route ----------
  P.notion = async function (page, args) {
    page.innerHTML = '<div class="note">Loading…</div>';
    try { await Promise.all([lib("md"), lib("clean")]); } catch (e) { page.innerHTML = '<section class="card pad note">' + esc(e.message) + "</section>"; return; }
    var err = await load();
    if (err) { page.innerHTML = '<section class="card pad note">Couldn\'t load My Notion: ' + esc(err.message || err) + "</section>"; return; }
    var a = args || [];
    var empty = !N.meta;
    if (a[0] === "import" || empty) return viewImport(page, !empty);
    if (a[0] === "p" && N.pages[a[1]]) return viewPage(page, N.pages[a[1]]);
    if (a[0] === "t" && N.tables[a[1]]) return viewTable(page, N.tables[a[1]]);
    viewHome(page);
  };
})();
