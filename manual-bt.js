/* SDX Members Dashboard: Manual backtest (under ADMIN).
   Every Failed Break Mech backtest trade (the same trades as the Mech groups and the tracker), each with
   Valid / Not valid tick boxes so the trades can be checked on the chart.
   Ticks are saved to the logged-in person's own rows in the backtests table, model "Failed Break Mech check", one row per pair. */
(function () {
  "use strict";
  var P = window.SDX_PAGES = window.SDX_PAGES || {};
  function X() { return window.SDX; }
  function esc(s) { return X().esc(s); }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function sb() { return X().sb; }
  function uid() { return X().state.session.user.id; }

  var MODEL = "Failed Break Mech check";
  var PAIRS = ["XAUUSD", "EURUSD", "GER30", "GBPUSD"];
  var DEC = { XAUUSD: 2, GER30: 1, EURUSD: 5, GBPUSD: 5 };
  var PIP = { XAUUSD: 0.1, GER30: 1, EURUSD: 0.0001, GBPUSD: 0.0001 };
  var TFS = ["M5", "M15", "M30", "H1"];
  var PER = 50;

  // checks[pair][key] = "v" (valid) or "x" (not valid); rowId[pair] = backtests row id
  var M = { ready: false, trades: [], checks: {}, rowId: {}, pair: "all", tf: "all", res: "all", chk: "all", pg: 0, err: "", saveMsg: "" };

  function loadPair(p) {
    window.SDX_MECHBT = window.SDX_MECHBT || {};
    if (window.SDX_MECHBT[p]) return Promise.resolve();
    return new Promise(function (ok) { var sc = document.createElement("script"); sc.src = "mech-bt-" + p + ".js?v=1"; sc.onload = ok; sc.onerror = ok; document.head.appendChild(sc); });
  }

  async function load() {
    await Promise.all(PAIRS.map(loadPair));
    var all = [];
    PAIRS.forEach(function (p) {
      ((window.SDX_MECHBT || {})[p] || []).forEach(function (r) {
        all.push({ key: r[0] + "-" + r[1] + "-" + r[2], pair: p, t: r[0], tf: r[1], side: r[2] === 1 ? "Buy" : "Sell", e: r[3], sl: r[4], tp: r[5],
          res: r[9] === "tp" ? "Win" : r[9] === "sl" ? "Loss" : "BE", R: +r[10] || 0 });
      });
    });
    all.sort(function (a, b) { return b.t - a.t; }); // newest first
    M.trades = all;
    PAIRS.forEach(function (p) { M.checks[p] = {}; });
    var r = await sb().from("backtests").select("id,pair,data").eq("model", MODEL).eq("user_id", uid());
    if (r.error) M.err = r.error.message;
    else (r.data || []).forEach(function (row) { M.rowId[row.pair] = row.id; M.checks[row.pair] = (row.data && row.data.checks) || {}; });
    M.ready = true;
  }

  // ---------- saving (one row per pair, saved a moment after the last tick) ----------
  var dirty = {}, timer = null;
  function queueSave(page, p) { dirty[p] = 1; clearTimeout(timer); setMsg(page, "Saving…"); timer = setTimeout(function () { saveNow(page); }, 700); }
  async function saveNow(page) {
    var ps = Object.keys(dirty); dirty = {};
    for (var i = 0; i < ps.length; i++) {
      var p = ps[i], data = { checks: M.checks[p] }, r;
      if (M.rowId[p]) r = await sb().from("backtests").update({ data: data }).eq("id", M.rowId[p]);
      else { r = await sb().from("backtests").insert({ user_id: uid(), model: MODEL, pair: p, data: data }).select("id").single(); if (!r.error && r.data) M.rowId[p] = r.data.id; }
      if (r.error) { setMsg(page, "Couldn't save: " + r.error.message); return; }
    }
    setMsg(page, "Saved");
  }
  function setMsg(page, t) { M.saveMsg = t; var el = $("#ckMsg", page); if (el) el.textContent = t; }

  // ---------- helpers ----------
  function chk(t) { return (M.checks[t.pair] || {})[t.key] || ""; }
  function inFilter(t) { return (M.pair === "all" || t.pair === M.pair) && (M.tf === "all" || t.tf === M.tf) && (M.res === "all" || t.res === M.res); }
  function shown() {
    return M.trades.filter(function (t) {
      if (!inFilter(t)) return false;
      var c = chk(t);
      return M.chk === "all" || (M.chk === "none" && !c) || M.chk === c;
    });
  }
  function stats(list) {
    var w = 0, l = 0, b = 0, R = 0;
    list.forEach(function (t) { if (t.res === "Win") w++; else if (t.res === "Loss") l++; else b++; R += t.R; });
    return { n: list.length, w: w, l: l, b: b, R: R, wr: w + l ? Math.round(w / (w + l) * 1000) / 10 : 0 };
  }
  function rTxt(r) { var v = Math.round(r * 10) / 10; return v === 0 ? "0R" : (v > 0 ? "+" : "") + v.toLocaleString("en-GB") + "R"; }
  function cls(v) { return v > 0 ? "pos" : v < 0 ? "neg" : ""; }
  function px(t, v) { return Number(v).toLocaleString("en-GB", { minimumFractionDigits: DEC[t.pair], maximumFractionDigits: DEC[t.pair], useGrouping: false }); }
  function pips(t, a, b) { return (Math.round(Math.abs(a - b) / PIP[t.pair] * 10) / 10).toLocaleString("en-GB"); }
  function tile(k, v, c) { return '<div class="tile"><span class="k">' + k + '</span><span class="v ' + (c || "") + '">' + esc(String(v)) + "</span></div>"; }
  function tabs(attr, cur, list) { return '<div class="tabs">' + list.map(function (o) { return '<button class="tab' + (cur === o[0] ? " on" : "") + '" ' + attr + '="' + o[0] + '">' + o[1] + "</button>"; }).join("") + "</div>"; }

  // ---------- page ----------
  function draw(page) {
    var base = M.trades.filter(inFilter), rows = shown();
    var valid = base.filter(function (t) { return chk(t) === "v"; }), bad = base.filter(function (t) { return chk(t) === "x"; });
    var sa = stats(base), sv = stats(valid);
    var pages = Math.max(1, Math.ceil(rows.length / PER)); if (M.pg >= pages) M.pg = pages - 1;
    var slice = rows.slice(M.pg * PER, M.pg * PER + PER);

    var html = '<div style="display:flex;flex-direction:column;gap:8px"><div class="eyebrow">ADMIN</div><h1 class="title">Manual <span class="metal-text">backtest.</span></h1>' +
      '<div class="note">Failed Break Mech Model. Every trade from the backtest, newest first. Check each one on the chart and tick Valid or Not valid.</div></div>';
    if (M.err) html += '<div class="card pad note" style="color:var(--t-ff8a8a)">Couldn\'t load your ticks: ' + esc(M.err) + "</div>";

    html += '<div style="display:flex;flex-wrap:wrap;gap:12px;align-items:center">' +
      tabs("data-cp", M.pair, [["all", "All pairs"]].concat(PAIRS.map(function (p) { return [p, p]; }))) +
      tabs("data-ct", M.tf, [["all", "All timeframes"]].concat(TFS.map(function (t) { return [t, t]; }))) +
      tabs("data-cr", M.res, [["all", "All results"], ["Win", "Wins"], ["Loss", "Losses"], ["BE", "BE"]]) +
      tabs("data-cc", M.chk, [["all", "All"], ["none", "Not checked"], ["v", "Valid"], ["x", "Not valid"]]) + "</div>";

    html += '<div class="tiles">' + tile("Trades", sa.n.toLocaleString("en-GB")) + tile("Checked", (valid.length + bad.length).toLocaleString("en-GB")) +
      tile("Valid", valid.length.toLocaleString("en-GB"), valid.length ? "pos" : "") + tile("Not valid", bad.length.toLocaleString("en-GB"), bad.length ? "neg" : "") +
      tile("Valid rate", valid.length + bad.length ? Math.round(valid.length / (valid.length + bad.length) * 1000) / 10 + "%" : "0%") + "</div>";
    html += '<div class="note" style="font-size:13px">All trades: win rate ' + sa.wr + "%, " + rTxt(sa.R) + ". Valid trades only: " + sv.n + " trades, " + sv.w + " wins, " + sv.l + " losses, " + sv.b + " BE, win rate " + sv.wr + '%, <b class="' + cls(sv.R) + '">' + rTxt(sv.R) + "</b>. Win rate leaves breakevens out.</div>";

    var pager = rows.length > PER ? '<div style="display:flex;gap:10px;align-items:center;justify-content:center;padding:12px"><button class="tab" data-pg="-1"' + (M.pg === 0 ? " disabled" : "") + '>Newer</button><span class="muted" style="font-size:12px">Page ' + (M.pg + 1) + " of " + pages + " (" + rows.length.toLocaleString("en-GB") + ' trades)</span><button class="tab" data-pg="1"' + (M.pg >= pages - 1 ? " disabled" : "") + ">Older</button></div>" : "";
    html += '<section class="card"><div style="display:flex;justify-content:flex-end;padding:10px 14px 0"><span class="muted" id="ckMsg" style="font-size:12px">' + esc(M.saveMsg) + "</span></div>" + pager +
      '<div class="scroll-x"><table style="min-width:1080px"><thead><tr style="background:var(--t-0c0c0d)"><th>Date (UK)</th><th>Pair</th><th>TF</th><th>Side</th><th>Entry</th><th>SL</th><th>TP</th><th>Result</th><th>R</th><th style="text-align:center">Valid</th><th style="text-align:center">Not valid</th></tr></thead><tbody>' +
      slice.map(function (t) {
        var d = new Date(t.t * 60000), c = chk(t);
        var box = function (v) { return '<td style="text-align:center"><input type="checkbox" data-ck="' + t.pair + "|" + t.key + '" data-v="' + v + '"' + (c === v ? " checked" : "") + ' style="width:18px;height:18px;cursor:pointer;accent-color:' + (v === "v" ? "var(--t-7fd99a)" : "var(--t-ff8a8a)") + '"></td>'; };
        return "<tr" + (c === "v" ? ' style="background:var(--t-0f1a12)"' : c === "x" ? ' style="background:var(--t-1a0f0f)"' : "") + "><td>" +
          esc(d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/London" })) + ' <span class="muted">' + esc(d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" })) + "</span></td>" +
          "<td><b>" + t.pair + "</b></td><td>" + esc(t.tf) + "</td><td>" + t.side + "</td><td>" + px(t, t.e) + "</td>" +
          "<td>" + px(t, t.sl) + ' <span class="muted">(' + pips(t, t.e, t.sl) + ")</span></td><td>" + px(t, t.tp) + ' <span class="muted">(' + pips(t, t.tp, t.e) + ")</span></td>" +
          '<td><span class="pill ' + (t.res === "Win" ? "win" : t.res === "Loss" ? "loss" : "be") + '">' + t.res + '</span></td><td class="' + cls(t.R) + '"><b>' + rTxt(t.R) + "</b></td>" + box("v") + box("x") + "</tr>";
      }).join("") + "</tbody></table></div>" +
      (rows.length ? "" : '<div class="note" style="padding:40px;text-align:center">No trades match these filters.</div>') + pager + "</section>";
    html += '<div class="note" style="font-size:12px;margin-top:-14px">SL and TP show the distance in pips in brackets. Ticks save to your login only, so students can\'t see them. Tick a box again to clear it.</div>';

    page.innerHTML = html;
    wire(page);
  }

  function wire(page) {
    var f = function (attr, key) { $$("[" + attr + "]", page).forEach(function (b) { b.onclick = function () { M[key] = b.getAttribute(attr); M.pg = 0; draw(page); }; }); };
    f("data-cp", "pair"); f("data-ct", "tf"); f("data-cr", "res"); f("data-cc", "chk");
    $$("[data-pg]", page).forEach(function (b) { b.onclick = function () { M.pg += +b.dataset.pg; draw(page); window.scrollTo(0, 0); }; });
    $$("[data-ck]", page).forEach(function (cb) {
      cb.onchange = function () {
        var parts = cb.dataset.ck.split("|"), p = parts[0], k = parts[1], v = cb.dataset.v, ch = M.checks[p];
        if (cb.checked) ch[k] = v; else delete ch[k];
        // only one of Valid / Not valid per trade, and colour the row
        queueSave(page, p);
        draw(page); // refresh the counts
      };
    });
  }

  P.manualbt = async function (page) {
    if (!M.ready) { page.innerHTML = '<div class="note">Loading…</div>'; await load(); }
    draw(page);
  };
})();
