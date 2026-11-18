/* SDX Members Dashboard: Manual backtest (under ADMIN).
   A log for backtesting the Failed Break Mech Model by hand (replay on TradingView, log each trade here).
   Trades are saved to the logged-in person's own rows in the backtests table, model "Failed Break Mech". */
(function () {
  "use strict";
  var P = window.SDX_PAGES = window.SDX_PAGES || {};
  function X() { return window.SDX; }
  function esc(s) { return X().esc(s); }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function sb() { return X().sb; }
  function uid() { return X().state.session.user.id; }

  var MODEL = "Failed Break Mech";
  var PAIRS = ["XAUUSD", "EURUSD", "GER30", "GBPUSD"];
  var PIP = { XAUUSD: 0.1, GER30: 1, EURUSD: 0.0001, GBPUSD: 0.0001 };
  var TFS = ["M5", "M15", "M30", "H1"];
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  // The model's rules, ticked on every trade
  var RULES = [
    ["fb", "Failed break: wick past the swing high / low, candle closes back inside"],
    ["gap", "At least 5 candles between the structure and the failed break"],
    ["held", "No candle has closed back through the level since"],
    ["poi", "Price taps a breaker block or flipped order block (M1 to M15)"],
    ["conf", "Entry candle closes in the trade direction"],
    ["sl", "SL past the failed break wick"],
    ["rf", "Risk free point set"]
  ];

  var M = { rows: null, pair: "all", tf: "all", form: false, err: "" };
  function risk() { try { var v = parseFloat(localStorage.getItem("sdx_mbt_risk")); return isNaN(v) ? 1.5 : v; } catch (e) { return 1.5; } }
  function setRisk(v) { try { localStorage.setItem("sdx_mbt_risk", String(v)); } catch (e) { } }

  async function load() {
    var r = await sb().from("backtests").select("*").eq("model", MODEL).order("created_at", { ascending: true });
    if (r.error) { M.err = r.error.message; M.rows = []; return; }
    M.err = ""; M.rows = (r.data || []).filter(function (b) { return b.data && b.data.result; });
  }

  // ---------- maths ----------
  function num(v) { var n = parseFloat(v); return isNaN(n) ? null : n; }
  function slDist(d) { var e = num(d.entry), s = num(d.sl); return e != null && s != null ? Math.abs(e - s) : null; }
  function tradeR(d) {
    if (d.result === "Loss") return -1;
    if (d.result === "BE") return 0;
    var o = num(d.r_override); if (o != null) return o;
    var e = num(d.entry), t = num(d.tp), sd = slDist(d);
    return e != null && t != null && sd ? Math.abs(t - e) / sd : 0;
  }
  function tradePips(d) { var sd = slDist(d), p = PIP[d.pair] || 0.0001; return sd == null ? null : tradeR(d) * sd / p; }
  function rTxt(r) { var v = Math.round(r * 10) / 10; return v === 0 ? "0R" : (v > 0 ? "+" : "") + v + "R"; }
  function pTxt(p) { if (p == null) return ""; var v = Math.round(p * 10) / 10; return v === 0 ? "0 pips" : (v > 0 ? "+" : "") + v.toLocaleString("en-GB") + " pips"; }
  function cls(v) { return v > 0 ? "pos" : v < 0 ? "neg" : ""; }
  function stats(rows) {
    var w = 0, l = 0, b = 0, R = 0, pips = 0;
    rows.forEach(function (x) { var d = x.data; if (d.result === "Win") w++; else if (d.result === "Loss") l++; else b++; R += tradeR(d); pips += tradePips(d) || 0; });
    return { n: rows.length, w: w, l: l, b: b, R: R, pips: pips, wr: w + l ? Math.round(w / (w + l) * 1000) / 10 : 0 };
  }
  function when(d) { return d.date || ""; }
  function shown() {
    return M.rows.filter(function (x) { return (M.pair === "all" || x.data.pair === M.pair) && (M.tf === "all" || x.data.tf === M.tf); })
      .sort(function (a, b) { return when(a.data) < when(b.data) ? -1 : when(a.data) > when(b.data) ? 1 : 0; });
  }
  function ruleCount(d) { var c = d.rules || []; return RULES.filter(function (r) { return c.indexOf(r[0]) > -1; }).length; }

  // ---------- page ----------
  function tile(k, v, c) { return '<div class="tile"><span class="k">' + k + '</span><span class="v ' + (c || "") + '">' + esc(v) + "</span></div>"; }
  function draw(page) {
    var rows = shown(), s = stats(rows), rk = risk();
    var html = '<div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-end;gap:16px"><div style="display:flex;flex-direction:column;gap:8px"><div class="eyebrow">ADMIN</div><h1 class="title">Manual <span class="metal-text">backtest.</span></h1><div class="note">Failed Break Mech Model. Replay the chart on TradingView and log every trade the rules give you.</div></div>' +
      '<button class="btn btn-metal" id="mbAdd">+ Log trade</button></div>';
    if (M.err) html += '<div class="card pad note" style="color:#ff8a8a">Couldn\'t load your trades: ' + esc(M.err) + "</div>";
    html += '<div style="display:flex;flex-wrap:wrap;gap:12px;align-items:center"><div class="tabs">' + ["all"].concat(PAIRS).map(function (p) { return '<button class="tab' + (M.pair === p ? " on" : "") + '" data-mp="' + p + '">' + (p === "all" ? "All pairs" : p) + "</button>"; }).join("") + "</div>" +
      '<div class="tabs">' + ["all"].concat(TFS).map(function (t) { return '<button class="tab' + (M.tf === t ? " on" : "") + '" data-mt="' + t + '">' + (t === "all" ? "All timeframes" : t) + "</button>"; }).join("") + "</div>" +
      '<label class="muted" style="font-size:12px;display:flex;align-items:center;gap:8px">Risk per trade <input class="input" id="mbRisk" type="number" step="0.05" value="' + rk + '" style="width:80px;height:36px;padding:0 10px">%</label></div>';
    html += '<div class="tiles">' + tile("Trades", s.n) + tile("Wins", s.w) + tile("Losses", s.l) + tile("Breakeven", s.b) + tile("Win rate", s.wr + "%") +
      tile("Total R", rTxt(s.R), cls(s.R)) + tile("% Gain", (s.R * rk > 0 ? "+" : "") + (Math.round(s.R * rk * 100) / 100) + "%", cls(s.R)) + tile("Pips", pTxt(s.pips) || "0 pips", cls(s.pips)) + "</div>";

    // months
    var byM = {}, order = [];
    rows.forEach(function (x) { var k = when(x.data).slice(0, 7); if (!k) k = "No date"; if (!byM[k]) { byM[k] = []; order.push(k); } byM[k].push(x); });
    var mName = function (k) { if (k === "No date") return k; var y = k.slice(0, 4), m = +k.slice(5, 7); return MONTHS[m - 1] + " " + y; };
    if (order.length) {
      html += '<section class="card"><div class="scroll-x"><table style="min-width:760px"><thead><tr style="background:#0c0c0d"><th>Month</th><th>Trades</th><th>Wins</th><th>Losses</th><th>BE</th><th>Win rate</th><th>% Gain</th><th>Total R</th><th>Pips</th></tr></thead><tbody>' +
        order.map(function (k) { var m = stats(byM[k]); return '<tr><td><span class="pill ' + (m.R > 0 ? "win" : m.R < 0 ? "loss" : "be") + '" style="min-width:120px">' + esc(mName(k)) + "</span></td><td>" + m.n + "</td><td>" + m.w + "</td><td>" + m.l + "</td><td>" + m.b + "</td><td>" + m.wr + '%</td><td class="' + cls(m.R) + '">' + (m.R * rk > 0 ? "+" : "") + (Math.round(m.R * rk * 100) / 100) + '%</td><td class="' + cls(m.R) + '"><b>' + rTxt(m.R) + '</b></td><td class="' + cls(m.pips) + '">' + pTxt(m.pips) + "</td></tr>"; }).join("") +
        "</tbody></table></div></section>";
    }

    // trades
    html += '<section class="card"><div class="scroll-x"><table style="min-width:1100px"><thead><tr style="background:#0c0c0d"><th>#</th><th>Date</th><th>Pair</th><th>TF</th><th>Side</th><th>Entry</th><th>SL</th><th>TP</th><th>Result</th><th>R</th><th>Pips</th><th>Rules</th><th>Chart</th></tr></thead><tbody>' +
      rows.map(function (x, i) { return { x: x, i: i }; }).reverse().map(function (o) {
        var d = o.x.data, r = tradeR(d), pp = tradePips(d), rc = ruleCount(d), dt = when(d);
        return '<tr data-mbe="' + o.x.id + '" style="cursor:pointer"><td class="muted">' + (o.i + 1) + "</td><td>" + (dt ? esc(new Date(dt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })) + ' <span class="muted">' + esc(dt.slice(11, 16)) + "</span>" : "") +
          "</td><td><b>" + esc(d.pair || "") + "</b></td><td>" + esc(d.tf || "") + "</td><td>" + esc(d.side || "") + "</td><td>" + esc(d.entry || "") + "</td><td>" + esc(d.sl || "") + "</td><td>" + esc(d.tp || "") +
          '</td><td><span class="pill ' + (d.result === "Win" ? "win" : d.result === "Loss" ? "loss" : "be") + '">' + esc(d.result) + '</span></td><td class="' + cls(r) + '"><b>' + rTxt(r) + '</b></td><td class="' + cls(pp) + '">' + pTxt(pp) +
          '</td><td><span class="mini" style="color:' + (rc === RULES.length ? "#7fd99a" : "#ffcf70") + '">' + rc + "/" + RULES.length + "</span></td><td>" +
          (d.chart ? '<a href="' + esc(d.chart) + '" target="_blank" rel="noopener"><img src="' + esc(d.chart) + '" alt="" style="width:56px;height:34px;object-fit:cover;border-radius:4px;display:block"></a>' : "") + "</td></tr>";
      }).join("") + "</tbody></table></div>" +
      (rows.length ? "" : '<div class="note" style="padding:40px;text-align:center">No trades logged yet. Click Log trade to add your first one.</div>') + "</section>";
    if (rows.length) html += '<div class="note" style="font-size:12px;margin-top:-14px">Tap a trade to edit it. R and pips work out from your entry, SL and TP. Win rate leaves breakevens out.</div>';

    if (M.form) html += form();
    page.innerHTML = html;
    wire(page);
  }

  function form() {
    var ed = M.form === true ? null : M.rows.filter(function (x) { return x.id === M.form; })[0], d = ed ? ed.data : { pair: M.pair !== "all" ? M.pair : "XAUUSD", tf: M.tf !== "all" ? M.tf : "M15", side: "Buy", result: "Win", rules: [] };
    var sel = function (id, opts, v) { return '<select class="input" id="' + id + '">' + opts.map(function (o) { return "<option" + (o === v ? " selected" : "") + ">" + o + "</option>"; }).join("") + "</select>"; };
    var on = d.rules || [];
    return '<div class="panel-wrap"><section class="panel"><div style="display:flex;justify-content:space-between;align-items:center"><div style="font-family:var(--sg);font-size:22px;font-weight:600">' + (ed ? "Edit trade" : "Log trade") + '</div><button class="x" id="mbClose">×</button></div>' +
      '<div class="form-grid">' +
      '<label class="field">Pair' + sel("f_pair", PAIRS, d.pair) + "</label>" +
      '<label class="field">Timeframe' + sel("f_tf", TFS, d.tf) + "</label>" +
      '<label class="field wide">Date and time (UK)<input class="input" id="f_date" type="datetime-local" value="' + esc(d.date || "") + '"></label>' +
      '<label class="field">Direction' + sel("f_side", ["Buy", "Sell"], d.side) + "</label>" +
      '<label class="field">Result' + sel("f_res", ["Win", "Loss", "BE"], d.result) + "</label>" +
      '<label class="field">Entry<input class="input" id="f_e" type="number" step="any" value="' + esc(d.entry || "") + '"></label>' +
      '<label class="field">SL<input class="input" id="f_sl" type="number" step="any" value="' + esc(d.sl || "") + '"></label>' +
      '<label class="field">TP<input class="input" id="f_tp" type="number" step="any" value="' + esc(d.tp || "") + '"></label>' +
      '<label class="field">R on a win (only if not the full TP)<input class="input" id="f_ro" type="number" step="any" placeholder="e.g. 3.5 for partials" value="' + esc(d.r_override == null ? "" : d.r_override) + '"></label>' +
      '<div class="field wide"><span id="f_calc" style="color:#e6e8eb;font-size:13px"></span></div>' +
      '<div class="field wide">Model rules<div style="display:flex;flex-direction:column;gap:8px">' + RULES.map(function (r) { return '<label style="display:flex;gap:10px;align-items:flex-start;color:#c9ccd1;font-size:13px;line-height:1.4;cursor:pointer"><input type="checkbox" data-rule="' + r[0] + '"' + (on.indexOf(r[0]) > -1 ? " checked" : "") + ' style="margin-top:2px;width:16px;height:16px;flex:none">' + esc(r[1]) + "</label>"; }).join("") + "</div></div>" +
      '<div class="field wide">Chart screenshot' + (d.chart ? '<img src="' + esc(d.chart) + '" alt="" style="width:100%;max-height:200px;object-fit:cover;border-radius:10px">' : "") + '<div style="display:flex;gap:8px;flex-wrap:wrap"><label class="btn btn-ghost" style="cursor:pointer;height:40px">' + (d.chart ? "Change image" : "Upload image") + '<input type="file" accept="image/*" id="f_img" hidden></label><input class="input" id="f_chart" value="' + esc(d.chart || "") + '" placeholder="or paste a TradingView link" style="height:40px;flex:1;min-width:160px"></div></div>' +
      '<label class="field wide">Notes<textarea class="input" id="f_notes" rows="3" style="height:auto;padding:12px;line-height:1.6">' + esc(d.notes || "") + "</textarea></label>" +
      '</div><div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn btn-metal" id="mbSave">Save trade</button>' + (ed ? '<button class="btn btn-ghost" id="mbDel" style="color:#ff8a8a;border-color:#3a1c1c">Delete</button>' : "") + '</div><span class="muted" id="f_msg" style="font-size:12px"></span></section></div>';
  }

  function readForm(page) {
    var g = function (id) { var el = $("#" + id, page); return el ? el.value.trim() : ""; };
    return { pair: g("f_pair"), tf: g("f_tf"), date: g("f_date"), side: g("f_side"), result: g("f_res"), entry: g("f_e"), sl: g("f_sl"), tp: g("f_tp"),
      r_override: g("f_ro") === "" ? null : g("f_ro"), rules: $$("[data-rule]", page).filter(function (c) { return c.checked; }).map(function (c) { return c.dataset.rule; }),
      chart: g("f_chart"), notes: g("f_notes") };
  }

  function wire(page) {
    $$("[data-mp]", page).forEach(function (b) { b.onclick = function () { M.pair = b.dataset.mp; draw(page); }; });
    $$("[data-mt]", page).forEach(function (b) { b.onclick = function () { M.tf = b.dataset.mt; draw(page); }; });
    var rk = $("#mbRisk", page); if (rk) rk.onchange = function () { var v = parseFloat(rk.value); if (!isNaN(v) && v > 0) { setRisk(v); draw(page); } };
    $("#mbAdd", page).onclick = function () { M.form = true; draw(page); };
    $$("[data-mbe]", page).forEach(function (tr) { tr.onclick = function (e) { if (e.target.closest("a")) return; M.form = tr.dataset.mbe; draw(page); }; });
    if (!M.form) return;
    $("#mbClose", page).onclick = function () { M.form = false; draw(page); };
    var calc = function () {
      var d = readForm(page), sd = slDist(d), out = [];
      if (sd) out.push("SL " + (Math.round(sd / (PIP[d.pair] || 0.0001) * 10) / 10).toLocaleString("en-GB") + " pips");
      if (d.entry && d.sl && d.tp && sd) out.push("TP " + (Math.round(Math.abs(num(d.tp) - num(d.entry)) / sd * 10) / 10) + "R");
      if (sd) out.push("This trade: " + rTxt(tradeR(d)) + " ( " + pTxt(tradePips(d)) + " )");
      var bad = "";
      if (d.entry && d.sl && d.tp) { var e = num(d.entry), s = num(d.sl), t = num(d.tp); if (d.side === "Buy" && !(s < e && t > e)) bad = "For a buy, SL should be below entry and TP above."; if (d.side === "Sell" && !(s > e && t < e)) bad = "For a sell, SL should be above entry and TP below."; }
      $("#f_calc", page).innerHTML = esc(out.join(" · ")) + (bad ? '<br><span style="color:#ffcf70">' + esc(bad) + "</span>" : "");
    };
    $$("#f_pair,#f_side,#f_res,#f_e,#f_sl,#f_tp,#f_ro", page).forEach(function (el) { el.oninput = calc; el.onchange = calc; });
    calc();
    var img = $("#f_img", page);
    if (img) img.onchange = async function () {
      var f = img.files && img.files[0]; if (!f) return;
      if (!window.SDX_UPLOAD) { $("#f_msg", page).textContent = "Image uploads aren't switched on yet."; return; }
      $("#f_msg", page).textContent = "Uploading…";
      try { $("#f_chart", page).value = await window.SDX_UPLOAD(f); $("#f_msg", page).textContent = "Image added. Tap Save trade."; } catch (e) { $("#f_msg", page).textContent = "Couldn't upload: " + (e.message || e); }
    };
    var del = $("#mbDel", page);
    if (del) del.onclick = async function () {
      if (!confirm("Delete this trade?")) return;
      var r = await sb().from("backtests").delete().eq("id", M.form);
      if (r.error) { $("#f_msg", page).textContent = "Couldn't delete: " + r.error.message; return; }
      M.form = false; await load(); draw(page);
    };
    $("#mbSave", page).onclick = async function () {
      var d = readForm(page);
      if (!d.entry || !d.sl) { $("#f_msg", page).textContent = "Add the entry and SL."; return; }
      if (d.result === "Win" && !d.tp && d.r_override == null) { $("#f_msg", page).textContent = "Add the TP, or the R you made."; return; }
      var r = M.form === true
        ? await sb().from("backtests").insert({ user_id: uid(), model: MODEL, pair: d.pair, data: d })
        : await sb().from("backtests").update({ pair: d.pair, data: d }).eq("id", M.form);
      if (r.error) { $("#f_msg", page).textContent = "Couldn't save: " + r.error.message; return; }
      M.form = false; await load(); draw(page);
    };
  }

  P.manualbt = async function (page) {
    if (!M.rows) { page.innerHTML = '<div class="note">Loading…</div>'; await load(); }
    draw(page);
  };
})();
