/* SDX Members Dashboard: the Elite journal (mirrors Sam's Notion "My journal") */
(function () {
  "use strict";
  var P = window.SDX_PAGES;
  var ORIG = P.journal; // keeps Trade Journal and Entry Model Data from pages.js
  function X() { return window.SDX; }
  function esc(s) { return X().esc(s); }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function head(eyebrow, a, b, sub) {
    return '<div style="display:flex;flex-direction:column;gap:8px"><div class="eyebrow">' + eyebrow + '</div><h1 class="title">' + esc(a) + (b ? ' <span class="metal-text">' + esc(b) + "</span>" : "") + "</h1>" + (sub ? '<div class="note">' + esc(sub) + "</div>" : "") + "</div>";
  }
  function crumb(name) { return '<div class="note" style="font-size:13px;margin-bottom:-10px"><a href="#/journal" class="muted">Journal</a> / <span style="color:#e6e8eb">' + esc(name) + "</span></div>"; }
  function tile(k, v, cls) { return '<div class="tile"><span class="k">' + esc(k) + '</span><span class="v ' + (cls || "") + '">' + esc(v) + "</span></div>"; }
  function money(n) { if (n == null || isNaN(n)) return "—"; var v = Math.abs(Math.round(n * 100) / 100); return (n < 0 ? "-$" : "$") + v.toLocaleString("en-US", { maximumFractionDigits: 2 }); }
  function num(x) { return x === "" || x == null || isNaN(parseFloat(x)) ? null : parseFloat(x); }
  function todayUK() { return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(new Date()); }
  function fmtDate(d) { if (!d) return ""; var t = new Date(d.length <= 10 ? d + "T12:00:00" : d); return isNaN(t) ? d : t.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }
  function uid() { return X().state.session.user.id; }
  function sb() { return X().sb; }
  function setupNote(err) { return '<section class="card pad note">The journal isn\'t switched on yet. Run <b>journal-setup.sql</b> in Supabase (SQL editor), then refresh.' + (err ? '<br><span class="muted" style="font-size:11px">' + esc(err.message || err) + "</span>" : "") + "</section>"; }

  // Links Sam controls. Add funded discount links here: [name, short note, link].
  var FUNDED_DISCOUNTS = [];
  var ESSENTIALS = [
    ["Lot Sizing", "Work out your lot size", "#/lots"],
    ["Calendar", "News for the week", "#/calendar"],
    ["Brokers", "Our partner brokers", "#/brokers"],
    ["TradingView", "Charts", "https://www.tradingview.com/"]
  ];

  // ======================= DATA =======================
  var D = { items: null, trades: null };
  async function load(force) {
    if (D.items && !force) return null;
    var r = await sb().from("journal_items").select("*").order("sort", { ascending: true }).order("created_at", { ascending: true });
    if (r.error) return r.error;
    D.items = r.data || [];
    await seed();
    return null;
  }
  function of(kind) { return (D.items || []).filter(function (i) { return i.kind === kind; }); }
  function byId(id) { return (D.items || []).filter(function (i) { return i.id === id; })[0]; }
  function docBy(slug) { return (D.items || []).filter(function (i) { return i.kind === "doc" && i.data.slug === slug; })[0]; }
  async function add(kind, data, sort) {
    var r = await sb().from("journal_items").insert({ user_id: uid(), kind: kind, data: data, sort: sort || Date.now() / 1e6 }).select().single();
    if (r.error) throw r.error;
    D.items.push(r.data); return r.data;
  }
  async function save(item) {
    var r = await sb().from("journal_items").update({ data: item.data, updated_at: new Date().toISOString() }).eq("id", item.id);
    if (r.error) throw r.error;
  }
  async function remove(item) {
    var r = await sb().from("journal_items").delete().eq("id", item.id);
    if (r.error) throw r.error;
    D.items = D.items.filter(function (i) { return i.id !== item.id; });
  }
  async function loadTrades() {
    var r = await sb().from("journal_trades").select("*");
    D.trades = r.error ? [] : (r.data || []);
  }
  async function upload(file) {
    var path = uid() + "/" + Date.now() + "-" + file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    var r = await sb().storage.from("journal").upload(path, file, { upsert: false });
    if (r.error) throw r.error;
    return sb().storage.from("journal").getPublicUrl(path).data.publicUrl;
  }

  window.SDX_UPLOAD = upload;

  // ---------- starting content (from Sam's Notion journal) ----------
  function chk(name, list) { return { type: "check", name: name, items: list.map(function (t) { return { t: t, d: false }; }) }; }
  function txt(name, text) { return { type: "text", name: name, text: text }; }
  function pics(name) { return { type: "images", name: name, urls: [] }; }
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function planBlocks() { return [chk("HTF POI selection", []), chk("LTF execution", []), chk("Trade management", []), chk("Risk management", []), txt("Mapping", ""), pics("Entry models"), pics("High probability examples")]; }
  function setupBlocks() { return [{ type: "list", name: "Strategy criteria", items: [] }, pics("Diagram"), pics("Trade examples")]; }
  function goalsDoc() {
    var b = [chk("Annual goals", [])];
    ["Q1", "Q2", "Q3", "Q4"].forEach(function (q) { b.push(chk("By end of " + q, [])); });
    MONTHS.forEach(function (m) { b.push(chk("By end of " + m, [])); });
    return b;
  }
  // Empty templates only. Students fill everything in themselves.
  var SEED = [
    ["plan", { title: "Entry Model 1 Plan", blocks: planBlocks() }],
    ["plan", { title: "Entry Model 2 Plan", blocks: planBlocks() }],
    ["plan", { title: "Entry Model 3 Plan", blocks: planBlocks() }],
    ["setup", { title: "Setup 1", blocks: setupBlocks() }],
    ["setup", { title: "Setup 2", blocks: setupBlocks() }],
    ["doc", { slug: "checklist", title: "Check list", cols: 3, blocks: [chk("Entries", []), chk("Analysis", []), chk("Emotions", []), chk("Taking profits", []), chk("Drawdown", [])] }],
    ["doc", { slug: "risk", title: "Risk Management Plan", cols: 2, blocks: [chk("Live funded accounts", []), chk("Eval accounts", []), chk("Trade management", []), chk("Risk management", [])] }],
    ["doc", { slug: "course", title: "Course Notes", blocks: [txt("Notes", "")] }],
    ["doc", { slug: "broker", title: "Broker", blocks: [txt("My broker", ""), { type: "links", name: "Links", items: [] }] }],
    ["doc", { slug: "habits", title: "Habit Tracker", cols: 3, blocks: [chk("Morning routine", []), chk("Night routine", []), chk("Goals", [])] }],
    ["doc", { slug: "goals", title: "Goals Annually", cols: 4, blocks: goalsDoc() }],
    ["doc", { slug: "goalsyear", title: "Goals " + new Date().getFullYear(), blocks: [chk("Trading goals", []), chk("Personal goals", []), txt("Why these matter", "")] }],
    ["doc", { slug: "pairs", title: "Currency Pairs", cols: 3, blocks: [chk("Forex", []), chk("Indices", []), chk("Metals", [])] }],
    ["doc", { slug: "gym", title: "Gym Plan", blocks: [chk("Monday", []), chk("Tuesday", []), chk("Wednesday", []), chk("Thursday", []), chk("Friday", []), chk("Weekend", [])] }],
    ["doc", { slug: "cardio", title: "Cardio Plan", blocks: [chk("This week", []), txt("Notes", "")] }],
    ["doc", { slug: "meals", title: "Meal Planner", blocks: [txt("Breakfast", ""), txt("Lunch", ""), txt("Dinner", ""), txt("Snacks", "")] }]
  ];
  async function seed() {
    var meta = of("meta")[0];
    var done = (meta && meta.data.seeded) || [];
    if (done.indexOf("v1") > -1) return;
    for (var i = 0; i < SEED.length; i++) await add(SEED[i][0], JSON.parse(JSON.stringify(SEED[i][1])), i + 1);
    if (meta) { meta.data.seeded = done.concat(["v1"]); await save(meta); }
    else await add("meta", { seeded: ["v1"] }, 0);
  }

  // ======================= HUB =======================
  var TABLE_LINKS = {
    scaling: "Scaling Roadmap", presession: "Pre Session TA", mech: "Mech Model", futures: "Futures Journal", progress: "Account Progress", live: "Live Trades", books: "Books"
  };
  function L(name, href) { return [name, href]; }
  function hubSections() {
    var plans = of("plan").map(function (p) { return L(p.data.title || "Untitled plan", "#/journal/d/" + p.id); });
    var d = function (slug, fallback) { var x = docBy(slug); return L(x ? x.data.title : fallback, x ? "#/journal/d/" + x.id : "javascript:void(0)"); };
    var mine = function (sec) { return of("page").filter(function (x) { return x.data.section === sec; }).map(function (x) { return L(x.data.title || "Untitled", "#/journal/d/" + x.id); }).concat([L("+ Add page", "#/journal/newpage/" + encodeURIComponent(sec))]); };
    var out = [
      ["PLANNING", plans.concat([L("+ New plan", "#/journal/newplan"), L("Setups", "#/journal/setups"), d("checklist", "Check list"), d("risk", "Risk Management Plan"), L("Scaling Roadmap", "#/journal/t/scaling")])],
      ["DATA", [L("Entry Model Data", "#/journal/data"), L("Pre Session TA", "#/journal/t/presession"), L("Mech Model", "#/journal/t/mech"), L("Futures Journal", "#/journal/t/futures"), L("Funded Accounts", "#/journal/funded")]],
      ["JOURNAL", [L("AI Review", "#/journal/ai"), L("Signal Journal", "#/tracker/mine"), L("Trade Journal", "#/journal/trades"), L("Account Progress", "#/journal/t/progress"), L("Live Trades", "#/journal/t/live")]],
      ["TRADING TOOLS", [d("course", "Course Notes"), L("Books", "#/journal/t/books"), d("broker", "Broker"), d("habits", "Habit Tracker")]],
      ["GOALS", [d("goals", "Goals Annually"), d("goalsyear", "Goals"), L("Monthly Reviews", "#/journal/reviews/monthly"), L("Weekly Reviews", "#/journal/reviews/weekly")]],
      ["TRADING", [d("pairs", "Currency Pairs"), L("Pips", "#/journal/pips"), L("Drawdown Recovery Rate", "#/journal/drawdown")]],
      ["HEALTH & FITNESS", [d("gym", "Gym Plan"), d("cardio", "Cardio Plan"), d("meals", "Meal Planner")]],
      ["TRADING ESSENTIALS", ESSENTIALS.map(function (e) { return [e[0], e[2], /^https?:/.test(e[2])]; })],
      ["FUNDED DISCOUNTS", FUNDED_DISCOUNTS.length ? FUNDED_DISCOUNTS.map(function (e) { return [e[0], e[2], true]; }) : [["Coming soon", "javascript:void(0)"]]]
    ];
    out.forEach(function (sec, i) { if (i < 7) sec[1] = sec[1].concat(i === 0 ? mine(sec[0]).filter(function (x) { return x[0] !== "+ Add page"; }) : mine(sec[0])); });
    return out;
  }
  function sectionCard(sec) {
    return '<section class="card" style="padding:18px 16px 10px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><span class="eyebrow">' + sec[0] + '</span><span class="muted" style="font-size:10px">' + (sec[1].length < 10 ? "0" : "") + sec[1].length + "</span></div>" +
      sec[1].map(function (it) {
        var ext = it[2], dead = it[1] === "javascript:void(0)";
        return '<a class="list-link" href="' + esc(it[1]) + '"' + (ext ? ' target="_blank" rel="noopener"' : "") + '><span>' + esc(it[0]) + '</span><span class="mini">' + (dead ? "SOON" : ext ? "LINK" : /^\+ /.test(it[0]) ? "NEW" : "OPEN") + "</span></a>";
      }).join("") + "</section>";
  }
  function monthStats() {
    var m = todayUK().slice(0, 7);
    var T = (D.trades || []).filter(function (t) { return (t.trade_date || "").slice(0, 7) === m; });
    var wins = T.filter(function (t) { return t.result === "Win"; }).length, tot = T.reduce(function (a, t) { return a + (Number(t.r) || 0); }, 0);
    return { n: T.length, wr: T.length ? Math.round(wins / T.length * 100) : 0, r: tot };
  }
  async function hub(page) {
    page.innerHTML = '<section class="hero" style="min-height:160px"><div class="eyebrow">MEMBERS JOURNAL</div><h1>Your journal.</h1></section><div class="note">Loading…</div>';
    var err = await load(); await loadTrades();
    if (err) { page.innerHTML = '<section class="hero" style="min-height:160px"><div class="eyebrow">MEMBERS JOURNAL</div><h1>Your journal.</h1></section>' + setupNote(err); return; }
    var s = monthStats(), secs = hubSections();
    var gallery = of("shot").slice().reverse();
    page.innerHTML = '<section class="hero" style="min-height:160px"><div class="eyebrow">MEMBERS JOURNAL</div><h1>Your journal.</h1></section>' +
      '<div class="tiles" style="padding:6px 0;border-bottom:1px solid #18181a">' + tile("Trades this month", s.n) + tile("Win rate", s.wr + "%") + tile("Total R", (s.r > 0 ? "+" : "") + s.r.toFixed(1) + "R", s.r > 0 ? "pos" : s.r < 0 ? "neg" : "") + tile("Plans", of("plan").length) + "</div>" +
      '<a href="#/journal/ai" class="card pad" style="display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap;color:#f4f4f5"><div><div class="eyebrow">AI REVIEW</div><div style="font:600 20px var(--sg);margin-top:6px">Get the AI coach to review all your data.</div><div class="note" style="font-size:13px">Your setups, pairs, sessions, days, confluences, funded accounts, plans and reviews.</div></div><span class="btn btn-metal">Review my data</span></a>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:16px">' + secs.slice(0, 5).map(sectionCard).join("") + "</div>" +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:16px">' + secs.slice(5).map(sectionCard).join("") + "</div>" +
      '<div style="display:flex;justify-content:space-between;align-items:flex-end;gap:12px;flex-wrap:wrap">' + head("TRADES", "Trade", "gallery.", "Screenshots of your trades.") + '<label class="btn btn-metal" style="cursor:pointer">Add screenshot<input type="file" accept="image/*" id="shotIn" multiple hidden></label></div>' +
      '<span class="muted" id="shotMsg" style="font-size:12px"></span>' +
      (gallery.length ? '<div class="grid-cards">' + gallery.map(function (g) {
        return '<section class="card" style="display:flex;flex-direction:column"><a href="' + esc(g.data.url) + '" target="_blank" rel="noopener"><img src="' + esc(g.data.url) + '" alt="" style="width:100%;aspect-ratio:16/9;object-fit:cover;display:block;border-bottom:1px solid #1a1a1c"></a><div style="padding:12px 14px;display:flex;justify-content:space-between;align-items:center;gap:10px"><input class="input" data-cap="' + g.id + '" value="' + esc(g.data.name || "") + '" placeholder="Name this trade" style="height:38px;font-size:13px"><button class="x" data-delshot="' + g.id + '" style="width:38px;height:38px;flex:none" aria-label="Delete">×</button></div></section>';
      }).join("") + "</div>" : '<section class="card pad note" style="text-align:center">No screenshots yet. Add your first trade.</section>');
    $("#shotIn", page).onchange = async function (e) {
      var files = Array.prototype.slice.call(e.target.files || []); if (!files.length) return;
      $("#shotMsg", page).textContent = "Uploading…";
      try { for (var i = 0; i < files.length; i++) { var u = await upload(files[i]); await add("shot", { url: u, name: files[i].name.replace(/\.[^.]+$/, ""), date: todayUK() }); } hub(page); }
      catch (er) { $("#shotMsg", page).textContent = "Couldn't upload: " + (er.message || er); }
    };
    $$("[data-cap]", page).forEach(function (inp) { inp.onchange = async function () { var it = byId(inp.dataset.cap); it.data.name = inp.value; await save(it); }; });
    $$("[data-delshot]", page).forEach(function (b) { b.onclick = async function () { if (!confirm("Delete this screenshot?")) return; await remove(byId(b.dataset.delshot)); hub(page); }; });
  }

  // ======================= DOC PAGES (plans, setups, checklists, notes) =======================
  var ED = {}; // editing state by id
  function imgGrid(urls, id, bi, editing) {
    if (!urls.length && !editing) return '<div class="note" style="font-size:12px">No images yet.</div>';
    return '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px">' + urls.map(function (u, k) {
      return '<div style="position:relative"><a href="' + esc(u) + '" target="_blank" rel="noopener"><img src="' + esc(u) + '" alt="" style="width:100%;aspect-ratio:16/10;object-fit:cover;border-radius:10px;box-shadow:inset 0 0 0 1px #222326;display:block"></a>' +
        (editing ? '<button class="x" data-delimg="' + bi + ":" + k + '" style="position:absolute;top:6px;right:6px;width:32px;height:32px;background:#0a0a0acc" aria-label="Remove">×</button>' : "") + "</div>";
    }).join("") + "</div>";
  }
  function viewBlock(b, bi) {
    var h = '<div class="eyebrow" style="margin-bottom:10px;text-transform:uppercase">' + esc(b.name || "") + "</div>";
    if (b.type === "check") {
      var done = b.items.filter(function (x) { return x.d; }).length;
      h = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><span class="eyebrow" style="text-transform:uppercase">' + esc(b.name || "") + '</span>' + (b.items.length ? '<span class="mini">' + done + "/" + b.items.length + "</span>" : "") + "</div>";
      return h + (b.items.length ? b.items.map(function (it, k) {
        return '<label style="display:flex;gap:12px;align-items:center;min-height:40px;cursor:pointer;font-size:14px;' + (it.d ? "color:#6b7078;text-decoration:line-through" : "color:#e6e8eb") + '"><input type="checkbox" data-tick="' + bi + ":" + k + '"' + (it.d ? " checked" : "") + ' style="width:18px;height:18px;accent-color:#c9ccd1;flex:none">' + esc(it.t) + "</label>";
      }).join("") : '<div class="note" style="font-size:12px">Nothing here yet. Tap Edit to add.</div>');
    }
    if (b.type === "list") return h + (b.items.length ? '<ol style="margin:0;padding-left:20px;display:flex;flex-direction:column;gap:8px;font-size:14px;color:#e6e8eb">' + b.items.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ol>" : '<div class="note" style="font-size:12px">Nothing here yet. Tap Edit to add.</div>');
    if (b.type === "text") return '<details' + (b.text && b.text.length < 400 ? " open" : "") + '><summary class="eyebrow" style="cursor:pointer;margin-bottom:10px;text-transform:uppercase">' + esc(b.name || "") + '</summary><div style="white-space:pre-wrap;font-size:14px;line-height:1.7;color:#d6d8dc">' + (b.text ? esc(b.text) : '<span class="note">Nothing here yet. Tap Edit to add.</span>') + "</div></details>";
    if (b.type === "images") return h + imgGrid(b.urls, null, bi, false);
    if (b.type === "links") return h + (b.items.length ? b.items.map(function (l) { var ext = /^https?:/.test(l.u); return '<a class="list-link" href="' + esc(l.u) + '"' + (ext ? ' target="_blank" rel="noopener"' : "") + "><span>" + esc(l.t) + '</span><span class="mini">OPEN</span></a>'; }).join("") : '<div class="note" style="font-size:12px">No links yet.</div>');
    return "";
  }
  function editBlock(b, bi, n) {
    var top = '<div style="display:flex;gap:8px;align-items:center"><input class="input" data-bname="' + bi + '" value="' + esc(b.name || "") + '" placeholder="Section name" style="height:42px;font-weight:600">' +
      '<button class="x" data-up="' + bi + '" style="width:40px;height:40px;flex:none"' + (bi === 0 ? " disabled" : "") + ' aria-label="Move up">↑</button><button class="x" data-down="' + bi + '" style="width:40px;height:40px;flex:none"' + (bi === n - 1 ? " disabled" : "") + ' aria-label="Move down">↓</button><button class="x" data-delb="' + bi + '" style="width:40px;height:40px;flex:none" aria-label="Delete section">×</button></div>';
    var body = "";
    if (b.type === "check" || b.type === "list") body = '<label class="field">' + (b.type === "check" ? "Tick boxes" : "Numbered list") + ', one per line<textarea class="input" data-blines="' + bi + '" rows="' + Math.max(4, b.items.length + 1) + '" style="height:auto;padding:12px;line-height:1.6">' + esc(b.items.map(function (x) { return b.type === "check" ? x.t : x; }).join("\n")) + "</textarea></label>";
    if (b.type === "text") body = '<textarea class="input" data-btext="' + bi + '" rows="8" style="height:auto;padding:12px;line-height:1.6">' + esc(b.text || "") + "</textarea>";
    if (b.type === "images") body = imgGrid(b.urls, null, bi, true) + '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><label class="btn btn-ghost" style="cursor:pointer;height:40px">Upload images<input type="file" accept="image/*" multiple data-bup="' + bi + '" hidden></label><input class="input" data-burl="' + bi + '" placeholder="or paste an image link" style="height:40px;flex:1;min-width:180px"><button class="btn btn-ghost" data-baddurl="' + bi + '" style="height:40px">Add</button></div>';
    if (b.type === "links") body = '<label class="field">One per line: Name | link<textarea class="input" data-blinks="' + bi + '" rows="4" style="height:auto;padding:12px;line-height:1.6">' + esc(b.items.map(function (l) { return l.t + " | " + l.u; }).join("\n")) + "</textarea></label>";
    return '<section class="card pad" style="display:flex;flex-direction:column;gap:12px">' + top + body + "</section>";
  }
  function readEdits(page, item) {
    item.data.title = $("#dTitle", page).value.trim() || item.data.title;
    item.data.blocks.forEach(function (b, bi) {
      var nm = $('[data-bname="' + bi + '"]', page); if (nm) b.name = nm.value;
      var ln = $('[data-blines="' + bi + '"]', page);
      if (ln) {
        var lines = ln.value.split("\n").map(function (s) { return s.trim(); }).filter(Boolean);
        if (b.type === "check") { var old = {}; b.items.forEach(function (x) { old[x.t] = x.d; }); b.items = lines.map(function (t) { return { t: t, d: !!old[t] }; }); }
        else b.items = lines;
      }
      var tx = $('[data-btext="' + bi + '"]', page); if (tx) b.text = tx.value;
      var lk = $('[data-blinks="' + bi + '"]', page);
      if (lk) b.items = lk.value.split("\n").map(function (s) { var p = s.split("|"); return { t: (p[0] || "").trim(), u: (p.slice(1).join("|") || "").trim() }; }).filter(function (l) { return l.t && l.u; });
    });
  }
  async function docPage(page, id) {
    var err = await load(); if (err) { page.innerHTML = setupNote(err); return; }
    var item = byId(id); if (!item) { location.hash = "#/journal"; return; }
    drawDoc(page, item);
  }
  function drawDoc(page, item) {
    var ed = !!ED[item.id], d = item.data, blocks = d.blocks || (d.blocks = []);
    var anyCheck = blocks.some(function (b) { return b.type === "check" && b.items.some(function (x) { return x.d; }); });
    var cols = d.cols || 1;
    var html = crumb(d.title) + '<div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-end;gap:14px">' +
      (ed ? '<input class="input" id="dTitle" value="' + esc(d.title) + '" style="max-width:520px;height:56px;font:600 26px var(--sg)">' : head(item.kind === "plan" || /^(checklist|risk)$/.test(d.slug || "") ? "PLANNING" : item.kind === "setup" ? "SETUPS" : ({ course: "TRADING TOOLS", broker: "TRADING TOOLS", habits: "TRADING TOOLS", goals: "GOALS", goalsyear: "GOALS", pairs: "TRADING", gym: "HEALTH & FITNESS", cardio: "HEALTH & FITNESS", meals: "HEALTH & FITNESS" })[d.slug] || (item.kind === "page" ? d.section : "JOURNAL"), d.title)) +
      '<div style="display:flex;gap:10px;flex-wrap:wrap">' + (ed ? '<button class="btn btn-ghost" id="dCancel">Cancel</button><button class="btn btn-metal" id="dSave">Save</button>' : (anyCheck ? '<button class="btn btn-ghost" id="dClear">Clear ticks</button>' : "") + '<button class="btn btn-metal" id="dEdit">Edit</button>') + "</div></div>";
    if (ed) {
      html += blocks.map(function (b, bi) { return editBlock(b, bi, blocks.length); }).join("") +
        '<section class="card pad" style="display:flex;flex-direction:column;gap:12px"><span class="eyebrow">ADD A SECTION</span><div class="chips"><button class="chip" data-addb="check">Tick boxes</button><button class="chip" data-addb="list">Numbered list</button><button class="chip" data-addb="text">Notes</button><button class="chip" data-addb="images">Images</button><button class="chip" data-addb="links">Links</button></div></section>' +
        '<div><button class="btn btn-ghost" id="dDel" style="color:#ff8a8a;border-color:#3a1c1c">Delete this page</button></div>' +
        '<span class="muted" id="dMsg" style="font-size:12px"></span>';
    } else {
      html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(' + (cols >= 3 ? 240 : cols === 2 ? 300 : 520) + 'px,1fr));gap:16px;align-items:start">' +
        blocks.map(function (b, bi) { return '<section class="card pad" style="' + (b.type === "images" || b.type === "text" ? "grid-column:1/-1;" : "") + '">' + viewBlock(b, bi) + "</section>"; }).join("") + "</div>" +
        (blocks.length ? "" : '<section class="card pad note">This page is empty. Tap Edit to add sections.</section>');
    }
    page.innerHTML = html;
    var redraw = function () { drawDoc(page, item); };
    if (!ed) {
      var dk = item.kind === "plan" ? "plan" : item.kind === "setup" ? "setup" : item.kind === "page" ? "page" : ({ checklist: "checklist", risk: "risk", goals: "goals", goalsyear: "goals", habits: "habits" })[d.slug] || "other";
      mountAI(page, "doc:" + item.id, d.title, dk, async function () { return d.title + "\n\n" + blocksText(d); }, dk === "plan" || dk === "setup" || dk === "risk" || dk === "checklist");
      $("#dEdit", page).onclick = function () { ED[item.id] = JSON.parse(JSON.stringify(item.data)); redraw(); };
      var cl = $("#dClear", page); if (cl) cl.onclick = async function () { blocks.forEach(function (b) { if (b.type === "check") b.items.forEach(function (x) { x.d = false; }); }); redraw(); await save(item); };
      $$("[data-tick]", page).forEach(function (c) {
        c.onchange = async function () { var p = c.dataset.tick.split(":"); blocks[+p[0]].items[+p[1]].d = c.checked; redraw(); try { await save(item); } catch (e) { alert("Couldn't save: " + e.message); } };
      });
      return;
    }
    $("#dCancel", page).onclick = function () { item.data = ED[item.id]; delete ED[item.id]; redraw(); };
    $("#dSave", page).onclick = async function () {
      readEdits(page, item); $("#dMsg", page).textContent = "Saving…";
      try { await save(item); delete ED[item.id]; redraw(); } catch (e) { $("#dMsg", page).textContent = "Couldn't save: " + e.message; }
    };
    var dl = $("#dDel", page); if (dl) dl.onclick = async function () { if (!confirm("Delete " + item.data.title + "? This can't be undone.")) return; await remove(item); delete ED[item.id]; location.hash = item.kind === "setup" ? "#/journal/setups" : "#/journal"; };
    $$("[data-addb]", page).forEach(function (b) {
      b.onclick = function () {
        readEdits(page, item); var t = b.dataset.addb;
        blocks.push(t === "text" ? txt("Notes", "") : t === "images" ? pics("Images") : t === "links" ? { type: "links", name: "Links", items: [] } : t === "list" ? { type: "list", name: "List", items: [] } : chk("Tick boxes", []));
        redraw();
      };
    });
    $$("[data-delb]", page).forEach(function (b) { b.onclick = function () { readEdits(page, item); blocks.splice(+b.dataset.delb, 1); redraw(); }; });
    $$("[data-up]", page).forEach(function (b) { b.onclick = function () { readEdits(page, item); var i = +b.dataset.up; if (i > 0) { var t = blocks[i - 1]; blocks[i - 1] = blocks[i]; blocks[i] = t; } redraw(); }; });
    $$("[data-down]", page).forEach(function (b) { b.onclick = function () { readEdits(page, item); var i = +b.dataset.down; if (i < blocks.length - 1) { var t = blocks[i + 1]; blocks[i + 1] = blocks[i]; blocks[i] = t; } redraw(); }; });
    $$("[data-delimg]", page).forEach(function (b) { b.onclick = function () { readEdits(page, item); var p = b.dataset.delimg.split(":"); blocks[+p[0]].urls.splice(+p[1], 1); redraw(); }; });
    $$("[data-baddurl]", page).forEach(function (b) { b.onclick = function () { var bi = +b.dataset.baddurl, v = $('[data-burl="' + bi + '"]', page).value.trim(); if (!v) return; readEdits(page, item); blocks[bi].urls.push(v); redraw(); }; });
    $$("[data-bup]", page).forEach(function (inp) {
      inp.onchange = async function () {
        var bi = +inp.dataset.bup, files = Array.prototype.slice.call(inp.files || []); if (!files.length) return;
        readEdits(page, item); $("#dMsg", page).textContent = "Uploading…";
        try { for (var i = 0; i < files.length; i++) blocks[bi].urls.push(await upload(files[i])); redraw(); }
        catch (e) { $("#dMsg", page).textContent = "Couldn't upload: " + (e.message || e); }
      };
    });
  }
  async function newPlan() {
    var err = await load(); if (err) return;
    var it = await add("plan", { title: "New plan", blocks: planBlocks() });
    ED[it.id] = JSON.parse(JSON.stringify(it.data));
    location.replace("#/journal/d/" + it.id);
  }
  async function newPage(sec) {
    var err = await load(); if (err) return;
    var it = await add("page", { section: decodeURIComponent(sec || "JOURNAL"), title: "New page", blocks: [chk("Tick boxes", []), txt("Notes", "")] });
    ED[it.id] = JSON.parse(JSON.stringify(it.data));
    location.replace("#/journal/d/" + it.id);
  }
  async function setupsPage(page) {
    var err = await load(); if (err) { page.innerHTML = setupNote(err); return; }
    var S = of("setup");
    page.innerHTML = crumb("Setups") + '<div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-end;gap:14px">' + head("PLANNING", "Setups") + '<button class="btn btn-metal" id="newS">New setup</button></div>' +
      '<div class="grid-cards">' + S.map(function (s, i) {
        var first = (s.data.blocks || []).filter(function (b) { return b.type === "images" && b.urls.length; })[0];
        var crit = (s.data.blocks || []).filter(function (b) { return b.type === "list"; })[0];
        return '<a class="card" href="#/journal/d/' + s.id + '" style="display:flex;flex-direction:column;color:#f4f4f5"><div class="vid"' + (first ? ' style="background:url(\'' + esc(first.urls[0]) + '\') center/cover"' : "") + '><span class="eyebrow" style="position:absolute;top:12px;left:14px">' + (i + 1 < 10 ? "0" : "") + (i + 1) + "</span>" + (first ? "" : '<span style="font:700 34px var(--sg)" class="metal-text">' + esc((s.data.title || "?").slice(0, 2).toUpperCase()) + "</span>") + "</div>" +
          '<div style="padding:16px 18px;display:flex;flex-direction:column;gap:6px"><span style="font-family:var(--sg);font-size:17px;font-weight:600">' + esc(s.data.title) + '</span><span class="note" style="font-size:13px">' + (crit && crit.items.length ? crit.items.length + " rules" : "No rules yet") + "</span></div></a>";
      }).join("") + "</div>" + (S.length ? "" : '<section class="card pad note">No setups yet.</section>');
    mountAI(page, "setups", "All my setups", "setup", async function () { return S.map(function (x) { return x.data.title + "\n" + blocksText(x.data); }).join("\n\n") || "(no setups)"; }, true);
    $("#newS", page).onclick = async function () {
      var it = await add("setup", { title: "New setup", blocks: setupBlocks() });
      ED[it.id] = JSON.parse(JSON.stringify(it.data)); location.hash = "#/journal/d/" + it.id;
    };
  }

  // ======================= TABLE PAGES =======================
  function sessionOf(dt) { if (!dt || dt.length < 16) return ""; var h = +dt.slice(11, 13); return h < 7 ? "Asia" : h < 12 ? "London" : h < 21 ? "New York" : "Asia"; }
  function status(r) { return r == null ? "" : r > 0 ? "Win" : r < 0 ? "Loss" : "Breakeven"; }
  function pill(s) { return s ? '<span class="pill ' + (s === "Win" ? "win" : s === "Loss" ? "loss" : "be") + '">' + esc(s) + "</span>" : ""; }
  function rStats(rows, key) {
    var R = rows.map(function (x) { return num(x.data[key]); }).filter(function (v) { return v != null; });
    var w = R.filter(function (v) { return v > 0; }).length, tot = R.reduce(function (a, v) { return a + v; }, 0);
    return [["Trades", rows.length], ["Win rate", R.length ? Math.round(w / R.length * 100) + "%" : "0%"], ["Total R", (tot > 0 ? "+" : "") + tot.toFixed(1) + "R", tot > 0 ? "pos" : tot < 0 ? "neg" : ""], ["Average R", R.length ? (tot / R.length).toFixed(2) + "R" : "0R"]];
  }
  var TABLES = {
    scaling: {
      title: "Scaling Roadmap", eyebrow: "PLANNING", sub: "Every account you're working on, from evaluation to live.", view: "board", boardBy: "status", boardCols: ["Not Started", "In Progress", "Completed"],
      fields: [["name", "Account", "text"], ["type", "Type", ["Evaluation", "Live Account"]], ["target", "Profit target (%)", "number"], ["status", "Status", ["Not Started", "In Progress", "Completed"]], ["priority", "Priority", ["P1", "P2", "P3", "P4", "P5"]], ["start", "Start", "date"], ["end", "End", "date"], ["notes", "Notes", "textarea"]],
      stats: function (rows) { return [["Accounts", rows.length], ["In progress", rows.filter(function (r) { return r.data.status === "In Progress"; }).length], ["Completed", rows.filter(function (r) { return r.data.status === "Completed"; }).length]]; }
    },
    presession: {
      title: "Pre Session TA", eyebrow: "DATA", sub: "Your analysis before each session, then whether it played out.", view: "cards", sortBy: "date",
      fields: [["date", "Date", "date"], ["pair", "Pair", "suggest"], ["bias", "Bias", ["Bullish", "Bearish", "No bias"]], ["htf", "HTF narrative (Daily / 4H)", "textarea"], ["mtf", "MTF bias (M15)", "textarea"], ["draw", "Draw on liquidity", "text"], ["pois", "POIs", "text"], ["news", "News events", "text"], ["plan", "Plan for the session", "textarea"], ["chart", "Chart", "image"], ["outcome", "Outcome", ["", "Played out", "Didn't play out", "No trade"]], ["review", "Review", "textarea"]],
      card: function (r) { var d = r.data; return '<div style="display:flex;justify-content:space-between;gap:10px;align-items:center"><span style="font:700 20px var(--sg)">' + esc(d.pair || "Analysis") + '</span><span class="tag" style="background:' + (d.bias === "Bullish" ? "rgba(127,217,154,.14);color:#7fd99a" : d.bias === "Bearish" ? "rgba(255,138,138,.14);color:#ff8a8a" : "#1c1c1e;color:#a3a7ae") + '">' + esc(d.bias || "—") + '</span></div><div class="muted" style="font-size:12px">' + fmtDate(d.date) + (d.outcome ? " · " + esc(d.outcome) : "") + "</div>" + (d.chart ? '<img src="' + esc(d.chart) + '" alt="" style="width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:10px">' : "") + (d.plan ? '<div class="note" style="font-size:13px;white-space:pre-wrap">' + esc(d.plan.slice(0, 220)) + "</div>" : ""); },
      stats: function (rows) { var done = rows.filter(function (r) { return r.data.outcome && r.data.outcome !== "No trade"; }), ok = done.filter(function (r) { return r.data.outcome === "Played out"; }).length; return [["Analyses", rows.length], ["Played out", ok], ["Hit rate", done.length ? Math.round(ok / done.length * 100) + "%" : "0%"]]; }
    },
    mech: {
      title: "Mech Model", eyebrow: "DATA", sub: "Month by month results for the Mech Model, per pair.", view: "table", sortBy: "month",
      fields: [["month", "Month", "month"], ["pair", "Pair", "suggest"], ["wins", "Wins", "number"], ["losses", "Losses", "number"], ["r", "Total R", "number"], ["notes", "Notes", "textarea"]],
      cols: [["month", "Month", function (d) { return d.month ? new Date(d.month + "-01T12:00:00").toLocaleDateString("en-GB", { month: "long", year: "numeric" }) : ""; }], ["pair", "Pair"], ["wins", "Wins"], ["losses", "Losses"], ["wr", "Win rate", function (d) { var t = (num(d.wins) || 0) + (num(d.losses) || 0); return t ? Math.round((num(d.wins) || 0) / t * 100) + "%" : ""; }], ["r", "Total R", function (d) { var v = num(d.r); return v == null ? "" : '<b class="' + (v > 0 ? "pos" : v < 0 ? "neg" : "") + '">' + (v > 0 ? "+" : "") + v + "R</b>"; }]],
      extra: function (rows) {
        var by = {}; rows.forEach(function (r) { var p = r.data.pair || "Other", b = by[p] || (by[p] = { w: 0, l: 0, r: 0 }); b.w += num(r.data.wins) || 0; b.l += num(r.data.losses) || 0; b.r += num(r.data.r) || 0; });
        var ks = Object.keys(by); if (!ks.length) return "";
        return '<section class="card"><div style="padding:16px 18px 4px" class="eyebrow">STRATEGY TESTER RESULTS · ALL MONTHS</div><div class="scroll-x"><table style="min-width:' + (120 + ks.length * 90) + 'px"><thead><tr><th></th>' + ks.map(function (k) { return "<th>" + esc(k) + "</th>"; }).join("") + "</tr></thead><tbody>" +
          "<tr><td class=\"muted\">Wins</td>" + ks.map(function (k) { return "<td>" + by[k].w + "</td>"; }).join("") + "</tr><tr><td class=\"muted\">Losses</td>" + ks.map(function (k) { return "<td>" + by[k].l + "</td>"; }).join("") + "</tr><tr><td class=\"muted\">Total R</td>" + ks.map(function (k) { var v = by[k].r; return '<td class="' + (v > 0 ? "pos" : v < 0 ? "neg" : "") + '" style="font-weight:600">' + (v > 0 ? "+" : "") + v + "</td>"; }).join("") + "</tr></tbody></table></div></section>";
      },
      stats: function (rows) { var w = 0, l = 0, r = 0; rows.forEach(function (x) { w += num(x.data.wins) || 0; l += num(x.data.losses) || 0; r += num(x.data.r) || 0; }); return [["Trades", w + l], ["Win rate", w + l ? Math.round(w / (w + l) * 100) + "%" : "0%"], ["Total R", (r > 0 ? "+" : "") + r + "R", r > 0 ? "pos" : r < 0 ? "neg" : ""]]; }
    },
    futures: {
      title: "Futures Journal", eyebrow: "DATA", sub: "Every futures trade with the full breakdown.", view: "table", sortBy: "opened",
      fields: [["no", "Trade #", "text"], ["opened", "Opened", "datetime"], ["closed", "Closed", "datetime"], ["pair", "Market", "suggest"], ["position", "Position", ["LONG", "SHORT"]], ["setup", "Setup", "suggest"], ["confluences", "Confluences", "tags"], ["phase", "MTF phase", "tags"], ["swing", "Swing", "tags"], ["internal", "Internal", "tags"], ["sl", "SL size", "number"], ["r", "R", "number"], ["chart", "Chart", "image"], ["notes", "Notes", "textarea"]],
      cols: [["opened", "Opened", function (d) { return d.opened ? fmtDate(d.opened.slice(0, 10)) + ' <span class="muted">' + d.opened.slice(11, 16) + "</span>" : ""; }], ["day", "Day", function (d) { return d.opened ? new Date(d.opened).toLocaleDateString("en-GB", { weekday: "short" }) : ""; }], ["session", "Session", function (d) { return sessionOf(d.opened); }], ["pair", "Market"], ["position", "Position"], ["setup", "Setup"], ["hours", "Hours open", function (d) { if (!d.opened || !d.closed) return ""; var h = (new Date(d.closed) - new Date(d.opened)) / 36e5; return h >= 0 ? h.toFixed(1) : ""; }], ["status", "Status", function (d) { return pill(status(num(d.r))); }], ["r", "R", function (d) { return d.r != null && d.r !== "" ? "<b>" + d.r + "</b>" : ""; }]],
      stats: function (rows) { return rStats(rows, "r"); }
    },
    progress: {
      title: "Account Progress", eyebrow: "JOURNAL", sub: "Log your balance and watch each account grow.", view: "chart", sortBy: "date", asc: true,
      fields: [["date", "Date", "date"], ["account", "Account", "suggest"], ["type", "Type", ["Live Account", "Evaluation"]], ["balance", "Balance ($)", "number"], ["flow", "Deposit or withdrawal ($)", "number"], ["notes", "Notes", "textarea"]],
      cols: [["date", "Date", function (d) { return fmtDate(d.date); }], ["account", "Account"], ["type", "Type"], ["balance", "Balance", function (d) { return "<b>" + money(num(d.balance)) + "</b>"; }], ["flow", "In / out", function (d) { return d.flow ? money(num(d.flow)) : ""; }], ["notes", "Notes"]]
    },
    live: {
      title: "Live Trades", eyebrow: "JOURNAL", sub: "Trades on your live and funded accounts.", view: "table", sortBy: "date",
      fields: [["date", "Date", "date"], ["account", "Account", "suggest"], ["pair", "Pair", "suggest"], ["side", "Side", ["Long", "Short"]], ["setup", "Setup", "suggest"], ["lots", "Lots", "number"], ["entry", "Entry", "number"], ["sl", "Stop loss", "number"], ["tp", "Take profit", "number"], ["r", "R", "number"], ["pnl", "Profit / loss ($)", "number"], ["chart", "Chart", "image"], ["notes", "Notes", "textarea"]],
      cols: [["date", "Date", function (d) { return fmtDate(d.date); }], ["account", "Account"], ["pair", "Pair"], ["side", "Side"], ["setup", "Setup"], ["lots", "Lots"], ["status", "Result", function (d) { return pill(status(num(d.r) != null ? num(d.r) : num(d.pnl))); }], ["r", "R"], ["pnl", "P&L", function (d) { var v = num(d.pnl); return v == null ? "" : '<b class="' + (v > 0 ? "pos" : v < 0 ? "neg" : "") + '">' + money(v) + "</b>"; }]],
      stats: function (rows) { var s = rStats(rows, "r"), p = rows.reduce(function (a, r) { return a + (num(r.data.pnl) || 0); }, 0); s.push(["Profit", money(p), p > 0 ? "pos" : p < 0 ? "neg" : ""]); return s; }
    },
    books: {
      title: "Books", eyebrow: "TRADING TOOLS", sub: "Books you're reading and what you took from them.", view: "cards", sortBy: "name", asc: true,
      fields: [["name", "Book", "text"], ["author", "Author", "text"], ["category", "Category", "suggest"], ["cover", "Cover", "image"], ["done1", "Date done #1", "date"], ["done2", "Date done #2", "date"], ["notes", "Key takeaways", "textarea"]],
      card: function (r) { var d = r.data; return (d.cover ? '<img src="' + esc(d.cover) + '" alt="" style="width:100%;aspect-ratio:3/2;object-fit:cover;border-radius:10px">' : "") + '<span style="font:600 17px var(--sg)">' + esc(d.name || "Untitled") + '</span><div class="muted" style="font-size:12px">' + esc([d.author, d.category].filter(Boolean).join(" · ")) + '</div><div style="display:flex;gap:8px;flex-wrap:wrap">' + (d.done1 ? '<span class="mini">READ ' + fmtDate(d.done1) + "</span>" : '<span class="mini">NOT READ YET</span>') + (d.done2 ? '<span class="mini">AGAIN ' + fmtDate(d.done2) + "</span>" : "") + "</div>"; },
      stats: function (rows) { return [["Books", rows.length], ["Read", rows.filter(function (r) { return r.data.done1; }).length]]; }
    }
  };
  var TB = { open: null };
  function usedValues(kind, k) {
    var seen = {}, out = [];
    of(kind).forEach(function (r) { var v = r.data[k]; (Array.isArray(v) ? v : [v]).forEach(function (x) { if (x && !seen[x]) { seen[x] = 1; out.push(x); } }); });
    return out.sort();
  }
  function fieldInput(f, v, kind) {
    var k = f[0], label = f[1], t = f[2];
    if (t === "suggest") {
      var opts = kind ? usedValues(kind, k) : [];
      return '<label class="field">' + esc(label) + '<input class="input" data-k="' + k + '" value="' + esc(v || "") + '" list="dl_' + k + '" autocomplete="off"><datalist id="dl_' + k + '">' + opts.map(function (o) { return '<option value="' + esc(o) + '">'; }).join("") + "</datalist></label>";
    }
    if (t === "tags") {
      var on = Array.isArray(v) ? v : [], all = (kind ? usedValues(kind, k) : []);
      on.forEach(function (x) { if (all.indexOf(x) < 0) all.push(x); });
      return '<div class="field wide">' + esc(label) + '<div class="chips" data-multi="' + k + '">' + all.map(function (o) { return '<button type="button" class="chip' + (on.indexOf(o) > -1 ? " on" : "") + '" data-o="' + esc(o) + '">' + esc(o) + "</button>"; }).join("") + '</div><div style="display:flex;gap:8px"><input class="input" data-newtag="' + k + '" placeholder="Add your own" style="height:40px"><button type="button" class="btn btn-ghost" data-addtag="' + k + '" style="height:40px">Add</button></div></div>';
    }
    if (Array.isArray(t) && f[3] === "multi") {
      var on = Array.isArray(v) ? v : [];
      return '<div class="field wide">' + esc(label) + '<div class="chips" data-multi="' + k + '">' + t.map(function (o) { return '<button type="button" class="chip' + (on.indexOf(o) > -1 ? " on" : "") + '" data-o="' + esc(o) + '">' + esc(o) + "</button>"; }).join("") + "</div></div>";
    }
    if (Array.isArray(t)) return '<label class="field">' + esc(label) + '<select class="input" data-k="' + k + '">' + t.map(function (o) { return '<option value="' + esc(o) + '"' + (v === o ? " selected" : "") + ">" + (o ? esc(o) : "Choose") + "</option>"; }).join("") + "</select></label>";
    if (t === "textarea") return '<label class="field wide">' + esc(label) + '<textarea class="input" data-k="' + k + '" rows="3" style="height:auto;padding:12px;line-height:1.6">' + esc(v || "") + "</textarea></label>";
    if (t === "image") return '<div class="field wide">' + esc(label) + (v ? '<img src="' + esc(v) + '" alt="" style="width:100%;max-height:220px;object-fit:cover;border-radius:10px">' : "") + '<div style="display:flex;gap:8px;flex-wrap:wrap"><label class="btn btn-ghost" style="cursor:pointer;height:40px">' + (v ? "Change image" : "Upload image") + '<input type="file" accept="image/*" data-img="' + k + '" hidden></label><input class="input" data-k="' + k + '" value="' + esc(v || "") + '" placeholder="or paste an image link" style="height:40px;flex:1;min-width:160px"></div></div>';
    var type = t === "datetime" ? "datetime-local" : t;
    return '<label class="field">' + esc(label) + '<input class="input" type="' + type + '"' + (t === "number" ? ' step="any"' : "") + ' data-k="' + k + '" value="' + esc(v == null ? "" : v) + '"></label>';
  }
  function sortRows(cfg, rows) {
    var k = cfg.sortBy; if (!k) return rows;
    return rows.slice().sort(function (a, b) { var x = a.data[k] || "", y = b.data[k] || ""; return (x < y ? -1 : x > y ? 1 : 0) * (cfg.asc ? 1 : -1); });
  }
  function chartSvg(rows) {
    var groups = {};
    rows.forEach(function (r) { var b = num(r.data.balance); if (b == null || !r.data.date) return; (groups[r.data.account || "Account"] = groups[r.data.account || "Account"] || []).push([r.data.date, b]); });
    var names = Object.keys(groups); if (!names.length) return "";
    var all = [], dates = [];
    names.forEach(function (n) { groups[n].sort(function (a, b) { return a[0] < b[0] ? -1 : 1; }); groups[n].forEach(function (p) { all.push(p[1]); dates.push(p[0]); }); });
    dates.sort(); var d0 = new Date(dates[0]).getTime(), d1 = new Date(dates[dates.length - 1]).getTime() || d0 + 1;
    var lo = Math.min.apply(null, all), hi = Math.max.apply(null, all); if (hi === lo) { hi += 1; lo -= 1; }
    var W = 760, H = 240, pl = 64, pr = 16, pt = 16, pb = 28;
    var x = function (d) { return pl + (d1 === d0 ? 0.5 : (new Date(d).getTime() - d0) / (d1 - d0)) * (W - pl - pr); }, y = function (v) { return pt + (1 - (v - lo) / (hi - lo)) * (H - pt - pb); };
    var shades = ["#f4f5f7", "#9aa0a8", "#c9ced6", "#6c727a", "#e4e8ed"];
    var grid = [0, 0.5, 1].map(function (f) { var v = lo + (hi - lo) * f; return '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y(v) + '" y2="' + y(v) + '" stroke="#1c1c1f"/><text x="' + (pl - 8) + '" y="' + (y(v) + 4) + '" text-anchor="end" fill="#6b7078" font-size="10">' + money(Math.round(v)) + "</text>"; }).join("");
    var lines = names.map(function (n, i) { var pts = groups[n].map(function (p) { return x(p[0]).toFixed(1) + "," + y(p[1]).toFixed(1); }); return '<polyline points="' + pts.join(" ") + '" fill="none" stroke="' + shades[i % 5] + '" stroke-width="2"/>' + groups[n].map(function (p) { return '<circle cx="' + x(p[0]).toFixed(1) + '" cy="' + y(p[1]).toFixed(1) + '" r="3" fill="' + shades[i % 5] + '"><title>' + esc(n) + " · " + fmtDate(p[0]) + " · " + money(p[1]) + "</title></circle>"; }).join(""); }).join("");
    var legend = names.length > 1 ? '<div style="display:flex;gap:14px;flex-wrap:wrap;padding:0 18px 14px">' + names.map(function (n, i) { return '<span style="display:flex;gap:6px;align-items:center;font-size:12px;color:#a3a7ae"><span style="width:10px;height:2px;background:' + shades[i % 5] + '"></span>' + esc(n) + "</span>"; }).join("") + "</div>" : "";
    var first = {}, last = {}; names.forEach(function (n) { first[n] = groups[n][0][1]; last[n] = groups[n][groups[n].length - 1][1]; });
    return '<section class="card"><div style="padding:16px 18px 0" class="eyebrow">BALANCE OVER TIME</div><svg viewBox="0 0 ' + W + " " + H + '" style="width:100%;height:auto;display:block">' + grid + lines + "</svg>" + legend + "</section>";
  }
  function progressStats(rows) {
    var groups = {}; rows.forEach(function (r) { var b = num(r.data.balance); if (b == null) return; (groups[r.data.account || "Account"] = groups[r.data.account || "Account"] || []).push(r); });
    var start = 0, cur = 0, flows = 0;
    Object.keys(groups).forEach(function (n) { var g = groups[n].slice().sort(function (a, b) { return (a.data.date || "") < (b.data.date || "") ? -1 : 1; }); start += num(g[0].data.balance); cur += num(g[g.length - 1].data.balance); g.slice(1).forEach(function (r) { flows += num(r.data.flow) || 0; }); });
    var gain = cur - start - flows;
    return [["Accounts", Object.keys(groups).length], ["Starting", money(start)], ["Current", money(cur)], ["Growth", start ? (gain >= 0 ? "+" : "") + (gain / start * 100).toFixed(1) + "%" : "0%", gain > 0 ? "pos" : gain < 0 ? "neg" : ""]];
  }
  async function tablePage(page, key) {
    var cfg = TABLES[key]; if (!cfg) { location.hash = "#/journal"; return; }
    var err = await load(); if (err) { page.innerHTML = crumb(cfg.title) + setupNote(err); return; }
    drawTable(page, key);
  }
  function drawTable(page, key) {
    var cfg = TABLES[key], rows = sortRows(cfg, of("t:" + key));
    var stats = key === "progress" ? progressStats(rows) : cfg.stats ? cfg.stats(rows) : null;
    var html = crumb(cfg.title) + '<div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-end;gap:14px">' + head(cfg.eyebrow, cfg.title, "", cfg.sub) + '<button class="btn btn-metal" id="tNew">Add</button></div>' +
      (stats ? '<div class="tiles" style="padding:6px 0;border-bottom:1px solid #18181a">' + stats.map(function (s) { return tile(s[0], s[1], s[2]); }).join("") + "</div>" : "");
    if (cfg.view === "chart") html += chartSvg(rows);
    if (cfg.extra) html += cfg.extra(rows);
    if (!rows.length) html += '<section class="card pad note" style="text-align:center">Nothing here yet. Tap Add.</section>';
    else if (cfg.view === "board") {
      html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;align-items:start">' + cfg.boardCols.map(function (c) {
        var col = rows.filter(function (r) { return (r.data[cfg.boardBy] || cfg.boardCols[0]) === c; });
        return '<section class="card pad" style="display:flex;flex-direction:column;gap:10px"><div style="display:flex;justify-content:space-between"><span class="eyebrow">' + esc(c) + '</span><span class="mini">' + col.length + "</span></div>" + col.map(function (r) {
          var d = r.data;
          return '<button data-row="' + r.id + '" style="text-align:left;background:#0b0b0c;border:1px solid #1f2023;border-radius:12px;padding:14px;color:#f4f4f5;cursor:pointer;display:flex;flex-direction:column;gap:8px;font:13px Inter"><span style="font:600 15px var(--sg)">' + esc(d.name || "Untitled") + '</span><span style="display:flex;gap:6px;flex-wrap:wrap">' + (d.type ? '<span class="mini">' + esc(d.type.toUpperCase()) + "</span>" : "") + (d.target ? '<span class="mini">' + esc(d.target) + "% TARGET</span>" : "") + (d.priority ? '<span class="mini" style="' + (d.priority === "P1" ? "color:#ff8a8a" : "") + '">' + esc(d.priority) + "</span>" : "") + "</span>" + (d.end ? '<span class="muted" style="font-size:11px">By ' + fmtDate(d.end) + "</span>" : "") + "</button>";
        }).join("") + (col.length ? "" : '<div class="note" style="font-size:12px">Empty</div>') + "</section>";
      }).join("") + "</div>";
    } else if (cfg.view === "cards") {
      html += '<div class="grid-cards">' + rows.map(function (r) { return '<button data-row="' + r.id + '" class="card" style="text-align:left;border:none;cursor:pointer;color:#f4f4f5;padding:18px;display:flex;flex-direction:column;gap:10px;font:13px Inter">' + cfg.card(r) + "</button>"; }).join("") + "</div>";
    } else {
      var cols = cfg.cols;
      html += '<section class="card"><div class="scroll-x"><table style="min-width:' + Math.max(560, cols.length * 100) + 'px"><thead><tr style="background:#0c0c0d">' + cols.map(function (c) { return "<th>" + esc(c[1]) + "</th>"; }).join("") + "</tr></thead><tbody>" +
        rows.map(function (r) { return '<tr data-row="' + r.id + '" style="cursor:pointer">' + cols.map(function (c) { var v = c[2] ? c[2](r.data) : esc(r.data[c[0]] == null ? "" : r.data[c[0]]); return "<td>" + v + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table></div></section>";
    }
    if (TB.open) {
      var it = TB.open === "new" ? null : byId(TB.open), d = it ? it.data : {};
      if (!it && cfg.fields.some(function (f) { return f[2] === "date"; })) { var df = cfg.fields.filter(function (f) { return f[2] === "date"; })[0][0]; if (!d[df]) d = Object.assign({}, d, (function () { var o = {}; o[df] = todayUK(); return o; })()); }
      html += '<div class="panel-wrap"><section class="panel"><div style="display:flex;justify-content:space-between;align-items:center"><div style="font-family:var(--sg);font-size:22px;font-weight:600">' + (it ? "Edit" : "Add") + '</div><button class="x" id="tClose">×</button></div>' +
        '<div class="form-grid" id="tForm">' + cfg.fields.map(function (f) { return fieldInput(f, d[f[0]], "t:" + key); }).join("") + "</div>" +
        '<div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn btn-metal" id="tSave">Save</button>' + (it ? '<button class="btn btn-ghost" id="tDel" style="color:#ff8a8a;border-color:#3a1c1c">Delete</button>' : "") + '</div><span class="muted" id="tMsg" style="font-size:12px"></span></section></div>';
    }
    page.innerHTML = html;
    if (!TB.open) mountAI(page, "t:" + key, cfg.title, key, async function () { return cfg.title + (stats ? "\nStats: " + stats.map(function (x) { return x[0] + " " + x[1]; }).join(", ") : "") + "\n\nEntries:\n" + rowsText(rows, cfg.fields); }, key === "scaling");
    $("#tNew", page).onclick = function () { TB.open = "new"; drawTable(page, key); };
    $$("[data-row]", page).forEach(function (r) { r.onclick = function () { TB.open = r.dataset.row; drawTable(page, key); }; });
    if (!TB.open) return;
    var form = $("#tForm", page);
    $("#tClose", page).onclick = function () { TB.open = null; drawTable(page, key); };
    $$("[data-multi] .chip", form).forEach(function (c) { c.onclick = function () { c.classList.toggle("on"); }; });
    $$("[data-addtag]", form).forEach(function (b) {
      var k = b.dataset.addtag, inp = $('[data-newtag="' + k + '"]', form);
      var go = function () { var v = inp.value.trim(); if (!v) return; var box = $('[data-multi="' + k + '"]', form), c = document.createElement("button"); c.type = "button"; c.className = "chip on"; c.dataset.o = v; c.textContent = v; c.onclick = function () { c.classList.toggle("on"); }; box.appendChild(c); inp.value = ""; };
      b.onclick = go; inp.onkeydown = function (e) { if (e.key === "Enter") { e.preventDefault(); go(); } };
    });
    $$("[data-img]", form).forEach(function (inp) {
      inp.onchange = async function () {
        var f = inp.files && inp.files[0]; if (!f) return; $("#tMsg", page).textContent = "Uploading…";
        try { var u = await upload(f); $('[data-k="' + inp.dataset.img + '"]', form).value = u; $("#tMsg", page).textContent = "Image added. Tap Save."; } catch (e) { $("#tMsg", page).textContent = "Couldn't upload: " + (e.message || e); }
      };
    });
    $("#tSave", page).onclick = async function () {
      var data = {};
      cfg.fields.forEach(function (f) {
        if (f[3] === "multi" || f[2] === "tags") { data[f[0]] = $$('[data-multi="' + f[0] + '"] .chip.on', form).map(function (c) { return c.dataset.o; }); return; }
        var el = $('[data-k="' + f[0] + '"]', form); if (!el) return;
        data[f[0]] = f[2] === "number" ? num(el.value) : el.value;
      });
      $("#tMsg", page).textContent = "Saving…";
      try {
        if (TB.open === "new") await add("t:" + key, data); else { var it2 = byId(TB.open); it2.data = data; await save(it2); }
        TB.open = null; drawTable(page, key);
      } catch (e) { $("#tMsg", page).textContent = "Couldn't save: " + e.message; }
    };
    var del = $("#tDel", page); if (del) del.onclick = async function () { if (!confirm("Delete this?")) return; await remove(byId(TB.open)); TB.open = null; drawTable(page, key); };
  }

  // ======================= FUNDED ACCOUNTS (Lucid style) =======================
  var FA = { open: null, dayFor: null };
  var ACC_FIELDS = [["name", "Account", "text"], ["acctId", "Account ID", "text"], ["firm", "Prop firm", "text"], ["phase", "Phase", ["Evaluation", "Funded", "Failed", "Reserve"]], ["size", "Account size ($)", "number"], ["target", "Profit target ($)", "number"], ["maxLoss", "Max loss ($)", "number"], ["floor", "Max loss floor ($)", "number"], ["dll", "Daily loss limit ($)", "number"], ["notes", "Notes", "textarea"]];
  var DAY_FIELDS = [["date", "Date", "date"], ["pnl", "Day P&L ($)", "number"], ["end", "End balance ($)", "number"], ["trades", "Trades taken", "number"], ["hitDll", "Hit daily loss limit", ["No", "Yes"]], ["notes", "Notes", "textarea"]];
  function accMetrics(a) {
    var d = a.data, days = of("fday").filter(function (x) { return x.data.account === a.id; });
    var pnl = days.reduce(function (s, x) { return s + (num(x.data.pnl) || 0); }, 0);
    var size = num(d.size) || 0, bal = size + pnl;
    var floor = num(d.floor) != null ? num(d.floor) : (size && num(d.maxLoss) != null ? size - num(d.maxLoss) : null);
    var biggest = days.reduce(function (m, x) { var v = num(x.data.pnl) || 0; return v > m ? v : m; }, 0);
    var green = days.filter(function (x) { return (num(x.data.pnl) || 0) > 0; }).length;
    var trades = days.reduce(function (s, x) { return s + (num(x.data.trades) || 0); }, 0);
    var target = num(d.target), left = target != null ? Math.max(0, target - pnl) : null;
    var consistency = pnl > 0 ? biggest / pnl * 100 : null;
    return { days: days, pnl: pnl, bal: bal, floor: floor, buffer: floor != null ? bal - floor : null, biggest: biggest, green: green, trades: trades, left: left, target: target, consistency: consistency, pct: target ? Math.max(0, Math.min(100, pnl / target * 100)) : null };
  }
  function bar(p, color) { return '<div style="height:6px;border-radius:3px;background:#1a1a1c;overflow:hidden"><div style="height:100%;width:' + (p || 0).toFixed(1) + '%;background:' + (color || "var(--metal)") + '"></div></div>'; }
  async function fundedPage(page) {
    var err = await load(); if (err) { page.innerHTML = crumb("Funded Accounts") + setupNote(err); return; }
    drawFunded(page);
  }
  function drawFunded(page) {
    var A = of("facc"), M = A.map(accMetrics);
    var tot = M.reduce(function (s, m) { return s + m.pnl; }, 0), cap = A.filter(function (a) { return a.data.phase === "Funded"; }).reduce(function (s, a) { return s + (num(a.data.size) || 0); }, 0);
    var html = crumb("Funded Accounts") + '<div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-end;gap:14px">' + head("DATA", "Funded", "accounts.", "Track each prop account: target, buffer above max loss, and daily results.") + '<button class="btn btn-metal" id="aNew">Add account</button></div>' +
      '<div class="tiles" style="padding:6px 0;border-bottom:1px solid #18181a">' + tile("Accounts", A.length) + tile("Funded capital", money(cap)) + tile("Total P&L", money(tot), tot > 0 ? "pos" : tot < 0 ? "neg" : "") + tile("Evaluations", A.filter(function (a) { return a.data.phase === "Evaluation"; }).length) + "</div>";
    if (!A.length) html += '<section class="card pad note" style="text-align:center">No accounts yet. Tap Add account.</section>';
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:16px;align-items:start">' + A.map(function (a, i) {
      var d = a.data, m = M[i], ph = d.phase || "Evaluation";
      var phCol = ph === "Funded" ? "rgba(127,217,154,.14);color:#7fd99a" : ph === "Failed" ? "rgba(255,138,138,.14);color:#ff8a8a" : ph === "Reserve" ? "#1c1c1e;color:#a3a7ae" : "rgba(160,180,255,.12);color:#b8c4ff";
      var pass = ph === "Evaluation" && m.left === 0 && (m.consistency == null || m.consistency <= 50);
      var days = m.days.slice().sort(function (x, y) { return (x.data.date || "") < (y.data.date || "") ? 1 : -1; });
      return '<section class="card pad" style="display:flex;flex-direction:column;gap:14px">' +
        '<div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start"><div><div style="font:700 20px var(--sg)">' + esc(d.name || "Account") + '</div><div class="muted" style="font-size:12px">' + esc([d.firm, d.acctId, d.size ? money(num(d.size)) : ""].filter(Boolean).join(" · ")) + '</div></div><span class="tag" style="background:' + phCol + '">' + esc(ph.toUpperCase()) + "</span></div>" +
        '<div style="display:flex;justify-content:space-between;align-items:flex-end"><div><div class="eyebrow" style="font-size:9px">BALANCE</div><div style="font:700 30px var(--sg)">' + money(m.bal) + '</div></div><div style="text-align:right"><div class="eyebrow" style="font-size:9px">P&L</div><div class="' + (m.pnl > 0 ? "pos" : m.pnl < 0 ? "neg" : "") + '" style="font:600 18px var(--sg)">' + (m.pnl >= 0 ? "+" : "") + money(m.pnl) + "</div></div></div>" +
        (m.target != null ? '<div style="display:flex;flex-direction:column;gap:6px"><div style="display:flex;justify-content:space-between;font-size:12px"><span class="muted">To target</span><span>' + (m.left === 0 ? '<b class="pos">Target hit</b>' : money(m.left) + " left") + "</span></div>" + bar(m.pct) + "</div>" : "") +
        (m.buffer != null ? '<div style="display:flex;flex-direction:column;gap:6px"><div style="display:flex;justify-content:space-between;font-size:12px"><span class="muted">Buffer above max loss</span><span class="' + (m.buffer < (num(d.dll) || 0) ? "neg" : "") + '">' + money(m.buffer) + "</span></div>" + bar(num(d.maxLoss) ? Math.max(0, Math.min(100, m.buffer / num(d.maxLoss) * 100)) : 0, m.buffer < (num(d.dll) || 0) ? "#ff8a8a" : "#7fd99a") + "</div>" : "") +
        '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;text-align:center">' + [["Days", m.days.length], ["Green", m.green], ["Trades", m.trades], ["Best day", money(m.biggest)]].map(function (k) { return '<div style="background:#0b0b0c;border-radius:10px;padding:10px 4px"><div class="muted" style="font-size:10px">' + k[0] + '</div><div style="font:600 14px var(--sg)">' + k[1] + "</div></div>"; }).join("") + "</div>" +
        (m.consistency != null ? '<div class="note" style="font-size:12px">Consistency: best day is <b style="color:' + (m.consistency > 50 ? "#ff8a8a" : "#e6e8eb") + '">' + m.consistency.toFixed(0) + "%</b> of total profit." + (num(d.dll) ? " Daily loss limit " + money(num(d.dll)) + "." : "") + "</div>" : "") +
        (pass ? '<div class="tag" style="background:rgba(127,217,154,.14);color:#7fd99a;align-self:flex-start">READY TO PASS</div>' : "") +
        '<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-metal" data-addday="' + a.id + '" style="height:40px">Add day</button><button class="btn btn-ghost" data-editacc="' + a.id + '" style="height:40px">Edit account</button></div>' +
        (days.length ? '<div style="border-top:1px solid #18181a">' + days.slice(0, 10).map(function (x) { var v = num(x.data.pnl) || 0; return '<button data-editday="' + x.id + '" style="width:100%;display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 0;background:none;border:none;border-bottom:1px solid #141416;color:#e6e8eb;cursor:pointer;font:13px Inter"><span>' + fmtDate(x.data.date) + (x.data.hitDll === "Yes" ? ' <span class="mini" style="color:#ff8a8a">DLL HIT</span>' : "") + '</span><b class="' + (v > 0 ? "pos" : v < 0 ? "neg" : "") + '">' + (v >= 0 ? "+" : "") + money(v) + "</b></button>"; }).join("") + "</div>" : "") +
        "</section>";
    }).join("") + "</div>";
    if (FA.open) {
      var isDay = FA.open.kind === "day", it = FA.open.id ? byId(FA.open.id) : null, d = it ? it.data : (isDay ? { date: todayUK(), hitDll: "No" } : { phase: "Evaluation" });
      var fields = isDay ? DAY_FIELDS : ACC_FIELDS;
      html += '<div class="panel-wrap"><section class="panel"><div style="display:flex;justify-content:space-between;align-items:center"><div style="font-family:var(--sg);font-size:22px;font-weight:600">' + (it ? "Edit " : "Add ") + (isDay ? "day" : "account") + '</div><button class="x" id="fClose">×</button></div>' +
        '<div class="form-grid" id="fForm">' + fields.map(function (f) { return fieldInput(f, d[f[0]], isDay ? "fday" : "facc"); }).join("") + "</div>" +
        (!isDay && !it ? '<div class="note" style="font-size:12px">Max loss floor is the balance where the account is lost. It starts at size minus max loss. Update it from your prop firm dashboard as it trails up.</div>' : "") +
        '<div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn btn-metal" id="fSave">Save</button>' + (it ? '<button class="btn btn-ghost" id="fDel" style="color:#ff8a8a;border-color:#3a1c1c">Delete</button>' : "") + '</div><span class="muted" id="fMsg" style="font-size:12px"></span></section></div>';
    }
    page.innerHTML = html;
    if (!FA.open) mountAI(page, "funded", "Funded accounts", "funded", async function () { return A.map(function (a, i) { var m = M[i], d = a.data; return "- " + (d.name || "Account") + " | " + (d.firm || "") + " | phase " + (d.phase || "") + " | size " + money(num(d.size)) + " | target " + money(num(d.target)) + " | max loss " + money(num(d.maxLoss)) + " | daily loss limit " + money(num(d.dll)) + " | balance " + money(m.bal) + " | P&L " + money(m.pnl) + (m.left != null ? " | left to target " + money(m.left) : "") + (m.buffer != null ? " | buffer above max loss " + money(m.buffer) : "") + " | days " + m.days.length + ", green " + m.green + ", best day " + money(m.biggest) + (m.consistency != null ? ", best day is " + Math.round(m.consistency) + "% of profit" : "") + " | daily results: " + m.days.slice().sort(function (x, y) { return x.data.date < y.data.date ? -1 : 1; }).map(function (x) { return x.data.date + " " + money(num(x.data.pnl)) + (x.data.hitDll === "Yes" ? " (hit DLL)" : ""); }).join(", "); }).join("\n") || "(no accounts)"; }, false);
    var redraw = function () { drawFunded(page); };
    $("#aNew", page).onclick = function () { FA.open = { kind: "acc" }; redraw(); };
    $$("[data-addday]", page).forEach(function (b) { b.onclick = function () { FA.open = { kind: "day", account: b.dataset.addday }; redraw(); }; });
    $$("[data-editacc]", page).forEach(function (b) { b.onclick = function () { FA.open = { kind: "acc", id: b.dataset.editacc }; redraw(); }; });
    $$("[data-editday]", page).forEach(function (b) { b.onclick = function () { var x = byId(b.dataset.editday); FA.open = { kind: "day", id: x.id, account: x.data.account }; redraw(); }; });
    if (!FA.open) return;
    $("#fClose", page).onclick = function () { FA.open = null; redraw(); };
    $("#fSave", page).onclick = async function () {
      var isDay = FA.open.kind === "day", fields = isDay ? DAY_FIELDS : ACC_FIELDS, data = {};
      fields.forEach(function (f) { var el = $('[data-k="' + f[0] + '"]', page); if (el) data[f[0]] = f[2] === "number" ? num(el.value) : el.value; });
      if (isDay) data.account = FA.open.account;
      if (!isDay && data.floor == null && data.size != null && data.maxLoss != null) data.floor = data.size - data.maxLoss;
      $("#fMsg", page).textContent = "Saving…";
      try { if (FA.open.id) { var it = byId(FA.open.id); it.data = data; await save(it); } else await add(isDay ? "fday" : "facc", data); FA.open = null; redraw(); }
      catch (e) { $("#fMsg", page).textContent = "Couldn't save: " + e.message; }
    };
    var del = $("#fDel", page); if (del) del.onclick = async function () {
      if (!confirm("Delete this?")) return;
      var it = byId(FA.open.id);
      if (it.kind === "facc") { var ds = of("fday").filter(function (x) { return x.data.account === it.id; }); for (var i = 0; i < ds.length; i++) await remove(ds[i]); }
      await remove(it); FA.open = null; redraw();
    };
  }

  // ======================= WEEKLY / MONTHLY REVIEWS =======================
  var RV = { open: null, busy: false };
  var QUESTIONS = [
    ["happy", "On a scale of 1-10, how happy were you this {p} and why?", "textarea"],
    ["wins", "What were your three big wins for the {p}?", "three"],
    ["goals", "Review your goals and assess your progress. Did you spend your time on the right things? If not, how will you improve next {p}?", "textarea"],
    ["lesson", "What was the biggest lesson you learned this {p}?", "textarea"],
    ["milestones", "What are the three big milestones that if you hit would make next {p} a win for you?", "three"],
    ["blockers", "What might prevent you from achieving these milestones and what can you do to get around it?", "textarea"]
  ];
  function mondayOf(d) { var t = new Date(d + "T12:00:00"), w = (t.getDay() + 6) % 7; t.setDate(t.getDate() - w); return t.toISOString().slice(0, 10); }
  function periodRange(kind, key) {
    if (kind === "monthly") { var s = key + "-01", e = new Date(key + "-01T12:00:00"); e.setMonth(e.getMonth() + 1); return [s, e.toISOString().slice(0, 10)]; }
    var e2 = new Date(key + "T12:00:00"); e2.setDate(e2.getDate() + 7); return [key, e2.toISOString().slice(0, 10)];
  }
  function periodLabel(kind, key) {
    if (kind === "monthly") return new Date(key + "-01T12:00:00").toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    return "Week of " + fmtDate(key);
  }
  function periodStats(kind, key) {
    var r = periodRange(kind, key);
    var T = (D.trades || []).filter(function (t) { return t.trade_date >= r[0] && t.trade_date < r[1]; });
    var w = T.filter(function (t) { return t.result === "Win"; }).length, tot = T.reduce(function (a, t) { return a + (Number(t.r) || 0); }, 0);
    var L = of("t:live").filter(function (x) { return x.data.date >= r[0] && x.data.date < r[1]; }), pnl = L.reduce(function (a, x) { return a + (num(x.data.pnl) || 0); }, 0);
    return { n: T.length, wr: T.length ? Math.round(w / T.length * 100) : 0, r: tot, pnl: pnl, live: L.length };
  }
  async function reviewsPage(page, kind) {
    if (kind !== "weekly" && kind !== "monthly") { location.hash = "#/journal"; return; }
    var err = await load(); await loadTrades(); if (err) { page.innerHTML = setupNote(err); return; }
    drawReviews(page, kind);
  }
  function drawReviews(page, kind) {
    var word = kind === "weekly" ? "week" : "month", title = kind === "weekly" ? "Weekly Reviews" : "Monthly Reviews";
    var R = of("rv:" + kind).slice().sort(function (a, b) { return a.data.key < b.data.key ? 1 : -1; });
    var html = crumb(title) + '<div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-end;gap:14px">' + head("GOALS", kind === "weekly" ? "Weekly" : "Monthly", "reviews.", "Review the last " + word + " and plan the next one. Your numbers fill in from your journal.") + '<button class="btn btn-metal" id="rNew">New review</button></div>';
    if (!R.length) html += '<section class="card pad note" style="text-align:center">No reviews yet. Tap New review.</section>';
    html += '<div class="grid-cards">' + R.map(function (r) {
      var s = periodStats(kind, r.data.key), score = parseInt(r.data.happy, 10);
      return '<button data-rv="' + r.id + '" class="card" style="text-align:left;border:none;cursor:pointer;color:#f4f4f5;padding:18px;display:flex;flex-direction:column;gap:10px;font:13px Inter"><div style="display:flex;justify-content:space-between;align-items:center"><span style="font:600 17px var(--sg)">' + esc(periodLabel(kind, r.data.key)) + "</span>" + (!isNaN(score) ? '<span class="mini">' + score + "/10</span>" : "") + '</div><div style="display:flex;gap:14px;font-size:12px;color:#a3a7ae"><span>' + s.n + " trades</span><span>" + s.wr + '% wins</span><span class="' + (s.r > 0 ? "pos" : s.r < 0 ? "neg" : "") + '">' + (s.r > 0 ? "+" : "") + s.r.toFixed(1) + "R</span></div>" + (r.data.lesson ? '<div class="note" style="font-size:12px">' + esc(r.data.lesson.slice(0, 140)) + "</div>" : "") + (r.data.ai ? '<span class="mini" style="align-self:flex-start">AI REVIEWED</span>' : "") + "</button>";
    }).join("") + "</div>";
    if (RV.open) {
      var it = RV.open === "new" ? null : byId(RV.open), d = it ? it.data : (RV.tmp || { key: kind === "weekly" ? mondayOf(todayUK()) : todayUK().slice(0, 7) });
      var s = periodStats(kind, d.key);
      html += '<div class="panel-wrap"><section class="panel" style="max-width:620px"><div style="display:flex;justify-content:space-between;align-items:center"><div style="font-family:var(--sg);font-size:22px;font-weight:600">' + (kind === "weekly" ? "Weekly" : "Monthly") + ' review</div><button class="x" id="rClose">×</button></div>' +
        '<label class="field">' + (kind === "weekly" ? "Week starting (Monday)" : "Month") + '<input class="input" id="rKey" type="' + (kind === "weekly" ? "date" : "month") + '" value="' + esc(d.key) + '"></label>' +
        '<div class="tiles" style="grid-template-columns:repeat(4,1fr)">' + tile("Trades", s.n) + tile("Win rate", s.wr + "%") + tile("Total R", (s.r > 0 ? "+" : "") + s.r.toFixed(1), s.r > 0 ? "pos" : s.r < 0 ? "neg" : "") + tile("Live P&L", money(s.pnl), s.pnl > 0 ? "pos" : s.pnl < 0 ? "neg" : "") + "</div>" +
        '<div class="eyebrow" style="margin-top:6px">' + word.toUpperCase() + "LY REFLECTION</div>" +
        QUESTIONS.map(function (q, qi) {
          var label = q[1].replace("{p}", word), v = d[q[0]];
          if (qi === 4) label = '<span class="eyebrow" style="display:block;margin:10px 0 6px">' + word.toUpperCase() + "LY PLANNING</span>" + label;
          if (q[2] === "three") { var a = Array.isArray(v) ? v : ["", "", ""]; return '<div class="field">' + label + [0, 1, 2].map(function (k) { return '<input class="input" data-q="' + q[0] + '" data-i="' + k + '" value="' + esc(a[k] || "") + '" placeholder="' + (k + 1) + '.">'; }).join("") + "</div>"; }
          return '<label class="field">' + label + '<textarea class="input" data-q="' + q[0] + '" rows="3" style="height:auto;padding:12px;line-height:1.6">' + esc(v || "") + "</textarea></label>";
        }).join("") +
        (d.ai ? '<section style="background:#121214;box-shadow:inset 0 0 0 1px #222326;border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:8px"><span class="eyebrow">AI COACH FEEDBACK</span><div style="white-space:pre-wrap;font-size:13px;line-height:1.7;color:#d6d8dc">' + esc(d.ai) + "</div></section>" : "") +
        '<div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn btn-metal" id="rSave">Save</button><button class="btn btn-ghost" id="rAi">' + (RV.busy ? "Reviewing…" : d.ai ? "Ask AI again" : "Get AI feedback") + "</button>" + (it ? '<button class="btn btn-ghost" id="rDel" style="color:#ff8a8a;border-color:#3a1c1c">Delete</button>' : "") + '</div><span class="muted" id="rMsg" style="font-size:12px"></span></section></div>';
    }
    page.innerHTML = html;
    if (!RV.open) mountAI(page, "rv:" + kind, title, "reviews", async function () { return R.slice(0, 8).map(function (r) { var s2 = periodStats(kind, r.data.key); return periodLabel(kind, r.data.key) + " (" + s2.n + " trades, " + s2.wr + "% win, " + s2.r.toFixed(1) + "R)\n" + QUESTIONS.map(function (q) { var v = r.data[q[0]]; return q[1].replace("{p}", word) + " " + (Array.isArray(v) ? v.filter(Boolean).join("; ") : v || "-"); }).join("\n"); }).join("\n\n") || "(no reviews yet)"; }, false);
    var redraw = function () { drawReviews(page, kind); };
    $("#rNew", page).onclick = function () { RV.open = "new"; RV.tmp = null; redraw(); };
    $$("[data-rv]", page).forEach(function (b) { b.onclick = function () { RV.open = b.dataset.rv; redraw(); }; });
    if (!RV.open) return;
    function collect() {
      var data = { key: $("#rKey", page).value };
      QUESTIONS.forEach(function (q) { if (q[2] === "three") data[q[0]] = $$('[data-q="' + q[0] + '"]', page).map(function (i) { return i.value; }); else data[q[0]] = $('[data-q="' + q[0] + '"]', page).value; });
      var old = RV.open !== "new" && byId(RV.open); if (old && old.data.ai) data.ai = old.data.ai;
      return data;
    }
    async function store(data) {
      if (RV.open === "new") { var n = await add("rv:" + kind, data); RV.open = n.id; return n; }
      var it = byId(RV.open); it.data = data; await save(it); return it;
    }
    $("#rKey", page).onchange = function () { var it = RV.open !== "new" && byId(RV.open); var data = collect(); if (it) it.data = data; else { RV.tmp = data; } redraw(); };
    $("#rClose", page).onclick = function () { RV.open = null; RV.tmp = null; redraw(); };
    $("#rSave", page).onclick = async function () { $("#rMsg", page).textContent = "Saving…"; try { await store(collect()); RV.open = null; RV.tmp = null; redraw(); } catch (e) { $("#rMsg", page).textContent = "Couldn't save: " + e.message; } };
    $("#rAi", page).onclick = async function () {
      if (RV.busy) return;
      var data = collect(), s = periodStats(kind, data.key);
      var prompt = "Please review my " + word + " as my trading coach. Be honest and specific, keep it short, and finish with 3 things to focus on next " + word + ".\n\n" + periodLabel(kind, data.key) + "\nTrades logged: " + s.n + ", win rate " + s.wr + "%, total " + s.r.toFixed(1) + "R, live P&L " + money(s.pnl) + ".\n\n" +
        QUESTIONS.map(function (q) { var v = data[q[0]]; return q[1].replace("{p}", word) + "\n" + (Array.isArray(v) ? v.filter(Boolean).map(function (x, i) { return (i + 1) + ". " + x; }).join("\n") : v || "(blank)"); }).join("\n\n");
      RV.busy = true; $("#rAi", page).textContent = "Reviewing…";
      var reply;
      try {
        var tok = (await sb().auth.getSession()).data.session;
        var r = await fetch(window.SDX_CONFIG.AUTH_URL + "/coach", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + (tok ? tok.access_token : "") }, body: JSON.stringify({ mode: "chat", messages: [{ role: "user", content: prompt }] }) });
        var j = await r.json(); reply = r.ok ? j.reply : null;
      } catch (e) { reply = null; }
      RV.busy = false;
      if (!reply) { $("#rAi", page).textContent = "Get AI feedback"; $("#rMsg", page).textContent = "The AI coach couldn't answer just now. Try again in a minute."; return; }
      data.ai = reply;
      try { await store(data); } catch (e) { $("#rMsg", page).textContent = "Couldn't save: " + e.message; return; }
      redraw();
    };
    var del = $("#rDel", page); if (del) del.onclick = async function () { if (!confirm("Delete this review?")) return; await remove(byId(RV.open)); RV.open = null; redraw(); };
  }


  // ======================= AI REVIEW (looks at everything they've logged) =======================
  var AI = { focus: "all", chat: [], busy: false, data: null };
  var FOCUS = [["all", "Everything"], ["backtest", "Backtests"], ["live", "My trades"], ["funded", "Funded accounts"], ["habits", "Plans & reviews"]];
  function dayOf(d) { var t = d ? new Date(d.length <= 10 ? d + "T12:00:00" : d) : null; return t && !isNaN(t) ? t.toLocaleDateString("en-GB", { weekday: "long" }) : ""; }
  function rOf(x) { var v = parseFloat(x); return isNaN(v) ? null : v; }
  async function gatherAll() {
    await load(true); await loadTrades();
    var bt = await sb().from("backtests").select("*"), sl = await sb().from("signal_logs").select("*");
    var T = [];
    (bt.data || []).forEach(function (b) { var d = b.data || {}; var r = rOf(d.r); if (r == null) return; var o = d.opened || d.trade_date || ""; T.push({ src: "backtest", model: b.model, pair: b.pair, setup: d.setup || b.model, r: r, session: o.length >= 16 ? sessionOf(o) : (d.session || ""), day: dayOf(o), position: (d.position || "").toUpperCase(), conf: Array.isArray(d.confluences) ? d.confluences : (d.confluences ? String(d.confluences).split(/\s*,\s*/) : []), poi: d.poi || "", draw: d.draw || "", date: o.slice(0, 10), note: d.notes || "" }); });
    (D.trades || []).forEach(function (t) { var r = rOf(t.r); if (r == null) return; T.push({ src: "journal", pair: t.pair, setup: t.setup || "", r: r, session: t.session || "", day: dayOf(t.trade_date), position: (t.side || "").toUpperCase(), conf: [], date: t.trade_date || "", note: t.notes || "" }); });
    of("t:futures").forEach(function (x) { var d = x.data, r = rOf(d.r); if (r == null) return; T.push({ src: "futures", pair: d.pair || "", setup: d.setup || "", r: r, session: sessionOf(d.opened), day: dayOf(d.opened), position: (d.position || "").toUpperCase(), conf: d.confluences || [], date: (d.opened || "").slice(0, 10), note: d.notes || "" }); });
    of("t:live").forEach(function (x) { var d = x.data, r = rOf(d.r); var p = num(d.pnl); if (r == null && p == null) return; T.push({ src: "live", pair: d.pair || "", setup: d.setup || "", r: r != null ? r : (p > 0 ? 1 : p < 0 ? -1 : 0), pnl: p, session: "", day: dayOf(d.date), position: (d.side || "").toUpperCase(), conf: [], date: d.date || "", note: d.notes || "" }); });
    return { trades: T, signals: sl.data || [] };
  }
  function groupBy(T, fn) {
    var g = {}; T.forEach(function (t) { var ks = fn(t); (Array.isArray(ks) ? ks : [ks]).forEach(function (k) { if (!k) return; var o = g[k] || (g[k] = { n: 0, w: 0, r: 0 }); o.n++; if (t.r > 0) o.w++; o.r += t.r; }); });
    return Object.keys(g).map(function (k) { var o = g[k]; return { k: k, n: o.n, wr: Math.round(o.w / o.n * 100), r: Math.round(o.r * 100) / 100, avg: Math.round(o.r / o.n * 100) / 100 }; }).sort(function (a, b) { return b.r - a.r; });
  }
  function summary(T) { var w = T.filter(function (t) { return t.r > 0; }).length, r = T.reduce(function (a, t) { return a + t.r; }, 0); return { n: T.length, wr: T.length ? Math.round(w / T.length * 100) : 0, r: Math.round(r * 100) / 100, avg: T.length ? Math.round(r / T.length * 100) / 100 : 0 }; }
  function streaks(T) { var s = T.slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; }), lw = 0, ll = 0, cw = 0, cl = 0; s.forEach(function (t) { if (t.r > 0) { cw++; cl = 0; } else if (t.r < 0) { cl++; cw = 0; } if (cw > lw) lw = cw; if (cl > ll) ll = cl; }); return { win: lw, loss: ll }; }
  function pickTrades(T) {
    if (AI.focus === "backtest") return T.filter(function (t) { return t.src === "backtest"; });
    if (AI.focus === "live") return T.filter(function (t) { return t.src !== "backtest"; });
    return T;
  }
  function breakdownTable(title, rows) {
    if (!rows.length) return "";
    return '<section class="card"><div class="eyebrow" style="padding:16px 18px 4px">' + esc(title) + '</div><div class="scroll-x"><table><thead><tr><th></th><th>Trades</th><th>Win rate</th><th>Total R</th><th>Avg R</th></tr></thead><tbody>' + rows.slice(0, 8).map(function (r) { return '<tr><td style="font-weight:600">' + esc(r.k) + "</td><td>" + r.n + "</td><td>" + r.wr + '%</td><td class="' + (r.r > 0 ? "pos" : r.r < 0 ? "neg" : "") + '" style="font-weight:600">' + (r.r > 0 ? "+" : "") + r.r + "R</td><td>" + r.avg + "R</td></tr>"; }).join("") + "</tbody></table></div></section>";
  }
  function line(title, rows) { return rows.length ? title + ": " + rows.slice(0, 10).map(function (r) { return r.k + " (" + r.n + " trades, " + r.wr + "% win, " + (r.r > 0 ? "+" : "") + r.r + "R)"; }).join("; ") : ""; }
  function buildPrompt() {
    var A = AI.data, T = pickTrades(A.trades), S = summary(T), st = streaks(T), parts = [];
    var fl = FOCUS.filter(function (f) { return f[0] === AI.focus; })[0][1];
    parts.push("You are reviewing a student's trading journal from the SDX dashboard. Focus: " + fl + ". Use plain, simple English, no jargon. Be honest and specific, use their numbers, point out what is working, what is costing them, and any rules they keep breaking. Finish with the 3 most important things to do next. Keep it under 350 words. This is education, not financial advice.");
    if (AI.focus !== "funded" && AI.focus !== "habits") {
      parts.push("OVERALL: " + S.n + " trades, " + S.wr + "% win rate, total " + S.r + "R, average " + S.avg + "R per trade. Longest win streak " + st.win + ", longest losing streak " + st.loss + ".");
      [["By source", function (t) { return t.src; }], ["By setup", function (t) { return t.setup; }], ["By pair", function (t) { return t.pair; }], ["By session", function (t) { return t.session; }], ["By day", function (t) { return t.day; }], ["By position", function (t) { return t.position; }], ["By confluence", function (t) { return t.conf; }], ["By POI", function (t) { return t.poi; }], ["By liquidity draw", function (t) { return t.draw; }]].forEach(function (g) { var l = line(g[0], groupBy(T, g[1])); if (l) parts.push(l); });
      var notes = T.filter(function (t) { return t.note; }).sort(function (a, b) { return a.date < b.date ? 1 : -1; }).slice(0, 15).map(function (t) { return "- " + t.date + " " + t.pair + " " + (t.r > 0 ? "+" : "") + t.r + "R: " + t.note.slice(0, 140); });
      if (notes.length) parts.push("Their latest trade notes:\n" + notes.join("\n"));
      if (AI.focus === "all" && A.signals.length) { var took = A.signals.filter(function (x) { return x.took; }).length; parts.push("Signal journal: logged " + A.signals.length + " signals, took " + took + ", missed " + (A.signals.length - took) + "."); }
    }
    if (AI.focus === "all" || AI.focus === "funded") {
      var acc = of("facc").map(function (a) { var m = accMetrics(a); return "- " + (a.data.name || "Account") + " (" + (a.data.phase || "") + ", size " + money(num(a.data.size)) + "): P&L " + money(m.pnl) + ", " + (m.left != null ? money(m.left) + " left to target, " : "") + (m.buffer != null ? "buffer above max loss " + money(m.buffer) + ", " : "") + m.days.length + " days, " + m.green + " green, best day " + money(m.biggest) + (m.consistency != null ? ", best day is " + Math.round(m.consistency) + "% of profit" : "") + ", " + m.days.filter(function (x) { return x.data.hitDll === "Yes"; }).length + " daily loss limit hits"; });
      if (acc.length) parts.push("Funded accounts:\n" + acc.join("\n"));
      var prog = progressStats(of("t:progress")); if (of("t:progress").length) parts.push("Account progress: " + prog.map(function (p) { return p[0] + " " + p[1]; }).join(", ") + ".");
    }
    if (AI.focus === "all" || AI.focus === "habits") {
      var plans = of("plan").concat(of("setup")).map(function (p) { var rules = []; (p.data.blocks || []).forEach(function (b) { if (b.type === "check") b.items.forEach(function (x) { rules.push(x.t); }); if (b.type === "list") rules = rules.concat(b.items); }); return rules.length ? "- " + p.data.title + ": " + rules.slice(0, 15).join("; ") : ""; }).filter(Boolean);
      if (plans.length) parts.push("Their written plans and setup rules:\n" + plans.join("\n"));
      var rk = docBy("risk"); if (rk) { var rr = []; rk.data.blocks.forEach(function (b) { if (b.type === "check") b.items.forEach(function (x) { rr.push(x.t); }); }); if (rr.length) parts.push("Their risk rules: " + rr.join("; ")); }
      var rv = of("rv:weekly").concat(of("rv:monthly")).sort(function (a, b) { return a.data.key < b.data.key ? 1 : -1; }).slice(0, 4).map(function (r) { return "- " + r.data.key + ": happiness " + (r.data.happy || "-").slice(0, 80) + " | lesson: " + (r.data.lesson || "-").slice(0, 160) + " | blockers: " + (r.data.blockers || "-").slice(0, 120); });
      if (rv.length) parts.push("Their latest reviews:\n" + rv.join("\n"));
      var pre = of("t:presession"), done = pre.filter(function (x) { return x.data.outcome && x.data.outcome !== "No trade"; }), ok = done.filter(function (x) { return x.data.outcome === "Played out"; }).length;
      if (pre.length) parts.push("Pre-session analysis: " + pre.length + " done, " + ok + " of " + done.length + " played out.");
    }
    return parts.join("\n\n").slice(0, 9000);
  }
  async function askAI(messages) {
    var tok = (await sb().auth.getSession()).data.session;
    var r = await fetch(window.SDX_CONFIG.AUTH_URL + "/coach", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + (tok ? tok.access_token : "") }, body: JSON.stringify({ mode: "chat", messages: messages }) });
    var j = await r.json(); if (!r.ok || !j.reply) throw new Error("no reply"); return j.reply;
  }
  async function aiPage(page) {
    page.innerHTML = crumb("AI Review") + '<div class="note">Loading your data…</div>';
    var err = await load(); if (err) { page.innerHTML = crumb("AI Review") + setupNote(err); return; }
    AI.data = await gatherAll(); drawAI(page);
  }
  function drawAI(page) {
    var T = pickTrades(AI.data.trades), S = summary(T), st = streaks(T), past = of("aireview").slice().sort(function (a, b) { return a.data.date < b.data.date ? 1 : -1; });
    var html = crumb("AI Review") + '<section class="hero" style="min-height:170px"><div class="eyebrow">SD TRADING EDUCATION</div><h1>AI review.</h1><div style="font-size:14px;color:#2a2c30">Reads everything you have logged and tells you what is working and what is not.</div></section>' +
      '<div class="tabs" style="align-self:flex-start;flex-wrap:wrap">' + FOCUS.map(function (f) { return '<button class="tab' + (AI.focus === f[0] ? " on" : "") + '" data-focus="' + f[0] + '" style="min-height:38px;font-size:13px">' + f[1] + "</button>"; }).join("") + "</div>";
    if (AI.focus !== "funded" && AI.focus !== "habits") {
      html += '<div class="tiles" style="padding:6px 0;border-bottom:1px solid #18181a">' + tile("Trades", S.n) + tile("Win rate", S.wr + "%") + tile("Total R", (S.r > 0 ? "+" : "") + S.r + "R", S.r > 0 ? "pos" : S.r < 0 ? "neg" : "") + tile("Average R", S.avg + "R") + tile("Worst losing run", st.loss) + "</div>";
      if (!T.length) html += '<section class="card pad note">No trades logged yet. Add trades to your Trade Journal, Entry Model Data, Futures Journal or Live Trades and they will show here.</section>';
      html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:16px;align-items:start">' + [["BY SETUP", function (t) { return t.setup; }], ["BY PAIR", function (t) { return t.pair; }], ["BY SESSION", function (t) { return t.session; }], ["BY DAY", function (t) { return t.day; }], ["BY CONFLUENCE", function (t) { return t.conf; }], ["BY POI", function (t) { return t.poi; }]].map(function (g) { return breakdownTable(g[0], groupBy(T, g[1])); }).join("") + "</div>";
    }
    html += '<section class="card pad" style="display:flex;flex-direction:column;gap:14px"><div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap"><span class="eyebrow">AI COACH</span><button class="btn btn-metal" id="aiGo">' + (AI.busy ? "Reviewing…" : "Review my data") + "</button></div>" +
      (AI.chat.length ? AI.chat.map(function (m) { var me = m.role === "user"; return me && m.hidden ? "" : '<div style="max-width:720px;align-self:' + (me ? "flex-end" : "flex-start") + ';border-radius:' + (me ? "16px 4px 16px 16px" : "4px 16px 16px 16px") + ';padding:12px 15px;font-size:14px;line-height:1.7;white-space:pre-wrap;' + (me ? "background:var(--metal);color:#0a0a0a" : "background:#121214;box-shadow:inset 0 0 0 1px #222326") + '">' + esc(m.content) + "</div>"; }).join("") : '<div class="note">Pick what to look at above, then tap Review my data. The more you log, the better the review.</div>') +
      (AI.chat.length ? '<form id="aiForm" style="display:flex;gap:10px"><input class="input" id="aiIn" placeholder="Ask a follow-up, e.g. why am I losing on Fridays?" autocomplete="off"><button class="btn btn-metal" type="submit">Send</button></form>' : "") +
      '<span class="muted" id="aiMsg" style="font-size:12px"></span><div class="note" style="font-size:11px">The AI coach is here to help you learn. It is not financial advice.</div></section>';
    if (past.length) html += '<section class="card pad"><div class="eyebrow" style="margin-bottom:8px">PAST REVIEWS</div>' + past.slice(0, 10).map(function (p) { return '<details style="border-top:1px solid #18181a;padding:10px 0"><summary style="cursor:pointer;font-size:13px">' + fmtDate(p.data.date) + ' · <span class="muted">' + esc(p.data.focus) + '</span></summary><div style="white-space:pre-wrap;font-size:13px;line-height:1.7;color:#d6d8dc;margin-top:8px">' + esc(p.data.text) + "</div></details>"; }).join("") + "</section>";
    page.innerHTML = html;
    var redraw = function () { drawAI(page); };
    $$("[data-focus]", page).forEach(function (b) { b.onclick = function () { AI.focus = b.dataset.focus; AI.chat = []; redraw(); }; });
    $("#aiGo", page).onclick = async function () {
      if (AI.busy) return;
      AI.busy = true; AI.chat = [{ role: "user", content: buildPrompt(), hidden: true }]; redraw();
      try {
        var reply = await askAI(AI.chat.map(function (m) { return { role: m.role, content: m.content }; }));
        AI.chat.push({ role: "assistant", content: reply });
        try { await add("aireview", { date: todayUK(), focus: FOCUS.filter(function (f) { return f[0] === AI.focus; })[0][1], text: reply }); } catch (e) { }
      } catch (e) { AI.chat = []; AI.busy = false; redraw(); $("#aiMsg", page).textContent = "The AI coach couldn't answer just now. Try again in a minute."; return; }
      AI.busy = false; redraw();
    };
    var f = $("#aiForm", page);
    if (f) f.onsubmit = async function (e) {
      e.preventDefault(); var q = $("#aiIn", page).value.trim(); if (!q || AI.busy) return;
      AI.chat.push({ role: "user", content: q }); AI.busy = true; redraw();
      try { AI.chat.push({ role: "assistant", content: await askAI(AI.chat.slice(-12).map(function (m) { return { role: m.role, content: m.content }; })) }); }
      catch (er) { AI.chat.push({ role: "assistant", content: "The AI coach couldn't answer just now. Try again in a minute." }); }
      AI.busy = false; redraw();
    };
  }


  // ======================= AI REVIEW BOX (bottom of every page) =======================
  var AIB = {};
  var GUIDE = {
    plan: "This is one of their entry model plans. Judge whether the rules are clear, specific and objective enough to follow the same way every time, whether anything important is missing (bias, POI, entry trigger, stop, target, management, when not to trade), and how it lines up with their actual results if there are any.",
    setup: "This is one of their trading setups. Judge whether the criteria are clear and objective, whether they could be backtested, and whether they have examples.",
    checklist: "This is their pre-trade checklist. Judge whether it covers analysis, entry, risk, management and emotions, whether the items are clear yes/no checks, and what the ticked boxes say about their last trade.",
    risk: "This is their risk management plan. Judge whether the risk per trade, daily and weekly loss limits, profit targets and trade limits are safe and realistic, whether they fit prop firm rules, and whether their actual results show they are sticking to it.",
    scaling: "This is their scaling roadmap of accounts. Judge whether the plan to grow from evaluations to funded and live accounts is realistic, well ordered and not taking on too much at once.",
    presession: "These are their pre-session analyses. Judge the quality of the analysis, how often it played out, and how to improve their preparation.",
    mech: "This is month by month Mech Model data per pair. Judge which pairs and months perform best and worst and what to focus on.",
    futures: "This is their futures journal. Judge their results by market, setup, session and confluences, and their discipline.",
    progress: "This is their account balance history. Judge growth, drawdowns and consistency.",
    live: "These are their live trades. Judge results, risk per trade, lot sizes and discipline.",
    books: "These are the trading books they are reading. Judge their reading and suggest how to use the takeaways.",
    funded: "These are their prop firm accounts. Judge how close each is to passing or payout, how safe they are from max loss and daily loss limits, consistency rules, and what to do next on each account.",
    reviews: "These are their weekly or monthly reviews. Judge their self-reflection, patterns across reviews, and whether they follow through on what they said.",
    entrydata: "This is their backtest data for one entry model. Judge which pairs, setups, sessions, days, confluences, POIs and liquidity draws work best and worst, sample size, and what to test next.",
    tradejournal: "This is their trade journal. Judge their results by setup, session and pair, and their discipline.",
    page: "This is a page they made in their journal. Judge how useful and clear it is.",
    goals: "These are their goals. Judge whether they are specific, measurable and realistic, and whether they focus on process not just money.",
    habits: "These are their routines and habits. Judge whether they support good trading.",
    other: "Judge what they have written and how to make it more useful for their trading."
  };
  function blocksText(d) {
    var out = [];
    (d.blocks || []).forEach(function (b) {
      if (b.type === "check") out.push(b.name + ":\n" + (b.items.length ? b.items.map(function (x) { return "- [" + (x.d ? "x" : " ") + "] " + x.t; }).join("\n") : "(empty)"));
      else if (b.type === "list") out.push(b.name + ":\n" + (b.items.length ? b.items.map(function (x, i) { return (i + 1) + ". " + x; }).join("\n") : "(empty)"));
      else if (b.type === "text") out.push(b.name + ":\n" + (b.text || "(empty)"));
      else if (b.type === "images") out.push(b.name + ": " + b.urls.length + " images");
      else if (b.type === "links") out.push(b.name + ": " + b.items.length + " links");
    });
    return out.join("\n\n");
  }
  function rowsText(rows, fields) {
    return rows.slice(0, 60).map(function (r) { var d = r.data || r; return "- " + fields.map(function (f) { var v = d[f[0]]; if (v == null || v === "" || (Array.isArray(v) && !v.length)) return ""; if (f[2] === "image") return ""; return f[1] + ": " + (Array.isArray(v) ? v.join(", ") : String(v).slice(0, 160)); }).filter(Boolean).join(" | "); }).join("\n");
  }
  async function resultsContext() {
    try { var A = await gatherAll(); var T = A.trades, S = summary(T); if (!T.length) return ""; return "Their actual results across the journal: " + S.n + " trades, " + S.wr + "% win rate, " + S.r + "R total, " + S.avg + "R average, worst losing run " + streaks(T).loss + ".\n" + line("By setup", groupBy(T, function (t) { return t.setup; })) + "\n" + line("By session", groupBy(T, function (t) { return t.session; })); } catch (e) { return ""; }
  }
  function parseReview(t) {
    var sec = { GOOD: [], IMPROVE: [], NEXT: [] }, cur = null, ok = false;
    String(t).split("\n").forEach(function (l) {
      var h = l.replace(/[*#_]/g, "").trim().toUpperCase();
      if (/^(GOOD|WHAT'?S GOOD|POSITIVES?)\s*:?$/.test(h)) { cur = "GOOD"; ok = true; return; }
      if (/^(IMPROVE|WHAT TO IMPROVE|NEGATIVES?)\s*:?$/.test(h)) { cur = "IMPROVE"; ok = true; return; }
      if (/^(NEXT|NEXT STEPS?)\s*:?$/.test(h)) { cur = "NEXT"; ok = true; return; }
      var x = l.replace(/^\s*([-*•]|\d+[.)])\s*/, "").replace(/\*\*/g, "").trim();
      if (cur && x) sec[cur].push(x);
    });
    return ok ? sec : null;
  }
  function aiBoxHtml(key, title) {
    var st = AIB[key] || {}, saved = of("pagereview").filter(function (x) { return x.data.key === key; }).sort(function (a, b) { return a.data.date < b.data.date ? 1 : -1; })[0];
    var text = st.text || (saved && saved.data.text), date = st.text ? todayUK() : saved && saved.data.date;
    var body = "";
    if (text) {
      var p = parseReview(text);
      var col = function (h, items, c) { return '<div style="flex:1;min-width:240px;border-radius:12px;padding:14px 16px;background:' + c[0] + ';box-shadow:inset 0 0 0 1px ' + c[1] + ';display:flex;flex-direction:column;gap:8px"><span class="eyebrow" style="color:' + c[2] + '">' + h + '</span>' + (items.length ? items.map(function (i) { return '<div style="display:flex;gap:8px;font-size:13px;line-height:1.6;color:#e6e8eb"><span style="color:' + c[2] + '">' + (c[3] || "•") + "</span><span>" + esc(i) + "</span></div>"; }).join("") : '<div class="note" style="font-size:12px">Nothing here.</div>') + "</div>"; };
      body = p ? '<div style="display:flex;gap:12px;flex-wrap:wrap">' + col("WHAT'S GOOD", p.GOOD, ["rgba(127,217,154,.06)", "rgba(127,217,154,.22)", "#7fd99a", "+"]) + col("WHAT TO IMPROVE", p.IMPROVE, ["rgba(255,138,138,.06)", "rgba(255,138,138,.22)", "#ff8a8a", "–"]) + "</div>" + (p.NEXT.length ? '<div style="border-radius:12px;padding:14px 16px;background:#121214;box-shadow:inset 0 0 0 1px #2a2b2e;display:flex;flex-direction:column;gap:6px"><span class="eyebrow">NEXT STEP</span>' + p.NEXT.map(function (i) { return '<div style="font-size:13px;line-height:1.6">' + esc(i) + "</div>"; }).join("") + "</div>" : "")
        : '<div style="white-space:pre-wrap;font-size:13px;line-height:1.7;color:#d6d8dc">' + esc(text) + "</div>";
    }
    return '<section class="card pad" data-aibox="' + esc(key) + '" style="display:flex;flex-direction:column;gap:14px;margin-top:4px"><div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap"><div><div class="eyebrow">AI REVIEW</div><div style="font:600 17px var(--sg);margin-top:4px">' + esc(title) + '</div>' + (date ? '<div class="muted" style="font-size:11px;margin-top:2px">Last reviewed ' + fmtDate(date) + "</div>" : '<div class="note" style="font-size:12px">The positives and what to improve on this page.</div>') + '</div><button class="btn ' + (text ? "btn-ghost" : "btn-metal") + '" data-aigo style="height:42px">' + (st.busy ? "Reviewing…" : text ? "Review again" : "Review this") + "</button></div>" + body + '<span class="muted" data-aimsg style="font-size:12px">' + esc(st.err || "") + '</span><div class="note" style="font-size:11px">The AI coach is here to help you learn. It is not financial advice.</div></section>';
  }
  // page: element, key: unique id, title: what is reviewed, kind: GUIDE key, ctx: async () => text, withResults: add their trade results
  function mountAI(page, key, title, kind, ctx, withResults) {
    var old = $('[data-aibox="' + key + '"]', page); if (old) old.remove();
    var wrap = document.createElement("div"); wrap.innerHTML = aiBoxHtml(key, title);
    var box = wrap.firstChild; page.appendChild(box);
    $("[data-aigo]", box).onclick = async function () {
      var st = AIB[key] || (AIB[key] = {}); if (st.busy) return;
      st.busy = true; st.err = ""; mountAI(page, key, title, kind, ctx, withResults);
      try {
        var content = await ctx(), extra = withResults ? await resultsContext() : "";
        var prompt = "You are the SDX AI coach reviewing one part of a student's trading journal: " + title + ". " + (GUIDE[kind] || GUIDE.other) +
          "\nUse plain, simple English with no jargon. Be honest and specific to what they wrote. Give 2 to 5 points in each section. If the page is mostly empty, say what they should fill in first.\nReply in exactly this format and nothing else:\nGOOD:\n- point\nIMPROVE:\n- point\nNEXT:\n- one clear next step\n\nHERE IS THE PAGE:\n" + (content || "(empty)").slice(0, 7000) + (extra ? "\n\n" + extra : "");
        var reply = await askAI([{ role: "user", content: prompt }]);
        st.text = reply;
        try { await load(); await add("pagereview", { key: key, title: title, date: todayUK(), text: reply }); } catch (e) { }
      } catch (e) { st.err = "The AI coach couldn't answer just now. Try again in a minute."; }
      st.busy = false; mountAI(page, key, title, kind, ctx, withResults);
    };
  }
  window.SDX_JOURNAL = { load: load, of: of, docBy: docBy, byId: byId, save: save, add: add, accMetrics: accMetrics, loadTrades: loadTrades, D: D, money: money, num: num, todayUK: todayUK };
  window.SDX_AI_BOX = function (page, key, title, kind, ctx, withResults) { load().then(function (err) { if (!err) mountAI(page, key, title, kind, ctx, withResults); }); };

  // ======================= TRADING REFERENCE PAGES =======================
  function pipsPage(page) {
    var rows = [["Most forex pairs (EURUSD, GBPUSD…)", "0.0001", "4th decimal", "1.08500 → 1.08600 = 10 pips"], ["JPY pairs (GBPJPY, USDJPY…)", "0.01", "2nd decimal", "190.50 → 190.60 = 10 pips"], ["Gold (XAUUSD)", "0.10", "1st decimal", "2650.0 → 2651.0 = 10 pips"], ["Indices (NAS100, US30, GER30…)", "1.0", "Whole number (points)", "20000 → 20010 = 10 points"]];
    page.innerHTML = crumb("Pips") + head("TRADING", "Pips", "", "What one pip is on each market. Most brokers show one extra decimal, called a pipette.") +
      '<section class="card"><div class="scroll-x"><table style="min-width:620px"><thead><tr style="background:#0c0c0d"><th>Market</th><th>1 pip</th><th>Where to look</th><th>Example</th></tr></thead><tbody>' + rows.map(function (r) { return '<tr><td style="font-weight:600">' + r[0] + '</td><td style="font-family:var(--sg)">' + r[1] + '</td><td class="muted">' + r[2] + "</td><td>" + r[3] + "</td></tr>"; }).join("") + "</tbody></table></div></section>" +
      '<section class="card pad" style="display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap"><div class="note">Brokers can set up gold and indices differently. Always check one pip on your own platform before you size a trade.</div><a class="btn btn-metal" href="#/lots">Open Lot Sizing</a></section>';
  }
  function drawdownPage(page) {
    var dd = [5, 10, 20, 30, 40, 50, 60, 70, 80, 90];
    page.innerHTML = crumb("Drawdown Recovery Rate") + head("TRADING", "Drawdown", "recovery.", "How much you need to make back after a loss. The deeper the drawdown, the harder it gets.") +
      '<section class="card"><table><thead><tr style="background:#0c0c0d"><th>Drawdown</th><th>Gain needed to recover</th><th style="width:45%"></th></tr></thead><tbody>' + dd.map(function (d) { var g = d / (100 - d) * 100; return '<tr><td style="font-family:var(--sg);font-weight:600" class="neg">-' + d + '%</td><td style="font-family:var(--sg);font-weight:600" class="pos">+' + (g % 1 ? g.toFixed(1) : g) + "%</td><td>" + bar(Math.min(100, g / 9)) + "</td></tr>"; }).join("") + "</tbody></table></section>" +
      '<section class="card pad" style="display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap"><label class="field" style="flex:1;min-width:160px">Your drawdown (%)<input class="input" id="ddIn" type="number" step="0.1" placeholder="e.g. 15"></label><div style="flex:1;min-width:160px"><div class="eyebrow">YOU NEED</div><div id="ddOut" style="font:700 30px var(--sg)">—</div></div></section>';
    $("#ddIn", page).oninput = function () { var v = num(this.value); $("#ddOut", page).textContent = v != null && v > 0 && v < 100 ? "+" + (v / (100 - v) * 100).toFixed(1) + "%" : "—"; };
  }

  // ======================= ROUTER =======================
  P.journal = function (page, sub) {
    sub = sub || [];
    var s = sub[0];
    TB.open = null; FA.open = null; RV.open = null;
    if (s === "signals") { location.replace("#/tracker/mine"); return; }
    if (s === "trades" || s === "data") return ORIG(page, sub);
    if (s === "d" && sub[1]) return docPage(page, sub[1]);
    if (s === "newplan") return newPlan();
    if (s === "newpage") return newPage(sub[1]);
    if (s === "setups") return setupsPage(page);
    if (s === "t" && sub[1]) return tablePage(page, sub[1]);
    if (s === "funded") return fundedPage(page);
    if (s === "reviews") return reviewsPage(page, sub[1]);
    if (s === "pips") return pipsPage(page);
    if (s === "ai") return aiPage(page);
    if (s === "drawdown") return drawdownPage(page);
    return hub(page);
  };
})();
