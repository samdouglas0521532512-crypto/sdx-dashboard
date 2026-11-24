/* SDX Members Dashboard: Trade Review (Elite members send a trade, Sam reviews it) */
(function () {
  "use strict";
  var P = window.SDX_PAGES;
  function X() { return window.SDX; }
  function esc(s) { return X().esc(s); }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function today() { return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(new Date()); }
  function dmy(t) { return t ? new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : ""; }

  var RESULTS = ["Running", "Win", "Loss", "Breakeven", "Didn't take it"];
  var F = { pair: "", dir: "Buy", date: "", model: "", result: "Running", note: "", urls: [], up: false, msg: "", sending: false };
  var MINE = { rows: null };

  function statusTag(d) {
    return d.status === "reviewed"
      ? '<span class="tag" style="background:rgba(var(--r-127-217-154),.14);color:var(--t-7fd99a)">REVIEWED</span>'
      : '<span class="tag" style="background:rgba(var(--r-255-159-67),.14);color:var(--t-ffb26b)">WAITING FOR SAM</span>';
  }
  function shots(urls, w) {
    return (urls || []).length ? '<div style="display:flex;gap:8px;flex-wrap:wrap">' + urls.map(function (u) {
      return '<a href="' + esc(u) + '" target="_blank" rel="noopener"><img src="' + esc(u) + '" alt="Trade screenshot" style="width:' + (w || 180) + 'px;height:' + Math.round((w || 180) * 0.62) + 'px;object-fit:cover;border-radius:10px;display:block;box-shadow:inset 0 0 0 1px var(--t-1f2023)"></a>';
    }).join("") + "</div>" : "";
  }
  function facts(d) {
    return '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><span style="font:600 18px var(--sg)">' + esc(d.pair || "Trade") + '</span>' +
      '<span class="tag" style="background:' + (d.dir === "Sell" ? "rgba(var(--r-255-138-138),.14);color:var(--t-ff8a8a)" : "rgba(var(--r-127-217-154),.14);color:var(--t-7fd99a)") + '">' + esc((d.dir || "").toUpperCase()) + "</span>" +
      (d.result ? '<span class="tag" style="background:var(--t-1c1c1e);color:var(--t-c9ced6)">' + esc(d.result.toUpperCase()) + "</span>" : "") +
      '<span class="muted" style="font-size:12px">' + esc(dmy(d.date)) + (d.model ? " · " + esc(d.model) : "") + "</span></div>";
  }
  window.SDX_REVIEW_PARTS = { statusTag: statusTag, shots: shots, facts: facts };

  async function load() {
    try {
      var r = await X().sb.from("journal_items").select("*").eq("kind", "review").order("created_at", { ascending: false });
      MINE.rows = r.error ? [] : (r.data || []);
    } catch (e) { MINE.rows = []; }
  }

  function draw(page) {
    if (!F.date) F.date = today();
    var rows = MINE.rows || [];
    var waiting = rows.filter(function (x) { return (x.data || {}).status !== "reviewed"; }).length;
    page.innerHTML =
      '<section class="hero" style="min-height:170px"><div class="eyebrow">ELITE</div><h1>Trade review.</h1><div style="font-size:14px;color:#2a2c30">Send me a trade, win or loss, and I will go through it with you.</div></section>' +
      '<section class="card pad" style="display:flex;flex-direction:column;gap:16px"><div class="eyebrow">SEND A TRADE</div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px">' +
      '<label class="field">Pair<input class="input" id="rvPair" placeholder="e.g. XAUUSD" value="' + esc(F.pair) + '"></label>' +
      '<label class="field">Date<input class="input" id="rvDate" type="date" value="' + esc(F.date) + '"></label>' +
      '<label class="field">Entry model<input class="input" id="rvModel" placeholder="e.g. Failed Break" value="' + esc(F.model) + '"></label>' +
      '<label class="field">Result<select class="input" id="rvResult">' + RESULTS.map(function (x) { return "<option" + (F.result === x ? " selected" : "") + ">" + esc(x) + "</option>"; }).join("") + "</select></label></div>" +
      '<div class="field">Direction<div class="chips">' + ["Buy", "Sell"].map(function (x) { return '<button type="button" class="chip' + (F.dir === x ? " on" : "") + '" data-dir="' + x + '">' + x + "</button>"; }).join("") + "</div></div>" +
      '<div class="field">Screenshots (up to 4: your entry, and the higher timeframe if you can)' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-top:6px">' + F.urls.map(function (u, i) {
        return '<span style="position:relative"><img src="' + esc(u) + '" alt="Screenshot" style="width:130px;height:82px;object-fit:cover;border-radius:10px;display:block"><button type="button" data-rm="' + i + '" aria-label="Remove" style="position:absolute;top:-6px;right:-6px;width:24px;height:24px;border-radius:50%;border:none;cursor:pointer;background:#0a0a0a;color:#fff;font-size:14px;line-height:1">×</button></span>';
      }).join("") +
      (F.urls.length < 4 ? '<label class="btn btn-ghost" style="cursor:pointer;height:42px">' + (F.up ? "Uploading…" : "Add screenshot") + '<input type="file" id="rvFile" accept="image/*" multiple style="display:none"></label>' : "") + "</div></div>" +
      '<label class="field">What do you want me to look at?<textarea class="input" id="rvNote" rows="4" style="height:auto;padding:12px 14px;line-height:1.5" placeholder="e.g. Was my entry too early? Should my stop have been above the high?">' + esc(F.note) + "</textarea></label>" +
      '<div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap"><button class="btn btn-metal" id="rvSend"' + (F.sending || F.up ? " disabled" : "") + ">" + (F.sending ? "Sending…" : "Send for review") + '</button><span class="note" id="rvMsg">' + esc(F.msg) + "</span></div></section>" +
      '<div style="display:flex;justify-content:space-between;align-items:center"><span class="eyebrow">YOUR TRADES</span><span class="muted" style="font-size:12px">' + rows.length + " sent" + (waiting ? " · " + waiting + " waiting" : "") + "</span></div>" +
      (MINE.rows === null ? '<div class="note">Loading…</div>' : !rows.length ? '<div class="card pad note" style="text-align:center">No trades sent yet. Your first one will show here with my review.</div>' :
        rows.map(function (x) {
          var d = x.data || {};
          return '<section class="card pad" style="display:flex;flex-direction:column;gap:12px"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center">' + facts(d) + statusTag(d) + "</div>" +
            shots(d.urls, 170) +
            (d.note ? '<div><div class="eyebrow">YOUR QUESTION</div><div style="font-size:14px;line-height:1.6;margin-top:4px;white-space:pre-wrap">' + esc(d.note) + "</div></div>" : "") +
            (d.reply ? '<div style="padding:14px 16px;border-radius:12px;background:var(--t-121214);box-shadow:inset 0 0 0 1px var(--t-c9ccd1)"><div class="eyebrow">SAM\'S REVIEW · ' + esc(dmy(d.reviewed_at)) + '</div><div style="font-size:14px;line-height:1.65;margin-top:6px;white-space:pre-wrap">' + esc(d.reply) + "</div></div>" : '<div class="note" style="font-size:12px">Sent ' + esc(dmy(x.created_at)) + ". I will review it as soon as I can.</div>") +
            "</section>";
        }).join(""));
    wire(page);
  }

  function keep(page) {
    F.pair = $("#rvPair", page).value; F.date = $("#rvDate", page).value; F.model = $("#rvModel", page).value;
    F.result = $("#rvResult", page).value; F.note = $("#rvNote", page).value;
  }
  function wire(page) {
    $$("[data-dir]", page).forEach(function (b) { b.onclick = function () { keep(page); F.dir = b.dataset.dir; draw(page); }; });
    $$("[data-rm]", page).forEach(function (b) { b.onclick = function () { keep(page); F.urls.splice(+b.dataset.rm, 1); draw(page); }; });
    var fi = $("#rvFile", page);
    if (fi) fi.onchange = async function (e) {
      keep(page);
      var files = Array.prototype.slice.call(e.target.files || []).slice(0, 4 - F.urls.length);
      if (!files.length) return;
      F.up = true; F.msg = ""; draw(page);
      try { for (var i = 0; i < files.length; i++) F.urls.push(await window.SDX_UPLOAD(files[i])); }
      catch (er) { F.msg = "Couldn't add the screenshot. Try again."; }
      F.up = false; draw(page);
    };
    $("#rvSend", page).onclick = async function () {
      keep(page);
      if (!F.pair.trim()) { F.msg = "Add the pair first."; draw(page); return; }
      if (!F.urls.length) { F.msg = "Add at least one screenshot."; draw(page); return; }
      F.sending = true; F.msg = ""; draw(page);
      try {
        var uid = (await X().sb.auth.getSession()).data.session.user.id;
        var data = { pair: F.pair.trim().toUpperCase(), dir: F.dir, date: F.date, model: F.model.trim(), result: F.result, note: F.note.trim(), urls: F.urls.slice(), status: "waiting", at: new Date().toISOString() };
        var r = await X().sb.from("journal_items").insert({ user_id: uid, kind: "review", data: data }).select().single();
        if (r.error) throw r.error;
        (MINE.rows = MINE.rows || []).unshift(r.data || { id: Date.now(), data: data, created_at: data.at });
        F = { pair: "", dir: "Buy", date: today(), model: "", result: "Running", note: "", urls: [], up: false, msg: "Sent. Your trade is waiting for review.", sending: false };
      } catch (er) { F.sending = false; F.msg = "Couldn't send: " + (er.message || er); }
      draw(page);
    };
  }

  P.review = function (page) {
    draw(page);
    if (MINE.rows === null) load().then(function () { if (location.hash.indexOf("review") > -1) draw(page); });
  };
})();
