/* SDX Members Dashboard: extra pages */
(function () {
  "use strict";
  var P = (window.SDX_PAGES = {});
  function X() { return window.SDX; }
  function esc(s) { return X().esc(s); }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function head(eyebrow, a, b, sub) {
    return '<div style="display:flex;flex-direction:column;gap:8px"><div class="eyebrow">' + eyebrow + '</div><h1 class="title">' + a + ' <span class="metal-text">' + b + "</span></h1>" + (sub ? '<div class="note">' + sub + "</div>" : "") + "</div>";
  }
  function money(n) { var v = Math.abs(Math.round(n * 100) / 100), whole = v % 1 === 0; return (n < 0 ? "-$" : "$") + v.toLocaleString("en-US", { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: 2 }); }

  // extra styles
  var css = document.createElement("style");
  css.textContent =
    ".chips{display:flex;flex-wrap:wrap;gap:8px}.chip{min-height:38px;padding:0 15px;border-radius:999px;cursor:pointer;font:500 12px Inter,sans-serif;background:transparent;color:#c9ccd1;border:1px solid #2a2b2e}.chip.on{background:var(--metal);color:#0a0a0a;border-color:#c9ccd1;font-weight:600}" +
    ".grid-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:16px}" +
    ".vid{position:relative;aspect-ratio:16/9;background:radial-gradient(80% 120% at 70% 0%,#232428 0%,#0c0c0d 70%);display:flex;align-items:center;justify-content:center;border-bottom:1px solid #1a1a1c}" +
    ".play{width:54px;height:54px;border-radius:50%;background:var(--metal);display:flex;align-items:center;justify-content:center}" +
    ".list-link{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:46px;padding:0 10px;margin:0 -6px;border-radius:8px;color:#e6e8eb;font-size:13px}.list-link:hover{background:#151517}" +
    ".mini{font-size:10px;letter-spacing:.08em;color:#6b7078;padding:3px 7px;border-radius:4px;box-shadow:inset 0 0 0 1px #24262a}" +
    ".form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.form-grid .wide{grid-column:1/-1}" +
    "select.input{appearance:auto}" +
    ".panel-wrap{position:fixed;inset:0;background:rgba(0,0,0,.7);display:flex;justify-content:flex-end;z-index:50}.panel{width:100%;max-width:460px;height:100%;overflow-y:auto;background:#0c0c0d;border-left:1px solid #1f2023;padding:28px;display:flex;flex-direction:column;gap:16px}" +
    ".modal-wrap{position:fixed;inset:0;background:rgba(0,0,0,.7);display:flex;align-items:flex-start;justify-content:center;padding:60px 20px;z-index:50;overflow-y:auto}.modal{width:100%;max-width:720px;background:#0c0c0d;border-radius:16px;box-shadow:inset 0 0 0 1px #2a2b2e;padding:26px;display:flex;flex-direction:column;gap:16px}" +
    ".x{width:44px;height:44px;border-radius:50%;border:1px solid #2a2b2e;background:transparent;color:#a3a7ae;cursor:pointer;font-size:18px}" +
    ".sym{min-height:44px;border-radius:10px;cursor:pointer;font:600 13px 'Space Grotesk',sans-serif;background:#070708;color:#c9ccd1;border:1px solid #222326}.sym.on{background:#18191c;color:#fff;border-color:#c9ccd1}" +
    ".ev{width:100%;text-align:left;background:transparent;border:none;border-top:1px solid #161618;cursor:pointer;color:#f4f4f5;font:13px Inter,sans-serif;display:grid;grid-template-columns:64px 64px minmax(0,1fr) repeat(3,76px);align-items:center;gap:12px;padding:12px 20px}.ev:hover{filter:brightness(1.25)}" +
    ".dot{width:8px;height:8px;border-radius:50%;display:inline-block}.expl{padding:4px 20px 20px 160px;background:#0e0e10;display:flex;flex-direction:column;gap:12px}" +
    ".k-live{background:linear-gradient(160deg,rgba(255,92,92,.10) 0%,#121214 70%);box-shadow:inset 0 0 0 1px rgba(255,92,92,.35)}.k-live .tag{background:rgba(255,92,92,.14);color:#ff8a8a}" +
    ".mbar{display:none}.scrim{display:none}" +
    "@media (max-width:860px){.mbar{display:flex;position:sticky;top:0;z-index:40;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;background:#0a0a0a;border-bottom:1px solid #18181a}.mbar .brand-row img{height:26px}.mbtn{width:44px;height:44px;border-radius:12px;border:1px solid #2a2b2e;background:#111113;color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer}" +
    ".side{position:fixed!important;top:0;left:0;bottom:0;width:280px;max-width:84vw!important;z-index:70;transform:translateX(-100%);transition:transform .25s ease;overflow-y:auto}.side.open{transform:none;box-shadow:20px 0 60px rgba(0,0,0,.6)}" +
    ".scrim{display:block;position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:65;opacity:0;pointer-events:none;transition:opacity .2s}.scrim.open{opacity:1;pointer-events:auto}.main{padding:18px 16px 40px!important}.topbar{display:none!important}}" +
    "@media (max-width:760px){.ev{grid-template-columns:50px 50px 1fr}.ev .hide-sm{display:none}.expl{padding:4px 16px 16px}.form-grid{grid-template-columns:1fr}}";
  document.head.appendChild(css);

  // ======================= TRADE BREAKDOWNS =======================
  var bdFilter = "all";
  P.breakdowns = function (page) {
    var T = X().TRADES.map(function (t, i) { return { n: i + 1, month: t[0], pair: t[1], w: t[2], rr: t[3], r: t[5] }; }).reverse();
    var shown = T.filter(function (c) { return bdFilter === "all" || c.w === bdFilter; });
    var F = [["all", "All trades"], ["Win", "Wins"], ["Loss", "Losses"], ["BE", "Breakevens"]];
    page.innerHTML = head("VIDEO BREAKDOWNS", "Trade", "breakdowns.", "Every trade sent out, broken down on video.") +
      '<div class="chips">' + F.map(function (f) { return '<button class="chip' + (f[0] === bdFilter ? " on" : "") + '" data-f="' + f[0] + '">' + f[1] + "</button>"; }).join("") + "</div>" +
      '<div class="grid-cards">' + shown.map(function (c) {
        var cls = c.w === "Win" ? "pos" : c.w === "Loss" ? "neg" : "";
        var tagBg = c.w === "Win" ? "#13261a" : c.w === "Loss" ? "#2e1313" : "#1c1c1e";
        var tagC = c.w === "Win" ? "#7fd99a" : c.w === "Loss" ? "#ff8a8a" : "#c9ccd1";
        return '<div class="card"><div class="vid"><span class="eyebrow" style="position:absolute;top:12px;left:14px">' + esc(c.pair) + '</span><div class="play"><svg width="18" height="18" viewBox="0 0 24 24" fill="#0a0a0a"><polygon points="8 5 19 12 8 19"/></svg></div><span class="muted" style="position:absolute;bottom:10px;right:14px;font-size:11px">Video coming soon</span></div>' +
          '<div style="padding:16px 18px;display:flex;flex-direction:column;gap:10px"><div style="display:flex;justify-content:space-between;align-items:center"><span style="font-family:var(--sg);font-size:17px;font-weight:600">Trade ' + c.n + '</span><span class="tag" style="background:' + tagBg + ";color:" + tagC + '">' + (c.w === "BE" ? "BREAKEVEN" : c.w.toUpperCase()) + "</span></div>" +
          '<div style="display:flex;justify-content:space-between;align-items:flex-end"><div class="note" style="font-size:12px">Sent ' + esc(c.month) + "<br>" + esc(c.pair) + " · RR " + esc(c.rr) + '</div><span class="' + cls + '" style="font-family:var(--sg);font-size:20px;font-weight:700">' + esc(c.r) + "</span></div></div></div>";
      }).join("") + "</div>";
    $$(".chip", page).forEach(function (b) { b.onclick = function () { bdFilter = b.dataset.f; P.breakdowns(page); }; });
  };

  // ======================= LIVE SESSIONS =======================
  // Timetable: every day, live trading 08:00 to 10:30, daily breakdown at 19:00 (UK time)
  var TIMETABLE = [
    { name: "Live trading session", start: "08:00", end: "10:30" },
    { name: "Daily breakdown", start: "19:00", end: "" }
  ];
  var DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  function ukNow() {
    var p = {}; new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", weekday: "long", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
    return { day: p.weekday, mins: (parseInt(p.hour, 10) % 24) * 60 + parseInt(p.minute, 10) };
  }
  function toMins(t) { var a = t.split(":"); return parseInt(a[0], 10) * 60 + parseInt(a[1], 10); }
  function nextSession() {
    var n = ukNow();
    for (var i = 0; i < TIMETABLE.length; i++) {
      var s = TIMETABLE[i], st = toMins(s.start), en = s.end ? toMins(s.end) : st + 60;
      if (n.mins >= st && n.mins < en) return { s: s, now: true };
    }
    for (var j = 0; j < TIMETABLE.length; j++) { if (toMins(TIMETABLE[j].start) > n.mins) return { s: TIMETABLE[j], in: toMins(TIMETABLE[j].start) - n.mins }; }
    return { s: TIMETABLE[0], in: 1440 - n.mins + toMins(TIMETABLE[0].start), tomorrow: true };
  }
  function fmtIn(m) { var h = Math.floor(m / 60), r = m % 60; return (h ? h + "h " : "") + r + "m"; }
  P.live = function (page) {
    var lv = X().liveNow(), n = ukNow(), nx = nextSession();
    var next = nx.now ? "On now: " + nx.s.name : "Next: " + nx.s.name + " at " + nx.s.start + (nx.tomorrow ? " tomorrow" : "") + " · in " + fmtIn(nx.in);
    var grid = '<div class="scroll-x"><table style="min-width:760px"><thead><tr style="background:#0c0c0d"><th>Session</th>' +
      DAYS.map(function (d) { return '<th style="text-align:center' + (d === n.day ? ";color:#fff" : "") + '">' + d.slice(0, 3).toUpperCase() + (d === n.day ? '<div style="height:2px;margin-top:6px;background:var(--metal);border-radius:2px"></div>' : "") + "</th>"; }).join("") + "</tr></thead><tbody>" +
      TIMETABLE.map(function (s) {
        var st = toMins(s.start), en = s.end ? toMins(s.end) : st + 60;
        return '<tr><td style="white-space:nowrap"><div style="font-weight:600">' + s.name + '</div><div class="muted" style="font-size:12px">' + s.start + (s.end ? " – " + s.end : "") + " UK</div></td>" +
          DAYS.map(function (d) {
            var today = d === n.day, onNow = today && n.mins >= st && n.mins < en, done = today && n.mins >= en;
            var style = onNow ? "background:var(--metal);color:#0a0a0a;font-weight:700" : today ? "background:#18191c;color:#fff;box-shadow:inset 0 0 0 1px #3a3b3f" : "background:#111113;color:#a3a7ae";
            return '<td style="text-align:center"><div style="border-radius:10px;padding:10px 6px;font-size:12px;' + style + '">' + (onNow ? "LIVE NOW" : s.start) + (done ? '<div style="font-size:10px;color:#6b7078;margin-top:2px">Done</div>' : "") + "</div></td>";
          }).join("") + "</tr>";
      }).join("") + "</tbody></table></div>";
    var past = X().state.messages.filter(function (m) { return X().isLive(m); }).slice().reverse().slice(0, 10);
    page.innerHTML = head("LIVE", "Live", "sessions.", "Live with Sam every day. Join links show here and on your dashboard the moment a session starts.") +
      (lv ? X().liveBanner(lv) : '<section class="card" style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;padding:18px 22px"><div style="display:flex;align-items:center;gap:14px"><span style="width:12px;height:12px;border-radius:50%;background:#3a3b3f"></span><div><div style="font-family:var(--sg);font-size:20px;font-weight:700">Not live right now</div><div class="note" style="font-size:12px">' + next + '</div></div></div><span class="btn btn-ghost" style="opacity:.5;cursor:default">Join the session</span></section>') +
      '<section class="card"><div style="display:flex;justify-content:space-between;align-items:center;padding:18px 20px 8px"><span class="eyebrow">WEEKLY TIMETABLE</span><span class="muted" style="font-size:12px">All times UK</span></div>' + grid + "</section>" +
      '<section class="card"><div class="eyebrow" style="padding:18px 20px 6px">PAST SESSIONS</div>' +
      (past.length ? past.map(function (m) {
        var d = new Date(m.sent_at);
        return '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;padding:14px 20px;border-top:1px solid #161618"><div><div style="font-weight:600">' + d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/London" }) + '</div><div class="muted" style="font-size:12px">Started ' + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" }) + '</div></div>' + (lv && m.message_id === lv.message_id ? '<span class="tag" style="background:rgba(255,92,92,.14);color:#ff8a8a">LIVE NOW</span>' : '<span class="mini">ENDED</span>') + '</div>';
      }).join("") : '<div class="note" style="padding:20px">No sessions yet.</div>') + "</section>";
  };

  // ======================= EDUCATION =======================
  // Add videos here: [title, short description, video file, length]. Leave the file "" to show "Coming soon".
  // Video files sit next to index.html. A thumbnail with the same name (.jpg) is used automatically.
  var EDU = [
    ["EDUCATION", [
      ["Welcome to the free trade service", "What you get and how it all works.", "01-welcome.mp4", "1:34"],
      ["Broker setup & signal breakdown", "Setting up your broker and reading a signal.", "02-broker-setup.mp4", "1:52"],
      ["Risk management", "How much to risk and keeping it the same every trade.", "03-risk-management.mp4", "3:54"],
      ["Understanding real trading vs fake", "What real trading results look like.", "04-real-vs-fake.mp4", "1:29"],
      ["The trade tracker", "How every trade is tracked and what the numbers mean.", "05-trade-tracker.mp4", "1:37"]
    ]]
  ];
  // ---- video progress (saved per student in journal_items, kind "video") ----
  var VP = { rows: null };
  function eduAll() { var a = []; EDU.forEach(function (g) { g[1].forEach(function (v) { if (v[2]) a.push(v); }); }); return a; }
  function secs(t) { var p = String(t || "0:00").split(":"); return (+p[0] || 0) * 60 + (+p[1] || 0); }
  async function vpLoad() {
    try { var r = await X().sb.from("journal_items").select("*").eq("kind", "video"); VP.rows = r.error ? [] : (r.data || []); }
    catch (e) { VP.rows = []; }
    return VP.rows;
  }
  function vpGet(file) { return (VP.rows || []).filter(function (r) { return r.data && r.data.v === file; })[0]; }
  async function vpSave(file, patch) {
    var row = vpGet(file), data = Object.assign({ v: file }, row ? row.data : {}, patch, { at: new Date().toISOString() });
    if (row && row.data.done) data.done = true;
    try {
      if (row) { row.data = data; await X().sb.from("journal_items").update({ data: data, updated_at: data.at }).eq("id", row.id); }
      else { var r = await X().sb.from("journal_items").insert({ user_id: (await X().sb.auth.getSession()).data.session.user.id, kind: "video", data: data }).select().single(); if (!r.error) VP.rows.push(r.data); }
    } catch (e) { }
  }
  function vpStats() {
    var all = eduAll(), done = all.filter(function (v) { var r = vpGet(v[2]); return r && r.data.done; });
    var next = all.filter(function (v) { var r = vpGet(v[2]); return !(r && r.data.done); })[0] || null;
    var last = (VP.rows || []).reduce(function (m, r) { return r.data && r.data.at > m ? r.data.at : m; }, "");
    var left = all.filter(function (v) { var r = vpGet(v[2]); return !(r && r.data.done); }).reduce(function (a, v) { return a + secs(v[3]); }, 0);
    return { all: all, total: all.length, done: done.length, next: next, nextIdx: next ? all.indexOf(next) : -1, last: last, leftMin: Math.max(1, Math.round(left / 60)) };
  }
  var MOTIVATE = [
    "Small steps every day beat big steps once a month.",
    "The traders who make it are the ones who keep learning.",
    "Your future self will thank you for the work you put in today.",
    "Discipline is doing it even when you don't feel like it.",
    "Learn the process. The results follow.",
    "Every pro was once a beginner who didn't quit.",
    "Ten minutes of learning today is ten minutes ahead of everyone else."
  ];
  function motivation(st) {
    var days = st.last ? Math.floor((Date.now() - new Date(st.last).getTime()) / 864e5) : null;
    if (st.total && st.done >= st.total) return ["You've finished every video.", "Now put it into practice. Follow the trade service and log every trade you take."];
    if (st.done === 0 && !st.last) return ["Start with the Welcome video.", "It's under 2 minutes and sets you up for everything else in the trade service."];
    var head = st.total - st.done === 1 ? "One video left. Finish it today." : "You're " + (st.total - st.done) + " videos away from finishing.";
    if (days != null && days >= 3) head = "You haven't watched a video in " + days + " days.";
    return [head, MOTIVATE[Math.floor(Date.now() / 864e5) % MOTIVATE.length] + " About " + st.leftMin + " minute" + (st.leftMin === 1 ? "" : "s") + " of video left."];
  }
  function progressBar(p) { return '<div style="height:8px;border-radius:4px;background:#1a1a1c;overflow:hidden"><div style="height:100%;width:' + p + '%;background:var(--metal);transition:width .4s"></div></div>'; }
  P.eduStats = function () { if (!VP.rows) return null; var st = vpStats(); return { done: st.done, total: st.total }; };
  // Card for the dashboard home
  P.eduCard = async function (el) {
    if (!el) return;
    await vpLoad(); var st = vpStats(); if (!st.total) { el.innerHTML = ""; return; }
    var m = motivation(st), pct = Math.round(st.done / st.total * 100), fin = st.done >= st.total;
    el.innerHTML = '<section class="card pad" style="display:flex;flex-direction:column;gap:16px"><div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap"><div class="eyebrow">YOUR EDUCATION</div><a href="#/education" class="muted" style="font-size:12px">All videos</a></div>' +
      '<div style="display:flex;justify-content:space-between;align-items:flex-end;gap:16px;flex-wrap:wrap"><div style="display:flex;flex-direction:column;gap:6px;min-width:0;flex:1 1 280px"><div style="font:600 22px var(--sg)">' + esc(m[0]) + '</div><div class="note" style="font-size:13px">' + esc(m[1]) + '</div></div>' +
      '<div style="text-align:right"><div style="font:700 34px var(--sg)">' + st.done + '<span class="muted" style="font-size:18px"> / ' + st.total + '</span></div><div class="muted" style="font-size:11px">videos completed</div></div></div>' + progressBar(pct) +
      (fin ? "" : '<a class="btn btn-metal" href="#/education/' + st.nextIdx + '" style="align-self:flex-start">' + (st.done || st.last ? "Continue: " : "Start: ") + esc(st.next[0]) + "</a>") + "</section>";
  };
  P.education = async function (page, sub) {
    var all = eduAll();
    await vpLoad();
    function draw() {
      var st = vpStats(), pct = st.total ? Math.round(st.done / st.total * 100) : 0, m = motivation(st), n = 0;
      page.innerHTML = '<section class="hero" style="min-height:190px"><div class="eyebrow">SD TRADING EDUCATION</div><h1>Education.</h1><div style="font-size:14px;color:#2a2c30">Videos on the trades sent out in the trade service.</div></section>' +
        '<section class="card pad" style="display:flex;flex-direction:column;gap:12px"><div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap"><div><div style="font:600 18px var(--sg)">' + esc(m[0]) + '</div><div class="note" style="font-size:13px">' + esc(m[1]) + '</div></div><div style="font:700 26px var(--sg)">' + st.done + '<span class="muted" style="font-size:15px"> / ' + st.total + " done</span></div></div>" + progressBar(pct) + "</section>" +
        EDU.map(function (g) {
          return '<div style="display:flex;flex-direction:column;gap:14px"><div style="display:flex;justify-content:space-between;align-items:center"><span class="eyebrow">' + g[0] + '</span><span class="muted" style="font-size:11px">' + g[1].length + (g[1].length === 1 ? " video" : " videos") + "</span></div>" +
            '<div class="grid-cards">' + g[1].map(function (v, i) {
              var idx = v[2] ? n++ : -1, soon = !v[2], thumb = soon ? "" : v[2].replace(/\.mp4$/i, ".jpg"), row = soon ? null : vpGet(v[2]), done = row && row.data.done, part = row && !done && row.data.pos ? Math.min(95, Math.round(row.data.pos / Math.max(1, secs(v[3])) * 100)) : 0;
              return '<a class="card edu-card" href="javascript:void(0)"' + (soon ? "" : ' data-v="' + idx + '"') + ' style="display:flex;flex-direction:column;color:#f4f4f5">' +
                '<div class="vid"' + (thumb ? ' style="background:linear-gradient(180deg,rgba(0,0,0,0) 55%,rgba(0,0,0,.6)),url(\'' + esc(thumb) + '\') center/cover"' : "") + '><span class="eyebrow" style="position:absolute;top:12px;left:14px">' + (i + 1 < 10 ? "0" : "") + (i + 1) + "</span>" +
                (done ? '<span class="tag" style="position:absolute;top:10px;right:12px;background:rgba(127,217,154,.9);color:#0a0a0a">WATCHED</span>' : "") +
                '<div class="play"' + (soon ? ' style="opacity:.45"' : ' style="position:absolute;left:14px;bottom:10px;width:40px;height:40px"') + '><svg width="' + (soon ? 18 : 14) + '" height="' + (soon ? 18 : 14) + '" viewBox="0 0 24 24" fill="#0a0a0a"><polygon points="8 5 19 12 8 19"/></svg></div>' +
                (soon ? '<span class="muted" style="position:absolute;bottom:10px;right:14px;font-size:11px">Coming soon</span>' : (v[3] ? '<span class="mini" style="position:absolute;bottom:10px;right:14px;background:rgba(0,0,0,.6);color:#e6e8eb">' + esc(v[3]) + "</span>" : "")) +
                (part ? '<div style="position:absolute;left:0;right:0;bottom:0;height:3px;background:rgba(255,255,255,.15)"><div style="height:100%;width:' + part + '%;background:#e6e8eb"></div></div>' : "") + "</div>" +
                '<div style="padding:16px 18px;display:flex;flex-direction:column;gap:6px"><span style="font-family:var(--sg);font-size:17px;font-weight:600">' + esc(v[0]) + '</span><span class="note" style="font-size:13px">' + esc(v[1]) + "</span>" + (part ? '<span class="muted" style="font-size:11px">' + part + "% watched</span>" : "") + "</div></a>";
            }).join("") + "</div></div>";
        }).join("") + '<div id="eduPlayer"></div>';
      page.querySelectorAll(".edu-card[data-v]").forEach(function (c) { c.onclick = function () { open(+c.getAttribute("data-v")); }; });
    }
    var holder, cur = null;
    function close() { if (holder) holder.innerHTML = ""; document.removeEventListener("keydown", onKey); cur = null; draw(); if (location.hash.split("/").length > 2) history.replaceState(null, "", "#/education"); }
    function onKey(e) { if (e.key === "Escape") close(); }
    function open(i) {
      var v = all[i]; if (!v) return; cur = i;
      holder = page.querySelector("#eduPlayer");
      var row = vpGet(v[2]);
      holder.innerHTML = '<div class="modal-wrap" id="eduWrap"><section class="modal" style="max-width:960px;padding:20px">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px"><div><div class="eyebrow">' + (i + 1 < 10 ? "0" : "") + (i + 1) + " of " + all.length + (row && row.data.done ? " · WATCHED" : "") + '</div><div style="font-family:var(--sg);font-size:20px;font-weight:600">' + esc(v[0]) + '</div></div><button class="x" id="eduClose" aria-label="Close">×</button></div>' +
        '<video src="' + esc(v[2]) + '" poster="' + esc(v[2].replace(/\.mp4$/i, ".jpg")) + '" controls autoplay playsinline preload="metadata" controlsList="nodownload" disablePictureInPicture oncontextmenu="return false" style="width:100%;aspect-ratio:16/9;border-radius:12px;background:#000;display:block"></video>' +
        '<div id="eduDone" style="display:none;border-radius:12px;padding:14px 16px;background:rgba(127,217,154,.08);box-shadow:inset 0 0 0 1px rgba(127,217,154,.25);font-size:14px"></div>' +
        '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px">' +
          (i > 0 ? '<button class="btn btn-ghost" data-go="' + (i - 1) + '">Previous</button>' : "<span></span>") +
          (i < all.length - 1 ? '<button class="btn btn-metal" data-go="' + (i + 1) + '">Next video</button>' : "<span></span>") +
        "</div></section></div>";
      var vid = holder.querySelector("video"), lastSave = 0, marked = row && row.data.done;
      if (row && !row.data.done && row.data.pos > 5) vid.addEventListener("loadedmetadata", function () { if (row.data.pos < vid.duration - 5) vid.currentTime = row.data.pos; }, { once: true });
      function finish() {
        if (marked) return; marked = true;
        vpSave(v[2], { done: true, pos: 0 }).then(function () {
          var st = vpStats(), box = holder.querySelector("#eduDone"); if (!box) return;
          box.style.display = "";
          box.innerHTML = st.done >= st.total ? "<b>That's every video done.</b> Now put it into practice in the trade service." : "<b>Nice one, that's " + st.done + " of " + st.total + " done.</b> " + (st.next ? "Up next: " + esc(st.next[0]) + "." : "");
        });
      }
      vid.addEventListener("timeupdate", function () {
        if (!vid.duration) return;
        if (vid.currentTime / vid.duration >= 0.9) finish();
        if (Date.now() - lastSave > 10000 && !marked) { lastSave = Date.now(); vpSave(v[2], { pos: Math.floor(vid.currentTime) }); }
      });
      vid.addEventListener("pause", function () { if (!marked && vid.currentTime > 3) vpSave(v[2], { pos: Math.floor(vid.currentTime) }); });
      vid.addEventListener("ended", finish);
      holder.querySelector("#eduClose").onclick = close;
      holder.querySelector("#eduWrap").onclick = function (e) { if (e.target.id === "eduWrap") close(); };
      holder.querySelectorAll("[data-go]").forEach(function (b) { b.onclick = function () { open(+b.getAttribute("data-go")); }; });
      document.removeEventListener("keydown", onKey); document.addEventListener("keydown", onKey);
    }
    draw();
    if (sub && sub[0] != null && sub[0] !== "" && !isNaN(+sub[0])) open(+sub[0]);
  };

  // ======================= SOCIALS =======================
  var SICON = {
    Instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.8" fill="currentColor"/>',
    YouTube: '<rect x="2.5" y="5.5" width="19" height="13" rx="4"/><polygon points="10 9 15 12 10 15" fill="currentColor"/>',
    TikTok: '<path d="M9 18a3 3 0 1 1 0-6"/><path d="M12 3v15"/><path d="M12 3c0 3 2.5 5 5 5"/>',
    Telegram: '<path d="M21 4L3 11l6 2 2 6 3-4 5 4z"/><path d="M9 13l12-9"/>',
    Discord: '<path d="M5 6c4-2 10-2 14 0l2 10c-2 2-4 3-6 3l-1-2h-4l-1 2c-2 0-4-1-6-3z"/><circle cx="9.5" cy="12" r="1.2" fill="currentColor"/><circle cx="14.5" cy="12" r="1.2" fill="currentColor"/>'
  };
  // Put your real links and handles here
  var SOCIALS = [
    ["Instagram", "Daily content and reels", "https://www.instagram.com/sdtradingeducation/", "@sdtradingeducation"],
    ["YouTube", "Full videos and trade breakdowns", "#", ""],
    ["TikTok", "Short clips", "https://www.tiktok.com/@sdtradingeducation", "@sdtradingeducation"],
    ["Telegram", "Trade service and updates", "https://t.me/+8WXVAwkqbedkMDg8", ""],
    ["Discord", "Community and live sessions", "https://discord.gg/sCYHMKme3", ""]
  ];
  P.socials = function (page) {
    var feat = SOCIALS.filter(function (x) { return x[0] === "Telegram"; })[0];
    var rest = SOCIALS.filter(function (x) { return x[0] !== "Telegram"; });
    var CTA = { Instagram: "Follow", YouTube: "Subscribe", TikTok: "Follow", Discord: "Join", Telegram: "Join" };
    function ic(name, size, col) { return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="' + col + '" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + SICON[name] + "</svg>"; }
    page.innerHTML = head("TOOLKIT", "Our", "socials.") +
      '<section class="hero" style="min-height:250px;justify-content:space-between;gap:20px"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap"><span class="eyebrow">MAIN CHANNEL</span><span class="tag" style="background:#0a0a0a;color:#fff">TRADE SERVICE</span></div>' +
      '<div style="display:flex;align-items:center;gap:18px;flex-wrap:wrap"><span style="width:64px;height:64px;border-radius:18px;background:#0a0a0a;display:flex;align-items:center;justify-content:center">' + ic("Telegram", 30, "#ffffff") + '</span><div><h1 style="font-size:44px">Telegram</h1><div style="font-size:14px;color:#2a2c30;margin-top:6px">' + feat[1] + (feat[3] ? " · " + esc(feat[3]) : "") + "</div></div></div>" +
      '<div><a class="btn" style="background:#0a0a0a;color:#fff" href="' + esc(feat[2]) + '" target="_blank" rel="noopener">Join on Telegram</a></div></section>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:16px">' + rest.map(function (x) {
        return '<a class="card" href="' + esc(x[2]) + '" target="_blank" rel="noopener" style="padding:24px;display:flex;flex-direction:column;gap:22px;min-height:250px;color:#f4f4f5">' +
          '<div style="display:flex;justify-content:space-between;align-items:flex-start"><span style="width:56px;height:56px;border-radius:16px;background:var(--metal);display:flex;align-items:center;justify-content:center;box-shadow:0 8px 24px rgba(200,204,210,.10)">' + ic(x[0], 26, "#0a0a0a") + '</span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8e939b" stroke-width="1.8"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="8 7 17 7 17 16"/></svg></div>' +
          '<div style="margin-top:auto;display:flex;flex-direction:column;gap:6px"><span style="font-family:var(--sg);font-size:26px;font-weight:700">' + x[0] + '</span><span class="note" style="font-size:13px">' + x[1] + "</span>" + (x[3] ? '<span style="font-size:13px;color:#c9ccd1">' + esc(x[3]) + "</span>" : "") + "</div>" +
          '<span class="btn btn-ghost" style="align-self:flex-start;height:40px">' + CTA[x[0]] + "</span></a>";
      }).join("") + "</div>";
  };

  // ======================= BROKERS =======================
  // Put your QuoMarkets referral link here
  var QUO_LINK = "#";
  var TRUSTPILOT = "https://uk.trustpilot.com/review/www.quomarkets.com";
  // Short extracts from real Trustpilot reviews (each links to the page it came from)
  var REVIEWS = [
    ["Kristina", "7 April 2026", "Very good service. Quick response and quick solution. Impressed.", "https://uk.trustpilot.com/review/www.quomarkets.com?page=7"],
    ["Jaime", "13 April 2026", "Compared to other brokers, the Spreads are very good and Execution is fast", "https://ca.trustpilot.com/review/www.quomarkets.com?page=6"],
    ["Darek", "4 May 2026", "Efficient and quick assistance in accessing the Quo Markets service.", "https://ie.trustpilot.com/review/www.quomarkets.com?page=5"],
    ["Marko", "9 May 2026", "I am grateful for the quick response and for resolving my problem.", "https://ca.trustpilot.com/review/www.quomarkets.com?page=2"]
  ];
  function stars(n) { var o = ""; for (var i = 0; i < 5; i++) o += '<span style="display:inline-flex;width:20px;height:20px;border-radius:3px;margin-right:3px;align-items:center;justify-content:center;background:' + (i < n ? "#00b67a" : "#2a2b2e") + '"><svg width="13" height="13" viewBox="0 0 24 24" fill="#fff"><path d="M12 2l3 7h7l-5.5 4.5 2 7.5-6.5-4.5-6.5 4.5 2-7.5L2 9h7z"/></svg></span>'; return o; }
  P.brokers = function (page) {
    page.innerHTML = head("PARTNERS", "Our", "broker.") +
      '<section class="hero" style="min-height:260px;justify-content:space-between;gap:22px"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap"><span class="eyebrow">RECOMMENDED BROKER</span><span class="tag" style="background:#0a0a0a;color:#fff">SDX PARTNER</span></div>' +
      '<div><h1>QuoMarkets</h1><div style="font-size:14px;color:#2a2c30;margin-top:10px;line-height:1.6;max-width:560px">The broker we use and recommend for the SDX trade service.</div></div>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap"><a class="btn" style="background:#0a0a0a;color:#fff" href="' + esc(QUO_LINK) + '" target="_blank" rel="noopener">Open an account</a><a class="btn" style="background:rgba(10,10,10,.08);color:#0a0a0a;box-shadow:inset 0 0 0 1px rgba(10,10,10,.25)" href="' + TRUSTPILOT + '" target="_blank" rel="noopener">Read the reviews</a></div></section>' +
      '<div class="row" style="align-items:stretch">' +
      '<section class="card pad" style="flex:1 1 300px;display:flex;flex-direction:column;gap:14px"><span class="eyebrow">TRUSTPILOT</span><div style="display:flex;align-items:baseline;gap:12px"><span style="font-family:var(--sg);font-size:56px;font-weight:700;line-height:1">4.9</span><span style="font-size:15px;font-weight:600">Excellent</span></div><div>' + stars(5) + '</div><div class="note">TrustScore 4.9 out of 5 from over 3,400 reviews.</div><a href="' + TRUSTPILOT + '" target="_blank" rel="noopener" style="text-decoration:underline;font-size:13px">See all reviews on Trustpilot</a></section>' +
      '<section class="card pad" style="flex:2 1 420px;display:flex;flex-direction:column;gap:12px"><span class="eyebrow">ABOUT QUOMARKETS</span>' +
      [["Global broker", "Based in Dubai, with traders all over the world."], ["MT4 and MT5", "Trade on both platforms from one account."], ["Lots of markets", "Forex, commodities, indices, stocks and crypto."]].map(function (f) { return '<div style="display:flex;gap:14px;align-items:flex-start;padding:10px 0;border-top:1px solid #18181a"><span style="width:8px;height:8px;border-radius:50%;background:var(--metal);margin-top:6px;flex:none"></span><div><div style="font-weight:600">' + f[0] + '</div><div class="note" style="font-size:13px">' + f[1] + "</div></div></div>"; }).join("") + "</section></div>" +
      '<div style="display:flex;justify-content:space-between;align-items:center"><span class="eyebrow">WHAT TRADERS SAY</span><a href="' + TRUSTPILOT + '" target="_blank" rel="noopener" class="muted" style="font-size:12px">More on Trustpilot</a></div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px">' + REVIEWS.map(function (r) {
        return '<a class="card pad" href="' + esc(r[3]) + '" target="_blank" rel="noopener" style="display:flex;flex-direction:column;gap:12px;color:#f4f4f5"><div style="font-size:15px;line-height:1.55">"' + esc(r[2]) + '"</div><div style="margin-top:auto;display:flex;justify-content:space-between;align-items:center;font-size:12px"><span style="font-weight:600">' + esc(r[0]) + '</span><span class="muted">' + esc(r[1]) + "</span></div></a>";
      }).join("") + "</div>" +
      '<div class="note" style="font-size:11px">Reviews are short extracts from public Trustpilot reviews. Tap a review to read it in full.</div>';
  };

  // ======================= CALENDAR =======================
  var cal = { range: "week", on: { high: true, medium: true, low: true }, open: "" };
  var IMP = { high: ["High", "#ff5c5c"], medium: ["Medium", "#ff9f43"], low: ["Low", "#f2d24b"] };
  var WEEK = [
    ["2026-11-09", [["01:30", "CNY", "CPI y/y", "medium", "", "", "0.9%"], ["13:40", "USD", "Fed Bowman Speaks", "medium"], ["15:00", "USD", "Wholesale Inventories m/m", "low", "0.7%", "0.6%", "0.6%"], ["16:00", "USD", "NY Fed 1-Year Inflation Expectations", "medium", "3.9%", "", "3.9%"], ["17:25", "GBP", "BoE Gov Bailey Speaks", "medium"], ["18:00", "USD", "3-Year Note Auction", "low", "4.627%", "", "4.932%"]]],
    ["2026-11-10", [["13:30", "USD", "CPI m/m", "high", "0.4%", "0.3%", "0.6%"], ["13:30", "USD", "Core CPI m/m", "high", "", "0.2%", ""], ["18:00", "USD", "10-Year Note Auction", "low"]]],
    ["2026-11-11", [["07:00", "EUR", "German Final CPI m/m", "low"], ["All day", "USD", "Bank Holiday (Veterans Day)", "low"]]],
    ["2026-11-12", [["02:00", "NZD", "Inflation Expectations q/q", "medium"], ["07:00", "GBP", "GDP m/m", "high"], ["13:30", "USD", "Unemployment Claims", "medium"]]],
    ["2026-11-13", [["13:30", "USD", "PPI m/m", "high", "", "0.4%", "1.3%"], ["13:30", "USD", "Core PPI m/m", "high", "", "0.3%", ""]]]
  ];
  var EXPL = {
    "CPI y/y": ["How much prices in China went up compared with a year ago. China buys a lot from Australia and New Zealand, so it can move AUD and NZD too.", "Prices rising faster than expected usually helps the currency, and can lift AUD and NZD.", "Prices rising slower than expected usually weakens the currency."],
    "Fed Bowman Speaks": ["A member of the US central bank (the Fed) giving a speech. Traders listen for hints about whether US interest rates will go up or down.", "If she sounds worried about prices rising, the dollar usually goes up.", "If she sounds relaxed or talks about cutting rates, the dollar usually goes down."],
    "Wholesale Inventories m/m": ["How much stock US wholesalers are holding. A small report that rarely moves the market much.", "Higher than expected can give the dollar a small lift.", "Lower than expected can weigh on the dollar slightly."],
    "NY Fed 1-Year Inflation Expectations": ["A survey of how much Americans think prices will rise over the next year.", "If people expect prices to rise more, rate rises look more likely and the dollar usually goes up.", "If people expect prices to rise less, the dollar usually goes down."],
    "BoE Gov Bailey Speaks": ["The boss of the Bank of England giving a speech. Traders listen for hints about UK interest rates.", "If he sounds worried about prices rising, the pound usually goes up.", "If he hints at cutting rates, the pound usually goes down."],
    "3-Year Note Auction": ["The US government borrowing money for 3 years. The rate it pays shows how much interest investors want.", "A higher rate than before can support the dollar.", "A lower rate than before can weigh on the dollar."],
    "10-Year Note Auction": ["The US government borrowing money for 10 years. The rate it pays shows how much interest investors want.", "A higher rate than before can support the dollar.", "A lower rate than before can weigh on the dollar."],
    "CPI m/m": ["The big one. How much prices in the US went up this month. The Fed watches this closely to decide on interest rates, so it can move every USD pair and gold hard.", "Prices rising faster than forecast means rates may stay high or go up, so the dollar usually goes up and gold usually drops.", "Prices rising slower than forecast means rates may come down, so the dollar usually drops and gold usually goes up."],
    "Core CPI m/m": ["The same as CPI but without food and energy, which jump around a lot. The Fed sees this as the truer picture of prices.", "Higher than forecast usually pushes the dollar up and gold down.", "Lower than forecast usually pushes the dollar down and gold up."],
    "German Final CPI m/m": ["The final number for how much prices went up in Germany this month. Usually the same as the first estimate, so it rarely moves much.", "Higher than the first estimate can give the euro a small lift.", "Lower than the first estimate can weigh on the euro slightly."],
    "Bank Holiday (Veterans Day)": ["US banks and the bond market are shut. Stock markets are open, but the dollar often moves less than normal.", "Expect quieter, thinner trading on USD pairs.", "Thin trading can also mean odd spikes, so be careful with size."],
    "Inflation Expectations q/q": ["A survey of how much businesses in New Zealand think prices will rise over the next 2 years.", "Higher expectations make a rate rise more likely, so the kiwi (NZD) usually goes up.", "Lower expectations usually weaken the kiwi."],
    "GDP m/m": ["How much the UK economy grew this month. Basically, is the country making more money or less.", "Better than forecast means a stronger economy, so the pound usually goes up.", "Worse than forecast means a weaker economy, so the pound usually goes down."],
    "Unemployment Claims": ["How many people in the US signed on for jobless benefits this week.", "Fewer claims than forecast means jobs are strong, so the dollar usually goes up.", "More claims than forecast means jobs are weakening, so the dollar usually goes down."],
    "PPI m/m": ["How much prices went up for US businesses this month. It often feeds through to shop prices later, so it is an early warning for CPI.", "Higher than forecast usually pushes the dollar up.", "Lower than forecast usually pushes the dollar down."],
    "Core PPI m/m": ["The same as PPI but without food and energy.", "Higher than forecast usually pushes the dollar up.", "Lower than forecast usually pushes the dollar down."]
  };
  function todayUK() { return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(new Date()); }
  var CCY = { USD: "the dollar", GBP: "the pound", EUR: "the euro", JPY: "the yen", AUD: "the Aussie dollar", NZD: "the kiwi (NZD)", CAD: "the Canadian dollar", CHF: "the Swiss franc", CNY: "the yuan" };
  function explain(title, ccy) {
    if (EXPL[title]) return EXPL[title];
    var c = CCY[ccy] || "the currency", t = title.toLowerCase(), gold = ccy === "USD" ? " Gold usually moves the other way to the dollar." : "";
    if (/holiday/.test(t)) return ["Banks in this country are closed today, so there is less trading than normal.", "Expect quieter, thinner trading on " + ccy + " pairs.", "Thin trading can also mean odd spikes, so be careful with size."];
    if (/unemployment rate|claims|jobless/.test(t)) return ["How many people are out of work. Fewer people out of work means a stronger economy.", "Higher than forecast is bad news, so " + c + " usually goes down." + gold, "Lower than forecast is good news, so " + c + " usually goes up." + gold];
    if (/cpi|inflation|pce|ppi|price/.test(t)) return ["How fast prices are going up. The central bank watches this closely to decide on interest rates.", "Prices rising faster than forecast means rates may stay high or go up, so " + c + " usually goes up." + gold, "Prices rising slower than forecast means rates may come down, so " + c + " usually goes down." + gold];
    if (/employment|payroll|non-farm|jobs/.test(t)) return ["How many new jobs were created. More jobs means a stronger economy.", "More jobs than forecast usually pushes " + c + " up." + gold, "Fewer jobs than forecast usually pushes " + c + " down." + gold];
    if (/gdp/.test(t)) return ["How much the economy grew. Basically, is the country making more money or less.", "Better than forecast means a stronger economy, so " + c + " usually goes up.", "Worse than forecast means a weaker economy, so " + c + " usually goes down."];
    if (/retail sales|spending/.test(t)) return ["How much people spent in shops. Shoppers spending more usually means a healthy economy.", "Higher than forecast usually pushes " + c + " up.", "Lower than forecast usually pushes " + c + " down."];
    if (/pmi|ism|sentiment|confidence|survey/.test(t)) return ["A survey of how businesses or shoppers feel about the economy. Above 50 on a PMI means things are growing.", "Better than forecast usually pushes " + c + " up.", "Worse than forecast usually pushes " + c + " down."];
    if (/rate|statement|press conference|minutes|policy|monetary/.test(t)) return ["The central bank deciding on, or explaining, interest rates. This can move the market hard.", "If they raise rates or sound worried about prices rising, " + c + " usually goes up.", "If they cut rates or hint at cuts, " + c + " usually goes down."];
    if (/speaks|testifies|speech/.test(t)) return ["A central bank or government official giving a speech. Traders listen for hints about interest rates.", "If they sound worried about prices rising, " + c + " usually goes up.", "If they sound relaxed or talk about cutting rates, " + c + " usually goes down."];
    if (/auction|bond|note/.test(t)) return ["The government borrowing money. The rate it pays shows how much interest investors want.", "A higher rate than before can support " + c + ".", "A lower rate than before can weigh on " + c + "."];
    return ["A scheduled report for " + ccy + ". Bigger surprises against the forecast usually mean bigger moves.", "Better than forecast usually helps " + c + ".", "Worse than forecast usually weighs on " + c + "."];
  }
  var LIVE_WEEK = null, calLoading = false, calSource = "sample";
  function loadCalendar(page) {
    var url = window.SDX_CONFIG && window.SDX_CONFIG.AUTH_URL;
    if (!url || calLoading || LIVE_WEEK) return;
    calLoading = true;
    fetch(url + "/calendar").then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (j) {
      var byDay = {};
      (j.events || []).forEach(function (e) {
        var d = new Date(e.date);
        var day = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(d);
        var imp = String(e.impact || "").toLowerCase();
        var key = imp === "high" ? "high" : imp === "medium" ? "medium" : "low";
        var allDay = imp === "holiday";
        var time = allDay ? "All day" : d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" });
        (byDay[day] = byDay[day] || []).push([time, e.country, e.title, key, e.forecast || "", e.previous || "", allDay]);
      });
      LIVE_WEEK = Object.keys(byDay).sort().map(function (k) { return [k, byDay[k]]; });
      calSource = "live";
      if (location.hash.indexOf("calendar") > -1) P.calendar(page);
    }).catch(function () {}).then(function () { calLoading = false; });
  }
  P.calendar = function (page) {
    loadCalendar(page);
    var today = todayUK();
    var weekData = LIVE_WEEK || WEEK.map(function (d) { return [d[0], d[1].map(function (e) { return [e[0], e[1], e[2], e[3], e[5] || "", e[6] || "", e[2].indexOf("Holiday") > -1]; })]; });
    var days = cal.range === "today" ? weekData.filter(function (d) { return d[0] === today; }) : weekData;
    var html = '<div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-end;gap:16px">' + head("TOOLKIT", "News", "calendar.") +
      '<div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center"><div class="tabs">' + [["today", "Today"], ["week", "This week"]].map(function (r) { return '<button class="tab' + (r[0] === cal.range ? " on" : "") + '" data-r="' + r[0] + '">' + r[1] + "</button>"; }).join("") + "</div>" +
      '<div class="chips">' + Object.keys(IMP).map(function (k) { return '<button class="chip' + (cal.on[k] ? " on" : "") + '" data-i="' + k + '"><span class="dot" style="background:' + IMP[k][1] + ';margin-right:6px"></span>' + IMP[k][0] + "</button>"; }).join("") + "</div></div></div>";
    if (!days.length) html += '<div class="card pad note" style="text-align:center">No events for today.</div>';
    days.forEach(function (d) {
      var ev = d[1].filter(function (e) { return cal.on[e[3]]; });
      var label = new Date(d[0] + "T12:00:00Z").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" }).toUpperCase();
      html += '<section class="card"><div style="display:flex;justify-content:space-between;padding:14px 20px" class="eyebrow"><span>' + label + "</span><span>" + ev.length + (ev.length === 1 ? " event" : " events") + "</span></div>" +
        '<div class="ev" style="cursor:default;font-size:10px;letter-spacing:.12em;color:#5e6269;padding:8px 20px;grid-template-columns:64px 64px minmax(0,1fr) 90px 90px"><span>TIME</span><span>CCY</span><span>EVENT</span><span class="hide-sm">FORECAST</span><span class="hide-sm">PREVIOUS</span></div>';
      ev.forEach(function (e) {
        var key = d[0] + e[0] + e[2], open = cal.open === key, x = explain(e[2], e[1]), hol = e[6];
        var tint = { high: "rgba(255,92,92,0.10)", medium: "rgba(255,159,67,0.09)", low: "rgba(242,210,75,0.07)" }[e[3]];
        var col = hol ? "#a3a7ae" : IMP[e[3]][1], lab = hol ? "HOLIDAY" : IMP[e[3]][0].toUpperCase();
        if (hol) tint = "rgba(255,255,255,0.03)";
        html += '<button class="ev" data-k="' + esc(key) + '" aria-expanded="' + open + '" style="grid-template-columns:64px 64px minmax(0,1fr) 90px 90px;background:linear-gradient(90deg,' + tint + ' 0%,' + tint + ' 60%,transparent 100%)"><span style="color:#d6d8dc">' + esc(e[0]) + '</span><span style="font-weight:700;color:' + col + '"><span class="dot" style="background:' + col + ';margin-right:6px;box-shadow:0 0 8px ' + col + '"></span>' + esc(e[1]) + '</span><span style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">' + esc(e[2]) + '<span style="font-size:9px;font-weight:700;letter-spacing:.12em;padding:3px 7px;border-radius:4px;background:' + tint.replace(/0\.\d+\)$/, "0.22)") + ';color:' + col + '">' + lab + '</span></span><span class="hide-sm" style="color:#d6d8dc">' + esc(e[4]) + '</span><span class="hide-sm muted">' + esc(e[5]) + "</span></button>";
        if (open) html += '<div class="expl"><div><div class="eyebrow">WHAT IS IT</div><div style="font-size:14px;line-height:1.6;margin-top:4px">' + esc(x[0]) + '</div></div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px">' +
          '<div style="padding:12px 14px;border-radius:10px;background:rgba(127,217,154,.06);box-shadow:inset 0 0 0 1px rgba(127,217,154,.25)"><div class="pos" style="font-size:11px;font-weight:600">' + (hol ? "WHAT TO EXPECT" : "IF IT COMES IN HIGHER") + '</div><div style="font-size:13px;line-height:1.55;margin-top:4px">' + esc(x[1]) + "</div></div>" +
          '<div style="padding:12px 14px;border-radius:10px;background:rgba(255,138,138,.06);box-shadow:inset 0 0 0 1px rgba(255,138,138,.25)"><div class="neg" style="font-size:11px;font-weight:600">' + (hol ? "WATCH OUT FOR" : "IF IT COMES IN LOWER") + '</div><div style="font-size:13px;line-height:1.55;margin-top:4px">' + esc(x[2]) + "</div></div></div></div>";
      });
      html += "</section>";
    });
    html += '<div class="note" style="font-size:11px">UK time. ' + (calSource === "live" ? "From Forex Factory, updates by itself." : "From Forex Factory once the site is live.") + " Tap any event for a simple explanation.</div>";
    page.innerHTML = html;
    $$("[data-r]", page).forEach(function (b) { b.onclick = function () { cal.range = b.dataset.r; P.calendar(page); }; });
    $$("[data-i]", page).forEach(function (b) { b.onclick = function () { cal.on[b.dataset.i] = !cal.on[b.dataset.i]; P.calendar(page); }; });
    $$("button.ev[data-k]", page).forEach(function (b) { b.onclick = function () { cal.open = cal.open === b.dataset.k ? "" : b.dataset.k; P.calendar(page); }; });
  };

  // ======================= LOT SIZING =======================
  var R = { EURUSD: 1.08, GBPUSD: 1.27, AUDUSD: 0.66, NZDUSD: 0.60, USDJPY: 150, USDCHF: 0.88, USDCAD: 1.37, USDTRY: 34, USDZAR: 18, USDMXN: 18, USDSEK: 10.5, USDNOK: 10.8, USDDKK: 6.9, USDSGD: 1.34, USDHKD: 7.8, USDPLN: 4.0, USDHUF: 360, USDCZK: 23, USDCNH: 7.2 };
  function toUsd(c) { if (c === "USD") return 1; if (R[c + "USD"]) return R[c + "USD"]; if (R["USD" + c]) return 1 / R["USD" + c]; return 1; }
  var FX = {
    Majors: ["EURUSD", "GBPUSD", "USDJPY", "USDCHF", "AUDUSD", "USDCAD", "NZDUSD"],
    Minors: ["EURGBP", "EURJPY", "EURCHF", "EURAUD", "EURCAD", "EURNZD", "GBPJPY", "GBPCHF", "GBPAUD", "GBPCAD", "GBPNZD", "AUDJPY", "AUDCHF", "AUDCAD", "AUDNZD", "CADJPY", "CADCHF", "CHFJPY", "NZDJPY", "NZDCHF", "NZDCAD"],
    Exotics: ["USDTRY", "USDZAR", "USDMXN", "USDSEK", "USDNOK", "USDDKK", "USDSGD", "USDHKD", "USDPLN", "USDHUF", "USDCZK", "USDCNH", "EURTRY", "EURZAR", "EURPLN", "EURHUF", "EURNOK", "EURSEK", "GBPZAR", "GBPTRY"]
  };
  var SPEC = {};
  Object.keys(FX).forEach(function (g) { FX[g].forEach(function (s) { var q = s.slice(3); SPEC[s] = { v: (q === "JPY" || q === "HUF" ? 1000 : 10) * toUsd(q), unit: "pips", fut: false, cat: "Forex" }; }); });
  var COM = { XAUUSD: 10, XAGUSD: 50, XPTUSD: 10, XPDUSD: 10, USOIL: 10, UKOIL: 10, NATGAS: 10 };
  Object.keys(COM).forEach(function (s) { SPEC[s] = { v: COM[s], unit: "pips", fut: false, cat: "Commodities" }; });
  var FUT = { ES: 50, MES: 5, NQ: 20, MNQ: 2, YM: 5, MYM: 0.5, RTY: 50, M2K: 5, GC: 100, MGC: 10, SI: 5000, SIL: 1000, CL: 1000, MCL: 100, NG: 10000 };
  Object.keys(FUT).forEach(function (s) { SPEC[s] = { v: FUT[s], unit: "points", fut: true, cat: "Futures" }; });
  var IDX = ["US30", "NAS100", "SPX500", "GER30", "UK100", "FRA40", "EU50", "JPN225", "AUS200", "HK50"];
  IDX.forEach(function (s) { SPEC[s] = { v: 1, unit: "points", fut: false, cat: "Indices" }; });
  var lot = { mode: "calc", pair: "GBPUSD", cat: "Forex", sub: "Majors", open: false, acct: 10000, sl: 10, risk: 1, wkBal: null, wkRisk: 1 };
  try { var saved = JSON.parse(localStorage.getItem("sdx_custom_lot") || "{}"); if (saved.wkBal) lot.wkBal = saved.wkBal; if (saved.wkRisk) lot.wkRisk = saved.wkRisk; } catch (e) {}
  function lotsFor(sym, bal, risk, sl) { var sp = SPEC[sym]; if (!sp || !(sl > 0)) return null; var raw = bal * risk / 100 / (sl * sp.v); return sp.fut ? String(Math.floor(raw)) + " contracts" : raw.toFixed(2) + " lots"; }
  function parseSignal(m) {
    var t = (m.plain || "").toUpperCase().replace(/\s+/g, " ");
    var pair = null;
    Object.keys(SPEC).forEach(function (s) { if (!pair && new RegExp("\\b" + s + "\\b").test(t)) pair = s; });
    if (!pair && /XAU/.test(t)) pair = "XAUUSD";
    if (!pair && /GER|DAX/.test(t)) pair = "GER30";
    var side = /\bSELL/.test(t) ? "SELL" : /\bBUY/.test(t) ? "BUY" : "";
    var slm = t.match(/SL[^(]*\(\s*([\d.]+)\s*PIPS?/);
    return { pair: pair, side: side, pips: slm ? parseFloat(slm[1]) : null };
  }
  P.lots = function (page) {
    var sp = SPEC[lot.pair];
    var tabs = '<div class="tabs" style="align-self:flex-start">' + [["calc", "Calculator"], ["custom", "Custom lot size"]].map(function (m) { return '<button class="tab' + (m[0] === lot.mode ? " on" : "") + '" data-m="' + m[0] + '" style="min-height:40px;padding:0 20px;font-size:13px">' + m[1] + "</button>"; }).join("") + "</div>";
    var html = head("TOOLKIT", "Lot", "sizing.") + tabs;
    if (lot.mode === "calc") {
      var list = lot.cat === "Forex" ? FX[lot.sub] : lot.cat === "Futures" ? Object.keys(FUT) : lot.cat === "Commodities" ? Object.keys(COM) : lot.cat === "Indices" ? IDX : Object.keys(SPEC);
      html += '<section class="card pad" style="max-width:640px;display:flex;flex-direction:column;gap:18px"><div class="eyebrow">CALCULATOR</div>' +
        '<label class="field">Pair<button type="button" id="pairBtn" class="input" style="text-align:left;display:flex;justify-content:space-between;align-items:center;cursor:pointer;font:600 17px var(--sg)">' + lot.pair + '<span class="muted" style="font:500 11px Inter">' + sp.cat + " ▾</span></button></label>" +
        (lot.open ? '<div style="border-radius:12px;background:#0a0a0b;box-shadow:inset 0 0 0 1px #26272a;padding:14px;display:flex;flex-direction:column;gap:12px"><div class="chips">' + ["Forex", "Futures", "Commodities", "Indices", "All"].map(function (c) { return '<button class="chip' + (c === lot.cat ? " on" : "") + '" data-c="' + c + '">' + c + "</button>"; }).join("") + "</div>" +
          (lot.cat === "Forex" ? '<div class="tabs" style="align-self:flex-start">' + Object.keys(FX).map(function (g) { return '<button class="tab' + (g === lot.sub ? " on" : "") + '" data-g="' + g + '">' + g + "</button>"; }).join("") + "</div>" : "") +
          '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:6px;max-height:240px;overflow-y:auto">' + list.map(function (s) { return '<button class="sym' + (s === lot.pair ? " on" : "") + '" data-s="' + s + '">' + s + "</button>"; }).join("") + "</div></div>" : "") +
        '<div class="form-grid"><label class="field">Account size ($)<input class="input" id="acct" type="number" value="' + lot.acct + '"></label><label class="field">Stop loss (' + sp.unit + ')<input class="input" id="sl" type="number" step="0.1" value="' + lot.sl + '"></label></div>' +
        '<div class="field">Risk per trade<div style="display:flex;gap:6px">' + [0.5, 1, 2, 3].map(function (r) { return '<button class="chip' + (r === lot.risk ? " on" : "") + '" data-k="' + r + '" style="flex:1;min-height:44px;border-radius:10px">' + r + "%</button>"; }).join("") + "</div></div>" +
        '<div class="hero" style="min-height:0;padding:22px 24px;flex-direction:row;justify-content:space-between;align-items:flex-end;flex-wrap:wrap"><div><div class="eyebrow">LOT SIZE</div><div id="res" style="font-family:var(--sg);font-size:44px;font-weight:700;line-height:1.1">' + (lotsFor(lot.pair, lot.acct, lot.risk, lot.sl) || "0") + '</div></div><div style="text-align:right;font-size:12px;color:#2a2c30" id="resSub">Risking <b>' + money(lot.acct * lot.risk / 100) + "</b><br>" + money(sp.v) + " per " + (sp.unit === "pips" ? "pip" : "point") + " per lot</div></div>" +
        '<div class="note" style="font-size:11px">USD account. Cross and exotic pairs use rough exchange rates for now.</div></section>';
    } else {
      var sigs = X().state.messages.filter(function (m) { return m.kind === "signal"; }).slice(-10).reverse();
      html += '<div class="row" style="align-items:flex-start"><section class="card pad" style="flex:3 1 460px;min-width:0;display:flex;flex-direction:column;gap:18px"><div class="eyebrow">CUSTOM LOT SIZE</div><div class="note">Set your balance once at the start of the week. Every signal sent works out your lot size for you.</div>' +
        '<div class="form-grid"><label class="field">Balance this week ($)<input class="input" id="wkBal" type="number" value="' + (lot.wkBal || "") + '" placeholder="10000"></label><label class="field">Risk per signal (%)<input class="input" id="wkRisk" type="number" step="0.1" value="' + lot.wkRisk + '"></label></div>' +
        '<div id="sigList">' + sigRows(sigs) + "</div></section>" +
        '<aside id="latestBox" style="flex:2 1 300px;position:sticky;top:20px">' + latestBox() + "</aside></div>";
    }
    page.innerHTML = html;
    $$("[data-m]", page).forEach(function (b) { b.onclick = function () { lot.mode = b.dataset.m; P.lots(page); }; });
    if (lot.mode === "calc") {
      $("#pairBtn", page).onclick = function () { lot.open = !lot.open; P.lots(page); };
      $$("[data-c]", page).forEach(function (b) { b.onclick = function () { lot.cat = b.dataset.c; P.lots(page); }; });
      $$("[data-g]", page).forEach(function (b) { b.onclick = function () { lot.sub = b.dataset.g; P.lots(page); }; });
      $$("[data-s]", page).forEach(function (b) { b.onclick = function () { lot.pair = b.dataset.s; lot.open = false; P.lots(page); }; });
      $$("[data-k]", page).forEach(function (b) { b.onclick = function () { lot.risk = parseFloat(b.dataset.k); P.lots(page); }; });
      function upd() { lot.acct = parseFloat($("#acct", page).value) || 0; lot.sl = parseFloat($("#sl", page).value) || 0; $("#res", page).textContent = lotsFor(lot.pair, lot.acct, lot.risk, lot.sl) || "0"; $("#resSub", page).innerHTML = "Risking <b>" + money(lot.acct * lot.risk / 100) + "</b><br>" + money(sp.v) + " per " + (sp.unit === "pips" ? "pip" : "point") + " per lot"; }
      $("#acct", page).oninput = upd; $("#sl", page).oninput = upd;
    } else {
      function upd2() {
        lot.wkBal = parseFloat($("#wkBal", page).value) || null; lot.wkRisk = parseFloat($("#wkRisk", page).value) || 0;
        try { localStorage.setItem("sdx_custom_lot", JSON.stringify({ wkBal: lot.wkBal, wkRisk: lot.wkRisk })); } catch (e) {}
        $("#sigList", page).innerHTML = sigRows(X().state.messages.filter(function (m) { return m.kind === "signal"; }).slice(-10).reverse());
        $("#latestBox", page).innerHTML = latestBox();
      }
      $("#wkBal", page).oninput = upd2; $("#wkRisk", page).oninput = upd2;
    }
  };
  function latestBox() {
    var all = X().state.messages.filter(function (m) { return m.kind === "signal"; });
    var m = all[all.length - 1];
    var fresh = m && (Date.now() - new Date(m.sent_at).getTime()) < 12 * 3600000;
    if (!fresh) {
      return '<section class="card" style="padding:26px;display:flex;flex-direction:column;gap:14px;min-height:300px;justify-content:center;align-items:center;text-align:center;background:radial-gradient(90% 90% at 50% 0%,#1a1b1e 0%,#0c0c0d 75%)"><span class="eyebrow">NEXT SIGNAL</span>' +
        '<div style="width:64px;height:64px;border-radius:50%;box-shadow:inset 0 0 0 1px #3a3b3f;display:flex;align-items:center;justify-content:center"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#c9ccd1" stroke-width="1.6"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="11" x2="16" y2="11"/><line x1="8" y1="15" x2="16" y2="15"/></svg></div>' +
        '<div style="font-family:var(--sg);font-size:20px;font-weight:600">When a trade is sent out, your lot size will be calculated here.</div>' +
        '<div class="note" style="font-size:12px">' + (lot.wkBal ? "Ready. Using " + money(lot.wkBal) + " at " + lot.wkRisk + "% risk." : "Enter your balance this week to get started.") + "</div></section>";
    }
    var s = parseSignal(m), lots = lot.wkBal && s.pair ? lotsFor(s.pair, lot.wkBal, lot.wkRisk, s.pips) : null;
    var when = new Date(m.sent_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" });
    return '<section class="hero" style="min-height:300px;justify-content:space-between;gap:16px"><div style="display:flex;justify-content:space-between;align-items:center"><span class="eyebrow">NEW SIGNAL · ' + when + '</span><span class="tag" style="background:#0a0a0a;color:#fff">' + (s.side || "SIGNAL") + "</span></div>" +
      '<div><div style="font-family:var(--sg);font-size:30px;font-weight:700">' + esc(s.pair || "Signal") + '</div><div style="font-size:13px;color:#2a2c30">Stop ' + (s.pips != null ? s.pips + " pips" : "not found") + (lot.wkBal ? " · Risk " + money(lot.wkBal * lot.wkRisk / 100) : "") + "</div></div>" +
      '<div><div class="eyebrow">YOUR LOT SIZE</div><div style="font-family:var(--sg);font-size:52px;font-weight:700;line-height:1">' + (lots || "—") + "</div>" + (lot.wkBal ? "" : '<div style="font-size:12px;color:#2a2c30;margin-top:6px">Enter your balance this week first.</div>') + "</div></section>";
  }
  function sigRows(sigs) {
    if (!sigs.length) return '<div class="note">No signals yet.</div>';
    return sigs.map(function (m) {
      var s = parseSignal(m);
      var when = new Date(m.sent_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Europe/London" });
      var cash = lot.wkBal ? lot.wkBal * lot.wkRisk / 100 : null;
      var lots = lot.wkBal && s.pair ? lotsFor(s.pair, lot.wkBal, lot.wkRisk, s.pips) : null;
      return '<div style="display:grid;grid-template-columns:minmax(0,1.4fr) repeat(3,minmax(0,1fr));gap:10px;align-items:center;padding:14px 0;border-top:1px solid #18181a">' +
        '<div><div style="font-family:var(--sg);font-size:16px;font-weight:600">' + esc(s.pair || "Signal") + ' <span class="muted" style="font:600 10px Inter">' + s.side + '</span></div><div class="muted" style="font-size:11px">' + when + "</div></div>" +
        '<div><div class="eyebrow" style="font-size:9px">STOP</div><div style="font-size:13px">' + (s.pips != null ? s.pips + " pips" : "—") + "</div></div>" +
        '<div><div class="eyebrow" style="font-size:9px">RISK</div><div style="font-size:13px">' + (cash != null ? money(cash) : "—") + "</div></div>" +
        '<div style="text-align:right"><div class="eyebrow" style="font-size:9px">YOUR SIZE</div><div style="font-family:var(--sg);font-size:17px;font-weight:700">' + (lots || "—") + "</div></div></div>";
    }).join("");
  }

  // ======================= JOURNAL =======================
  var J = { signalLogs: null, trades: null, backtests: null, tradeFormOpen: false, edm: "Entry Model 1", edPair: null, pickerOpen: false, picked: {}, cat: "Forex", sub: "Majors", btForm: false };
  async function uid() { return X().state.session.user.id; }
  async function loadSignalLogs() { var r = await X().sb.from("signal_logs").select("*"); J.signalLogs = r.data || []; }
  async function loadTrades() { var r = await X().sb.from("journal_trades").select("*").order("trade_date", { ascending: false }); J.trades = r.data || []; }
  async function loadBacktests() { var r = await X().sb.from("backtests").select("*").order("created_at", { ascending: true }); J.backtests = r.data || []; }
  function needsTables(err) { return err ? '<div class="card pad note">Journal saving isn\'t switched on yet. Run the journal setup in Supabase.</div>' : ""; }

  P.journal = function (page, sub) {
    var s = sub && sub[0];
    if (s === "signals") return P.results(page);
    if (s === "trades") return tradeJournal(page);
    if (s === "data") return entryData(page);
    var sections = [
      ["PLANNING", [["Entry Model 1"], ["Entry Model 2"], ["Entry Model 3"], ["Setups"], ["Checklist"], ["Risk Management Plan"], ["Scaling Plan"]]],
      ["DATA", [["Entry Model Data", "#/journal/data"], ["Pre-Session Analysis"], ["Futures"], ["Funded Accounts"]]],
      ["JOURNAL", [["Signal Journal", "#/journal/signals"], ["Trade Journal", "#/journal/trades"], ["Account Progress"], ["Live Trades"]]],
      ["GOALS", [["Yearly Goals"], ["Monthly Reviews"], ["Weekly Reviews"]]]
    ];
    page.innerHTML = '<section class="hero" style="min-height:160px"><div class="eyebrow">MEMBERS JOURNAL</div><h1>Your journal.</h1></section>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:16px">' + sections.map(function (sec) {
        return '<section class="card" style="padding:18px 16px 10px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><span class="eyebrow">' + sec[0] + '</span><span class="muted" style="font-size:10px">' + (sec[1].length < 10 ? "0" : "") + sec[1].length + "</span></div>" +
          sec[1].map(function (it) { return '<a class="list-link" href="' + (it[1] || "javascript:void(0)") + '"><span>' + it[0] + '</span><span class="mini">' + (it[1] ? "OPEN" : "SOON") + "</span></a>"; }).join("") + "</section>";
      }).join("") + "</div>";
  };
  function crumb(name) { return '<div class="note" style="font-size:13px;margin-bottom:-10px"><a href="#/journal" class="muted">Journal</a> / <span style="color:#e6e8eb">' + name + "</span></div>"; }

  // ---- signal journal ----
  async function signalJournal(page) {
    page.innerHTML = crumb("Signal Journal") + head("JOURNAL", "Signal", "journal.", "Track your own results from every signal sent.") + '<div class="note">Loading…</div>';
    var r = await X().sb.from("signal_logs").select("*");
    if (r.error) { page.innerHTML = crumb("Signal Journal") + needsTables(r.error); return; }
    J.signalLogs = r.data || [];
    drawSignalJournal(page);
  }
  function drawSignalJournal(page) {
    var sigs = X().state.messages.filter(function (m) { return m.kind === "signal"; }).slice().reverse();
    var logs = {}; J.signalLogs.forEach(function (l) { logs[l.message_id] = l; });
    var took = 0, missed = 0, total = 0;
    J.signalLogs.forEach(function (l) { if (l.took) { took++; if (l.balance && l.risk_pct && l.result_r != null) total += l.balance * l.risk_pct / 100 * l.result_r; } else missed++; });
    var html = crumb("Signal Journal") + head("JOURNAL", "Signal", "journal.", "Track your own results from every signal sent.") +
      '<div class="tiles" style="padding:6px 0;border-bottom:1px solid #18181a">' + tileH("Signals sent", sigs.length) + tileH("You took", took) + tileH("Missed", missed) + tileH("Follow rate", sigs.length ? Math.round(took / sigs.length * 100) + "%" : "0%") + tileH("Your profit", money(total), total < 0 ? "neg" : total > 0 ? "pos" : "") + "</div>";
    sigs.forEach(function (m) {
      var s = parseSignal(m), l = logs[m.message_id];
      var when = new Date(m.sent_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" });
      html += '<section class="card pad" style="display:flex;flex-direction:column;gap:14px" data-mid="' + m.message_id + '"><div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:10px;align-items:center"><div style="display:flex;align-items:center;gap:12px"><span style="font-family:var(--sg);font-size:22px;font-weight:700">' + esc(s.pair || "Signal") + '</span><span class="tag" style="background:var(--metal);color:#0a0a0a">' + (s.side || "SIGNAL") + '</span><span class="muted" style="font-size:12px">' + when + "</span></div>" +
        (l ? '<span class="' + (l.took ? (l.result_r > 0 ? "pos" : l.result_r < 0 ? "neg" : "") : "muted") + '" style="font-weight:600;font-size:13px">' + (l.took ? (l.balance && l.risk_pct && l.result_r != null ? money(l.balance * l.risk_pct / 100 * l.result_r) : "Took it") : "Missed") + "</span>" : '<span class="muted" style="font-size:12px">Not logged</span>') + "</div>" +
        '<div class="note" style="font-size:12px">' + esc((m.plain || "").replace(/\s+/g, " ").slice(0, 140)) + "</div>" +
        '<div class="form-grid"><label class="field">Did you take it?<select class="input" data-f="took"><option value="">Choose</option><option value="yes"' + (l && l.took ? " selected" : "") + '>Yes, I took it</option><option value="no"' + (l && !l.took ? " selected" : "") + '>No, I missed it</option></select></label>' +
        '<label class="field">Account balance ($)<input class="input" type="number" data-f="balance" value="' + (l && l.balance != null ? l.balance : "") + '"></label>' +
        '<label class="field">Risk (%)<input class="input" type="number" step="0.1" data-f="risk_pct" value="' + (l && l.risk_pct != null ? l.risk_pct : "") + '"></label>' +
        '<label class="field">Your result (R)<input class="input" type="number" step="0.1" data-f="result_r" placeholder="e.g. 1.5 or -1" value="' + (l && l.result_r != null ? l.result_r : "") + '"></label>' +
        '<label class="field wide">Notes<input class="input" data-f="note" value="' + esc(l && l.note || "") + '"></label></div>' +
        '<div><button class="btn btn-metal" data-save>Save</button> <span class="muted" style="font-size:12px" data-msg></span></div></section>';
    });
    if (!sigs.length) html += '<div class="card pad note">No signals yet.</div>';
    page.innerHTML = html;
    $$("[data-save]", page).forEach(function (b) {
      b.onclick = async function () {
        var sec = b.closest("[data-mid]"), msg = $("[data-msg]", sec);
        var v = function (f) { return $('[data-f="' + f + '"]', sec).value; };
        if (!v("took")) { msg.textContent = "Pick whether you took it."; return; }
        var num = function (x) { return x === "" ? null : parseFloat(x); };
        var row = { user_id: await uid(), message_id: parseInt(sec.dataset.mid, 10), took: v("took") === "yes", balance: num(v("balance")), risk_pct: num(v("risk_pct")), result_r: num(v("result_r")), note: v("note") || null };
        msg.textContent = "Saving…";
        var r = await X().sb.from("signal_logs").upsert(row, { onConflict: "user_id,message_id" });
        if (r.error) { msg.textContent = "Couldn't save: " + r.error.message; return; }
        await loadSignalLogs(); drawSignalJournal(page);
      };
    });
  }
  function tileH(k, v, cls) { return '<div class="tile"><span class="k">' + k + '</span><span class="v ' + (cls || "") + '">' + esc(v) + "</span></div>"; }

  // ---- trade journal ----
  async function tradeJournal(page) {
    page.innerHTML = crumb("Trade Journal") + '<div class="note">Loading…</div>';
    var r = await X().sb.from("journal_trades").select("*").order("trade_date", { ascending: false });
    if (r.error) { page.innerHTML = crumb("Trade Journal") + needsTables(r.error); return; }
    J.trades = r.data || [];
    drawTradeJournal(page);
  }
  function drawTradeJournal(page) {
    var T = J.trades, wins = T.filter(function (t) { return t.result === "Win"; }).length, tot = T.reduce(function (a, t) { return a + (t.r || 0); }, 0);
    var html = crumb("Trade Journal") + '<div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-end;gap:16px">' + head("JOURNAL", "Trade", "journal.") + '<button class="btn btn-metal" id="newT">New trade</button></div>' +
      '<div class="tiles" style="padding:6px 0;border-bottom:1px solid #18181a">' + tileH("Trades", T.length) + tileH("Win rate", T.length ? Math.round(wins / T.length * 100) + "%" : "0%") + tileH("Total R", (tot > 0 ? "+" : "") + tot.toFixed(1) + "R", tot > 0 ? "pos" : tot < 0 ? "neg" : "") + tileH("Average R", T.length ? (tot / T.length).toFixed(2) + "R" : "0R") + "</div>" +
      '<section class="card"><div class="scroll-x"><table style="min-width:720px"><thead><tr style="background:#0c0c0d"><th>Date</th><th>Pair</th><th>Setup</th><th>Side</th><th>Session</th><th>Result</th><th class="r">R</th><th>Notes</th><th></th></tr></thead><tbody>' +
      T.map(function (t) { var c = t.result === "Win" ? "win" : t.result === "Loss" ? "loss" : "be"; return "<tr><td class=\"muted\">" + esc(t.trade_date || "") + '</td><td style="font-weight:600">' + esc(t.pair) + "</td><td>" + esc(t.setup || "") + "</td><td>" + esc(t.side || "") + "</td><td>" + esc(t.session || "") + '</td><td><span class="pill ' + c + '">' + esc(t.result || "") + '</span></td><td class="r" style="font-family:var(--sg);font-weight:600">' + (t.r != null ? t.r : "") + '</td><td class="muted" style="max-width:260px">' + esc(t.notes || "") + '</td><td><button class="chip" data-del="' + t.id + '" style="min-height:30px">Delete</button></td></tr>'; }).join("") +
      "</tbody></table></div>" + (T.length ? "" : '<div class="note" style="padding:36px;text-align:center">No trades yet. Click New trade.</div>') + "</section>";
    if (J.tradeFormOpen) {
      html += '<div class="panel-wrap"><section class="panel"><div style="display:flex;justify-content:space-between;align-items:center"><div style="font-family:var(--sg);font-size:22px;font-weight:600">New trade</div><button class="x" id="closeT">×</button></div>' +
        '<div class="form-grid"><label class="field">Date<input class="input" type="date" id="t_date" value="' + todayUK() + '"></label><label class="field">Pair<input class="input" id="t_pair" placeholder="GBPUSD"></label>' +
        '<label class="field">Setup<select class="input" id="t_setup"><option>Entry Model 1</option><option>Entry Model 2</option><option>Entry Model 3</option></select></label>' +
        '<label class="field">Side<select class="input" id="t_side"><option>Long</option><option>Short</option></select></label>' +
        '<label class="field">Session<select class="input" id="t_session"><option>London</option><option>New York</option><option>Asia</option></select></label>' +
        '<label class="field">Result<select class="input" id="t_result"><option>Win</option><option>Loss</option><option>Breakeven</option></select></label>' +
        '<label class="field">R<input class="input" type="number" step="0.1" id="t_r" placeholder="3"></label><label class="field wide">Notes<textarea class="input" id="t_notes" rows="4" style="height:auto;padding:12px"></textarea></label></div>' +
        '<button class="btn btn-metal" id="saveT">Save trade</button><span class="muted" id="t_msg" style="font-size:12px"></span></section></div>';
    }
    page.innerHTML = html;
    if (window.SDX_AI_BOX && !J.tradeFormOpen) window.SDX_AI_BOX(page, "tradejournal", "Trade Journal", "tradejournal", async function () { return T.slice(0, 80).map(function (t) { return "- " + (t.trade_date || "") + " | " + t.pair + " | " + (t.setup || "") + " | " + (t.side || "") + " | " + (t.session || "") + " | " + (t.result || "") + " " + (t.r != null ? t.r + "R" : "") + (t.notes ? " | " + String(t.notes).slice(0, 100) : ""); }).join("\n") || "(no trades)"; }, false);
    $("#newT", page).onclick = function () { J.tradeFormOpen = true; drawTradeJournal(page); };
    $$("[data-del]", page).forEach(function (b) { b.onclick = async function () { if (!confirm("Delete this trade?")) return; await X().sb.from("journal_trades").delete().eq("id", b.dataset.del); await loadTrades(); drawTradeJournal(page); }; });
    if (J.tradeFormOpen) {
      $("#closeT", page).onclick = function () { J.tradeFormOpen = false; drawTradeJournal(page); };
      $("#saveT", page).onclick = async function () {
        var g = function (i) { return $("#" + i, page).value; };
        if (!g("t_pair")) { $("#t_msg", page).textContent = "Add the pair."; return; }
        var row = { user_id: await uid(), trade_date: g("t_date") || null, pair: g("t_pair").toUpperCase(), setup: g("t_setup"), side: g("t_side"), session: g("t_session"), result: g("t_result"), r: g("t_r") === "" ? null : parseFloat(g("t_r")), notes: g("t_notes") || null };
        var r = await X().sb.from("journal_trades").insert(row);
        if (r.error) { $("#t_msg", page).textContent = "Couldn't save: " + r.error.message; return; }
        J.tradeFormOpen = false; await loadTrades(); drawTradeJournal(page);
      };
    }
  }

  // ---- entry model data ----
  // Entry Model Data columns (same as the Notion DFX EM table). "pick" = a drop-down the student fills with their own options.
  var BT_F = [["no", "Trade #", "text"], ["setup", "Setup", "pick"], ["r", "R", "number"], ["entry", "Entry", "pick"], ["position", "Position", ["", "LONG", "SHORT"]], ["opened", "Opened", "datetime"], ["closed", "Closed", "datetime"], ["confluences", "Confluences", "multi"], ["chart", "Files & media", "image"], ["poi", "What POI?", "pick"], ["draw", "What liquidity draw", "pick"], ["notes", "Text", "textarea"]];
  function btOpts(k) { var seen = {}, out = []; (J.backtests || []).forEach(function (b) { var v = b.data && b.data[k]; (Array.isArray(v) ? v : [v]).forEach(function (x) { if (x && !seen[x]) { seen[x] = 1; out.push(x); } }); }); return out.sort(); }
  function btWhen(d) { return d.opened || d.trade_date || ""; }
  function btStatus(d) { var r = parseFloat(d.r); if (isNaN(r)) return d.result || ""; return r > 0 ? "Win" : r < 0 ? "Loss" : "Breakeven"; }
  function btSession(d) { var o = d.opened || ""; if (o.length < 16) return d.session || ""; var h = +o.slice(11, 13); return h < 7 ? "Asia" : h < 12 ? "London" : h < 21 ? "New York" : "Asia"; }
  function btDate(o) { return o ? new Date(o.length <= 10 ? o + "T12:00:00" : o) : null; }
  var BT_COLS = [
    ["no", "Trade #", function (d) { return '<b>' + esc(d.no || "") + "</b>"; }],
    ["setup", "Setup", function (d) { return d.setup ? '<span class="mini" style="color:#e6e8eb">' + esc(d.setup) + "</span>" : ""; }],
    ["r", "R", function (d) { return d.r == null || d.r === "" ? "" : '<b style="font-family:var(--sg)">' + esc(d.r) + "</b>"; }],
    ["status", "Status", function (d) { var v = btStatus(d); if (!v) return ""; return '<span class="pill ' + (v === "Win" ? "win" : v === "Loss" ? "loss" : "be") + '">' + v + "</span>"; }],
    ["entry", "Entry", function (d) { return esc(d.entry || ""); }],
    ["position", "Position", function (d) { return d.position ? '<span class="mini" style="color:#e6e8eb">' + esc(d.position.toUpperCase()) + "</span>" : ""; }],
    ["opened", "Opened", function (d) { var t = btDate(btWhen(d)); return t && !isNaN(t) ? t.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) + (btWhen(d).length > 10 ? ' <span class="muted">' + btWhen(d).slice(11, 16) + "</span>" : "") : ""; }],
    ["closed", "Closed", function (d) { var t = btDate(d.closed); return t && !isNaN(t) ? t.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) + (d.closed.length > 10 ? ' <span class="muted">' + d.closed.slice(11, 16) + "</span>" : "") : ""; }],
    ["hours", "Hours", function (d) { if (!d.opened || !d.closed) return ""; var h = (new Date(d.closed) - new Date(d.opened)) / 36e5; return h >= 0 ? h.toFixed(1) : ""; }],
    ["day", "Day", function (d) { var t = btDate(btWhen(d)); return t && !isNaN(t) ? t.toLocaleDateString("en-GB", { weekday: "long" }) : ""; }],
    ["month", "Month", function (d) { var t = btDate(btWhen(d)); return t && !isNaN(t) ? t.toLocaleDateString("en-GB", { month: "long" }) : ""; }],
    ["year", "Year", function (d) { var t = btDate(btWhen(d)); return t && !isNaN(t) ? t.getFullYear() : ""; }],
    ["session", "Session", function (d) { return esc(btSession(d)); }],
    ["confluences", "Confluences", function (d) { var c = Array.isArray(d.confluences) ? d.confluences : (d.confluences ? String(d.confluences).split(/\s*,\s*/) : []); return '<div style="display:flex;flex-wrap:wrap;gap:4px;min-width:180px">' + c.filter(Boolean).map(function (x) { return '<span class="mini" style="color:#e6e8eb">' + esc(x) + "</span>"; }).join("") + "</div>"; }],
    ["chart", "Files & media", function (d) { return d.chart ? '<a href="' + esc(d.chart) + '" target="_blank" rel="noopener"><img src="' + esc(d.chart) + '" alt="" style="width:56px;height:34px;object-fit:cover;border-radius:4px;display:block"></a>' : ""; }],
    ["poi", "What POI?", function (d) { return esc(d.poi || ""); }],
    ["draw", "What liquidity draw", function (d) { return esc(d.draw || ""); }],
    ["notes", "Text", function (d) { return '<span style="display:block;max-width:220px;white-space:normal">' + esc(d.notes || "") + "</span>"; }]
  ];
  function btInput(f, v) {
    var k = f[0], label = f[1], t = f[2];
    if (Array.isArray(t)) return '<label class="field">' + label + '<select class="input" data-bt="' + k + '">' + t.map(function (o) { return '<option value="' + o + '"' + (String(v || "").toUpperCase() === o ? " selected" : "") + ">" + (o || "Choose") + "</option>"; }).join("") + "</select></label>";
    if (t === "pick") {
      var opts = btOpts(k);
      return '<div class="field">' + label + '<select class="input" data-bt="' + k + '" data-pick="' + k + '"><option value="">Choose</option>' + opts.map(function (o) { return '<option' + (v === o ? " selected" : "") + ">" + esc(o) + "</option>"; }).join("") + '<option value="__new">+ New option</option></select><input class="input" data-pnew="' + k + '" placeholder="Type the new option" style="display:none;height:42px"></div>';
    }
    if (t === "multi") {
      var on = Array.isArray(v) ? v : (v ? String(v).split(/\s*,\s*/) : []), all = btOpts(k);
      on.forEach(function (x) { if (x && all.indexOf(x) < 0) all.push(x); });
      return '<div class="field wide">' + label + '<div class="chips" data-multi="' + k + '">' + all.map(function (o) { return '<button type="button" class="chip' + (on.indexOf(o) > -1 ? " on" : "") + '" data-o="' + esc(o) + '">' + esc(o) + "</button>"; }).join("") + '</div><div style="display:flex;gap:8px"><input class="input" data-newtag="' + k + '" placeholder="Add your own" style="height:40px"><button type="button" class="btn btn-ghost" data-addtag="' + k + '" style="height:40px">Add</button></div></div>';
    }
    if (t === "image") return '<div class="field wide">' + label + (v ? '<img src="' + esc(v) + '" alt="" style="width:100%;max-height:200px;object-fit:cover;border-radius:10px">' : "") + '<div style="display:flex;gap:8px;flex-wrap:wrap"><label class="btn btn-ghost" style="cursor:pointer;height:40px">' + (v ? "Change image" : "Upload image") + '<input type="file" accept="image/*" data-btimg="' + k + '" hidden></label><input class="input" data-bt="' + k + '" value="' + esc(v || "") + '" placeholder="or paste an image link" style="height:40px;flex:1;min-width:160px"></div></div>';
    if (t === "textarea") return '<label class="field wide">' + label + '<textarea class="input" data-bt="' + k + '" rows="3" style="height:auto;padding:12px;line-height:1.6">' + esc(v || "") + "</textarea></label>";
    return '<label class="field">' + label + '<input class="input" data-bt="' + k + '" type="' + (t === "datetime" ? "datetime-local" : t === "number" ? "number" : "text") + '"' + (t === "number" ? ' step="any"' : "") + ' value="' + esc(v == null ? "" : v) + '"></label>';
  }
  async function entryData(page) {
    page.innerHTML = crumb("Entry Model Data") + '<div class="note">Loading…</div>';
    var r = await X().sb.from("backtests").select("*").order("created_at", { ascending: true });
    if (r.error) { page.innerHTML = crumb("Entry Model Data") + needsTables(r.error); return; }
    J.backtests = r.data || [];
    drawEntryData(page);
  }
  function drawEntryData(page) {
    var models = ["Entry Model 1", "Entry Model 2", "Entry Model 3"];
    var mine = J.backtests.filter(function (b) { return b.model === J.edm; });
    var pairs = []; mine.forEach(function (b) { if (pairs.indexOf(b.pair) < 0) pairs.push(b.pair); });
    var html = crumb("Entry Model Data");
    if (!J.edPair) {
      html += '<div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-end;gap:16px">' + head("DATA", "Entry model", "data.") + '<button class="btn btn-metal" id="addPair">+ Add pair</button></div>' +
        '<div class="tabs" style="align-self:flex-start">' + models.map(function (m) { return '<button class="tab' + (m === J.edm ? " on" : "") + '" data-md="' + m + '" style="min-height:40px;padding:0 16px;font-size:13px">' + m + "</button>"; }).join("") + "</div>" +
        (pairs.length ? '<div class="grid-cards">' + pairs.map(function (p) {
          var rows = mine.filter(function (b) { return b.pair === p && b.data && b.data.r !== undefined; });
          var w = rows.filter(function (b) { return btStatus(b.data) === "Win"; }).length, tot = rows.reduce(function (a, b) { return a + (parseFloat(b.data.r) || 0); }, 0);
          return '<button class="card pad" data-pair="' + esc(p) + '" style="text-align:left;border:none;cursor:pointer;color:#f4f4f5;display:flex;flex-direction:column;gap:12px;min-height:110px"><span style="font-family:var(--sg);font-size:19px;font-weight:600">' + esc(p) + '</span><span class="muted" style="font-size:12px">' + rows.length + " trades · " + (rows.length ? Math.round(w / rows.length * 100) : 0) + "% win · " + (tot > 0 ? "+" : "") + tot.toFixed(1) + "R</span></button>";
        }).join("") + "</div>" : '<div class="card pad" style="text-align:center;padding:50px"><div style="font-family:var(--sg);font-size:20px;font-weight:600">No pairs yet</div><div class="note" style="margin-top:6px">Add the pairs you backtest this model on. Each pair gets its own table.</div></div>');
    } else {
      var rows = mine.filter(function (b) { return b.pair === J.edPair && b.data && b.data.r !== undefined; });
      var w = rows.filter(function (b) { return btStatus(b.data) === "Win"; }).length, tot = rows.reduce(function (a, b) { return a + (parseFloat(b.data.r) || 0); }, 0);
      html += '<div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-end;gap:16px"><div style="display:flex;flex-direction:column;gap:8px"><button class="chip" id="backList" style="align-self:flex-start">← ' + esc(J.edm) + '</button><h1 class="title">' + esc(J.edPair) + '</h1></div><div style="display:flex;gap:10px;flex-wrap:wrap"><label class="btn btn-ghost" style="cursor:pointer">Import CSV<input type="file" accept=".csv" id="csv" style="display:none"></label><button class="btn btn-metal" id="addBt">Add trade</button></div></div>' +
        '<div class="tiles" style="padding:6px 0;border-bottom:1px solid #18181a">' + tileH("Trades", rows.length) + tileH("Win rate", rows.length ? Math.round(w / rows.length * 100) + "%" : "0%") + tileH("Total R", (tot > 0 ? "+" : "") + tot.toFixed(1) + "R", tot > 0 ? "pos" : tot < 0 ? "neg" : "") + tileH("Average R", rows.length ? (tot / rows.length).toFixed(2) + "R" : "0R") + "</div>" +
        '<section class="card"><div class="scroll-x"><table style="min-width:1900px"><thead><tr style="background:#0c0c0d">' + BT_COLS.map(function (c) { return "<th>" + c[1] + "</th>"; }).join("") + "</tr></thead><tbody>" +
        rows.slice().reverse().map(function (b) { return '<tr data-edbt="' + b.id + '" style="cursor:pointer">' + BT_COLS.map(function (c) { return '<td style="color:#c9ccd1;white-space:nowrap">' + c[2](b.data || {}) + "</td>"; }).join("") + "</tr>"; }).join("") +
        "</tbody></table></div>" + (rows.length ? "" : '<div class="note" style="padding:36px;text-align:center">No trades yet. Click Add trade or import a CSV.</div>') + "</section>" + (rows.length ? '<div class="note" style="font-size:12px;margin-top:-14px">Tap a trade to edit it. Status, hours, day, month, year and session fill in by themselves.</div>' : "");
      if (J.btForm) {
        var ed = J.btForm === true ? null : J.backtests.filter(function (b) { return b.id === J.btForm; })[0], dv = ed ? ed.data : {};
        html += '<div class="panel-wrap"><section class="panel"><div style="display:flex;justify-content:space-between;align-items:center"><div style="font-family:var(--sg);font-size:22px;font-weight:600">' + (ed ? "Edit trade" : "Add trade") + " · " + esc(J.edPair) + '</div><button class="x" id="closeBt">×</button></div><div class="form-grid" id="btForm">' +
          BT_F.map(function (f) { return btInput(f, dv[f[0]]); }).join("") +
          '</div><div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn btn-metal" id="saveBt">Save trade</button>' + (ed ? '<button class="btn btn-ghost" id="delBt" style="color:#ff8a8a;border-color:#3a1c1c">Delete</button>' : "") + '</div><span class="muted" id="bt_msg" style="font-size:12px"></span></section></div>';
      }
    }
    if (J.pickerOpen) {
      var list = J.cat === "Forex" ? FX[J.sub] : J.cat === "Futures" ? Object.keys(FUT) : J.cat === "Commodities" ? Object.keys(COM) : J.cat === "Indices" ? IDX : Object.keys(SPEC);
      html += '<div class="modal-wrap"><section class="modal"><div style="display:flex;justify-content:space-between;align-items:center"><div><div style="font-family:var(--sg);font-size:22px;font-weight:600">Add pair</div><div class="muted" style="font-size:12px">To ' + esc(J.edm) + '</div></div><button class="x" id="closeP">×</button></div>' +
        '<div class="chips">' + ["Forex", "Futures", "Commodities", "Indices", "All"].map(function (c) { return '<button class="chip' + (c === J.cat ? " on" : "") + '" data-pc="' + c + '">' + c + "</button>"; }).join("") + "</div>" +
        (J.cat === "Forex" ? '<div class="tabs" style="align-self:flex-start">' + Object.keys(FX).map(function (g) { return '<button class="tab' + (g === J.sub ? " on" : "") + '" data-pg="' + g + '">' + g + "</button>"; }).join("") + "</div>" : "") +
        '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(104px,1fr));gap:8px;max-height:300px;overflow-y:auto">' + list.map(function (s) { var has = pairs.indexOf(s) > -1; return '<button class="sym' + (J.picked[s] || has ? " on" : "") + '" data-ps="' + s + '"' + (has ? " disabled" : "") + ">" + s + "</button>"; }).join("") + "</div>" +
        '<div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid #1a1a1c;padding-top:10px"><span class="muted" style="font-size:12px">' + (Object.keys(J.picked).length || "Pick one or more") + (Object.keys(J.picked).length ? " selected" : "") + '</span><button class="btn btn-metal" id="confirmP">Add to model</button></div></section></div>';
    }
    page.innerHTML = html;
    if (window.SDX_AI_BOX && !J.btForm && !J.pickerOpen) {
      var edKey = "ed:" + J.edm + (J.edPair ? ":" + J.edPair : ""), edTitle = "Entry Model Data · " + J.edm + (J.edPair ? " · " + J.edPair : "");
      window.SDX_AI_BOX(page, edKey, edTitle, "entrydata", async function () {
        var rs = mine.filter(function (b) { return (!J.edPair || b.pair === J.edPair) && b.data && b.data.r !== undefined && b.data.r !== ""; });
        return rs.length + " backtested trades.\n" + rs.slice(-80).map(function (b) { var d = b.data; return "- " + b.pair + " | " + (d.setup || "") + " | " + d.r + "R " + btStatus(d) + " | " + (d.position || "") + " | " + (btSession(d) || "") + " | " + (btWhen(d) ? new Date(btWhen(d)).toLocaleDateString("en-GB", { weekday: "short" }) : "") + " | entry " + (d.entry || "") + " | conf " + (Array.isArray(d.confluences) ? d.confluences.join(", ") : d.confluences || "") + " | POI " + (d.poi || "") + " | draw " + (d.draw || "") + (d.notes ? " | " + String(d.notes).slice(0, 100) : ""); }).join("\n");
      }, false);
    }
    $$("[data-md]", page).forEach(function (b) { b.onclick = function () { J.edm = b.dataset.md; drawEntryData(page); }; });
    $$("[data-pair]", page).forEach(function (b) { b.onclick = function () { J.edPair = b.dataset.pair; drawEntryData(page); }; });
    var ap = $("#addPair", page); if (ap) ap.onclick = function () { J.pickerOpen = true; J.picked = {}; drawEntryData(page); };
    var bl = $("#backList", page); if (bl) bl.onclick = function () { J.edPair = null; drawEntryData(page); };
    var ab = $("#addBt", page); if (ab) ab.onclick = function () { J.btForm = true; drawEntryData(page); };
    var cb = $("#closeBt", page); if (cb) cb.onclick = function () { J.btForm = false; drawEntryData(page); };
    $$("[data-edbt]", page).forEach(function (tr) { tr.onclick = function (e) { if (e.target.closest("a")) return; J.btForm = tr.dataset.edbt; drawEntryData(page); }; });
    var fm = $("#btForm", page);
    if (fm) {
      $$("[data-pick]", fm).forEach(function (sel) { sel.onchange = function () { var n = $('[data-pnew="' + sel.dataset.pick + '"]', fm); n.style.display = sel.value === "__new" ? "" : "none"; if (sel.value === "__new") n.focus(); }; });
      $$("[data-multi] .chip", fm).forEach(function (c) { c.onclick = function () { c.classList.toggle("on"); }; });
      $$("[data-addtag]", fm).forEach(function (b) {
        var k = b.dataset.addtag, inp = $('[data-newtag="' + k + '"]', fm);
        var go = function () { var v = inp.value.trim(); if (!v) return; var c = document.createElement("button"); c.type = "button"; c.className = "chip on"; c.dataset.o = v; c.textContent = v; c.onclick = function () { c.classList.toggle("on"); }; $('[data-multi="' + k + '"]', fm).appendChild(c); inp.value = ""; };
        b.onclick = go; inp.onkeydown = function (e) { if (e.key === "Enter") { e.preventDefault(); go(); } };
      });
      $$("[data-btimg]", fm).forEach(function (inp) {
        inp.onchange = async function () {
          var f = inp.files && inp.files[0]; if (!f) return;
          if (!window.SDX_UPLOAD) { $("#bt_msg", page).textContent = "Image uploads aren't switched on yet."; return; }
          $("#bt_msg", page).textContent = "Uploading…";
          try { $('[data-bt="' + inp.dataset.btimg + '"]', fm).value = await window.SDX_UPLOAD(f); $("#bt_msg", page).textContent = "Image added. Tap Save trade."; } catch (e) { $("#bt_msg", page).textContent = "Couldn't upload: " + (e.message || e); }
        };
      });
    }
    var db2 = $("#delBt", page); if (db2) db2.onclick = async function () { if (!confirm("Delete this trade?")) return; await X().sb.from("backtests").delete().eq("id", J.btForm); J.btForm = false; await loadBacktests(); drawEntryData(page); };
    var sb2 = $("#saveBt", page);
    if (sb2) sb2.onclick = async function () {
      var data = {};
      BT_F.forEach(function (f) {
        var k = f[0];
        if (f[2] === "multi") { data[k] = $$('[data-multi="' + k + '"] .chip.on', fm).map(function (c) { return c.dataset.o; }); return; }
        var el = $('[data-bt="' + k + '"]', fm); if (!el) return;
        var v = el.value;
        if (f[2] === "pick" && v === "__new") v = $('[data-pnew="' + k + '"]', fm).value.trim();
        data[k] = v;
      });
      if (data.r === "") { $("#bt_msg", page).textContent = "Add the R."; return; }
      var r;
      if (J.btForm === true) r = await X().sb.from("backtests").insert({ user_id: await uid(), model: J.edm, pair: J.edPair, data: data });
      else r = await X().sb.from("backtests").update({ data: data }).eq("id", J.btForm);
      if (r.error) { $("#bt_msg", page).textContent = "Couldn't save: " + r.error.message; return; }
      J.btForm = false; await loadBacktests(); drawEntryData(page);
    };
    var csv = $("#csv", page);
    if (csv) csv.onchange = function () {
      var f = csv.files[0]; if (!f) return;
      var rd = new FileReader();
      rd.onload = async function () {
        var lines = String(rd.result).split(/\r?\n/).filter(function (l) { return l.trim(); });
        if (lines.length < 2) return;
        var split = function (l) { var out = [], cur = "", q = false; for (var i = 0; i < l.length; i++) { var ch = l[i]; if (ch === '"') q = !q; else if (ch === "," && !q) { out.push(cur.trim()); cur = ""; } else cur += ch; } out.push(cur.trim()); return out; };
        var hd = split(lines[0]).map(function (h) { return h.toLowerCase(); });
        var find = function (names) { for (var i = 0; i < names.length; i++) { var k = hd.indexOf(names[i]); if (k > -1) return k; } return -1; };
        var map = { no: find(["trade #", "trade", "#"]), setup: find(["setup"]), r: find(["r", "rr"]), result: find(["status", "result", "w/l"]), entry: find(["entry"]), position: find(["position", "side"]), opened: find(["opened", "date"]), closed: find(["closed"]), session: find(["session"]), confluences: find(["confluences"]), poi: find(["what poi?", "poi"]), draw: find(["what liquidity draw", "liquidity draw", "target"]), notes: find(["text", "notes"]) };
        var id = await uid();
        var rows = lines.slice(1).map(function (l) { var v = split(l), d = {}; Object.keys(map).forEach(function (k) { d[k] = map[k] > -1 ? (v[map[k]] || "") : ""; }); if (d.confluences) d.confluences = d.confluences.split(/\s*,\s*/).filter(Boolean); if (d.opened && !isNaN(new Date(d.opened))) { var od = new Date(d.opened); d.opened = new Date(od.getTime() - od.getTimezoneOffset() * 6e4).toISOString().slice(0, 16); } if (d.closed && !isNaN(new Date(d.closed))) { var cd = new Date(d.closed); d.closed = new Date(cd.getTime() - cd.getTimezoneOffset() * 6e4).toISOString().slice(0, 16); } return { user_id: id, model: J.edm, pair: J.edPair, data: d }; });
        await X().sb.from("backtests").insert(rows);
        await loadBacktests(); drawEntryData(page);
      };
      rd.readAsText(f);
    };
    if (J.pickerOpen) {
      $("#closeP", page).onclick = function () { J.pickerOpen = false; drawEntryData(page); };
      $$("[data-pc]", page).forEach(function (b) { b.onclick = function () { J.cat = b.dataset.pc; drawEntryData(page); }; });
      $$("[data-pg]", page).forEach(function (b) { b.onclick = function () { J.sub = b.dataset.pg; drawEntryData(page); }; });
      $$("[data-ps]", page).forEach(function (b) { b.onclick = function () { var s = b.dataset.ps; if (J.picked[s]) delete J.picked[s]; else J.picked[s] = true; drawEntryData(page); }; });
      $("#confirmP", page).onclick = async function () {
        var id = await uid();
        var rows = Object.keys(J.picked).map(function (p) { return { user_id: id, model: J.edm, pair: p, data: {} }; });
        if (rows.length) { var r = await X().sb.from("backtests").insert(rows); if (r.error) { alert("Couldn't add: " + r.error.message); return; } }
        J.pickerOpen = false; J.picked = {}; await loadBacktests(); drawEntryData(page);
      };
    }
  }
  // ======================= MY RESULTS (signal tracking + balance) =======================
  var RS = { logs: [], settings: null, editing: {} };
  async function loadResults() {
    var a = await X().sb.from("signal_logs").select("*");
    var b = await X().sb.from("account_settings").select("*");
    if (a.error || b.error) return a.error || b.error;
    RS.logs = a.data || []; RS.settings = (b.data || [])[0] || null; return null;
  }
  function computeResults() {
    var start = RS.settings && RS.settings.start_balance != null ? Number(RS.settings.start_balance) : null;
    var sigs = X().state.messages.filter(function (m) { return m.kind === "signal"; });
    var byMid = {}; RS.logs.forEach(function (l) { byMid[l.message_id] = l; });
    var bal = start, took = 0, missed = 0, total = 0, rows = [];
    sigs.forEach(function (m) {
      var l = byMid[m.message_id], pnl = null;
      if (l && l.took) {
        took++;
        if (l.pnl_amount != null) pnl = Number(l.pnl_amount);
        else if (l.pnl_pct != null && bal != null) pnl = bal * Number(l.pnl_pct) / 100;
        else if (l.result_r != null && l.risk_pct != null && bal != null) pnl = bal * Number(l.risk_pct) / 100 * Number(l.result_r);
        if (pnl != null) { total += pnl; if (bal != null) bal += pnl; }
      } else if (l && l.took === false) missed++;
      rows.push({ m: m, l: l, pnl: pnl, balAfter: bal });
    });
    return { start: start, bal: bal, took: took, missed: missed, total: total, rows: rows.reverse(), sigCount: sigs.length };
  }
  P.fillBalance = async function (el) {
    if (!el) return;
    var err = await loadResults(); if (err) return;
    var c = computeResults();
    el.textContent = c.bal != null ? money(c.bal) : "Not set";
    if (c.bal != null && c.bal < 500) el.style.color = "#ff8a8a";
  };
  P.results = async function (page) {
    page.innerHTML = head("TRADE SERVICE", "My", "results.", "Tick every signal you take and track your own balance.") + '<div class="note">Loading…</div>';
    var err = await loadResults();
    if (err) { page.innerHTML = head("TRADE SERVICE", "My", "results.") + '<div class="card pad note">Results saving isn\'t switched on yet. Run the results setup in Supabase.</div>'; return; }
    drawResults(page);
  };
  function drawResults(page) {
    var c = computeResults();
    var growth = c.start ? (c.total / c.start * 100) : 0;
    var low = c.bal != null && c.bal < 500;
    var html = head("TRADE SERVICE", "My", "results.", "Tick every signal you take and track your own balance.") +
      '<section class="card pad" style="display:flex;flex-wrap:wrap;gap:18px;align-items:flex-end;justify-content:space-between"><div style="display:flex;flex-direction:column;gap:6px"><span class="eyebrow">STARTING BALANCE</span><div style="display:flex;gap:10px;align-items:center"><input class="input" id="startBal" type="number" style="max-width:200px" placeholder="e.g. 1000" value="' + (c.start != null ? c.start : "") + '"><button class="btn btn-metal" id="saveStart" style="height:46px">Save</button></div><span class="note" style="font-size:12px">Your balance when you joined. Everything is worked out from here.</span></div>' +
      '<div style="text-align:right"><div class="eyebrow">CURRENT BALANCE</div><div style="font-family:var(--sg);font-size:40px;font-weight:700;' + (low ? "color:#ff8a8a" : "") + '">' + (c.bal != null ? money(c.bal) : "—") + "</div>" + (low ? '<div class="neg" style="font-size:12px">Below the $500 minimum. Top up to keep your access.</div>' : '<div class="note" style="font-size:12px">Minimum $500 · checked every Friday</div>') + "</div></section>" +
      '<div class="tiles" style="padding:6px 0;border-bottom:1px solid #18181a">' + tileH("Profit", (c.total >= 0 ? "+" : "") + money(c.total), c.total > 0 ? "pos" : c.total < 0 ? "neg" : "") + tileH("Growth", (growth >= 0 ? "+" : "") + growth.toFixed(1) + "%", growth > 0 ? "pos" : growth < 0 ? "neg" : "") + tileH("Signals sent", c.sigCount) + tileH("You took", c.took) + tileH("Missed", c.missed) + tileH("Follow rate", c.sigCount ? Math.round(c.took / c.sigCount * 100) + "%" : "0%") + "</div>";
    c.rows.forEach(function (r) {
      var m = r.m, l = r.l, s = parseSignal(m), mid = m.message_id, ed = RS.editing[mid] || !l;
      var when = new Date(m.sent_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" });
      var unit = (l && l.pnl_pct != null && l.pnl_amount == null) ? "pct" : "amt";
      html += '<section class="card pad" data-mid="' + mid + '" style="display:flex;flex-direction:column;gap:14px"><div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:10px;align-items:center"><div style="display:flex;align-items:center;gap:12px"><span style="font-family:var(--sg);font-size:22px;font-weight:700">' + esc(s.pair || "Signal") + '</span><span class="tag" style="background:var(--metal);color:#0a0a0a">' + (s.side || "SIGNAL") + '</span><span class="muted" style="font-size:12px">' + when + "</span></div>" +
        (l ? '<span class="' + (l.took ? (r.pnl > 0 ? "pos" : r.pnl < 0 ? "neg" : "") : "muted") + '" style="font-weight:700;font-size:15px">' + (l.took ? (r.pnl != null ? (r.pnl >= 0 ? "+" : "") + money(r.pnl) : "Took it") : "Missed") + "</span>" : '<span class="tag" style="background:rgba(255,159,67,.14);color:#ff9f43">NOT LOGGED</span>') + "</div>";
      if (!ed) {
        html += '<div style="display:flex;flex-wrap:wrap;gap:18px;font-size:13px;color:#a3a7ae"><span>' + (l.took ? "Took it" : "Missed it") + "</span>" + (l.took && l.risk_pct != null ? "<span>" + l.risk_pct + "% risk</span>" : "") + (l.took && l.pnl_pct != null ? "<span>" + (l.pnl_pct >= 0 ? "+" : "") + l.pnl_pct + "%</span>" : "") + (r.balAfter != null && l.took ? "<span>Balance after " + money(r.balAfter) + "</span>" : "") + (l.note ? "<span>" + esc(l.note) + "</span>" : "") + '<button class="chip" data-edit style="min-height:30px;margin-left:auto">Edit</button></div>';
      } else {
        var took = l ? l.took : null;
        html += '<div class="chips"><button class="chip' + (took === true ? " on" : "") + '" data-took="yes">I took it</button><button class="chip' + (took === false ? " on" : "") + '" data-took="no">I missed it</button></div>' +
          '<div class="form-grid" data-fields style="' + (took === false ? "display:none" : "") + '"><label class="field">Risk (%)<input class="input" type="number" step="0.1" data-f="risk_pct" value="' + (l && l.risk_pct != null ? l.risk_pct : "") + '" placeholder="1"></label>' +
          '<label class="field">Result in<select class="input" data-f="unit"><option value="amt"' + (unit === "amt" ? " selected" : "") + '>$ profit / loss</option><option value="pct"' + (unit === "pct" ? " selected" : "") + '>% of account</option></select></label>' +
          '<label class="field">Profit or loss<input class="input" type="number" step="0.01" data-f="pnl" placeholder="e.g. 25 or -10" value="' + (l ? (unit === "pct" ? (l.pnl_pct != null ? l.pnl_pct : "") : (l.pnl_amount != null ? l.pnl_amount : "")) : "") + '"></label>' +
          '<label class="field">Notes<input class="input" data-f="note" value="' + esc(l && l.note || "") + '"></label></div>' +
          '<div><button class="btn btn-metal" data-save>Save</button> <span class="muted" style="font-size:12px" data-msg></span></div>';
      }
      html += "</section>";
    });
    if (!c.rows.length) html += '<div class="card pad note">No signals yet.</div>';
    page.innerHTML = html;
    $("#saveStart", page).onclick = async function () {
      var v = parseFloat($("#startBal", page).value);
      if (isNaN(v)) return;
      var r = await X().sb.from("account_settings").upsert({ user_id: X().state.session.user.id, start_balance: v }, { onConflict: "user_id" });
      if (!r.error) { await loadResults(); drawResults(page); }
    };
    $$("[data-mid]", page).forEach(function (sec) {
      var mid = parseInt(sec.dataset.mid, 10), tookSel = null;
      var e = $("[data-edit]", sec); if (e) e.onclick = function () { RS.editing[mid] = true; drawResults(page); };
      $$("[data-took]", sec).forEach(function (b) { b.onclick = function () { tookSel = b.dataset.took; $$("[data-took]", sec).forEach(function (x) { x.classList.toggle("on", x === b); }); var f = $("[data-fields]", sec); if (f) f.style.display = tookSel === "no" ? "none" : ""; }; });
      var sv = $("[data-save]", sec);
      if (sv) sv.onclick = async function () {
        var on = $("[data-took].on", sec), msg = $("[data-msg]", sec);
        if (!on) { msg.textContent = "Pick whether you took it."; return; }
        var v = function (f) { var i = $('[data-f="' + f + '"]', sec); return i ? i.value : ""; };
        var num = function (x) { return x === "" ? null : parseFloat(x); };
        var took = on.dataset.took === "yes", unit = v("unit");
        var row = { user_id: X().state.session.user.id, message_id: mid, took: took, risk_pct: took ? num(v("risk_pct")) : null, pnl_amount: took && unit === "amt" ? num(v("pnl")) : null, pnl_pct: took && unit === "pct" ? num(v("pnl")) : null, note: v("note") || null };
        msg.textContent = "Saving…";
        var r = await X().sb.from("signal_logs").upsert(row, { onConflict: "user_id,message_id" });
        if (r.error) { msg.textContent = "Couldn't save: " + r.error.message; return; }
        delete RS.editing[mid]; await loadResults(); drawResults(page);
      };
    });
  }

  // ======================= AI COACH =======================
  var COACH = { msgs: [], busy: false };
  async function askCoach(page, text, mode) {
    if (COACH.busy) return;
    COACH.busy = true;
    if (text) COACH.msgs.push({ role: "user", content: text });
    drawCoach(page);
    var reply;
    try {
      var tok = (await X().sb.auth.getSession()).data.session;
      var r = await fetch(window.SDX_CONFIG.AUTH_URL + "/coach", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + (tok ? tok.access_token : "") }, body: JSON.stringify({ mode: mode || "chat", messages: COACH.msgs.slice(-12) }) });
      var j = await r.json();
      reply = r.ok ? j.reply : "The coach couldn't answer just now. Try again in a minute.";
    } catch (e) { reply = "The coach isn't connected yet. It switches on when the site goes live."; }
    COACH.msgs.push({ role: "assistant", content: reply });
    COACH.busy = false; drawCoach(page);
  }
  function drawCoach(page) {
    var chat = COACH.msgs.map(function (m) {
      var me = m.role === "user";
      return '<div style="max-width:620px;align-self:' + (me ? "flex-end" : "flex-start") + ';border-radius:' + (me ? "16px 4px 16px 16px" : "4px 16px 16px 16px") + ';padding:12px 15px;font-size:14px;line-height:1.6;white-space:pre-wrap;' + (me ? "background:var(--metal);color:#0a0a0a" : "background:#121214;box-shadow:inset 0 0 0 1px #222326") + '">' + esc(m.content) + "</div>";
    }).join("");
    page.innerHTML = '<section class="hero" style="min-height:170px"><div class="eyebrow">SD TRADING EDUCATION</div><h1>AI coach.</h1><div style="font-size:14px;color:#2a2c30">Reviews your results, checks your risk and answers your questions.</div></section>' +
      '<div class="chips"><button class="chip" data-mode="review">Review my results</button><button class="chip" data-mode="risk">Check my risk</button></div>' +
      '<section class="card" style="display:flex;flex-direction:column"><div style="min-height:320px;max-height:520px;overflow-y:auto;display:flex;flex-direction:column;gap:10px;padding:20px" id="coachLog">' + (chat || '<div class="note" style="margin:auto;text-align:center;max-width:380px">Ask anything about the trade service, risk or your results. Or tap Review my results above.</div>') + (COACH.busy ? '<div class="note">Thinking…</div>' : "") + "</div>" +
      '<form id="coachForm" style="display:flex;gap:10px;padding:14px;border-top:1px solid #18181a"><input class="input" id="coachIn" placeholder="e.g. How do I work out my lot size?" autocomplete="off"><button class="btn btn-metal" type="submit">Send</button></form></section>' +
      '<div class="note" style="font-size:11px">The coach is here to help you learn. It is not financial advice.</div>';
    var log = $("#coachLog", page); log.scrollTop = log.scrollHeight;
    $("#coachForm", page).onsubmit = function (e) { e.preventDefault(); var t = $("#coachIn", page).value.trim(); if (t) askCoach(page, t, "chat"); };
    $$("[data-mode]", page).forEach(function (b) { b.onclick = function () { askCoach(page, b.dataset.mode === "review" ? "Review my results" : "Check my risk", b.dataset.mode); }; });
  }
  P.coach = function (page) { drawCoach(page); };

  // ======================= SUPPORT =======================
  P.support = function (page) {
    page.innerHTML = head("HELP", "Support.", "", "Need a hand? Message the support team on Telegram.") +
      '<section class="hero" style="min-height:230px;justify-content:space-between;gap:18px"><span class="eyebrow">FASTEST WAY</span><div style="display:flex;align-items:center;gap:18px;flex-wrap:wrap"><span style="width:64px;height:64px;border-radius:18px;background:#0a0a0a;display:flex;align-items:center;justify-content:center"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + SICON.Telegram + '</svg></span><div><h1 style="font-size:40px">Support bot</h1><div style="font-size:14px;color:#2a2c30;margin-top:6px">@sdxsupportbot on Telegram</div></div></div><div><a class="btn" style="background:#0a0a0a;color:#fff" href="https://t.me/sdxsupportbot" target="_blank" rel="noopener">Message support</a></div></section>' +
      '<section class="card pad" style="display:flex;flex-direction:column;gap:4px"><span class="eyebrow" style="margin-bottom:8px">BEFORE YOU MESSAGE</span>' +
      [["Can't log in?", "Make sure you are still in the SDX Trade Ideas channel on Telegram, then log in with Telegram again."], ["Balance under $500?", "Top up your account to keep your access. Support checks every Friday."], ["Missed a signal?", "Every signal stays in Trade Service and My Results, so you can still log it."]].map(function (f) { return '<div style="padding:12px 0;border-top:1px solid #18181a"><div style="font-weight:600">' + f[0] + '</div><div class="note" style="font-size:13px">' + f[1] + "</div></div>"; }).join("") + "</section>";
  };

  // ======================= ADMIN =======================
  var AD = { list: null, filter: "all", msg: "" };
  async function adminCall(path, body) {
    var tok = (await X().sb.auth.getSession()).data.session;
    var r = await fetch(window.SDX_CONFIG.AUTH_URL + path, { method: body ? "POST" : "GET", headers: { "Content-Type": "application/json", Authorization: "Bearer " + (tok ? tok.access_token : "") }, body: body ? JSON.stringify(body) : undefined });
    if (!r.ok) throw new Error((await r.json()).detail || "error");
    return r.json();
  }
  P.admin = async function (page) {
    page.innerHTML = head("ADMIN", "Admin", "portal.", "Everyone with access to the dashboard.") + '<div class="note">Loading…</div>';
    try { AD.list = (await adminCall("/admin/members")).members; } catch (e) { AD.list = window.SDX_SAMPLE_MEMBERS || []; AD.msg = window.SDX_SAMPLE_MEMBERS ? "" : "Couldn't load members: " + e.message; }
    drawAdmin(page);
  };
  function drawAdmin(page) {
    var L = AD.list || [];
    var count = function (f) { return L.filter(f).length; };
    var shown = L.filter(function (m) { return AD.filter === "all" || (AD.filter === "active" ? m.active : AD.filter === "revoked" ? !m.active : AD.filter === "under" ? (m.active && m.balance != null && m.balance < 500) : m.plan === AD.filter); });
    page.innerHTML = head("ADMIN", "Admin", "portal.", "Everyone with access to the dashboard. Revoking someone also removes them from the Telegram channel.") +
      '<div class="tiles" style="padding:6px 0;border-bottom:1px solid #18181a">' + tileH("Members", L.length) + tileH("Active", count(function (m) { return m.active; }), "pos") + tileH("Revoked", count(function (m) { return !m.active; }), "neg") + tileH("Total account size", money(L.reduce(function (a, m) { return a + (m.active && m.balance ? m.balance : 0); }, 0))) + tileH("Under $500", count(function (m) { return m.active && m.balance != null && m.balance < 500; }), "neg") + tileH("No balance set", count(function (m) { return m.active && m.plan !== "Admin" && m.balance == null; })) + "</div>" +
      '<div class="chips">' + [["all", "All"], ["active", "Active"], ["under", "Under $500"], ["revoked", "Revoked"], ["Trade Service", "Trade Service"], ["Elite Pack", "Elite Pack"]].map(function (f) { return '<button class="chip' + (f[0] === AD.filter ? " on" : "") + '" data-af="' + esc(f[0]) + '">' + f[1] + "</button>"; }).join("") + "</div>" +
      (AD.msg ? '<div class="note">' + esc(AD.msg) + "</div>" : "") +
      '<section class="card"><div class="scroll-x"><table style="min-width:1000px"><thead><tr style="background:#0c0c0d"><th>Name</th><th>Telegram</th><th>Plan</th><th class="r">Account size</th><th class="r">Start</th><th>Joined</th><th>Status</th><th class="r">Access</th></tr></thead><tbody>' +
      shown.map(function (m) {
        var low = m.balance != null && m.balance < 500;
        var tgMissing = m.plan === "Trade Service" && !m.telegram_username;
        var tgCell = tgMissing ? '<span class="tag" style="background:rgba(255,159,67,.14);color:#ff9f43">NO USERNAME</span>' : m.telegram_username ? '<a href="https://t.me/' + esc(m.telegram_username) + '" target="_blank" rel="noopener" style="color:#d7dade">@' + esc(m.telegram_username) + "</a>" : (m.telegram_id ? '<span class="muted">ID ' + esc(m.telegram_id) + "</span>" : '<span class="muted">—</span>');
        return '<tr' + (low && m.active ? ' style="background:rgba(255,92,92,.05)"' : "") + '><td style="font-weight:600">' + esc(m.name || m.email) + "</td><td>" + tgCell + "</td><td>" + esc(m.plan || "") + '</td><td class="r" style="font-family:var(--sg);font-weight:700;' + (low ? "color:#ff8a8a" : "") + '">' + (m.balance != null ? money(m.balance) : '<span class="muted" style="font-weight:400;font-family:Inter">Not set</span>') + (low ? '<div style="font-size:10px;font-family:Inter;font-weight:600;letter-spacing:.06em">UNDER $500</div>' : "") + '</td><td class="r muted">' + (m.start_balance != null ? money(m.start_balance) : "—") + '</td><td class="muted">' + (m.created_at ? new Date(m.created_at).toLocaleDateString("en-GB") : "") + '</td><td><span class="pill ' + (m.active ? "win" : "loss") + '">' + (m.active ? "Active" : "Revoked") + '</span></td><td class="r">' + (m.plan === "Admin" ? '<span class="muted" style="font-size:12px">You</span>' : '<button class="chip" data-acc="' + esc(m.email) + '" data-to="' + (m.active ? "revoke" : "restore") + '" style="min-height:32px;' + (m.active ? "color:#ff8a8a;border-color:rgba(255,138,138,.4)" : "") + '">' + (m.active ? "Revoke access" : "Restore") + "</button>") + "</td></tr>";
      }).join("") + "</tbody></table></div>" + (shown.length ? "" : '<div class="note" style="padding:30px;text-align:center">No members here.</div>') + "</section>" +
      (AD.confirm ? '<div class="modal-wrap"><section class="modal" style="max-width:460px"><div style="font-family:var(--sg);font-size:22px;font-weight:600">' + (AD.confirm.to === "revoke" ? "Revoke access?" : "Restore access?") + '</div><div class="note">' + (AD.confirm.to === "revoke" ? esc(AD.confirm.name) + " will lose access to the dashboard and be removed from the Telegram channel." : esc(AD.confirm.name) + " will get dashboard access back and be able to rejoin the Telegram channel.") + '</div><div style="display:flex;gap:10px;justify-content:flex-end"><button class="btn btn-ghost" id="cNo">Cancel</button><button class="btn btn-metal" id="cYes">' + (AD.confirm.to === "revoke" ? "Revoke" : "Restore") + "</button></div></section></div>" : "");
    $$("[data-af]", page).forEach(function (b) { b.onclick = function () { AD.filter = b.dataset.af; drawAdmin(page); }; });
    $$("[data-acc]", page).forEach(function (b) { b.onclick = function () { var m = L.filter(function (x) { return x.email === b.dataset.acc; })[0]; AD.confirm = { email: m.email, name: m.name || m.email, to: b.dataset.to }; drawAdmin(page); }; });
    if (AD.confirm) {
      $("#cNo", page).onclick = function () { AD.confirm = null; drawAdmin(page); };
      $("#cYes", page).onclick = async function () {
        var c = AD.confirm; AD.confirm = null;
        try { await adminCall("/admin/access", { email: c.email, action: c.to }); AD.msg = (c.to === "revoke" ? "Revoked " : "Restored ") + c.name + "."; }
        catch (e) { if (window.SDX_SAMPLE_MEMBERS) { AD.msg = "Preview: " + (c.to === "revoke" ? "revoked " : "restored ") + c.name + "."; } else { AD.msg = "Couldn't change access: " + e.message; } }
        L.forEach(function (m) { if (m.email === c.email && (window.SDX_SAMPLE_MEMBERS || AD.msg.indexOf("Couldn't") < 0)) m.active = c.to !== "revoke"; });
        drawAdmin(page);
      };
    }
  }
})();
