/* SDX Members Dashboard: Entry model data (admins only, under ADMIN in the menu)
   Pick a scanner, then: Trade data (all years / year calendar / month with every trade),
   Risk management (SL size test, risk numbers), Trade management (partial plans, every version tested).
   The results files only load when this page is opened. */
(function () {
  "use strict";
  function esc(s) { return window.SDX.esc(s); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  var SCANNERS = [["chrome", "SDX Pulse"], ["platinum", "SDX Sniper"], ["titanium", "SDX Precision"], ["obsidian", "SDX Phantom"], ["trap", "Failed Break Model"], ["keylv", "Gold Key Levels"], ["cobalt", "SDX Raid"], ["iridium", "SDX Ghost"], ["mech", "Mech Model"], ["amsweep", "AM Sweep Model"], ["m1model", "M1 Model"]];
  var TP_CHOICES = [1, 1.5, 2, 3, 4, 5, 6, 8, 10];
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var RV = { TP: 2, BE: 0, SL: -1 };
  var S = { ovSec: {}, ovPg: {}, ovTab: {}, calPair: "all", calYear: null, calAll: false, gr: { buf: "0.5", k: "R" }, scan: null, sec: "trades", plSort: "R", mkt: null, loadingM: {}, sl: { e: "retest", rf: 0.25, k: "R" }, year: "2025", rmYear: "all", tmYear: "all", month: null, openList: {}, ver: {}, loading: false, failed: false, tp: null };

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
    var staged = V.some(function (v) { return v.stage; });
    function opt(v) { return '<option value="' + esc(v.id) + '"' + (v.id === cur ? " selected" : "") + ">" + esc(v.name) + "</option>"; }
    var inner;
    if (staged) {
      var g = function (label, st) { var L = V.filter(function (v) { return st.indexOf(v.stage) >= 0; }); return L.length ? '<optgroup label="' + esc(label) + '">' + L.map(opt).join("") + "</optgroup>" : ""; };
      inner = g(V.some(function (x) { return x.noTrade; }) ? "LATEST · most refined (not traded)" : "LATEST · most refined (use this)", ["latest", "latest-part"]) + g("BEFORE REFINEMENT · valid at the time", ["older"]);
    } else inner = V.map(opt).join("");
    return '<label style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><span class="note" style="font-size:12px">Version</span><select class="input" data-sdv="' + key + '" style="height:38px;width:auto;font-size:13px">' + inner + "</select></label>";
  }
  function verBanner(key) {
    var v = curVer(key); if (!v || !v.stage) return "";
    var latest = v.stage !== "older";
    var top = versions(key).filter(function (x) { return x.stage === "latest"; })[0];
    if (v.noTrade) return '<div style="border:1px solid var(--neg, #FF4D4D);border-radius:10px;padding:10px 12px;font-size:13px;line-height:1.45"><b style="color:var(--neg, #FF4D4D)">NOT TRADED ON THIS PAIR.</b> This is the most refined test, but nothing held up in the latest year, so the model isn\'t used here.</div>';
    var msg = latest
      ? (v.stage === "latest" ? "LATEST · MOST REFINED. This is the version to use. All the refinements so far are built in." : "LATEST · MOST REFINED (one part of it). Part of " + (top ? top.name : "the latest version") + ".")
      : "BEFORE REFINEMENT. These rules were valid at the time and the results are real backtests, but they've since been refined. For trading, use " + (top ? top.name : "the latest version") + ".";
    var col = latest ? "var(--pos, #16C35A)" : "var(--warn, #E0A100)";
    return '<div style="border:1px solid ' + col + ';border-radius:10px;padding:10px 12px;font-size:13px;line-height:1.45"><b style="color:' + col + '">' + esc(msg.split(".")[0]) + ".</b>" + esc(msg.slice(msg.indexOf(".") + 1)) + "</div>";
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
      '<div class="chips">' + chip("R", "Most R after spread") + chip("pips", "Most pips") + chip("win", P.wl ? "Highest win rate" : "Most trades in profit") + chip("dd", "Smallest drawdown") + "</div>" +
      '<div class="scroll-x"><table style="min-width:900px"><thead><tr><th>Plan</th><th class="r">Total R</th><th class="r">After spread</th><th class="r">Pips</th><th class="r">' + (P.wl ? "Win rate (W vs L)" : "In profit") + '</th><th class="r">Drawdown</th><th class="r">Losing run</th><th class="r">2022-24 after spread</th><th class="r">2025-26 after spread</th></tr></thead><tbody>' +
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
    return '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap"><span class="eyebrow">' + esc(title) + "</span>" + verPicker(S.scan) + "</div>" + verBanner(S.scan) +
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


  // ---------- OVERVIEW: best results, confirmations, and what happens if you change one thing ----------
  var OVY = ["2022", "2023", "2024", "2025", "2026"];
  function ovWr(x) { var l = 100 - x.win - x.rf; return x.win + l > 0 ? Math.round((x.win / (x.win + l)) * 1000) / 10 + "%" : "—"; }
  function ovTable(rows) {
    return '<div class="scroll-x"><table style="min-width:900px"><thead><tr><th>Option</th><th class="r">Trades</th><th class="r">Win rate (W vs L)</th><th class="r">Stopped at entry</th><th class="r">Total R</th><th class="r">Drawdown</th><th class="r">Losing run</th>' +
      OVY.map(function (y) { return '<th class="r">' + y + "</th>"; }).join("") + "</tr></thead><tbody>" +
      rows.map(function (x) {
        return '<tr style="' + (x.cur ? "background:rgba(233,237,242,.06)" : "") + '"><td>' + esc(x.label) + (x.cur ? ' <span class="tag" style="margin-left:6px">In use</span>' : "") + (x.best ? ' <span class="tag" style="margin-left:6px">Best</span>' : "") +
          '</td><td class="r">' + x.n + '</td><td class="r">' + ovWr(x) + '</td><td class="r muted">' + x.rf + '%</td><td class="r ' + cls(x.R) + '" style="font-weight:600">' + (x.n ? rTxt(x.R) : "—") +
          '</td><td class="r neg">' + rTxt(x.dd) + '</td><td class="r">' + x.run + "</td>" +
          x.years.map(function (v) { return '<td class="r ' + cls(v) + '">' + (v == null ? "—" : rTxt(v)) + "</td>"; }).join("") + "</tr>";
      }).join("") + "</tbody></table></div>";
  }
  function spanYears(d) {
    var M3 = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    function n(x) { var p = String(x).split(" "); return +p[1] * 12 + M3.indexOf(p[0]); }
    return (n(d.to) - n(d.from) + 1) / 12;
  }

  function pgCell(v, t) {
    if (v == null || v === "") return '<td class="r muted">—</td>';
    if (t === "txt") return "<td>" + esc(v) + "</td>";
    if (t === "R") return '<td class="r ' + cls(v) + '" style="font-weight:600">' + rTxt(v) + "</td>";
    if (t === "neg") return '<td class="r neg">' + rTxt(v) + "</td>";
    if (t === "pct") return '<td class="r">' + v + "%</td>";
    return '<td class="r">' + esc(v) + "</td>";
  }
  function pgBlock(b) {
    if (b.type === "head") return '<span class="eyebrow" style="margin-top:8px">' + esc(b.text.toUpperCase()) + "</span>";
    if (b.type === "note") return '<div class="note" style="font-size:12px">' + esc(b.text) + "</div>";
    if (b.type === "list") return '<ul style="margin:0;padding-left:20px;display:flex;flex-direction:column;gap:6px;font-size:14px;line-height:1.5">' + b.items.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>";
    if (b.type === "tabs") {
      var key = S.scan + (S.ovPg[S.scan] || ""), cur = S.ovTab[key] != null ? S.ovTab[key] : b.tabs.length - 1, t = b.tabs[cur] || b.tabs[0];
      return '<div class="chips">' + b.tabs.map(function (x, i) { return '<button class="chip' + (i === cur ? " on" : "") + '" data-ovtab="' + i + '">' + esc(x.name) + "</button>"; }).join("") + "</div>" + t.blocks.map(pgBlock).join("");
    }
    if (b.type === "tiles") return '<div class="tiles">' + b.items.map(function (x) { return tile(x[0], x[1], x[2]); }).join("") + "</div>";
    if (b.type === "table") return '<div class="scroll-x"><table style="min-width:' + Math.max(520, b.cols.length * 95) + 'px"><thead><tr>' + b.cols.map(function (c, i) { return "<th" + (c[1] === "txt" ? "" : ' class="r"') + ">" + esc(c[0]) + "</th>"; }).join("") + "</tr></thead><tbody>" +
      b.rows.map(function (r) { return "<tr>" + r.map(function (v, i) { return pgCell(v, b.cols[i][1]); }).join("") + "</tr>"; }).join("") + "</tbody></table></div>";
    return "";
  }

  // ---------- results calendar: month boxes for one year, for all traded pairs or one pair ----------
  var CAL_PAIRS = [["all", "All traded pairs"], ["XAUUSD", "XAUUSD"], ["EURUSD", "EURUSD"], ["GER30", "GER30"], ["GBPUSD", "GBPUSD (not traded)"]];
  var MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function calendar(O) {
    var C = O.cal, pair = C[S.calPair] ? S.calPair : "all", P = C[pair], years = Object.keys(P).sort();
    var yr = S.calYear && P[S.calYear] ? S.calYear : years[years.length - 1];
    var ms = P[yr], tot = 0, n = 0, w = 0, b = 0, l = 0, up = 0, had = 0;
    ms.forEach(function (m) { if (!m) return; had++; tot += m.R; n += m.n; w += m.w; b += m.b; l += m.l; if (m.R > 0) up++; });
    tot = Math.round(tot * 10) / 10;
    var pairBtns = '<div class="chips">' + CAL_PAIRS.map(function (x) { return '<button class="chip' + (x[0] === pair ? " on" : "") + '" data-calp="' + x[0] + '">' + esc(x[1]) + "</button>"; }).join("") + "</div>";
    var yearBtns = '<div class="chips">' + years.map(function (y) { return '<button class="chip' + (y === yr ? " on" : "") + '" data-caly="' + y + '">' + y + (y === "2026" ? " so far" : "") + "</button>"; }).join("") + "</div>";
    var tiles = '<div class="tiles">' + tile(yr + " total", rTxt(tot), cls(tot)) + tile("Trades", n) + tile("Wins / BE / Losses", w + " / " + b + " / " + l) +
      tile("Win rate (W vs L)", w + l ? (Math.round(1000 * w / (w + l)) / 10) + "%" : "—") + tile("Profitable months", up + " of " + had) + "</div>";
    var boxes = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px">' + ms.map(function (m, i) {
      if (!m) return '<div style="border:1px dashed var(--line, #C9CED5);border-radius:12px;padding:12px;min-height:96px;opacity:.55"><div style="font:700 13px var(--sg)">' + MON[i] + '</div><div class="note" style="font-size:12px;margin-top:6px">No trades / no data</div></div>';
      var bg = m.R > 0 ? "rgba(22,195,90,.14)" : m.R < 0 ? "rgba(255,77,77,.14)" : "rgba(140,146,156,.16)";
      var bd = m.R > 0 ? "#16C35A" : m.R < 0 ? "#FF4D4D" : "#8C929C";
      return '<div style="background:' + bg + ';border:1px solid ' + bd + ';border-radius:12px;padding:12px;min-height:96px;display:flex;flex-direction:column;gap:4px">' +
        '<div style="display:flex;justify-content:space-between;align-items:center"><span style="font:700 13px var(--sg)">' + MON[i] + '</span><span class="note" style="font-size:11px">' + m.n + " trades</span></div>" +
        '<div style="font:700 22px var(--sg);color:' + bd + '">' + rTxt(m.R) + "</div>" +
        '<div class="note" style="font-size:11px">W ' + m.w + " · BE " + m.b + " · L " + m.l + "</div></div>";
    }).join("") + "</div>";
    var note = '<div class="note" style="font-size:12px">Green = profitable month, red = losing month, grey = breakeven. All traded pairs = XAUUSD + EURUSD + GER30, same risk on every trade (GBPUSD isn\'t traded, so it\'s left out). Data: XAUUSD Jan 2022 - Nov 2026 (no June 2026), EURUSD 2023-2025, GER30 Jan 2022 - May 2026. No spread. Tap a pair to see all its data below.</div>';
    var allBtn = '<div class="chips"><button class="chip' + (S.calAll ? " on" : "") + '" data-calall="1">Refined model results 2022-2026</button>' + (S.calAll ? '<button class="chip" data-calall="0">Back to ' + esc(yr) + "</button>" : "") + "</div>";
    if (S.calAll) {
      var cell = function (m) {
        if (!m) return '<td class="r" style="opacity:.45">—</td>';
        var bg = m.R > 0 ? "rgba(22,195,90,.16)" : m.R < 0 ? "rgba(255,77,77,.16)" : "rgba(140,146,156,.18)";
        var fg = m.R > 0 ? "#16C35A" : m.R < 0 ? "#FF4D4D" : "#8C929C";
        return '<td class="r" style="background:' + bg + ';white-space:nowrap"><div style="font-weight:700;color:' + fg + '">' + rTxt(m.R) + '</div><div class="note" style="font-size:10.5px">' + m.n + " tr</div></td>";
      };
      var grand = 0, gn = 0, gw = 0, gl = 0;
      var body = years.map(function (y) {
        var t = 0, tn = 0, tw = 0, tl = 0;
        P[y].forEach(function (m) { if (m) { t += m.R; tn += m.n; tw += m.w; tl += m.l; } });
        t = Math.round(t * 10) / 10; grand += t; gn += tn; gw += tw; gl += tl;
        return "<tr><td><b>" + y + (y === "2026" ? " (so far)" : "") + "</b></td>" + P[y].map(cell).join("") + '<td class="r ' + cls(t) + '" style="font-weight:700">' + rTxt(t) + '</td><td class="r">' + tn + '</td><td class="r">' + (tw + tl ? Math.round(1000 * tw / (tw + tl)) / 10 + "%" : "—") + "</td></tr>";
      }).join("");
      grand = Math.round(grand * 10) / 10;
      var table = '<div class="scroll-x"><table style="min-width:1100px"><thead><tr><th>Year</th>' + MON.map(function (m) { return '<th class="r">' + m + "</th>"; }).join("") + '<th class="r">Year R</th><th class="r">Trades</th><th class="r">Win rate (W vs L)</th></tr></thead><tbody>' + body +
        '<tr><td><b>Total</b></td>' + MON.map(function () { return "<td></td>"; }).join("") + '<td class="r ' + cls(grand) + '" style="font-weight:700">' + rTxt(grand) + '</td><td class="r">' + gn + '</td><td class="r">' + (gw + gl ? Math.round(1000 * gw / (gw + gl)) / 10 + "%" : "—") + "</td></tr></tbody></table></div>";
      return card('<span class="eyebrow">FAILED BREAK MODEL · REFINED MODEL RESULTS 2022-2026 · ' + esc(CAL_PAIRS.filter(function (x) { return x[0] === pair; })[0][1].toUpperCase()) + "</span>" + pairBtns + allBtn +
        '<div class="tiles">' + tile("Total R", rTxt(grand), cls(grand)) + tile("Trades", gn) + tile("Win rate (W vs L)", gw + gl ? Math.round(1000 * gw / (gw + gl)) / 10 + "%" : "—") + "</div>" + table + note);
    }
    return card('<span class="eyebrow">FAILED BREAK MODEL · RESULTS ' + esc(yr) + (yr === "2026" ? " SO FAR" : "") + " · " + esc(CAL_PAIRS.filter(function (x) { return x[0] === pair; })[0][1].toUpperCase()) + "</span>" + pairBtns + allBtn + yearBtns + tiles + boxes + note);
  }
  function overview() {
    var d = D(S.scan), O = d.overview, b = O.best;
    var tiles = '<div class="tiles">' + tile("Total R", rTxt(b.R), cls(b.R)) + tile("R a year (average)", rTxt(Math.round((b.R / Math.max(spanYears(d), 0.5)) * 10) / 10), cls(b.R)) + tile("Trades", b.n) +
      tile("Win rate (W vs L)", ovWr(b), "pos") + tile("Stopped at entry", b.rf + "%") + tile("Worst drawdown", rTxt(b.dd), "neg") + tile("Longest losing run", b.run) + "</div>";
    var yt = '<div class="tiles">' + OVY.map(function (y, i) { var v = b.years[i]; return tile(y + (y === "2026" ? " (to " + d.to + ")" : ""), v == null ? "—" : rTxt(v), cls(v)); }).join("") + "</div>";
    var cur = S.ovSec[S.scan] || O.sections[0].id, sec = O.sections.filter(function (x) { return x.id === cur; })[0] || O.sections[0];
    var chips = '<div class="chips">' + O.sections.map(function (x) { return '<button class="chip' + (x.id === sec.id ? " on" : "") + '" data-ovs="' + esc(x.id) + '">' + esc(x.name) + "</button>"; }).join("") + "</div>";
    var body = sec.rows ? ovTable(sec.rows) : sec.groups.map(function (g) { return '<span class="eyebrow" style="margin-top:8px">' + esc(g.name.toUpperCase()) + "</span>" + ovTable(g.rows); }).join("");
    var bestCard = card('<span class="eyebrow">BEST RESULTS · ' + esc(S.mkt + " · " + d.from + " to " + d.to) + '</span><span style="font:700 20px var(--sg)">' + esc(O.title) + '</span><div class="note" style="font-size:13px">' + esc(O.summary) + "</div>" + tiles + yt +
        (O.version ? '<button class="btn btn-ghost" data-ovver="' + esc(O.version) + '" style="align-self:flex-start">See every trade</button>' : ""));
    var confCard = card('<span class="eyebrow">CONFIRMATIONS</span><ol style="margin:0;padding-left:20px;display:flex;flex-direction:column;gap:8px;font-size:14px;line-height:1.5">' + O.rules.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ol>");
    var whatCard = card('<span class="eyebrow">WHAT HAPPENS IF YOU CHANGE IT · TAP A SECTION</span>' + chips + '<div class="note" style="font-size:12px">' + esc(sec.note) + ' Win rate = wins against losses only, breakevens left out. "In use" = what the model uses. "Best" = most R in that table. Stopped at entry = closed at 0R after the SL moved to entry.</div>' + body);
    if (!O.pages) return bestCard + confCard + whatCard;
    var P = [["sum", "Summary"]].concat(O.pages.map(function (x) { return [x.id, x.name]; })).concat([["what", "What if"]]);
    var pg = S.ovPg[S.scan] || "sum";
    var nav = '<div class="chips">' + P.map(function (x) { return '<button class="chip' + (x[0] === pg ? " on" : "") + '" data-ovp="' + esc(x[0]) + '">' + esc(x[1]) + "</button>"; }).join("") + "</div>";
    if (pg === "sum") return nav + (O.cal ? calendar(O) : "") + bestCard;
    if (pg === "what") return nav + whatCard;
    var page = O.pages.filter(function (x) { return x.id === pg; })[0] || O.pages[0];
    return nav + card('<span class="eyebrow">' + esc(page.name.toUpperCase()) + "</span>" + page.blocks.map(pgBlock).join(""));
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
    if (!window.SDX_SCANDATA_INDEX) { load("scanner-data-index.js?v=35", "index", redraw); return '<div class="note">Loading scanner results…</div>'; }
    if (!S.scan) return picker();
    var ms = scanMarkets(S.scan);
    if (!ms.length) return '<button class="btn btn-ghost" data-sdscan="">All scanners and models</button><div class="note">' + esc(scName(S.scan)) + " hasn't been tested yet.</div>";
    if (ms.indexOf(S.mkt) < 0) S.mkt = ms[0];
    if (!(window.SDX_SCANDATA || {})[S.mkt]) { load("scanner-data-" + S.mkt + ".js?v=35", S.mkt, redraw); return '<div class="note">Loading ' + esc(S.mkt) + " results…</div>"; }
    var ys = years();
    if (S.year !== "all" && ys.indexOf(S.year) < 0) { S.year = "all"; S.month = null; }
    if (S.rmYear !== "all" && ys.indexOf(S.rmYear) < 0) S.rmYear = "all";
    if (S.tmYear !== "all" && ys.indexOf(S.tmYear) < 0) S.tmYear = "all";
    var hasOv = !!(data()[S.scan] || {}).overview;
    if (S.sec === "overview" && !hasOv) S.sec = "trades";
    var secs = (hasOv ? [["overview", "Overview"]] : []).concat([["trades", "Trade data"], ["risk", "Risk management"], ["mgmt", "Trade management"]]);
    return '<div style="display:flex;flex-direction:column;gap:16px">' +
      '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap"><button class="btn btn-ghost" data-sdscan="">All scanners and models</button><span style="font:700 24px var(--sg)">' + esc(scName(S.scan)) + "</span>" +
      '<div class="chips" style="margin-left:auto">' + ms.map(function (m) { return '<button class="chip' + (S.mkt === m ? " on" : "") + '" data-sdk="' + m + '">' + m + "</button>"; }).join("") + "</div></div>" +
      '<div class="tabs">' + secs.map(function (x) { return '<button class="tab' + (S.sec === x[0] ? " on" : "") + '" data-sdsec="' + x[0] + '">' + x[1] + "</button>"; }).join("") + "</div>" +
      (S.sec === "overview" ? overview() : S.sec === "risk" ? riskView() : S.sec === "mgmt" ? mgmtView() : tradeData()) + "</div>";
  }
  function wire(page, redraw) {
    $$("[data-sdscan]", page).forEach(function (b) { b.onclick = function () { S.scan = b.dataset.sdscan || null; S.month = null; S.sec = "overview"; redraw(); window.scrollTo(0, 0); }; });
    $$("[data-ovtab]", page).forEach(function (b) { b.onclick = function () { S.ovTab[S.scan + (S.ovPg[S.scan] || "")] = +b.dataset.ovtab; redraw(); }; });
    $$("[data-calall]", page).forEach(function (b) { b.onclick = function () { S.calAll = b.dataset.calall === "1"; redraw(); }; });
    $$("[data-calp]", page).forEach(function (b) { b.onclick = function () { S.calPair = b.dataset.calp; if (S.calPair !== "all") { S.mkt = S.calPair; S.month = null; } redraw(); }; });
    $$("[data-caly]", page).forEach(function (b) { b.onclick = function () { S.calYear = b.dataset.caly; redraw(); }; });
    $$("[data-ovp]", page).forEach(function (b) { b.onclick = function () { S.ovPg[S.scan] = b.dataset.ovp; redraw(); }; });
    $$("[data-ovs]", page).forEach(function (b) { b.onclick = function () { S.ovSec[S.scan] = b.dataset.ovs; redraw(); }; });
    $$("[data-ovver]", page).forEach(function (b) { b.onclick = function () { S.ver[S.scan + S.mkt] = b.dataset.ovver; S.sec = "trades"; S.year = "all"; S.month = null; redraw(); window.scrollTo(0, 0); }; });
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
      page.innerHTML = '<div style="display:flex;flex-direction:column;gap:8px"><div class="eyebrow">ADMIN</div><h1 class="title" style="margin:0">Entry model data.</h1><div class="note" style="font-size:13px">Backtest results for every scanner and model. Only admins can see this page.</div></div>' + render(draw);
      wire(page, draw);
    }
    draw();
  };
})();
