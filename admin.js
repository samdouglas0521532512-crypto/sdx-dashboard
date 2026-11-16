/* SDX Members Dashboard: Admin (Overview, Students, Scanner access, Access) */
(function () {
  "use strict";
  var P = window.SDX_PAGES;
  function X() { return window.SDX; }
  function C() { return window.SDX_ADMIN_CORE; }
  function esc(s) { return X().esc(s); }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  var S = { tab: "overview", q: "", plan: "all", sort: "active", open: null, detail: null, reqFilter: "requested", msg: "" };
  var SCAN_NAMES = { platinum: "SDX Sniper", chrome: "SDX Pulse", titanium: "SDX Precision", obsidian: "SDX Phantom", cobalt: "SDX Raid", iridium: "SDX Ghost" };

  function head(sub) {
    return '<div style="display:flex;flex-direction:column;gap:8px"><div class="eyebrow">ADMIN</div><h1 class="title" style="margin:0">Admin portal.</h1><div class="note" style="font-size:13px">' + esc(sub) + "</div></div>";
  }
  function days(t) { return t ? Math.floor((Date.now() - new Date(t).getTime()) / 864e5) : 9999; }
  function ago(t) {
    if (!t) return "Never";
    var m = Math.round((Date.now() - new Date(t).getTime()) / 6e4);
    return m < 2 ? "Just now" : m < 60 ? m + " min ago" : m < 1440 ? Math.floor(m / 60) + "h ago" : m < 2880 ? "Yesterday" : Math.floor(m / 1440) + " days ago";
  }
  function dmy(t) { return t ? new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"; }
  function students() { return (C().AD.list || []).filter(function (m) { return m.plan !== "Admin"; }); }
  function winRate(m) { var d = (m.wins || 0) + (m.losses || 0); return d ? Math.round((m.wins / d) * 100) + "%" : "—"; }
  function rTxt(r) { r = Number(r) || 0; return (r > 0 ? "+" : "") + (Math.round(r * 100) / 100) + "R"; }
  function tile(k, v, cls) { return '<div class="tile"><span class="k">' + esc(k) + '</span><span class="v ' + (cls || "") + '">' + esc(v) + "</span></div>"; }
  function planTag(p) {
    var elite = p === "Elite Pack";
    return '<span class="tag" style="' + (elite ? "background:var(--metal);color:#0a0a0a" : "background:#1c1c1e;color:#c9ced6") + '">' + esc(elite ? "ELITE" : p === "Trade Service" ? "FREE" : (p || "").toUpperCase()) + "</span>";
  }
  function reqTag(st) {
    var c = st === "added" ? ["ACCESS GRANTED", "rgba(127,217,154,.14)", "#7fd99a"] : st === "removed" ? ["REMOVED", "rgba(255,138,138,.12)", "#ff8a8a"] : ["WAITING", "rgba(255,159,67,.14)", "#ffb26b"];
    return '<span class="tag" style="background:' + c[1] + ";color:" + c[2] + '">' + c[0] + "</span>";
  }
  function allReqs() {
    var out = [];
    students().forEach(function (m) { (m.scanner_requests || []).forEach(function (r) { out.push(Object.assign({ member: m }, r)); }); });
    return out.sort(function (a, b) { return (b.at || "") > (a.at || "") ? 1 : -1; });
  }
  function scannerStatus(m) {
    var r = m.scanner_requests || [];
    if (!r.length) return '<span class="muted">—</span>';
    var w = r.filter(function (x) { return x.status === "requested"; }).length, g = r.filter(function (x) { return x.status === "added"; }).length;
    return (g ? '<span style="color:#7fd99a">' + g + " granted</span>" : "") + (g && w ? " · " : "") + (w ? '<span style="color:#ffb26b">' + w + " waiting</span>" : "") + (!g && !w ? '<span class="muted">Removed</span>' : "");
  }

  // ---------- tabs (shared with the Access tab in pages.js) ----------
  function tabs() {
    var pend = allReqs().filter(function (r) { return r.status === "requested"; }).length;
    var t = [["overview", "Overview"], ["students", "Students"], ["scanners", "Scanner access" + (pend ? " (" + pend + ")" : "")], ["import", "Add Elite members"], ["access", "Access"]];
    return '<div class="chips" style="margin-top:4px">' + t.map(function (x) { return '<button class="chip' + (S.tab === x[0] ? " on" : "") + '" data-atab="' + x[0] + '">' + esc(x[1]) + "</button>"; }).join("") + "</div>";
  }
  function wire(page) {
    $$("[data-atab]", page).forEach(function (b) { b.onclick = function () { S.tab = b.dataset.atab; S.msg = ""; draw(page); }; });
  }
  window.SDX_ADMIN = { tabs: tabs, wire: wire };

  // ---------- overview ----------
  function overview() {
    var L = students();
    var active = L.filter(function (m) { return m.active; });
    var elite = active.filter(function (m) { return m.plan === "Elite Pack"; }).length;
    var free = active.filter(function (m) { return m.plan === "Trade Service"; }).length;
    var a7 = active.filter(function (m) { return days(m.last_activity) <= 7; }).length;
    var pend = allReqs().filter(function (r) { return r.status === "requested"; });
    var sum = function (k) { return L.reduce(function (a, m) { return a + (m[k] || 0); }, 0); };
    var quiet = active.filter(function (m) { return days(m.last_activity) > 7; }).sort(function (a, b) { return days(b.last_activity) - days(a.last_activity); }).slice(0, 8);
    var recent = L.filter(function (m) { return m.last_activity; }).sort(function (a, b) { return b.last_activity > a.last_activity ? 1 : -1; }).slice(0, 8);
    var newest = L.slice().sort(function (a, b) { return (b.created_at || "") > (a.created_at || "") ? 1 : -1; }).slice(0, 6);
    function row(m, right) {
      return '<button data-open="' + esc(m.email) + '" style="display:flex;justify-content:space-between;align-items:center;gap:10px;width:100%;padding:11px 0;border:none;border-bottom:1px solid #18181a;background:none;color:#f4f4f5;font:13px Inter;cursor:pointer;text-align:left"><span style="display:flex;gap:10px;align-items:center;min-width:0"><span style="font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(m.name || m.email) + "</span>" + planTag(m.plan) + '</span><span class="muted" style="font-size:12px;white-space:nowrap">' + right + "</span></button>";
    }
    function card(title, inner, empty) { return '<section class="card pad" style="display:flex;flex-direction:column"><span class="eyebrow" style="margin-bottom:6px">' + esc(title) + "</span>" + (inner || '<div class="note" style="padding:14px 0">' + esc(empty) + "</div>") + "</section>"; }
    return '<div class="tiles" style="padding:6px 0;border-bottom:1px solid #18181a">' +
      tile("Students", active.length) + tile("Elite", elite) + tile("Free", free) + tile("Active this week", a7, "pos") +
      tile("Scanner requests", pend.length, pend.length ? "neg" : "") + tile("Signals logged", sum("signals_logged")) + tile("Journal trades", sum("trades")) + "</div>" +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:16px">' +
      card("SCANNER REQUESTS WAITING", pend.slice(0, 6).map(function (r) { return row(r.member, esc(SCAN_NAMES[r.scanner] || r.name || "") + " · @" + esc(r.tv)); }).join("") + (pend.length ? '<button class="btn btn-ghost" data-atab="scanners" style="margin-top:12px;align-self:flex-start">Open scanner access</button>' : ""), "No requests waiting.") +
      card("ACTIVE RECENTLY", recent.map(function (m) { return row(m, ago(m.last_activity)); }).join(""), "Nobody yet.") +
      card("QUIET FOR 7+ DAYS", quiet.map(function (m) { return row(m, m.last_activity ? days(m.last_activity) + " days" : "Never logged in"); }).join(""), "Everyone has been active this week.") +
      card("NEWEST STUDENTS", newest.map(function (m) { return row(m, "Joined " + dmy(m.created_at)); }).join(""), "No students yet.") +
      "</div>";
  }

  // ---------- students ----------
  function studentsTab() {
    var q = S.q.toLowerCase();
    var L = students().filter(function (m) {
      if (S.plan === "elite" && m.plan !== "Elite Pack") return false;
      if (S.plan === "free" && m.plan !== "Trade Service") return false;
      if (S.plan === "quiet" && !(m.active && days(m.last_activity) > 7)) return false;
      if (S.plan === "revoked" && m.active) return false;
      return !q || [m.name, m.email, m.telegram_username].join(" ").toLowerCase().indexOf(q) > -1;
    });
    var sorters = {
      active: function (a, b) { return (b.last_activity || "") > (a.last_activity || "") ? 1 : -1; },
      joined: function (a, b) { return (b.created_at || "") > (a.created_at || "") ? 1 : -1; },
      trades: function (a, b) { return (b.trades || 0) - (a.trades || 0); },
      journal: function (a, b) { return (b.journal_entries || 0) - (a.journal_entries || 0); }
    };
    L.sort(sorters[S.sort]);
    return '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center"><input class="input" id="aQ" placeholder="Search name, email or Telegram" value="' + esc(S.q) + '" style="max-width:300px;height:38px" autocomplete="off">' +
      '<div class="chips">' + [["all", "All"], ["elite", "Elite"], ["free", "Free"], ["quiet", "Quiet 7+ days"], ["revoked", "Revoked"]].map(function (f) { return '<button class="chip' + (S.plan === f[0] ? " on" : "") + '" data-ap="' + f[0] + '">' + f[1] + "</button>"; }).join("") + "</div>" +
      '<select class="input" id="aSort" style="height:38px;width:auto;font-size:13px">' + [["active", "Last active"], ["joined", "Newest"], ["trades", "Most trades"], ["journal", "Most journal use"]].map(function (o) { return '<option value="' + o[0] + '"' + (S.sort === o[0] ? " selected" : "") + ">Sort: " + o[1] + "</option>"; }).join("") + "</select></div>" +
      '<section class="card"><div class="scroll-x"><table style="min-width:1100px"><thead><tr style="background:#0c0c0d"><th>Student</th><th>Plan</th><th>Last login</th><th>Last active</th><th class="r">Journal</th><th class="r">Trades</th><th class="r">Win rate</th><th class="r">Total R</th><th class="r">Signals</th><th class="r">Videos</th><th>Scanners</th></tr></thead><tbody>' +
      L.map(function (m) {
        return '<tr data-open="' + esc(m.email) + '" style="cursor:pointer' + (m.active ? "" : ";opacity:.5") + '"><td><div style="font-weight:600">' + esc(m.name || m.email) + '</div><div class="muted" style="font-size:11px">' + esc(m.telegram_username ? "@" + m.telegram_username : m.email) + "</div></td><td>" + planTag(m.plan) + '</td><td class="muted">' + ago(m.last_sign_in) + '</td><td class="muted">' + ago(m.last_activity) + '</td><td class="r">' + (m.journal_entries || 0) + '</td><td class="r">' + (m.trades || 0) + '</td><td class="r">' + winRate(m) + '</td><td class="r" style="color:' + ((m.total_r || 0) > 0 ? "#7fd99a" : (m.total_r || 0) < 0 ? "#ff8a8a" : "inherit") + '">' + (m.trades ? rTxt(m.total_r) : "—") + '</td><td class="r">' + (m.signals_logged || 0) + '</td><td class="r">' + (m.videos_watched || 0) + "</td><td>" + scannerStatus(m) + "</td></tr>";
      }).join("") + "</tbody></table></div>" + (L.length ? "" : '<div class="note" style="padding:30px;text-align:center">No students match.</div>') + "</section>";
  }

  // ---------- scanner access ----------
  function scannersTab() {
    var R = allReqs(), shown = R.filter(function (r) { return S.reqFilter === "all" || r.status === S.reqFilter; });
    var n = function (s) { return R.filter(function (r) { return r.status === s; }).length; };
    return '<div class="note" style="font-size:13px;max-width:760px">To give access: tap Copy, open the scanner on TradingView, go to Manage access, paste the username and add them. Then tap Mark granted here. Marking someone removed here does not take them off TradingView, so remove them in Manage access too.</div>' +
      '<div class="chips">' + [["requested", "Waiting (" + n("requested") + ")"], ["added", "Granted (" + n("added") + ")"], ["removed", "Removed (" + n("removed") + ")"], ["all", "All (" + R.length + ")"]].map(function (f) { return '<button class="chip' + (S.reqFilter === f[0] ? " on" : "") + '" data-rf="' + f[0] + '">' + f[1] + "</button>"; }).join("") + "</div>" +
      '<section class="card"><div class="scroll-x"><table style="min-width:900px"><thead><tr style="background:#0c0c0d"><th>Student</th><th>Plan</th><th>Scanner</th><th>TradingView username</th><th>Requested</th><th>Status</th><th class="r">Action</th></tr></thead><tbody>' +
      shown.map(function (r) {
        var btns = r.status === "added"
          ? '<button class="chip" data-rq="' + esc(r.id) + '" data-st="removed" style="min-height:32px;color:#ff8a8a;border-color:rgba(255,138,138,.4)">Mark removed</button>'
          : '<button class="chip" data-rq="' + esc(r.id) + '" data-st="added" style="min-height:32px;color:#7fd99a;border-color:rgba(127,217,154,.4)">Mark granted</button>';
        return '<tr><td style="font-weight:600">' + esc(r.member.name || r.member.email) + "</td><td>" + planTag(r.member.plan) + "</td><td>" + esc(SCAN_NAMES[r.scanner] || r.name || "") + '</td><td><span style="font-family:var(--sg);font-weight:600">@' + esc(r.tv) + '</span> <button class="chip" data-copy="' + esc(r.tv) + '" style="min-height:26px;font-size:11px;margin-left:6px">Copy</button></td><td class="muted">' + ago(r.at) + "</td><td>" + reqTag(r.status) + '</td><td class="r">' + btns + "</td></tr>";
      }).join("") + "</tbody></table></div>" + (shown.length ? "" : '<div class="note" style="padding:30px;text-align:center">Nothing here.</div>') + "</section>";
  }

  // ---------- add past Elite buyers ----------
  var IM = { text: "", res: null, busy: false };
  function splitRow(line) {
    var out = [], cur = "", q = false;
    for (var i = 0; i < line.length; i++) { var c = line[i]; if (c === '"') { if (q && line[i + 1] === '"') { cur += '"'; i++; } else q = !q; } else if ((c === "," || c === "\t" || c === ";") && !q) { out.push(cur); cur = ""; } else cur += c; }
    out.push(cur); return out.map(function (x) { return x.trim(); });
  }
  function parsePeople(text) {
    var lines = String(text || "").split(/\r?\n/).filter(function (l) { return l.trim(); });
    if (!lines.length) return [];
    var hdr = splitRow(lines[0]).map(function (h) { return h.toLowerCase(); });
    var ei = hdr.findIndex(function (h) { return h.indexOf("email") > -1; });
    var people = [];
    if (ei > -1) {
      var ni = hdr.findIndex(function (h) { return h === "name" || h === "full name"; }), fi = hdr.findIndex(function (h) { return h.indexOf("first") > -1; }), li = hdr.findIndex(function (h) { return h.indexOf("last") > -1; });
      lines.slice(1).forEach(function (l) { var c = splitRow(l); var nm = ni > -1 ? c[ni] : [fi > -1 ? c[fi] : "", li > -1 ? c[li] : ""].join(" ").trim(); if (c[ei]) people.push({ email: c[ei].toLowerCase(), name: nm || "" }); });
    } else {
      lines.forEach(function (l) { (l.match(/[^\s,;<>"]+@[^\s,;<>"]+\.[^\s,;<>"]+/g) || []).forEach(function (e) { people.push({ email: e.toLowerCase(), name: "" }); }); });
    }
    var seen = {}; return people.filter(function (p) { if (seen[p.email]) return false; seen[p.email] = 1; return /@/.test(p.email); });
  }
  function importTab() {
    var P2 = parsePeople(IM.text), R = IM.res;
    return '<section class="card pad" style="display:flex;flex-direction:column;gap:14px;max-width:820px">' +
      '<div style="font:600 18px var(--sg)">Give access to people who bought the Elite Pack before.</div>' +
      '<div class="note" style="font-size:13px">New buyers get added automatically. For anyone who bought before that was set up: in Kajabi go to Contacts (People), filter by the Elite Pack offer, then Export. Upload that file here, or paste the emails one per line. They can then log in on the Elite tab with the email they bought with.</div>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center"><label class="btn btn-ghost" style="cursor:pointer">Upload Kajabi CSV<input type="file" id="imFile" accept=".csv,.txt,text/csv" style="display:none"></label><span class="muted" style="font-size:12px">or paste below</span></div>' +
      '<textarea class="input" id="imText" rows="9" placeholder="jordan@gmail.com&#10;kai@hotmail.co.uk" style="font-family:ui-monospace,monospace;font-size:12px;padding:12px;height:auto">' + esc(IM.text) + "</textarea>" +
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap"><span class="muted" style="font-size:13px" id="imCount">' + P2.length + " email" + (P2.length === 1 ? "" : "s") + ' found</span><button class="btn btn-metal" id="imGo"' + (P2.length && !IM.busy ? "" : " disabled") + ">" + (IM.busy ? "Adding…" : "Give Elite access") + "</button></div>" +
      (R ? '<div style="display:flex;flex-direction:column;gap:6px;border-top:1px solid #18181a;padding-top:14px;font-size:13px">' + (R.err ? '<div style="color:#ff8a8a">' + esc(R.err) + "</div>" :
        '<div style="color:#7fd99a">' + R.added.length + " added with Elite access.</div>" +
        (R.already.length ? '<div class="muted">' + R.already.length + " already had access.</div>" : "") +
        (R.revoked.length ? '<div style="color:#ffb26b">' + R.revoked.length + " were revoked before, so left revoked: " + esc(R.revoked.join(", ")) + ". Restore them on the Access tab if you want them back.</div>" : "") +
        (R.bad.length ? '<div style="color:#ff8a8a">' + R.bad.length + " didn't look like emails: " + esc(R.bad.join(", ")) + "</div>" : "")) + "</div>" : "") +
      "</section>";
  }
  function wireImport(page) {
    var ta = $("#imText", page); if (!ta) return;
    ta.oninput = function () { IM.text = ta.value; var n = parsePeople(IM.text).length; $("#imCount", page).textContent = n + " email" + (n === 1 ? "" : "s") + " found"; $("#imGo", page).disabled = !n; };
    $("#imFile", page).onchange = function (e) { var f = e.target.files[0]; if (!f) return; var rd = new FileReader(); rd.onload = function () { IM.text = String(rd.result || ""); IM.res = null; draw(page); }; rd.readAsText(f); };
    $("#imGo", page).onclick = async function () {
      var people = parsePeople(IM.text); if (!people.length) return;
      IM.busy = true; draw(page);
      try { IM.res = await C().call("/admin/import-elite", { people: people }); IM.text = ""; C().AD.list = (await C().call("/admin/members")).members; }
      catch (e) { IM.res = window.SDX_SAMPLE_MEMBERS ? { added: people.map(function (p) { return p.email; }), already: [], revoked: [], bad: [] } : { err: "Couldn't add them: " + e.message }; }
      IM.busy = false; draw(page);
    };
  }

  // ---------- one student ----------
  function detail() {
    var m = students().filter(function (x) { return x.email === S.open; })[0];
    if (!m) return "";
    var D = S.detail, vids = window.SDX_EDU ? [].concat.apply([], window.SDX_EDU.map(function (g) { return g[1]; })) : [];
    var body;
    if (!D) body = '<div class="note">Loading…</div>';
    else if (D.err) body = '<div class="note">' + esc(D.err) + "</div>";
    else {
      var done = {}; (D.videos || []).forEach(function (v) { if (v.done) done[v.file] = true; });
      body = '<div><span class="eyebrow">RECENT TRADES</span>' + (D.trades && D.trades.length ? '<div class="scroll-x"><table style="min-width:440px;margin-top:6px"><thead><tr><th>Date</th><th>Pair</th><th>Side</th><th>Setup</th><th class="r">R</th></tr></thead><tbody>' + D.trades.slice(0, 12).map(function (t) { return '<tr><td class="muted">' + dmy(t.date) + "</td><td>" + esc(t.pair || "—") + "</td><td>" + esc((t.side || "—").toString().toUpperCase()) + '</td><td class="muted">' + esc(t.setup || "") + '</td><td class="r" style="color:' + (t.r > 0 ? "#7fd99a" : t.r < 0 ? "#ff8a8a" : "inherit") + '">' + (t.r != null ? rTxt(t.r) : "—") + "</td></tr>"; }).join("") + "</tbody></table></div>" : '<div class="note" style="padding:8px 0">No trades logged yet.</div>') + "</div>" +
        '<div><span class="eyebrow">VIDEOS</span><div style="display:flex;flex-direction:column;gap:6px;margin-top:8px">' + (vids.length ? vids.filter(function (v) { return v[2]; }).map(function (v) { return '<div style="display:flex;justify-content:space-between;font-size:13px"><span>' + esc(v[0]) + '</span><span style="color:' + (done[v[2]] ? "#7fd99a" : "#6b7078") + '">' + (done[v[2]] ? "Watched" : "Not yet") + "</span></div>"; }).join("") : '<div class="note">No videos.</div>') + "</div></div>" +
        '<div><span class="eyebrow">SCANNERS</span><div style="display:flex;flex-direction:column;gap:6px;margin-top:8px">' + ((m.scanner_requests || []).length ? m.scanner_requests.map(function (r) { return '<div style="display:flex;justify-content:space-between;gap:10px;font-size:13px"><span>' + esc(SCAN_NAMES[r.scanner] || r.name || "") + ' <span class="muted">@' + esc(r.tv) + "</span></span>" + reqTag(r.status) + "</div>"; }).join("") : '<div class="note">No scanner requests.</div>') + "</div></div>";
    }
    return '<div class="modal-wrap" id="aWrap"><section class="modal" style="max-width:640px;max-height:88vh;overflow:auto;display:flex;flex-direction:column;gap:18px">' +
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px"><div><div style="font:600 24px var(--sg)">' + esc(m.name || m.email) + '</div><div class="muted" style="font-size:12px;margin-top:4px">' + esc(m.telegram_username ? "@" + m.telegram_username + " · " : "") + esc(m.email) + "</div></div>" + planTag(m.plan) + "</div>" +
      '<div class="tiles">' + tile("Joined", m.created_at ? new Date(m.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—") + tile("Last login", ago(m.last_sign_in)) + tile("Trades", m.trades || 0) + tile("Win rate", winRate(m)) + tile("Total R", m.trades ? rTxt(m.total_r) : "—", (m.total_r || 0) >= 0 ? "pos" : "neg") + tile("Journal entries", m.journal_entries || 0) + tile("Signals logged", m.signals_logged || 0) + tile("Account", m.balance != null ? "$" + Math.round(m.balance).toLocaleString("en-US") : "Not set") + "</div>" +
      body + '<div style="display:flex;justify-content:flex-end"><button class="btn btn-ghost" id="aClose">Close</button></div></section></div>';
  }
  async function openStudent(page, email) {
    S.open = email; S.detail = null; draw(page);
    var m = students().filter(function (x) { return x.email === email; })[0];
    if (!m || !m.user_id) { S.detail = window.SDX_SAMPLE_DETAIL || { err: "This student hasn't logged in yet, so there's nothing to show." }; draw(page); return; }
    try { S.detail = await C().call("/admin/student?user_id=" + encodeURIComponent(m.user_id)); }
    catch (e) { S.detail = window.SDX_SAMPLE_DETAIL || { err: "Couldn't load this student: " + e.message }; }
    if (S.open === email) draw(page);
  }

  // ---------- page ----------
  function draw(page) {
    if (S.tab === "access") { C().drawAccess(page); return; }
    var sub = { overview: "How your students are getting on.", students: "Every student, what they're using and how they're doing. Tap one for more.", scanners: "Students asking for access to the scanners on TradingView.", import: "Add people who already paid for the Elite Pack." }[S.tab];
    page.innerHTML = head(sub) + tabs() + (S.msg ? '<div class="note">' + esc(S.msg) + "</div>" : "") +
      (S.tab === "overview" ? overview() : S.tab === "students" ? studentsTab() : S.tab === "import" ? importTab() : scannersTab()) + (S.open ? detail() : "");
    wire(page);
    wireImport(page);
    $$("[data-open]", page).forEach(function (b) { b.onclick = function () { openStudent(page, b.dataset.open); }; });
    $$("[data-ap]", page).forEach(function (b) { b.onclick = function () { S.plan = b.dataset.ap; draw(page); }; });
    $$("[data-rf]", page).forEach(function (b) { b.onclick = function () { S.reqFilter = b.dataset.rf; draw(page); }; });
    var q = $("#aQ", page);
    if (q) q.oninput = function () { S.q = q.value; var pos = q.selectionStart; draw(page); var n = $("#aQ", page); n.focus(); n.setSelectionRange(pos, pos); };
    var so = $("#aSort", page); if (so) so.onchange = function () { S.sort = so.value; draw(page); };
    $$("[data-copy]", page).forEach(function (b) {
      b.onclick = function () {
        var t = b.dataset.copy;
        try { navigator.clipboard.writeText(t); } catch (e) { }
        b.textContent = "Copied";
        setTimeout(function () { if (document.body.contains(b)) b.textContent = "Copy"; }, 1500);
      };
    });
    $$("[data-rq]", page).forEach(function (b) {
      b.onclick = async function () {
        var id = b.dataset.rq, st = b.dataset.st;
        b.disabled = true; b.textContent = "Saving…";
        var ok = true;
        try { await C().call("/admin/scanner-request", { id: id, status: st }); }
        catch (e) { ok = !!window.SDX_SAMPLE_MEMBERS; if (!ok) S.msg = "Couldn't update: " + e.message; }
        if (ok) {
          students().forEach(function (m) { (m.scanner_requests || []).forEach(function (r) { if (String(r.id) === String(id)) { r.status = st; S.msg = (st === "added" ? "Marked @" + r.tv + " as granted." : "Marked @" + r.tv + " as removed. Remember to remove them on TradingView too."); } }); });
        }
        draw(page);
      };
    });
    if (S.open) {
      $("#aClose", page).onclick = function () { S.open = null; draw(page); };
      $("#aWrap", page).onclick = function (e) { if (e.target.id === "aWrap") { S.open = null; draw(page); } };
    }
  }

  P.admin = async function (page) {
    page.innerHTML = head("Loading…");
    var A = C().AD;
    try { A.list = (await C().call("/admin/members")).members; A.msg = ""; }
    catch (e) { A.list = window.SDX_SAMPLE_MEMBERS || []; A.msg = window.SDX_SAMPLE_MEMBERS ? "" : "Couldn't load members: " + e.message; S.msg = A.msg; }
    draw(page);
  };
})();
