/* SDX Members Dashboard: Failed Break journal (under ADMIN).
   A quick backtest journal for the Failed Break Model: pick a year (2020 to 2026) and month, every day of the month
   is listed, and "+ Trade" under a day adds a trade row (timeframe, direction, entry and exit time, TP in R, result, R, overlap).
   Each trade is its own row in the backtests table, model "Failed Break journal", saved to the logged-in person only. */
(function () {
  "use strict";
  var P = window.SDX_PAGES = window.SDX_PAGES || {};
  function X() { return window.SDX; }
  function esc(s) { return X().esc(s); }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function sb() { return X().sb; }
  function uid() { return X().state.session.user.id; }

  var MODEL = "Failed Break journal";
  var YEARS = [2026, 2025, 2024, 2023, 2022, 2021, 2020];
  var PAIRS = ["XAUUSD", "EURUSD", "GER30", "GBPUSD"];
  var TFS = ["M1", "M5", "M15", "M30", "H1"];
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  var now = new Date();
  var J = { rows: null, err: "", year: 2026, month: now.getFullYear() === 2026 ? now.getMonth() : 0, pair: "XAUUSD", lastTf: "M5", msg: "" };
  try { var sp = localStorage.getItem("sdx_fbj_pair"); if (PAIRS.indexOf(sp) > -1) J.pair = sp; } catch (e) { }

  async function load() {
    var r = await sb().from("backtests").select("id,pair,data").eq("model", MODEL).eq("user_id", uid());
    if (r.error) { J.err = r.error.message; J.rows = []; return; }
    J.err = ""; J.rows = r.data || [];
  }

  // ---------- maths ----------
  function num(v) { var n = parseFloat(v); return isNaN(n) ? null : n; }
  function tradeR(d) {
    var o = num(d.r); if (o != null) return o;          // R typed in by hand (partials etc.)
    if (d.result === "Loss") return -1;
    if (d.result === "BE") return 0;
    if (d.result === "Win") return num(d.tp_r) || 0;
    return null;                                          // no result yet
  }
  function rTxt(r) { var v = Math.round(r * 10) / 10; return v === 0 ? "0R" : (v > 0 ? "+" : "") + v + "R"; }
  function cls(v) { return v > 0 ? "pos" : v < 0 ? "neg" : ""; }
  function stats(list) {
    var w = 0, l = 0, b = 0, R = 0, open = 0;
    list.forEach(function (x) { var d = x.data; if (d.result === "Win") w++; else if (d.result === "Loss") l++; else if (d.result === "BE") b++; else { open++; return; } R += tradeR(d) || 0; });
    return { n: w + l + b, w: w, l: l, b: b, open: open, R: R, wr: w + l ? Math.round(w / (w + l) * 1000) / 10 : 0 };
  }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function mKey(y, m) { return y + "-" + pad(m + 1); }
  function mine() { return J.rows.filter(function (x) { return (x.pair || x.data.pair) === J.pair; }); }
  function inMonth(y, m) { var k = mKey(y, m); return mine().filter(function (x) { return (x.data.date || "").slice(0, 7) === k; }); }

  // ---------- page ----------
  function tile(k, v, c) { return '<div class="tile"><span class="k">' + k + '</span><span class="v ' + (c || "") + '">' + esc(String(v)) + "</span></div>"; }
  function sel(f, opts, v, ph) { return '<select class="input" data-f="' + f + '" style="height:36px;padding:0 8px;width:auto;font-size:13px">' + (ph ? '<option value="">' + ph + "</option>" : "") + opts.map(function (o) { return "<option" + (o === v ? " selected" : "") + ">" + o + "</option>"; }).join("") + "</select>"; }
  function lab(t, inner) { return '<label style="display:flex;flex-direction:column;gap:3px;font-size:10px;color:#7c8088;text-transform:uppercase;letter-spacing:.04em">' + t + inner + "</label>"; }

  function tradeRow(x) {
    var d = x.data, r = tradeR(d);
    var resBtn = function (v, c) { var on = d.result === v; return '<button class="tab' + (on ? " on" : "") + '" data-res="' + v + '" style="height:30px;padding:0 10px;font-size:12px' + (on ? ";color:" + c : "") + '">' + v + "</button>"; };
    return '<div class="fbj-t" data-id="' + x.id + '" style="display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end;padding:10px 12px;border-radius:10px;background:#0a0a0b;box-shadow:inset 0 0 0 1px ' + (d.result === "Win" ? "#1f4a2c" : d.result === "Loss" ? "#4a1f1f" : "#1a1a1c") + '">' +
      lab("TF", sel("tf", TFS, d.tf)) +
      lab("Side", sel("side", ["Buy", "Sell"], d.side, "–")) +
      lab("Entry", '<input class="input" type="time" data-f="entry_t" value="' + esc(d.entry_t || "") + '" style="height:36px;padding:0 8px;width:110px;font-size:13px">') +
      lab("Exit", '<input class="input" type="time" data-f="exit_t" value="' + esc(d.exit_t || "") + '" style="height:36px;padding:0 8px;width:110px;font-size:13px">') +
      lab("TP (R)", '<input class="input" type="number" step="0.1" data-f="tp_r" value="' + esc(d.tp_r == null ? "" : d.tp_r) + '" placeholder="5" style="height:36px;padding:0 8px;width:70px;font-size:13px">') +
      lab("Result", '<div class="tabs" style="padding:3px">' + resBtn("Win", "#7fd99a") + resBtn("Loss", "#ff8a8a") + resBtn("BE", "#c9ccd1") + "</div>") +
      lab("R", '<input class="input" type="number" step="0.1" data-f="r" value="' + esc(d.r == null ? "" : d.r) + '" placeholder="' + (r == null ? "" : (Math.round(r * 10) / 10)) + '" title="Leave blank to work it out from the result. Type a number for partials." style="height:36px;padding:0 8px;width:70px;font-size:13px">') +
      '<label style="display:flex;align-items:center;gap:6px;font-size:12px;color:#c9ccd1;height:36px;cursor:pointer"><input type="checkbox" data-f="overlap"' + (d.overlap ? " checked" : "") + ' style="width:16px;height:16px">Overlap</label>' +
      '<span class="' + cls(r || 0) + '" style="font-family:var(--sg);font-weight:600;font-size:16px;height:36px;display:flex;align-items:center;min-width:56px">' + (r == null ? '<span class="muted" style="font-size:12px">Open</span>' : rTxt(r)) + "</span>" +
      '<button class="x" data-del title="Delete trade" style="margin-left:auto;height:36px">×</button></div>';
  }

  function draw(page) {
    var y = J.year, m = J.month, list = inMonth(y, m), s = stats(list);
    var html = '<div style="display:flex;flex-direction:column;gap:8px"><div class="eyebrow">ADMIN</div><h1 class="title">Failed Break <span class="metal-text">journal.</span></h1>' +
      '<div class="note">Backtest the Failed Break Model day by day. Click + Trade under a day, fill in the trade, and it saves by itself.</div></div>';
    if (J.err) html += '<div class="card pad note" style="color:#ff8a8a">Couldn\'t load your trades: ' + esc(J.err) + "</div>";

    html += '<div style="display:flex;flex-wrap:wrap;gap:12px;align-items:center">' +
      '<div class="tabs">' + PAIRS.map(function (p) { return '<button class="tab' + (J.pair === p ? " on" : "") + '" data-jp="' + p + '">' + p + "</button>"; }).join("") + "</div>" +
      '<div class="tabs">' + YEARS.map(function (yy) { return '<button class="tab' + (y === yy ? " on" : "") + '" data-jy="' + yy + '">' + yy + "</button>"; }).join("") + "</div></div>";
    // months with their R
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:6px">' + MONTHS.map(function (mn, i) {
      var ms = stats(inMonth(y, i)), on = i === m;
      return '<button class="tab' + (on ? " on" : "") + '" data-jm="' + i + '" style="height:auto;padding:8px 6px;display:flex;flex-direction:column;gap:2px;box-shadow:inset 0 0 0 1px #1f2023"><span>' + mn.slice(0, 3) + '</span><span class="' + cls(ms.R) + '" style="font-size:11px">' + (ms.n || ms.open ? rTxt(ms.R) : "–") + "</span></button>";
    }).join("") + "</div>";

    var ys = stats(mine().filter(function (x) { return (x.data.date || "").slice(0, 4) === String(y); }));
    html += '<div class="tiles">' + tile("Trades", s.n) + tile("Wins", s.w) + tile("Losses", s.l) + tile("Breakeven", s.b) + tile("Win rate", s.wr + "%") + tile("Total R", rTxt(s.R), cls(s.R)) + "</div>" +
      '<div class="note" style="font-size:13px">' + MONTHS[m] + " " + y + (s.open ? ": " + s.open + " trade" + (s.open > 1 ? "s" : "") + " with no result yet, not counted." : ".") + " " + y + " so far: " + ys.n + " trades, win rate " + ys.wr + '%, <b class="' + cls(ys.R) + '">' + rTxt(ys.R) + "</b>. Win rate leaves breakevens out." +
      ' <span class="muted" id="fbjMsg">' + esc(J.msg) + "</span></div>";

    // days
    var dim = new Date(y, m + 1, 0).getDate(), days = "";
    for (var dd = 1; dd <= dim; dd++) {
      var ds = y + "-" + pad(m + 1) + "-" + pad(dd), wd = new Date(y, m, dd).getDay();
      var tr = list.filter(function (x) { return x.data.date === ds; }).sort(function (a, b) { return (a.data.entry_t || "99") < (b.data.entry_t || "99") ? -1 : 1; });
      var dsR = stats(tr);
      days += '<div style="display:flex;flex-direction:column;gap:8px;padding:12px 16px;border-top:1px solid #161618' + (wd === 0 || wd === 6 ? ";background:#09090a" : "") + '">' +
        '<div style="display:flex;align-items:center;gap:12px"><b style="min-width:130px">' + DAYS[wd] + " " + dd + " " + MONTHS[m].slice(0, 3) + "</b>" +
        (tr.length ? '<span class="mini ' + cls(dsR.R) + '">' + tr.length + " trade" + (tr.length > 1 ? "s" : "") + (dsR.n ? " · " + rTxt(dsR.R) : "") + "</span>" : "") +
        '<button class="btn btn-ghost" data-add="' + ds + '" style="margin-left:auto;height:32px;padding:0 12px;font-size:13px">+ Trade</button></div>' +
        tr.map(tradeRow).join("") + "</div>";
    }
    html += '<section class="card">' + days + "</section>";
    page.innerHTML = html;
    wire(page);
  }

  // ---------- saving ----------
  var timers = {};
  function setMsg(page, t) { J.msg = t; var el = $("#fbjMsg", page); if (el) el.textContent = t; }
  function find(id) { return J.rows.filter(function (x) { return String(x.id) === String(id); })[0]; }
  function save(page, x, now) {
    clearTimeout(timers[x.id]); setMsg(page, "Saving…");
    var go = async function () {
      var r = await sb().from("backtests").update({ data: x.data }).eq("id", x.id);
      setMsg(page, r.error ? "Couldn't save: " + r.error.message : "Saved");
    };
    if (now) go(); else timers[x.id] = setTimeout(go, 600);
  }

  // redraw, then put the cursor back where it was, so tabbing from box to box keeps working
  function drawKeep(page) {
    setTimeout(function () {
      var a = document.activeElement, row = a && a.closest && a.closest(".fbj-t"), f = a && a.dataset && a.dataset.f;
      var id = row && row.dataset.id;
      draw(page);
      if (id && f) { var el = $('.fbj-t[data-id="' + id + '"] [data-f="' + f + '"]', page); if (el) el.focus(); }
    }, 0);
  }

  function wire(page) {
    $$("[data-jp]", page).forEach(function (b) { b.onclick = function () { J.pair = b.dataset.jp; try { localStorage.setItem("sdx_fbj_pair", J.pair); } catch (e) { } draw(page); }; });
    $$("[data-jy]", page).forEach(function (b) { b.onclick = function () { J.year = +b.dataset.jy; draw(page); }; });
    $$("[data-jm]", page).forEach(function (b) { b.onclick = function () { J.month = +b.dataset.jm; draw(page); }; });
    $$("[data-add]", page).forEach(function (b) {
      b.onclick = async function () {
        b.disabled = true;
        var data = { date: b.dataset.add, pair: J.pair, tf: J.lastTf, side: "", entry_t: "", exit_t: "", tp_r: null, result: "", r: null, overlap: false };
        var r = await sb().from("backtests").insert({ user_id: uid(), model: MODEL, pair: J.pair, data: data }).select("id,pair,data").single();
        if (r.error) { b.disabled = false; setMsg(page, "Couldn't add: " + r.error.message); return; }
        J.rows.push(r.data); draw(page);
        var row = $('.fbj-t[data-id="' + r.data.id + '"] [data-f="entry_t"]', page); if (row) row.focus();
      };
    });
    $$(".fbj-t", page).forEach(function (el) {
      var x = find(el.dataset.id); if (!x) return;
      $$("[data-f]", el).forEach(function (inp) {
        var f = inp.dataset.f;
        var upd = function (redraw) {
          if (f === "overlap") x.data.overlap = inp.checked;
          else if (f === "tp_r" || f === "r") x.data[f] = inp.value === "" ? null : +inp.value;
          else x.data[f] = inp.value;
          if (f === "tf") J.lastTf = inp.value;
          save(page, x, redraw);
          if (redraw) drawKeep(page);
        };
        inp.oninput = function () { if (inp.type !== "checkbox" && inp.tagName !== "SELECT") upd(false); };
        inp.onchange = function () { upd(true); };
      });
      $$("[data-res]", el).forEach(function (b) {
        b.onclick = function () { x.data.result = x.data.result === b.dataset.res ? "" : b.dataset.res; save(page, x, true); draw(page); };
      });
      $("[data-del]", el).onclick = async function () {
        if (!confirm("Delete this trade?")) return;
        var r = await sb().from("backtests").delete().eq("id", x.id);
        if (r.error) { setMsg(page, "Couldn't delete: " + r.error.message); return; }
        J.rows = J.rows.filter(function (o) { return o !== x; }); draw(page);
      };
    });
  }

  P.fbjournal = async function (page) {
    if (!J.rows) { page.innerHTML = '<div class="note">Loading…</div>'; await load(); }
    draw(page);
  };
})();
