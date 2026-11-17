/* SDX Members Dashboard: Scanner data (admins only, under ADMIN in the menu)
   Pick a scanner, then: Trade data (all years / year calendar / month with every trade),
   Risk management (SL size test, risk numbers), Trade management (partial plans, every version tested).
   The results files only load when this page is opened. */
(function () {
  "use strict";
  function esc(s) { return window.SDX.esc(s); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  var SCANNERS = [["chrome", "SDX Pulse"], ["platinum", "SDX Sniper"], ["titanium", "SDX Precision"], ["obsidian", "SDX Phantom"], ["trap", "Structure Trap"], ["cobalt", "SDX Raid"], ["iridium", "SDX Ghost"], ["mech", "Mech Model"], ["amsweep", "AM Sweep Model"], ["m1model", "M1 Model"]];
  var TP_CHOICES = [1, 1.5, 2, 3, 4, 5, 6, 8, 10];
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var RV = { TP: 2, BE: 0, SL: -1 };
  var S = { gr: { buf: "0.5", k: "R" }, scan: null, sec: "trades", plSort: "R", mkt: null, loadingM: {}, sl: { e: "retest", rf: 0.25, k: "R" }, year: "2025", rmYear: "all", tmYear: "all", month: null, openList: {}, ver: {}, loading: false, failed: false, tp: null };

  function data() { return (window.SDX_SCANDATA || {})[S.mkt] || {}; }
  function markets() { return Object.keys(window.SDX_SCANDATA_INDEX || {}); }
  function D(key) { return data()[key] || null; }
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
  // ---------- TP tester: re-work a version's trades with one TP at S.tp R ----------
  // Trade fields 9 and 10 = furthest R price reached before the SL, and whether the SL was hit.
  // Same entries and SL, one TP, no risk free or partials.
  var tpCache = {};
  function hasMax(v) { return v && v.trades.length && v.trades[0][9] != null; }
  function vt(v) {
    if (!v) return [];
    if (!S.tp || !hasMax(v)) return v.trades;
    var ck = S.mkt + "|" + S.scan + "|" + v.id + "|" + S.tp;
    if (tpCache[ck]) return tpCache[ck];
    var out = [];
    v.trades.forEach(function (t) {
      var win = t[9] >= S.tp;
      if (!win && !t[10]) return; // never hit the new TP or the SL before the data ends
      var risk = Math.abs(t[2] - t[3]), n = t.slice();
      n[4] = Math.round((t[2] + t[1] * S.tp * risk) * 1e5) / 1e5;
      n[5] = win ? "TP" : "SL";
      n[6] = win ? S.tp : -1;
      out.push(n);
    });
    tpCache[ck] = out;
    return out;
  }
  function trades(key, y, m) { var v = curVer(key); return v ? inPeriod(vt(v), y, m) : []; }
  function allTrades(y, m) { return S.scan ? trades(S.scan, y, m) : []; }
  function scName(k) { return (SCANNERS.filter(function (s) { return s[0] === k; })[0] || [k, k])[1]; }
  function r(t) { return t[6] != null ? t[6] : RV[t[5]]; }
  function sumR(L) { return Math.round(L.reduce(function (a, t) { return a + r(t); }, 0) * 10) / 10; }
  function rTxt(x) { x = Math.round(x * 100) / 100; return (x > 0 ? "+" : "") + x + "R"; }
  function cls(x) { return x > 0 ? "pos" : x < 0 ? "neg" : ""; }
  function count(L, res) { return L.filter(function (t) { var x = r(t); return res === "TP" ? x > 0 : res === "BE" ? x === 0 : x < 0; }).length; }
  function pips(L) { var any = false, x = L.reduce(function (a, t) { if (t[7] != null) { any = true; return a + r(t) * t[7]; } return a; }, 0); return any ? Math.round(x) : null; }
  function net(L) { var any = false, x = L.reduce(function (a, t) { if (t[8] != null) { any = true; return a + r(t) - t[8]; } return a + r(t); }, 0); return any ? Math.round(x * 10) / 10 : null; }
  function pTxt(x) { return (x > 0 ? "+" : "") + x.toLocaleString("en-GB") + " pips"; }
  function tpHits(L) { var h = [0, 0, 0]; L.forEach(function (t) { var i = ["TP1", "TP2", "TP3"].indexOf(t[5]); if (i > -1) h[i]++; }); return h; }
  function wr(L) { var w = count(L, "TP"), l = count(L, "SL"); return w + l ? Math.round((w / (w + l)) * 1000) / 10 + "%" : "—"; }
  function drawdown(L) { var eq = 0, pk = 0, dd = 0; L.forEach(function (t) { eq += r(t); pk = Math.max(pk, eq); dd = Math.min(dd, eq - pk); }); return dd; }
  function loseRun(L) { var run = 0, best = 0; L.forEach(function (t) { run = r(t) < 0 ? run + 1 : 0; best = Math.max(best, run); }); return best; }
  function posMonths(L) {
    var m = {}; L.forEach(function (t) { var k = t[0].slice(0, 7); m[k] = (m[k] || 0) + r(t); });
    var ks = Object.keys(m); return ks.filter(function (k) { return m[k] > 0; }).length + "/" + ks.length;
  }
  function weeks(L) { if (L.length < 2) return "—"; var d = (new Date(L[L.length - 1][0]) - new Date(L[0][0])) / 6048e5; return d > 0 ? Math.round((L.length / d) * 10) / 10 : "—"; }
  function tile(k, v, c) { return '<div class="tile"><span class="k">' + esc(k) + '</span><span class="v ' + (c || "") + '">' + esc(v) + "</span></div>"; }
  function stats(L, extra) {
    return '<div class="tiles">' + tile("Trades", L.length) + tile("Wins", count(L, "TP"), "pos") + tile("Risk free", count(L, "BE")) + tile("Losses", count(L, "SL"), "neg") +
      tile("Win rate (W vs L)", wr(L)) + tile("Total R", rTxt(sumR(L)), cls(sumR(L))) +
      (net(L) != null ? tile("R after spread", rTxt(net(L)), cls(net(L))) : "") +
      (pips(L) != null ? tile("Total pips", pTxt(pips(L)), cls(pips(L))) : "") +
      (tpHits(L)[0] ? tile("Reached TP1 / TP2 / TP3", tpHits(L).join(" / ")) : "") +
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
      var L = inPeriod(vt(v), y, m), R = sumR(L);
      if (L.length && (best === null || R > best)) best = R;
      return { v: v, L: L, R: R };
    });
    var hd = "<th>Version</th><th class=\"r\">Trades</th><th class=\"r\">W / RF / L</th><th class=\"r\">Win rate</th><th class=\"r\">Total R</th><th class=\"r\">After spread</th><th class=\"r\">Pips</th>" + (full ? '<th class="r">Drawdown</th><th class="r">Losing run</th><th class="r">Positive months</th>' : "");
    return '<div class="scroll-x"><table style="min-width:' + (full ? 820 : 520) + 'px"><thead><tr>' + hd + "</tr></thead><tbody>" +
      rows.map(function (x) {
        var L = x.L, on = x.v.id === cur, top = L.length && x.R === best;
        return '<tr style="' + (on ? "background:rgba(233,237,242,.06)" : "") + '"><td>' + esc(x.v.name) + (S.tp ? (hasMax(x.v) ? ' <span class="muted" style="font-size:11px">· TP ' + S.tp + "R</span>" : ' <span class="muted" style="font-size:11px">· TP as tested</span>') : "") + (top ? ' <span class="tag" style="margin-left:6px">Best</span>' : "") + (on ? ' <span class="muted" style="font-size:11px">· showing</span>' : "") + "</td>" +
          '<td class="r">' + L.length + '</td><td class="r muted">' + count(L, "TP") + " / " + count(L, "BE") + " / " + count(L, "SL") + '</td><td class="r">' + wr(L) + '</td><td class="r ' + cls(x.R) + '" style="font-weight:600">' + (L.length ? rTxt(x.R) : "—") + '</td><td class="r ' + cls(net(L)) + '" style="font-weight:600">' + (L.length && net(L) != null ? rTxt(net(L)) : "—") + '</td><td class="r ' + cls(pips(L)) + '">' + (L.length && pips(L) != null ? pTxt(pips(L)) : "—") + "</td>" +
          (full ? '<td class="r neg">' + rTxt(drawdown(L)) + '</td><td class="r">' + loseRun(L) + '</td><td class="r">' + posMonths(L) + "</td>" : "") + "</tr>";
      }).join("") + "</tbody></table></div>";
  }
  function yearByYear(key) {
    var V = versions(key), ys = years(); if (V.length < 2) return "";
    return '<div class="scroll-x"><table style="min-width:640px"><thead><tr><th>Version</th>' + ys.map(function (y) { return '<th class="r">' + y + "</th>"; }).join("") + "</tr></thead><tbody>" +
      V.map(function (v) {
        return "<tr><td>" + esc(v.name) + "</td>" + ys.map(function (y) { var L = inPeriod(vt(v), y), R = sumR(L); return '<td class="r ' + cls(R) + '">' + (L.length ? rTxt(R) : "—") + "</td>"; }).join("") + "</tr>";
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

  // ---------- management plans ----------
  function plansTable(key) {
    var d = D(key), P = d && d.plans; if (!P) return "";
    var k = S.plSort;
    var rows = P.rows.slice().sort(function (a, b) { return k === "R" ? b[2] - a[2] : k === "pips" ? b[3] - a[3] : k === "win" ? b[4] - a[4] || b[2] - a[2] : b[5] - a[5] || b[2] - a[2]; });
    function chip(v, label) { return '<button class="chip' + (k === v ? " on" : "") + '" data-pls="' + v + '">' + label + "</button>"; }
    return '<span class="eyebrow">TRADE MANAGEMENT PLANS · ALL YEARS</span><div class="note" style="font-size:12px">' + esc(P.note) + "</div>" +
      '<div class="chips">' + chip("R", "Most R after spread") + chip("pips", "Most pips") + chip("win", "Most trades in profit") + chip("dd", "Smallest drawdown") + "</div>" +
      '<div class="scroll-x"><table style="min-width:900px"><thead><tr><th>Plan</th><th class="r">Total R</th><th class="r">After spread</th><th class="r">Pips</th><th class="r">In profit</th><th class="r">Drawdown</th><th class="r">Losing run</th><th class="r">2022-24 after spread</th><th class="r">2025-26 after spread</th></tr></thead><tbody>' +
      rows.map(function (x) {
        return '<tr style="' + (x[9] ? "background:rgba(233,237,242,.06)" : "") + '"><td>' + esc(x[0]) + (x[9] ? ' <span class="tag" style="margin-left:6px">In use</span>' : "") + '</td><td class="r ' + cls(x[1]) + '">' + rTxt(x[1]) +
          '</td><td class="r ' + cls(x[2]) + '" style="font-weight:600">' + rTxt(x[2]) + '</td><td class="r ' + cls(x[3]) + '">' + pTxt(x[3]) + '</td><td class="r">' + x[4] + '%</td><td class="r neg">' + rTxt(x[5]) +
          '</td><td class="r">' + x[6] + '</td><td class="r ' + cls(x[7]) + '">' + rTxt(x[7]) + '</td><td class="r ' + cls(x[8]) + '">' + rTxt(x[8]) + "</td></tr>";
      }).join("") + "</tbody></table></div>";
  }

  // ---------- SL grid (risk management) ----------
  function slGrid(key, y) {
    var d = D(key), G = d && d.grid; if (!G) return "";
    var bufs = [], o = S.gr, per = y || "all";
    G.rows.forEach(function (x) { if (bufs.indexOf(x.buf) < 0) bufs.push(x.buf); });
    if (bufs.indexOf(o.buf) < 0) o.buf = bufs.indexOf("0.5") > -1 ? "0.5" : bufs[0];
    var rows = G.rows.filter(function (x) { return x.buf === o.buf; }), sls = [], tps = [];
    rows.forEach(function (x) { if (sls.indexOf(x.minsl) < 0) sls.push(x.minsl); if (tps.indexOf(x.tp) < 0) tps.push(x.tp); });
    sls.sort(function (a, b) { return a - b; }); tps.sort(function (a, b) { return a - b; });
    var best = null;
    rows.forEach(function (x) { var q = x.res[per]; if (q && q.n && (best === null || q.R > best)) best = q.R; });
    function chip(g, v, label) { return '<button class="chip' + (String(o[g]) === String(v) ? " on" : "") + '" data-gro="' + g + '" data-grv="' + v + '">' + esc(label) + "</button>"; }
    var tbl = '<div class="scroll-x"><table style="min-width:560px"><thead><tr><th>Skip if SL under</th>' + tps.map(function (x) { return '<th class="r">TP ' + x + "R</th>"; }).join("") + "</tr></thead><tbody>" +
      sls.map(function (sl) {
        return "<tr><td>" + (sl === 0 ? "No minimum" : sl + " pips") + "</td>" + tps.map(function (tp) {
          var x = rows.filter(function (z) { return z.minsl === sl && z.tp === tp; })[0], q = x && x.res[per];
          if (!q || !q.n) return '<td class="r muted">—</td>';
          var w = q.W + q.L ? Math.round((q.W / (q.W + q.L)) * 1000) / 10 : 0;
          var main = o.k === "R" ? '<span class="' + cls(q.R) + '" style="font-weight:600">' + rTxt(q.R) + "</span>" : o.k === "wr" ? w + "%" : '<span class="neg">' + rTxt(q.dd) + "</span>";
          return '<td class="r" style="' + (q.R === best ? "box-shadow:inset 0 0 0 1px rgba(127,217,154,.6)" : "") + '" title="' + q.n + " trades · " + q.W + "W " + q.L + "L · win rate " + w + "% · " + rTxt(q.R) + " after spread · drawdown " + rTxt(q.dd) + '">' + main + "</td>";
        }).join("") + "</tr>";
      }).join("") + "</tbody></table></div>";
    return '<span class="eyebrow">SL SIZE AND TP TEST · ' + (per === "all" ? "ALL YEARS" : per) + "</span>" +
      '<div class="note" style="font-size:12px">' + esc(G.note) + " Green outline = most R. Hover a box for the full numbers.</div>" +
      '<div style="display:flex;gap:14px;flex-wrap:wrap;align-items:center"><span class="note" style="font-size:12px">SL buffer</span><div class="chips">' + bufs.map(function (b) { return chip("buf", b, b + "x ATR"); }).join("") + '</div><div class="chips">' +
      chip("k", "R", "R after spread") + chip("k", "wr", "Win rate") + chip("k", "dd", "Drawdown") + "</div></div>" + tbl;
  }

  // ---------- shared bits ----------
  function yearChips(cur, attr) {
    return '<div class="chips">' + [["all", "All years"]].concat(years().map(function (y) { return [y, y]; })).map(function (y) { return '<button class="chip' + (cur === y[0] ? " on" : "") + '" data-' + attr + '="' + y[0] + '">' + y[1] + "</button>"; }).join("") + "</div>";
  }
  function verHead(title) {
    var v = curVer(S.scan), d = D(S.scan);
    return '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap"><span class="eyebrow">' + esc(title) + "</span>" + verPicker(S.scan) + "</div>" +
      '<div class="note" style="font-size:12px">' + esc(S.mkt + " · " + d.from + " to " + d.to + " · " + v.settings) + "</div>" + tpPicker(v);
  }
  function tpPicker(v) {
    if (!hasMax(v)) return S.tp ? '<div class="note" style="font-size:12px">This version was tested before the TP tester existed, so it shows its own TP.</div>' : "";
    function chip(val, label) { return '<button class="chip' + (String(S.tp) === String(val) ? " on" : "") + '" data-sdtp="' + val + '">' + esc(label) + "</button>"; }
    return '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap"><span class="note" style="font-size:12px">Test a TP</span><div class="chips">' +
      chip("", "As tested") + TP_CHOICES.map(function (x) { return chip(x, x + "R"); }).join("") + "</div>" +
      '<input class="input" data-sdtpin type="number" min="0.1" step="0.1" placeholder="Other R" value="' + (S.tp && TP_CHOICES.indexOf(S.tp) < 0 ? S.tp : "") + '" style="height:34px;width:96px;font-size:13px"></div>' +
      (S.tp ? '<div class="note" style="font-size:12px">Showing one TP at ' + S.tp + 'R: same entries and SL, no risk free or partials. The trades are the ones this version took, so a bigger TP doesn\'t stop later trades from happening.</div>' : "");
  }
  function yearsTable(L) {
    var ys = years();
    return '<div class="scroll-x"><table style="min-width:620px"><thead><tr><th>Year</th><th class="r">Trades</th><th class="r">W / RF / L</th><th class="r">Win rate</th><th class="r">Total R</th><th class="r">After spread</th><th class="r">Pips</th><th class="r">Drawdown</th><th class="r">Positive months</th></tr></thead><tbody>' +
      ys.map(function (y) {
        var T = inPeriod(L, y), R = sumR(T);
        if (!T.length) return "";
        return '<tr><td><button class="chip" data-sdy="' + y + '">' + y + '</button></td><td class="r">' + T.length + '</td><td class="r muted">' + count(T, "TP") + " / " + count(T, "BE") + " / " + count(T, "SL") + '</td><td class="r">' + wr(T) + '</td><td class="r ' + cls(R) + '" style="font-weight:600">' + rTxt(R) +
          (net(T) != null ? '</td><td class="r ' + cls(net(T)) + '" style="font-weight:600">' + rTxt(net(T)) : '</td><td class="r">—') + '</td><td class="r ' + cls(pips(T)) + '">' + (pips(T) != null ? pTxt(pips(T)) : "—") + '</td><td class="r neg">' + rTxt(drawdown(T)) + '</td><td class="r">' + posMonths(T) + "</td></tr>";
      }).join("") + "</tbody></table></div>";
  }

  // ---------- TRADE DATA ----------
  function allView() {
    var v = curVer(S.scan);
    return card(verHead("ALL YEARS") + stats(vt(v), true)) +
      card('<span class="eyebrow">EACH YEAR · TAP ONE FOR ITS MONTHS</span>' + yearsTable(vt(v)));
  }
  function yearView() {
    var y = S.year, L = allTrades(y);
    var cells = MONTHS.map(function (name, m) {
      var T = allTrades(y, m), x = sumR(T);
      if (!T.length) return '<div class="jday off sdm-m" style="min-height:96px;box-shadow:inset 0 0 0 1px #18191b"><span class="dn" style="font-size:12px">' + name + '</span><span class="muted" style="font-size:12px">No trades</span></div>';
      var p = pips(T);
      return '<button class="jday sdm-m ' + (x > 0 ? "up" : x < 0 ? "down" : "flat") + '" data-sdm="' + m + '" style="min-height:96px;cursor:pointer;border:0;text-align:left;color:inherit">' +
        '<span class="dn" style="font-size:12px;color:#c9ccd1">' + name + "</span>" +
        '<span class="dr" style="font-size:22px">' + rTxt(x) + "</span>" +
        '<span class="dn">' + T.length + " trades · " + count(T, "TP") + "W " + count(T, "BE") + "RF " + count(T, "SL") + "L" + (p != null ? " · " + pTxt(p) : "") + "</span></button>";
    }).join("");
    return card(verHead(y) + stats(L, true)) +
      card('<span class="eyebrow">MONTHS · TAP ONE FOR EVERY TRADE</span><div class="sdm-grid">' + cells + "</div>", 12);
  }
  function monthView() {
    var y = S.year, m = S.month, T = allTrades(y, m), open = S.openList[S.scan];
    var body = !T.length ? '<div class="note">No trades this month on this version.</div>' :
      stats(T) + dayCal(T, y, m) + '<button class="btn btn-ghost" data-sdl="' + S.scan + '" style="align-self:flex-start">' + (open ? "Hide trades" : "Show all " + T.length + " trades") + "</button>" + (open ? tradeList(T) : "");
    return '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap"><button class="btn btn-ghost" data-sdback="1">Back to ' + y + "</button>" +
      '<button class="chip" data-sdstep="-1">Previous month</button><button class="chip" data-sdstep="1">Next month</button></div>' +
      card(verHead(MONTHS[m].toUpperCase() + " " + y) + body);
  }
  function tradeData() {
    return yearChips(S.year, "sdy") + (S.year === "all" ? allView() : S.month == null ? yearView() : monthView());
  }

  // ---------- RISK MANAGEMENT ----------
  function riskView() {
    var v = curVer(S.scan), L = inPeriod(vt(v), S.rmYear, null);
    var rp = L.map(function (t) { return t[7]; }).filter(function (x) { return x != null; }).sort(function (a, b) { return a - b; });
    var med = rp.length ? rp[Math.floor(rp.length / 2)] : null;
    var tiles = '<div class="tiles">' + tile("Worst drawdown", rTxt(drawdown(L)), "neg") + tile("Longest losing run", loseRun(L)) + tile("Losses", count(L, "SL"), "neg") +
      tile("Loss rate", L.length ? Math.round((count(L, "SL") / L.length) * 1000) / 10 + "%" : "—") +
      (med != null ? tile("Typical SL", med + " pips") + tile("Smallest / biggest SL", rp[0] + " / " + rp[rp.length - 1] + " pips") : "") + "</div>";
    var sl = slGrid(S.scan, S.rmYear) || slTest(S.scan, S.rmYear);
    return yearChips(S.rmYear, "rmy") + card(verHead("RISK · " + (S.rmYear === "all" ? "ALL YEARS" : S.rmYear)) + tiles) +
      (sl ? card(sl) : card('<div class="note">No SL size test for this scanner on ' + esc(S.mkt) + " yet.</div>", 8));
  }

  // ---------- TRADE MANAGEMENT ----------
  function mgmtView() {
    var out = "";
    var pl = plansTable(S.scan);
    if (pl) out += card(pl);
    if (versions(S.scan).length > 1) {
      out += card('<span class="eyebrow">EVERY VERSION TESTED · ' + (S.tmYear === "all" ? "ALL YEARS" : S.tmYear) + '</span>' + yearChips(S.tmYear, "tmy") + compare(S.scan, S.tmYear, null, true));
      out += card('<span class="eyebrow">EVERY VERSION · EACH YEAR</span>' + yearByYear(S.scan));
    }
    return out || card('<div class="note">No trade management tests for this scanner on ' + esc(S.mkt) + " yet.</div>", 8);
  }

  // ---------- day calendar and trade list ----------
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
    return '<div class="scroll-x"><table style="min-width:560px;margin-top:6px"><thead><tr><th>Date</th><th>Time</th><th>Side</th><th class="r">Entry</th><th class="r">SL</th><th class="r">TP</th><th>Result</th><th class="r">R</th><th class="r">Pips</th></tr></thead><tbody>' +
      T.map(function (t) {
        var res = { TP: "Win", BE: "Risk free", SL: "Loss", TP1: "TP1 hit", TP2: "TP2 hit", TP3: "All TPs hit" }[t[5]] || t[5];
        return '<tr><td class="muted">' + esc(new Date(t[0].slice(0, 10) + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })) + '</td><td class="muted">' + esc(t[0].slice(11, 16)) + "</td><td>" + (t[1] === 1 ? "BUY" : "SELL") +
          '</td><td class="r">' + t[2] + '</td><td class="r">' + t[3] + '</td><td class="r">' + t[4] + "</td><td>" + res + '</td><td class="r ' + cls(r(t)) + '">' + rTxt(r(t)) + '</td><td class="r ' + cls(r(t)) + '">' + (t[7] != null ? (r(t) * t[7] > 0 ? "+" : "") + Math.round(r(t) * t[7] * 10) / 10 : "—") + "</td></tr>";
      }).join("") + "</tbody></table></div>";
  }

  // ---------- loading ----------
  function load(src, key, redraw) {
    if (S.loadingM[key]) return;
    S.loadingM[key] = true;
    var sc = document.createElement("script");
    sc.src = src;
    sc.onload = function () { S.loadingM[key] = false; if (redraw) redraw(); };
    sc.onerror = function () { S.loadingM[key] = false; S.failed = true; if (redraw) redraw(); };
    document.head.appendChild(sc);
  }
  function scanMarkets(k) { var I = window.SDX_SCANDATA_INDEX || {}; return Object.keys(I).filter(function (m) { return I[m][k]; }); }

  // ---------- step 1: pick a scanner ----------
  function picker() {
    var I = window.SDX_SCANDATA_INDEX;
    return '<div class="sdm-mk">' + SCANNERS.map(function (s) {
      var ms = scanMarkets(s[0]);
      var lines = ms.length ? ms.map(function (m) {
        var x = I[m][s[0]];
        return '<span style="display:flex;justify-content:space-between;gap:10px;font-size:13px"><span>' + m + ' <span class="muted" style="font-size:11px">' + esc(x.from + " to " + x.to) + '</span></span><span class="' + cls(x.R) + '" style="font-weight:600;white-space:nowrap">' + rTxt(x.R) + (x.net ? ' <span class="muted" style="font-weight:400">after spread</span>' : "") + ' <span class="muted" style="font-weight:400">· ' + x.wr + "% wins</span></span></span>";
      }).join("") : '<span class="note" style="font-size:12px">Not tested yet.</span>';
      return '<button class="card pad sdm-mcard" data-sdscan="' + s[0] + '"' + (ms.length ? "" : ' style="opacity:.55"') + '><span class="eyebrow">' + (["mech", "amsweep", "m1model"].indexOf(s[0]) > -1 ? "MODEL" : "SCANNER") + '</span><span style="font:700 24px var(--sg)">' + esc(s[1]) + "</span>" +
        '<span style="display:flex;flex-direction:column;gap:6px;margin-top:4px">' + lines + "</span>" + (ms.length ? '<span class="btn btn-ghost" style="align-self:flex-start;margin-top:8px">Open ' + esc(s[1]) + "</span>" : "") + "</button>";
    }).join("") + "</div>";
  }

  // ---------- step 2: the scanner's page ----------
  function render(redraw) {
    if (S.failed) return '<div class="note">Couldn\'t load the scanner results. Refresh the page to try again.</div>';
    if (!window.SDX_SCANDATA_INDEX) { load("scanner-data-index.js?v=16", "index", redraw); return '<div class="note">Loading scanner results…</div>'; }
    if (!S.scan) return picker();
    var ms = scanMarkets(S.scan);
    if (!ms.length) return '<button class="btn btn-ghost" data-sdscan="">All scanners and models</button><div class="note">' + esc(scName(S.scan)) + " hasn't been tested yet.</div>";
    if (ms.indexOf(S.mkt) < 0) S.mkt = ms[0];
    if (!(window.SDX_SCANDATA || {})[S.mkt]) { load("scanner-data-" + S.mkt + ".js?v=16", S.mkt, redraw); return '<div class="note">Loading ' + esc(S.mkt) + " results…</div>"; }
    var ys = years();
    if (S.year !== "all" && ys.indexOf(S.year) < 0) { S.year = "all"; S.month = null; }
    if (S.rmYear !== "all" && ys.indexOf(S.rmYear) < 0) S.rmYear = "all";
    if (S.tmYear !== "all" && ys.indexOf(S.tmYear) < 0) S.tmYear = "all";
    var secs = [["trades", "Trade data"], ["risk", "Risk management"], ["mgmt", "Trade management"]];
    return '<div style="display:flex;flex-direction:column;gap:16px">' +
      '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap"><button class="btn btn-ghost" data-sdscan="">All scanners and models</button><span style="font:700 24px var(--sg)">' + esc(scName(S.scan)) + "</span>" +
      '<div class="chips" style="margin-left:auto">' + ms.map(function (m) { return '<button class="chip' + (S.mkt === m ? " on" : "") + '" data-sdk="' + m + '">' + m + "</button>"; }).join("") + "</div></div>" +
      '<div class="tabs">' + secs.map(function (x) { return '<button class="tab' + (S.sec === x[0] ? " on" : "") + '" data-sdsec="' + x[0] + '">' + x[1] + "</button>"; }).join("") + "</div>" +
      (S.sec === "risk" ? riskView() : S.sec === "mgmt" ? mgmtView() : tradeData()) + "</div>";
  }
  function wire(page, redraw) {
    $$("[data-sdscan]", page).forEach(function (b) { b.onclick = function () { S.scan = b.dataset.sdscan || null; S.month = null; S.sec = "trades"; redraw(); window.scrollTo(0, 0); }; });
    $$("[data-sdsec]", page).forEach(function (b) { b.onclick = function () { S.sec = b.dataset.sdsec; redraw(); }; });
    $$("[data-sdtp]", page).forEach(function (b) { b.onclick = function () { S.tp = b.dataset.sdtp ? +b.dataset.sdtp : null; redraw(); }; });
    $$("[data-sdtpin]", page).forEach(function (inp) { inp.onchange = function () { var x = Math.round(parseFloat(inp.value) * 10) / 10; S.tp = x > 0 ? x : null; redraw(); }; });
    $$("[data-sdk]", page).forEach(function (b) { b.onclick = function () { S.mkt = b.dataset.sdk; S.month = null; redraw(); }; });
    $$("[data-sdy]", page).forEach(function (b) { b.onclick = function () { S.year = b.dataset.sdy; S.month = null; S.sec = "trades"; redraw(); window.scrollTo(0, 0); }; });
    $$("[data-rmy]", page).forEach(function (b) { b.onclick = function () { S.rmYear = b.dataset.rmy; redraw(); }; });
    $$("[data-tmy]", page).forEach(function (b) { b.onclick = function () { S.tmYear = b.dataset.tmy; redraw(); }; });
    $$("[data-sdm]", page).forEach(function (b) { b.onclick = function () { S.month = +b.dataset.sdm; S.openList = {}; redraw(); window.scrollTo(0, 0); }; });
    $$("[data-sdback]", page).forEach(function (b) { b.onclick = function () { S.month = null; redraw(); }; });
    $$("[data-sdl]", page).forEach(function (b) { b.onclick = function () { S.openList[b.dataset.sdl] = !S.openList[b.dataset.sdl]; redraw(); }; });
    $$("[data-pls]", page).forEach(function (b) { b.onclick = function () { S.plSort = b.dataset.pls; redraw(); }; });
    $$("[data-gro]", page).forEach(function (b) { b.onclick = function () { S.gr[b.dataset.gro] = b.dataset.grv; redraw(); }; });
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

  // ---------- the page (admins only) ----------
  window.SDX_PAGES = window.SDX_PAGES || {};
  window.SDX_PAGES.scandata = function (page) {
    function draw() {
      page.innerHTML = '<div style="display:flex;flex-direction:column;gap:8px"><div class="eyebrow">ADMIN</div><h1 class="title" style="margin:0">Scanner data.</h1><div class="note" style="font-size:13px">Backtest results for every scanner and model. Only admins can see this page.</div></div>' + render(draw);
      wire(page, draw);
    }
    draw();
  };
})();
