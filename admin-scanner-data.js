/* SDX Members Dashboard: Admin > Scanner data (pick a year, then a month, see every scanner's results) */
(function () {
  "use strict";
  function esc(s) { return window.SDX.esc(s); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  var SCANNERS = [["chrome", "SDX Pulse"], ["platinum", "SDX Sniper"], ["titanium", "SDX Precision"], ["obsidian", "SDX Phantom"], ["cobalt", "SDX Raid"], ["iridium", "SDX Ghost"]];
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var S = { year: null, month: null, openList: {} };

  function data() { return window.SDX_SCANNER_DATA || {}; }
  function trades(key, y, m) {
    var d = data()[key]; if (!d) return [];
    var pre = y + (m != null ? "-" + String(m + 1).padStart(2, "0") : "");
    return d.trades.filter(function (t) { return t[0].indexOf(pre) === 0; });
  }
  function allTrades(y, m) { var out = []; SCANNERS.forEach(function (s) { out = out.concat(trades(s[0], y, m)); }); return out; }
  function sumR(L) { return Math.round(L.reduce(function (a, t) { return a + t[6]; }, 0) * 10) / 10; }
  function rTxt(r) { return (r > 0 ? "+" : "") + r + "R"; }
  function cls(r) { return r > 0 ? "pos" : r < 0 ? "neg" : ""; }
  function count(L, res) { return L.filter(function (t) { return t[5] === res; }).length; }
  function wr(L) { var w = count(L, "TP"), l = count(L, "SL"); return w + l ? Math.round((w / (w + l)) * 100) + "%" : "—"; }
  function tile(k, v, c) { return '<div class="tile"><span class="k">' + esc(k) + '</span><span class="v ' + (c || "") + '">' + esc(v) + "</span></div>"; }
  function stats(L) {
    return '<div class="tiles">' + tile("Trades", L.length) + tile("Wins", count(L, "TP"), "pos") + tile("Risk free", count(L, "BE")) + tile("Losses", count(L, "SL"), "neg") +
      tile("Win rate (W vs L)", wr(L)) + tile("Total R", rTxt(sumR(L)), cls(sumR(L))) + "</div>";
  }
  function years() {
    var ys = {};
    Object.keys(data()).forEach(function (k) { data()[k].trades.forEach(function (t) { ys[t[0].slice(0, 4)] = 1; }); });
    return Object.keys(ys).sort();
  }

  // ---------- year: 12 month calendar ----------
  function yearView() {
    var y = S.year, L = allTrades(y);
    var cells = MONTHS.map(function (name, m) {
      var T = allTrades(y, m), r = sumR(T);
      if (!T.length) return '<div class="jday off sdm-m" style="min-height:96px;box-shadow:inset 0 0 0 1px #18191b"><span class="dn" style="font-size:12px">' + name + '</span><span class="muted" style="font-size:12px">No trades</span></div>';
      return '<button class="jday sdm-m ' + (r > 0 ? "up" : r < 0 ? "down" : "flat") + '" data-sdm="' + m + '" style="min-height:96px;cursor:pointer;border:0;text-align:left;color:inherit">' +
        '<span class="dn" style="font-size:12px;color:#c9ccd1">' + name + "</span>" +
        '<span class="dr" style="font-size:22px">' + rTxt(r) + "</span>" +
        '<span class="dn">' + T.length + " trades · " + count(T, "TP") + "W " + count(T, "BE") + "RF " + count(T, "SL") + "L</span></button>";
    }).join("");
    return '<section class="card pad" style="display:flex;flex-direction:column;gap:14px"><span class="eyebrow">' + y + " · ALL SCANNERS</span>" + stats(L) + "</section>" +
      '<section class="card pad" style="display:flex;flex-direction:column;gap:12px"><span class="eyebrow">MONTHS · TAP ONE FOR EVERY SCANNER</span>' +
      '<div class="sdm-grid">' + cells + "</div></section>";
  }

  // ---------- month: every scanner ----------
  function dayCal(T, y, m) {
    var first = new Date(Date.UTC(y, m, 1)).getUTCDay(); first = (first + 6) % 7; // Monday first
    var n = new Date(Date.UTC(y, m + 1, 0)).getUTCDate(), byDay = {};
    T.forEach(function (t) { var d = +t[0].slice(8, 10); byDay[d] = (byDay[d] || 0) + t[6]; });
    var html = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(function (d) { return '<div class="dn" style="font-size:10px;color:#6b7078;text-align:center">' + d + "</div>"; }).join("");
    for (var i = 0; i < first; i++) html += '<div class="jday off"></div>';
    for (var d = 1; d <= n; d++) {
      var r = byDay[d] != null ? Math.round(byDay[d] * 10) / 10 : null;
      html += '<div class="jday ' + (r == null ? "" : r > 0 ? "up" : r < 0 ? "down" : "flat") + '"><span class="dn">' + d + '</span><span class="dr">' + (r == null ? "" : rTxt(r)) + "</span></div>";
    }
    return '<div class="jcal">' + html + "</div>";
  }
  function tradeList(T) {
    return '<div class="scroll-x"><table style="min-width:560px;margin-top:6px"><thead><tr><th>Date</th><th>Time</th><th>Side</th><th class="r">Entry</th><th class="r">SL</th><th class="r">TP</th><th>Result</th><th class="r">R</th></tr></thead><tbody>' +
      T.map(function (t) {
        var res = t[5] === "TP" ? "Win" : t[5] === "BE" ? "Risk free" : "Loss";
        return "<tr><td class=\"muted\">" + esc(new Date(t[0].slice(0, 10) + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })) + '</td><td class="muted">' + esc(t[0].slice(11, 16)) + "</td><td>" + (t[1] === 1 ? "BUY" : "SELL") +
          '</td><td class="r">' + t[2] + '</td><td class="r">' + t[3] + '</td><td class="r">' + t[4] + "</td><td>" + res + '</td><td class="r ' + cls(t[6]) + '">' + rTxt(t[6]) + "</td></tr>";
      }).join("") + "</tbody></table></div>";
  }
  function monthView() {
    var y = S.year, m = S.month, L = allTrades(y, m);
    var cards = SCANNERS.map(function (s) {
      var d = data()[s[0]], T = trades(s[0], y, m);
      var headTxt = '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px;flex-wrap:wrap"><span class="eyebrow">' + esc(s[1].toUpperCase()) + "</span>" +
        (d ? '<span class="note" style="font-size:12px">' + esc(d.market + " · " + d.settings) + "</span>" : "") + "</div>";
      if (!d) return '<section class="card pad" style="display:flex;flex-direction:column;gap:8px">' + headTxt + '<div class="note">No results for this scanner yet.</div></section>';
      if (!T.length) return '<section class="card pad" style="display:flex;flex-direction:column;gap:8px">' + headTxt + '<div class="note">No trades this month.</div></section>';
      var open = S.openList[s[0]];
      return '<section class="card pad" style="display:flex;flex-direction:column;gap:14px">' + headTxt + stats(T) + dayCal(T, y, m) +
        '<button class="btn btn-ghost" data-sdl="' + s[0] + '" style="align-self:flex-start">' + (open ? "Hide trades" : "Show all " + T.length + " trades") + "</button>" + (open ? tradeList(T) : "") + "</section>";
    }).join("");
    return '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap"><button class="btn btn-ghost" data-sdback="1">Back to ' + y + "</button>" +
      '<button class="chip" data-sdstep="-1">Previous month</button><button class="chip" data-sdstep="1">Next month</button></div>' +
      '<section class="card pad" style="display:flex;flex-direction:column;gap:14px"><span class="eyebrow">' + MONTHS[m].toUpperCase() + " " + y + " · ALL SCANNERS</span>" + stats(L) + "</section>" + cards;
  }

  function render() {
    var ys = years();
    if (!ys.length) return '<div class="note">No scanner results yet.</div>';
    if (!S.year || ys.indexOf(S.year) < 0) S.year = ys[ys.length - 1];
    return '<div style="display:flex;flex-direction:column;gap:16px">' +
      '<div class="chips">' + ys.map(function (y) { return '<button class="chip' + (S.year === y ? " on" : "") + '" data-sdy="' + y + '">' + y + "</button>"; }).join("") + "</div>" +
      (S.month == null ? yearView() : monthView()) + "</div>";
  }
  function wire(page, redraw) {
    $$("[data-sdy]", page).forEach(function (b) { b.onclick = function () { S.year = b.dataset.sdy; S.month = null; redraw(); }; });
    $$("[data-sdm]", page).forEach(function (b) { b.onclick = function () { S.month = +b.dataset.sdm; S.openList = {}; redraw(); window.scrollTo(0, 0); }; });
    $$("[data-sdback]", page).forEach(function (b) { b.onclick = function () { S.month = null; redraw(); }; });
    $$("[data-sdl]", page).forEach(function (b) { b.onclick = function () { S.openList[b.dataset.sdl] = !S.openList[b.dataset.sdl]; redraw(); }; });
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
