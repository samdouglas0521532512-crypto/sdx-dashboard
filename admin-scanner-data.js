/* SDX Members Dashboard: Admin > Scanner data
   All years: every tested version side by side. A year: 12 month calendar. A month: every scanner, day calendar, trades.
   The results file is only loaded when this tab is opened. */
(function () {
  "use strict";
  function esc(s) { return window.SDX.esc(s); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  var SCANNERS = [["chrome", "SDX Pulse"], ["platinum", "SDX Sniper"], ["titanium", "SDX Precision"], ["obsidian", "SDX Phantom"], ["cobalt", "SDX Raid"], ["iridium", "SDX Ghost"]];
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var RV = { TP: 2, BE: 0, SL: -1 };
  var S = { mkt: "XAUUSD", sl: { e: "close", rf: 0.25, k: "R" }, year: "2025", month: null, openList: {}, ver: {}, loading: false, failed: false };

  function data() { return window.SDX_SCANNER_DATA || {}; }
  function markets() { var m = {}; Object.keys(data()).forEach(function (k) { Object.keys(data()[k].markets || {}).forEach(function (x) { m[x] = 1; }); }); return Object.keys(m).sort().reverse(); }
  function D(key) { var d = data()[key]; return d && d.markets ? d.markets[S.mkt] || null : null; }
  function versions(key) { var d = D(key); return d ? d.versions : []; }
  function curVer(key) {
    var d = D(key); if (!d) return null;
    var id = S.ver[key + S.mkt] || d["default"];
    return d.versions.filter(function (v) { return v.id === id; })[0] || d.versions[0];
  }
  function inPeriod(L, y, m) {
    if (y === "all") return L;
    var pre = y + (m != null ? "-" + String(m + 1).padStart(2, "0") : "");
    return L.filter(function (t) { return t[0].indexOf(pre) === 0; });
  }
  function trades(key, y, m) { var v = curVer(key); return v ? inPeriod(v.trades, y, m) : []; }
  function allTrades(y, m) { var out = []; SCANNERS.forEach(function (s) { out = out.concat(trades(s[0], y, m)); }); return out; }
  function r(t) { return RV[t[5]]; }
  function sumR(L) { return Math.round(L.reduce(function (a, t) { return a + r(t); }, 0) * 10) / 10; }
  function rTxt(x) { return (x > 0 ? "+" : "") + x + "R"; }
  function cls(x) { return x > 0 ? "pos" : x < 0 ? "neg" : ""; }
  function count(L, res) { return L.filter(function (t) { return t[5] === res; }).length; }
  function wr(L) { var w = count(L, "TP"), l = count(L, "SL"); return w + l ? Math.round((w / (w + l)) * 1000) / 10 + "%" : "—"; }
  function drawdown(L) { var eq = 0, pk = 0, dd = 0; L.forEach(function (t) { eq += r(t); pk = Math.max(pk, eq); dd = Math.min(dd, eq - pk); }); return dd; }
  function loseRun(L) { var run = 0, best = 0; L.forEach(function (t) { run = t[5] === "SL" ? run + 1 : 0; best = Math.max(best, run); }); return best; }
  function posMonths(L) {
    var m = {}; L.forEach(function (t) { var k = t[0].slice(0, 7); m[k] = (m[k] || 0) + r(t); });
    var ks = Object.keys(m); return ks.filter(function (k) { return m[k] > 0; }).length + "/" + ks.length;
  }
  function weeks(L) { if (L.length < 2) return "—"; var d = (new Date(L[L.length - 1][0]) - new Date(L[0][0])) / 6048e5; return d > 0 ? Math.round((L.length / d) * 10) / 10 : "—"; }
  function tile(k, v, c) { return '<div class="tile"><span class="k">' + esc(k) + '</span><span class="v ' + (c || "") + '">' + esc(v) + "</span></div>"; }
  function stats(L, extra) {
    return '<div class="tiles">' + tile("Trades", L.length) + tile("Wins", count(L, "TP"), "pos") + tile("Risk free", count(L, "BE")) + tile("Losses", count(L, "SL"), "neg") +
      tile("Win rate (W vs L)", wr(L)) + tile("Total R", rTxt(sumR(L)), cls(sumR(L))) +
      (extra ? tile("Worst drawdown", rTxt(drawdown(L)), "neg") + tile("Longest losing run", loseRun(L)) + tile("Positive months", posMonths(L)) + tile("Trades per week", weeks(L)) : "") + "</div>";
  }
  function years() {
    var ys = {};
    Object.keys(data()).forEach(function (k) { versions(k).forEach(function (v) { v.trades.forEach(function (t) { ys[t[0].slice(0, 4)] = 1; }); }); });
    return Object.keys(ys).sort();
  }
  function card(inner, gap) { return '<section class="card pad" style="display:flex;flex-direction:column;gap:' + (gap || 14) + 'px">' + inner + "</section>"; }
  function verPicker(key) {
    var V = versions(key); if (V.length < 2) return "";
    var cur = curVer(key).id;
    return '<label style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><span class="note" style="font-size:12px">Version</span><select class="input" data-sdv="' + key + '" style="height:38px;width:auto;font-size:13px">' +
      V.map(function (v) { return '<option value="' + esc(v.id) + '"' + (v.id === cur ? " selected" : "") + ">" + esc(v.name) + "</option>"; }).join("") + "</select></label>";
  }

  // ---------- comparison of every version of a scanner ----------
  function compare(key, y, m, full) {
    var V = versions(key); if (V.length < 2) return "";
    var cur = curVer(key).id;
    var best = null;
    var rows = V.map(function (v) {
      var L = inPeriod(v.trades, y, m), R = sumR(L);
      if (L.length && (best === null || R > best)) best = R;
      return { v: v, L: L, R: R };
    });
    var hd = "<th>Version</th><th class=\"r\">Trades</th><th class=\"r\">W / RF / L</th><th class=\"r\">Win rate</th><th class=\"r\">Total R</th>" + (full ? '<th class="r">Drawdown</th><th class="r">Losing run</th><th class="r">Positive months</th>' : "");
    return '<div class="scroll-x"><table style="min-width:' + (full ? 820 : 520) + 'px"><thead><tr>' + hd + "</tr></thead><tbody>" +
      rows.map(function (x) {
        var L = x.L, on = x.v.id === cur, top = L.length && x.R === best;
        return '<tr style="' + (on ? "background:rgba(233,237,242,.06)" : "") + '"><td>' + esc(x.v.name) + (top ? ' <span class="tag" style="margin-left:6px">Best</span>' : "") + (on ? ' <span class="muted" style="font-size:11px">· showing</span>' : "") + "</td>" +
          '<td class="r">' + L.length + '</td><td class="r muted">' + count(L, "TP") + " / " + count(L, "BE") + " / " + count(L, "SL") + '</td><td class="r">' + wr(L) + '</td><td class="r ' + cls(x.R) + '" style="font-weight:600">' + (L.length ? rTxt(x.R) : "—") + "</td>" +
          (full ? '<td class="r neg">' + rTxt(drawdown(L)) + '</td><td class="r">' + loseRun(L) + '</td><td class="r">' + posMonths(L) + "</td>" : "") + "</tr>";
      }).join("") + "</tbody></table></div>";
  }
  function yearByYear(key) {
    var V = versions(key), ys = years(); if (V.length < 2) return "";
    return '<div class="scroll-x"><table style="min-width:640px"><thead><tr><th>Version</th>' + ys.map(function (y) { return '<th class="r">' + y + "</th>"; }).join("") + "</tr></thead><tbody>" +
      V.map(function (v) {
        return "<tr><td>" + esc(v.name) + "</td>" + ys.map(function (y) { var L = inPeriod(v.trades, y), R = sumR(L); return '<td class="r ' + cls(R) + '">' + (L.length ? rTxt(R) : "—") + "</td>"; }).join("") + "</tr>";
      }).join("") + "</tbody></table></div>";
  }

  // ---------- SL size test ----------
  function slTest(key, y) {
    var d = D(key), T = d && d.slTest; if (!T) return "";
    var o = S.sl, per = y || "all";
    var rows = T.rows.filter(function (x) { return x.e === o.e && x.rf === o.rf; });
    var sls = [], rrs = [];
    rows.forEach(function (x) { if (sls.indexOf(x.sl) < 0) sls.push(x.sl); if (rrs.indexOf(x.rr) < 0) rrs.push(x.rr); });
    sls.sort(function (a, b) { return a - b; }); rrs.sort(function (a, b) { return a - b; });
    function cell(x) {
      var q = x && x.res[per]; if (!q || !q.n) return null;
      var w = q.W + q.L ? Math.round((q.W / (q.W + q.L)) * 1000) / 10 : 0;
      return { R: q.R, wr: w, dd: q.dd, q: q };
    }
    var best = null;
    rows.forEach(function (x) { var c = cell(x); if (c && (best === null || c.R > best)) best = c.R; });
    function chip(g, v, label) { return '<button class="chip' + (String(o[g]) === String(v) ? " on" : "") + '" data-slo="' + g + '" data-slv="' + v + '">' + esc(label) + "</button>"; }
    var tbl = '<div class="scroll-x"><table style="min-width:620px"><thead><tr><th>SL</th>' + rrs.map(function (x) { return '<th class="r">TP ' + x + "R</th>"; }).join("") + "</tr></thead><tbody>" +
      sls.map(function (sl) {
        return "<tr><td>" + (sl === 0 ? "Top of zone" : sl + " pips") + "</td>" + rrs.map(function (rr) {
          var c = cell(rows.filter(function (x) { return x.sl === sl && x.rr === rr; })[0]);
          if (!c) return '<td class="r muted">—</td>';
          var main = o.k === "R" ? '<span class="' + cls(c.R) + '" style="font-weight:600">' + rTxt(c.R) + "</span>" : o.k === "wr" ? c.wr + "%" : '<span class="neg">' + rTxt(c.dd) + "</span>";
          var top = c.R === best;
          return '<td class="r" style="' + (top ? "box-shadow:inset 0 0 0 1px rgba(127,217,154,.6)" : "") + '" title="' + c.q.n + " trades · " + c.q.W + "W " + c.q.BE + "RF " + c.q.L + "L · win rate " + c.wr + "% · " + rTxt(c.R) + " · drawdown " + rTxt(c.dd) + '">' + main + "</td>";
        }).join("") + "</tr>";
      }).join("") + "</tbody></table></div>";
    return '<span class="eyebrow" style="margin-top:6px">SL SIZE TEST · ' + (per === "all" ? "ALL YEARS" : per) + "</span>" +
      '<div class="note" style="font-size:12px">' + esc(T.note) + " Green outline = most R. Hover a box for the full numbers.</div>" +
      '<div style="display:flex;gap:14px;flex-wrap:wrap"><div class="chips">' + chip("e", "retest", "Retest") + chip("e", "close", "Candle close") + '</div><div class="chips">' + chip("rf", 0.5, "RF 0.5R") + chip("rf", 0.25, "RF 0.25R") +
      '</div><div class="chips">' + chip("k", "R", "Total R") + chip("k", "wr", "Win rate") + chip("k", "dd", "Drawdown") + "</div></div>" + tbl;
  }

  // ---------- all years ----------
  function allView() {
    var parts = card('<span class="eyebrow">ALL YEARS · ALL SCANNERS</span><div class="note" style="font-size:12px">Uses the version picked for each scanner below.</div>' + stats(allTrades("all"), true));
    SCANNERS.forEach(function (s) {
      var d = D(s[0]);
      var head = '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap"><span class="eyebrow">' + esc(s[1].toUpperCase()) + "</span>" + (d ? verPicker(s[0]) : "") + "</div>";
      if (!d) { parts += card(head + '<div class="note">No results for this scanner yet.</div>', 8); return; }
      var v = curVer(s[0]);
      parts += card(head + '<div class="note" style="font-size:12px">' + esc(S.mkt + " · " + d.from + " to " + d.to + " · " + v.settings) + "</div>" + stats(v.trades, true) +
        '<span class="eyebrow" style="margin-top:6px">EVERY VERSION TESTED</span>' + compare(s[0], "all", null, true) +
        '<span class="eyebrow" style="margin-top:6px">EACH YEAR</span>' + yearByYear(s[0]) + slTest(s[0], "all"));
    });
    return parts;
  }

  // ---------- year: 12 month calendar ----------
  function yearView() {
    var y = S.year, L = allTrades(y);
    var cells = MONTHS.map(function (name, m) {
      var T = allTrades(y, m), x = sumR(T);
      if (!T.length) return '<div class="jday off sdm-m" style="min-height:96px;box-shadow:inset 0 0 0 1px #18191b"><span class="dn" style="font-size:12px">' + name + '</span><span class="muted" style="font-size:12px">No trades</span></div>';
      return '<button class="jday sdm-m ' + (x > 0 ? "up" : x < 0 ? "down" : "flat") + '" data-sdm="' + m + '" style="min-height:96px;cursor:pointer;border:0;text-align:left;color:inherit">' +
        '<span class="dn" style="font-size:12px;color:#c9ccd1">' + name + "</span>" +
        '<span class="dr" style="font-size:22px">' + rTxt(x) + "</span>" +
        '<span class="dn">' + T.length + " trades · " + count(T, "TP") + "W " + count(T, "BE") + "RF " + count(T, "SL") + "L</span></button>";
    }).join("");
    var cmp = SCANNERS.filter(function (s) { return versions(s[0]).length > 1; }).map(function (s) {
      return card('<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap"><span class="eyebrow">' + esc(s[1].toUpperCase()) + " · EVERY VERSION IN " + y + "</span>" + verPicker(s[0]) + "</div>" + compare(s[0], y, null, true) + slTest(s[0], y));
    }).join("");
    return card('<span class="eyebrow">' + y + " · ALL SCANNERS</span>" + stats(L, true)) +
      card('<span class="eyebrow">MONTHS · TAP ONE FOR EVERY SCANNER</span><div class="sdm-grid">' + cells + "</div>", 12) + cmp;
  }

  // ---------- month: every scanner ----------
  function dayCal(T, y, m) {
    var first = (new Date(Date.UTC(y, m, 1)).getUTCDay() + 6) % 7; // Monday first
    var n = new Date(Date.UTC(y, m + 1, 0)).getUTCDate(), byDay = {};
    T.forEach(function (t) { var d = +t[0].slice(8, 10); byDay[d] = (byDay[d] || 0) + r(t); });
    var html = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(function (d) { return '<div class="dn" style="font-size:10px;color:#6b7078;text-align:center">' + d + "</div>"; }).join("");
    for (var i = 0; i < first; i++) html += '<div class="jday off"></div>';
    for (var d = 1; d <= n; d++) {
      var x = byDay[d] != null ? Math.round(byDay[d] * 10) / 10 : null;
      html += '<div class="jday ' + (x == null ? "" : x > 0 ? "up" : x < 0 ? "down" : "flat") + '"><span class="dn">' + d + '</span><span class="dr">' + (x == null ? "" : rTxt(x)) + "</span></div>";
    }
    return '<div class="jcal">' + html + "</div>";
  }
  function tradeList(T) {
    return '<div class="scroll-x"><table style="min-width:560px;margin-top:6px"><thead><tr><th>Date</th><th>Time</th><th>Side</th><th class="r">Entry</th><th class="r">SL</th><th class="r">TP</th><th>Result</th><th class="r">R</th></tr></thead><tbody>' +
      T.map(function (t) {
        var res = t[5] === "TP" ? "Win" : t[5] === "BE" ? "Risk free" : "Loss";
        return '<tr><td class="muted">' + esc(new Date(t[0].slice(0, 10) + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })) + '</td><td class="muted">' + esc(t[0].slice(11, 16)) + "</td><td>" + (t[1] === 1 ? "BUY" : "SELL") +
          '</td><td class="r">' + t[2] + '</td><td class="r">' + t[3] + '</td><td class="r">' + t[4] + "</td><td>" + res + '</td><td class="r ' + cls(r(t)) + '">' + rTxt(r(t)) + "</td></tr>";
      }).join("") + "</tbody></table></div>";
  }
  function monthView() {
    var y = S.year, m = S.month, L = allTrades(y, m);
    var cards = SCANNERS.map(function (s) {
      var d = D(s[0]);
      var head = '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap"><span class="eyebrow">' + esc(s[1].toUpperCase()) + "</span>" + (d ? verPicker(s[0]) : "") + "</div>";
      if (!d) return card(head + '<div class="note">No results for this scanner yet.</div>', 8);
      var v = curVer(s[0]), T = trades(s[0], y, m);
      var top = head + '<div class="note" style="font-size:12px">' + esc(S.mkt + " · " + v.settings) + "</div>";
      var cmp = versions(s[0]).length > 1 ? '<span class="eyebrow" style="margin-top:6px">EVERY VERSION THIS MONTH</span>' + compare(s[0], y, m, false) : "";
      if (!T.length) return card(top + '<div class="note">No trades this month on this version.</div>' + cmp);
      var open = S.openList[s[0]];
      return card(top + stats(T) + dayCal(T, y, m) +
        '<button class="btn btn-ghost" data-sdl="' + s[0] + '" style="align-self:flex-start">' + (open ? "Hide trades" : "Show all " + T.length + " trades") + "</button>" + (open ? tradeList(T) : "") + cmp);
    }).join("");
    return '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap"><button class="btn btn-ghost" data-sdback="1">Back to ' + y + "</button>" +
      '<button class="chip" data-sdstep="-1">Previous month</button><button class="chip" data-sdstep="1">Next month</button></div>' +
      card('<span class="eyebrow">' + MONTHS[m].toUpperCase() + " " + y + " · ALL SCANNERS</span>" + stats(L)) + cards;
  }

  function render(redraw) {
    if (!window.SDX_SCANNER_DATA) {
      if (S.failed) return '<div class="note">Couldn\'t load the scanner results. Refresh the page to try again.</div>';
      if (!S.loading) {
        S.loading = true;
        var sc = document.createElement("script");
        sc.src = "scanner-data.js?v=4";
        sc.onload = function () { S.loading = false; if (redraw) redraw(); };
        sc.onerror = function () { S.loading = false; S.failed = true; if (redraw) redraw(); };
        document.head.appendChild(sc);
      }
      return '<div class="note">Loading scanner results…</div>';
    }
    var ys = years();
    if (!ys.length) return '<div class="note">No scanner results yet.</div>';
    if (S.year !== "all" && ys.indexOf(S.year) < 0) { S.year = "all"; S.month = null; }
    return '<div style="display:flex;flex-direction:column;gap:16px">' +
      '<div class="chips">' + markets().map(function (m) { return '<button class="chip' + (S.mkt === m ? " on" : "") + '" data-sdk="' + m + '">' + m + "</button>"; }).join("") + "</div>" +
      '<div class="chips">' + [["all", "All years"]].concat(ys.map(function (y) { return [y, y]; })).map(function (y) { return '<button class="chip' + (S.year === y[0] ? " on" : "") + '" data-sdy="' + y[0] + '">' + y[1] + "</button>"; }).join("") + "</div>" +
      (S.year === "all" ? allView() : S.month == null ? yearView() : monthView()) + "</div>";
  }
  function wire(page, redraw) {
    $$("[data-sdk]", page).forEach(function (b) { b.onclick = function () { S.mkt = b.dataset.sdk; redraw(); }; });
    $$("[data-sdy]", page).forEach(function (b) { b.onclick = function () { S.year = b.dataset.sdy; S.month = null; redraw(); }; });
    $$("[data-sdm]", page).forEach(function (b) { b.onclick = function () { S.month = +b.dataset.sdm; S.openList = {}; redraw(); window.scrollTo(0, 0); }; });
    $$("[data-sdback]", page).forEach(function (b) { b.onclick = function () { S.month = null; redraw(); }; });
    $$("[data-sdl]", page).forEach(function (b) { b.onclick = function () { S.openList[b.dataset.sdl] = !S.openList[b.dataset.sdl]; redraw(); }; });
    $$("[data-slo]", page).forEach(function (b) { b.onclick = function () { var g = b.dataset.slo, v = b.dataset.slv; S.sl[g] = g === "rf" ? +v : v; redraw(); }; });
    $$("[data-sdv]", page).forEach(function (sel) { sel.onchange = function () { S.ver[sel.dataset.sdv + S.mkt] = sel.value; redraw(); }; });
    $$("[data-sdstep]", page).forEach(function (b) {
      b.onclick = function () {
        var y = +S.year, m = S.month + +b.dataset.sdstep;
        if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; }
        if (years().indexOf(String(y)) < 0) return;
        S.year = String(y); S.month = m; S.openList = {}; redraw();
      };
    });
  }
  window.SDX_ADMIN_SCANDATA = { render: render, wire: wire };
})();
