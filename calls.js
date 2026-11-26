/* SDX Members Dashboard: 1-1 Calls (Elite members book a call with Sam, then watch the recording back) */
(function () {
  "use strict";
  var P = window.SDX_PAGES;
  function X() { return window.SDX; }
  function api(path, body) { return window.SDX_ADMIN_CORE.call(path, body); }

  // ---------- Calendly ----------
  function calUrl() { return String((window.SDX_CONFIG || {}).CALENDLY_URL || "").trim(); }
  var calScript = null;
  function loadCalendly() {
    if (window.Calendly) return Promise.resolve();
    if (calScript) return calScript;
    calScript = new Promise(function (ok, bad) {
      var l = document.createElement("link"); l.rel = "stylesheet"; l.href = "https://assets.calendly.com/assets/external/widget.css"; document.head.appendChild(l);
      var sc = document.createElement("script"); sc.src = "https://assets.calendly.com/assets/external/widget.js"; sc.async = true;
      sc.onload = function () { ok(); }; sc.onerror = function () { calScript = null; bad(new Error("Calendly didn't load")); };
      document.head.appendChild(sc);
    });
    return calScript;
  }
  function calEmbedUrl() {
    var u = calUrl(), light = document.documentElement.dataset.theme === "light";
    var q = "hide_gdpr_banner=1&hide_landing_page_details=1" + (light ? "" : "&background_color=121214&text_color=e8e9eb&primary_color=c9ced6");
    return u + (u.indexOf("?") > -1 ? "&" : "?") + q;
  }
  function mountCalendly(page) {
    var box = $("#clCal", page);
    if (!box) return;
    loadCalendly().then(function () {
      if (!document.body.contains(box)) return;
      box.innerHTML = "";
      var st = X().state || {}, mem = st.member || {}, user = (st.session || {}).user || {};
      window.Calendly.initInlineWidget({
        url: calEmbedUrl(), parentElement: box,
        prefill: { name: mem.name || "", email: user.email || "", customAnswers: { a1: M.topic || "" } },
        utm: { utmSource: "sdx-dashboard" }
      });
    }).catch(function () {
      box.style.height = "auto";
      box.innerHTML = '<div class="note" style="padding:20px">The booking calendar didn\'t load. <a href="' + esc(calUrl()) + '" target="_blank" rel="noopener">Open it in a new tab</a> instead.</div>';
    });
  }
  var calListening = false;
  function listenCalendly() {
    if (calListening) return;
    calListening = true;
    window.addEventListener("message", async function (e) {
      if (e.origin !== "https://calendly.com" || !e.data || e.data.event !== "calendly.event_scheduled") return;
      var p = e.data.payload || {}, page = document.getElementById("page");
      var t = page && $("#clTopic", page); if (t) M.topic = t.value;
      M.saving = true; M.msg = "";
      try {
        await api("/calls/calendly", { event_uri: (p.event || {}).uri, invitee_uri: (p.invitee || {}).uri, topic: (M.topic || "").trim() });
        M.topic = ""; M.msg = "Booked. See you on the call.";
      } catch (er) {
        M.msg = "You're booked. Check your email for the details. (" + er.message + ")";
      }
      await load(); M.saving = false;
      if (page && location.hash.indexOf("calls") > -1) draw(page);
    });
  }
  function esc(s) { return X().esc(s); }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  var TZ = "Europe/London";
  function when(at) {
    return at ? new Date(at).toLocaleString("en-GB", { timeZone: TZ, weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "";
  }
  function dayKey(at) { return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date(at)); }
  function dayLabel(at) { return new Date(at).toLocaleDateString("en-GB", { timeZone: TZ, weekday: "long", day: "numeric", month: "long" }); }
  function hm(at) { return new Date(at).toLocaleTimeString("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }); }
  function future(at) { return at && new Date(at).getTime() > Date.now(); }
  // a date and time typed in UK time -> ISO, whatever timezone the browser is in
  function ukIso(date, time) {
    if (!date || !/^\d{1,2}[:.]\d{2}$/.test(time || "")) return "";
    var p = time.replace(".", ":").split(":"), d = date.split("-");
    var guess = Date.UTC(+d[0], +d[1] - 1, +d[2], +p[0], +p[1]);
    var parts = {}; new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
      .formatToParts(new Date(guess)).forEach(function (x) { parts[x.type] = x.value; });
    var shown = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute);
    return new Date(guess - (shown - guess)).toISOString();
  }
  function timeFields(attr, n) {
    return '<div style="display:flex;gap:10px;flex-wrap:wrap"><input class="input" type="date" data-' + attr + 'd="' + n + '" style="flex:1;min-width:150px"><input class="input" type="time" step="900" data-' + attr + 't="' + n + '" style="width:130px"></div>';
  }
  function tag(txt, kind) {
    var c = kind === "good" ? "background:rgba(var(--r-127-217-154),.14);color:var(--t-7fd99a)"
      : kind === "wait" ? "background:rgba(var(--r-255-159-67),.14);color:var(--t-ffb26b)"
      : kind === "bad" ? "background:rgba(var(--r-255-138-138),.12);color:var(--t-ff8a8a)"
      : "background:var(--t-1c1c1e);color:var(--t-c9ced6)";
    return '<span class="tag" style="' + c + '">' + esc(txt) + "</span>";
  }
  function callTag(d) {
    if (d.status === "cancelled") return tag("CANCELLED", "bad");
    if (d.status === "declined") return tag("NOT BOOKED", "bad");
    if (d.status === "requested") return tag("WAITING FOR SAM", "wait");
    if (d.status === "proposed") return tag("NEW TIME SUGGESTED", "wait");
    if (d.recording_path || d.recording_link) return tag("RECORDING READY", "good");
    if (d.status === "booked" && future(d.at)) return tag("BOOKED", "");
    return tag("RECORDING COMING", "wait");
  }
  function recording(d) {
    var out = "";
    if (d.recording_url) out += '<video controls preload="metadata" playsinline src="' + esc(d.recording_url) + '" style="width:100%;max-width:820px;border-radius:12px;background:#000;display:block"></video>';
    if (d.recording_link) out += '<a class="btn btn-ghost" href="' + esc(d.recording_link) + '" target="_blank" rel="noopener" style="align-self:flex-start">Watch the recording</a>';
    return out;
  }
  function notes(d, who) {
    return d.notes ? '<div style="padding:14px 16px;border-radius:12px;background:var(--t-121214);box-shadow:inset 0 0 0 1px var(--t-c9ccd1)"><div class="eyebrow">' + esc(who) + '</div><div style="font-size:14px;line-height:1.65;margin-top:6px;white-space:pre-wrap">' + esc(d.notes) + "</div></div>" : "";
  }
  window.SDX_CALL_PARTS = { ukIso: ukIso, when: when, callTag: callTag, recording: recording, notes: notes, future: future, hm: hm, dayKey: dayKey, dayLabel: dayLabel, tag: tag };

  // ======================= MEMBER PAGE =======================
  var M = { data: null, pick: null, topic: "", msg: "", busy: false };

  async function load() {
    try { M.data = await api("/calls"); M.err = ""; }
    catch (e) { M.data = { slots: [], calls: [] }; M.err = "Couldn't load your calls: " + e.message; }
  }

  function requestForm() {
    return '<div class="note" style="font-size:13px">Tell me when suits you. Give me up to three times (UK time) and I\'ll book one or suggest another.</div>' +
      '<div style="display:flex;flex-direction:column;gap:10px">' + [1, 2, 3].map(function (n) { return '<label class="field">' + (n === 1 ? "Best time" : "Another time (optional)") + timeFields("rq", n) + "</label>"; }).join("") + "</div>" +
      '<label class="field">How long<select class="input" id="rqMins" style="max-width:200px">' + ["20", "30", "45", "60"].map(function (m) { return '<option value="' + m + '"' + (m === "30" ? " selected" : "") + ">" + m + " mins</option>"; }).join("") + "</select></label>" +
      '<label class="field">What do you want to go through?<textarea class="input" id="rqTopic" rows="4" style="height:auto;padding:12px 14px;line-height:1.5" placeholder="e.g. My last three losses on gold, my entries on the Failed Break model, building my trading plan">' + esc(M.topic) + "</textarea></label>" +
      '<div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap"><button class="btn btn-metal" id="rqSend"' + (M.busy ? " disabled" : "") + ">" + (M.busy ? "Sending…" : "Ask for a call") + '</button><span class="note">' + esc(M.msg) + "</span></div>";
  }

  function draw(page) {
    var d = M.data;
    var head = '<section class="hero" style="min-height:170px"><div class="eyebrow">ELITE</div><h1>1-1 calls.</h1><div style="font-size:14px;color:#2a2c30">Book a call with me. Once we\'ve done it, the recording shows up here so you can watch it back.</div></section>';
    if (!d) { page.innerHTML = head + '<div class="note">Loading…</div>'; return; }
    var calls = d.calls || [];
    var next = calls.filter(function (c) { return c.data.status === "booked" && future(c.data.at); }).sort(function (a, b) { return a.data.at > b.data.at ? 1 : -1; })[0];
    var pending = calls.filter(function (c) { return c.data.status === "requested" || c.data.status === "proposed"; })[0];
    var past = calls.filter(function (c) { return c !== next && c !== pending; });

    var top;
    if (!next && pending) {
      var q = pending.data;
      top = '<section class="card pad" style="display:flex;flex-direction:column;gap:14px">' +
        (q.status === "proposed" ?
          '<div class="eyebrow">SAM SUGGESTED A NEW TIME</div><div style="font:600 24px var(--sg)">' + esc(when(q.at)) + ' <span class="muted" style="font:500 13px Inter">UK time · ' + esc(q.mins || 30) + " mins</span></div>" +
          (q.sam_message ? '<div style="font-size:14px;line-height:1.6;white-space:pre-wrap">' + esc(q.sam_message) + "</div>" : "") +
          '<div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center"><button class="btn btn-metal" id="clYes" data-id="' + esc(pending.id) + '">Yes, book it</button>' +
          '<button class="btn btn-ghost" id="clCancel" data-id="' + esc(pending.id) + '">That doesn\'t work, cancel</button><span class="note">' + esc(M.msg) + "</span></div>" :
          '<div class="eyebrow">CALL REQUESTED</div><div style="font-size:14px;line-height:1.6">I\'ve got your request. I\'ll book one of your times, or suggest another, and it\'ll show here. You\'ll get a Telegram message too.</div>' +
          '<div><div class="eyebrow">THE TIMES YOU ASKED FOR</div><div class="chips" style="margin-top:6px">' + (q.options || []).map(function (o) { return '<span class="chip">' + esc(when(o)) + "</span>"; }).join("") + "</div></div>" +
          '<div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center"><button class="btn btn-ghost" id="clCancel" data-id="' + esc(pending.id) + '">Cancel my request</button><span class="note">' + esc(M.msg) + "</span></div>") +
        (q.topic ? '<div><div class="eyebrow">WHAT WE\'RE GOING THROUGH</div><div style="font-size:14px;line-height:1.6;margin-top:4px;white-space:pre-wrap">' + esc(q.topic) + "</div></div>" : "") + "</section>";
    } else if (next) {
      var n = next.data;
      top = '<section class="card pad" style="display:flex;flex-direction:column;gap:14px"><div class="eyebrow">YOUR NEXT CALL</div>' +
        '<div style="font:600 24px var(--sg)">' + esc(when(n.at)) + ' <span class="muted" style="font:500 13px Inter">UK time · ' + esc(n.mins || 30) + " mins</span></div>" +
        (n.moved_at ? '<div class="note" style="font-size:13px">Sam moved this call to the time above.</div>' : "") +
        (n.sam_message ? '<div style="font-size:14px;line-height:1.6;white-space:pre-wrap">' + esc(n.sam_message) + "</div>" : "") +
        (n.topic ? '<div><div class="eyebrow">WHAT WE\'RE GOING THROUGH</div><div style="font-size:14px;line-height:1.6;margin-top:4px;white-space:pre-wrap">' + esc(n.topic) + "</div></div>" : "") +
        '<div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center">' +
        (n.link ? '<a class="btn btn-metal" href="' + esc(n.link) + '" target="_blank" rel="noopener">Join the call</a>' : '<span class="note">I\'ll add the call link here before we start.</span>') +
        (n.source === "calendly" && n.reschedule_url ? '<a class="btn btn-ghost" href="' + esc(n.reschedule_url) + '" target="_blank" rel="noopener">Change the time</a>' : "") +
        '<button class="btn btn-ghost" id="clCancel" data-id="' + esc(next.id) + '">Cancel this call</button><span class="note">' + esc(M.msg) + "</span></div></section>";
    } else if (calUrl()) {
      top = '<section class="card pad" style="display:flex;flex-direction:column;gap:16px"><div class="eyebrow">BOOK A CALL</div>' +
        '<label class="field">What do you want to go through?<textarea class="input" id="clTopic" rows="3" style="height:auto;padding:12px 14px;line-height:1.5" placeholder="e.g. My last three losses on gold, my entries on the Failed Break model, building my trading plan">' + esc(M.topic) + "</textarea></label>" +
        '<div class="note" style="font-size:13px">Then pick a time below. It books straight into my calendar and you\'ll get an email with the details.</div>' +
        (M.saving ? '<div class="note">Saving your call…</div>' : '<div id="clCal" style="min-width:280px;height:720px;border-radius:12px;overflow:hidden"><div class="note" style="padding:20px">Loading the calendar…</div></div>') +
        (M.msg ? '<span class="note">' + esc(M.msg) + "</span>" : "") + "</section>";
    } else {
      var slots = d.slots || [], days = [], byDay = {};
      slots.forEach(function (s) { var k = dayKey(s.at); if (!byDay[k]) { byDay[k] = []; days.push(k); } byDay[k].push(s); });
      top = '<section class="card pad" style="display:flex;flex-direction:column;gap:16px"><div class="eyebrow">' + (slots.length ? "BOOK A CALL" : "ASK FOR A CALL") + '</div>' +
        (!slots.length ? requestForm() :
          '<div class="note" style="font-size:13px">Pick a time. All times are UK time.</div>' +
          days.map(function (k) {
            return '<div style="display:flex;flex-direction:column;gap:8px"><div style="font:600 14px var(--sg)">' + esc(dayLabel(byDay[k][0].at)) + '</div><div class="chips">' +
              byDay[k].map(function (s) { return '<button type="button" class="chip' + (M.pick === s.id ? " on" : "") + '" data-slot="' + esc(s.id) + '">' + esc(hm(s.at)) + ' <span class="muted" style="font-size:11px">· ' + esc(s.mins || 30) + "m</span></button>"; }).join("") + "</div></div>";
          }).join("") +
          '<label class="field">What do you want to go through?<textarea class="input" id="clTopic" rows="4" style="height:auto;padding:12px 14px;line-height:1.5" placeholder="e.g. My last three losses on gold, my entries on the Failed Break model, building my trading plan">' + esc(M.topic) + "</textarea></label>" +
          '<div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap"><button class="btn btn-metal" id="clBook"' + (M.busy ? " disabled" : "") + ">" + (M.busy ? "Booking…" : "Book this call") + "</button>") +
        (slots.length ? '<span class="note">' + esc(M.msg) + "</span></div>" : "") +
        (slots.length ? '<details style="margin-top:6px"><summary style="cursor:pointer;font:600 14px var(--sg)">None of these work? Ask for your own time</summary><div style="display:flex;flex-direction:column;gap:14px;margin-top:14px">' + requestForm() + "</div></details>" : "") + "</section>";
    }

    page.innerHTML = head + (M.err ? '<div class="note">' + esc(M.err) + "</div>" : "") + top +
      '<div style="display:flex;justify-content:space-between;align-items:center"><span class="eyebrow">YOUR CALLS</span><span class="muted" style="font-size:12px">' + past.length + " so far</span></div>" +
      (!past.length ? '<div class="card pad note" style="text-align:center">No calls yet. After your first call, the recording will show here.</div>' :
        past.map(function (c) {
          var x = c.data;
          return '<section class="card pad" style="display:flex;flex-direction:column;gap:12px"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center"><span style="font:600 17px var(--sg)">' + esc(when(x.at || (x.options || [])[0])) + "</span>" + callTag(x) + "</div>" +
            (x.topic ? '<div style="font-size:14px;line-height:1.6;white-space:pre-wrap;color:var(--t-c9ced6)">' + esc(x.topic) + "</div>" : "") +
            (x.status === "declined" && x.sam_message ? '<div style="font-size:14px;line-height:1.6;white-space:pre-wrap">' + esc(x.sam_message) + "</div>" : "") +
            (x.status === "cancelled" || x.status === "declined" ? "" : recording(x) || '<div class="note" style="font-size:12px">I\'ll upload the recording here after the call.</div>') +
            notes(x, "SAM'S NOTES") + "</section>";
        }).join(""));
    wire(page);
  }

  function wire(page) {
    if (calUrl()) {
      listenCalendly();
      mountCalendly(page);
      var tp = $("#clTopic", page); if (tp) tp.oninput = function () { M.topic = tp.value; };
    }
    $$("[data-slot]", page).forEach(function (b) { b.onclick = function () { var t = $("#clTopic", page); if (t) M.topic = t.value; M.pick = b.dataset.slot; M.msg = ""; draw(page); }; });
    var bk = $("#clBook", page);
    if (bk) bk.onclick = async function () {
      M.topic = $("#clTopic", page).value;
      if (!M.pick) { M.msg = "Pick a time first."; draw(page); return; }
      M.busy = true; M.msg = ""; draw(page);
      try { await api("/calls/book", { slot_id: M.pick, topic: M.topic.trim() }); M.pick = null; M.topic = ""; M.msg = "Booked. See you on the call."; await load(); }
      catch (e) { M.msg = e.message; await load(); }
      M.busy = false; draw(page);
    };
    var rs = $("#rqSend", page);
    if (rs) rs.onclick = async function () {
      var opts = [1, 2, 3].map(function (n) { return ukIso(($('[data-rqd="' + n + '"]', page) || {}).value, ($('[data-rqt="' + n + '"]', page) || {}).value); }).filter(Boolean);
      M.topic = $("#rqTopic", page).value;
      if (!opts.length) { M.msg = "Pick a date and a time first."; draw(page); return; }
      if (opts.some(function (o) { return !future(o); })) { M.msg = "One of those times has already passed."; draw(page); return; }
      M.busy = true; M.msg = ""; draw(page);
      try { await api("/calls/request", { options: opts, mins: +$("#rqMins", page).value || 30, topic: M.topic.trim() }); M.topic = ""; M.msg = "Request sent."; await load(); }
      catch (e) { M.msg = e.message; }
      M.busy = false; draw(page);
    };
    var yes = $("#clYes", page);
    if (yes) yes.onclick = async function () {
      yes.disabled = true;
      try { await api("/calls/respond", { id: yes.dataset.id }); M.msg = "Booked. See you on the call."; await load(); }
      catch (e) { M.msg = e.message; }
      draw(page);
    };
    var cn = $("#clCancel", page);
    if (cn) cn.onclick = async function () {
      if (cn.dataset.sure !== "1") { cn.dataset.sure = "1"; cn.textContent = "Tap again to cancel"; return; }
      cn.disabled = true;
      try { await api("/calls/cancel", { id: cn.dataset.id }); M.msg = "Cancelled. You can ask for another time."; await load(); }
      catch (e) { M.msg = "Couldn't cancel: " + e.message; }
      draw(page);
    };
  }

  P.calls = function (page) {
    draw(page);
    load().then(function () { if (location.hash.indexOf("calls") > -1) draw(page); });
  };

  // ======================= ADMIN TAB =======================
  var A = { data: null, msg: "", date: "", times: "", mins: "30", link: "", up: {}, draft: {} };

  function adminLoad(redraw) {
    return api("/admin/calls").then(function (j) { A.data = j; }).catch(function (e) { A.data = { slots: [], calls: [] }; A.msg = "Couldn't load calls: " + e.message; }).then(redraw);
  }
  function needsRec(c) { var d = c.data; return (d.status === "booked" || d.status === "done") && !future(d.at) && !d.recording_path && !d.recording_link; }

  function adminTab() {
    if (!A.data) return '<div class="note">Loading calls…</div>';
    var calls = A.data.calls || [];
    var upcoming = calls.filter(function (c) { return c.data.status === "booked" && future(c.data.at); });
    var requests = calls.filter(function (c) { return c.data.status === "requested" || c.data.status === "proposed"; });
    function reqCard(c) {
      var d = c.data, id = esc(c.id);
      return '<section class="card pad" style="display:flex;flex-direction:column;gap:12px"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center"><div style="display:flex;flex-direction:column;gap:4px"><span style="font:600 17px var(--sg)">' + esc(c.name || c.email) + '</span><span class="muted" style="font-size:12px">' + esc(d.mins || 30) + " mins</span></div>" + callTag(d) + "</div>" +
        (d.topic ? '<div><div class="eyebrow">WHAT THEY WANT TO GO THROUGH</div><div style="font-size:14px;line-height:1.6;margin-top:4px;white-space:pre-wrap">' + esc(d.topic) + "</div></div>" : "") +
        (d.status === "proposed" ? '<div class="note">You suggested ' + esc(when(d.at)) + " UK. Waiting for them to say yes.</div>" :
          '<div><div class="eyebrow">TIMES THEY ASKED FOR · TAP ONE TO BOOK IT</div><div class="chips" style="margin-top:6px">' + (d.options || []).map(function (o) { return '<button type="button" class="chip" data-rbook="' + id + '" data-at="' + esc(o) + '"' + (future(o) ? "" : " disabled") + ">" + esc(when(o)) + "</button>"; }).join("") + "</div></div>") +
        '<div style="display:flex;flex-direction:column;gap:10px"><div class="eyebrow">' + (d.status === "proposed" ? "SUGGEST ANOTHER TIME" : "OR SUGGEST A DIFFERENT TIME") + "</div>" + timeFields("rp" + id, 1) +
        '<input class="input" data-rmsg="' + id + '" placeholder="Message for them (optional), e.g. I\'m on a flight that day, does this work?">' +
        '<div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn btn-ghost" data-rprop="' + id + '">Suggest this time</button><button class="btn btn-ghost" data-rdecline="' + id + '">Can\'t do it</button></div></div></section>';
    }
    var waiting = calls.filter(needsRec).reverse();
    var done = calls.filter(function (c) { return c.data.recording_path || c.data.recording_link; }).reverse();
    var open = (A.data.slots || []).filter(function (s) { return !s.booked && future(s.at); });
    function callCard(c, mode) {
      var d = c.data, id = esc(c.id), dr = A.draft[c.id] || {};
      return '<section class="card pad" style="display:flex;flex-direction:column;gap:12px"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center"><div style="display:flex;flex-direction:column;gap:4px"><span style="font:600 17px var(--sg)">' + esc(c.name || c.email) + '</span><span class="muted" style="font-size:12px">' + esc(when(d.at)) + " UK · " + esc(d.mins || 30) + " mins</span></div>" + callTag(d) + "</div>" +
        (d.topic ? '<div><div class="eyebrow">WHAT THEY WANT TO GO THROUGH</div><div style="font-size:14px;line-height:1.6;margin-top:4px;white-space:pre-wrap">' + esc(d.topic) + "</div></div>" : "") +
        (mode === "upcoming" ?
          '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end"><label class="field" style="flex:1;min-width:240px">Call link<input class="input" data-clink="' + id + '" placeholder="Zoom or Google Meet link" value="' + esc(dr.link != null ? dr.link : (d.link || "")) + '"></label><button class="btn btn-ghost" data-csave="' + id + '">Save link</button><button class="btn btn-ghost" data-ccancel="' + id + '">Cancel call</button></div>' +
          '<details><summary style="cursor:pointer;font-size:13px">Change the time</summary><div style="display:flex;flex-direction:column;gap:10px;margin-top:10px">' + timeFields("mv" + id, 1) +
          '<input class="input" data-mvmsg="' + id + '" placeholder="Message for them (optional)"><div><button class="btn btn-ghost" data-cmove="' + id + '">Move the call</button></div></div></details>' :
          (mode === "done" ? recording(d) : "") +
          '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center"><label class="btn btn-metal" style="cursor:pointer">' + (A.up[c.id] ? "Uploading…" : (mode === "done" ? "Replace recording" : "Upload recording")) + '<input type="file" accept="video/*,audio/*" data-cfile="' + id + '" style="display:none"' + (A.up[c.id] ? " disabled" : "") + '></label><span class="muted" style="font-size:12px">or paste a link</span>' +
          '<input class="input" data-crlink="' + id + '" placeholder="Google Drive or Zoom recording link" style="flex:1;min-width:220px" value="' + esc(dr.recording_link != null ? dr.recording_link : (d.recording_link || "")) + '"></div>' +
          '<label class="field">Notes for them (optional)<textarea class="input" data-cnotes="' + id + '" rows="3" style="height:auto;padding:12px 14px;line-height:1.5" placeholder="What we covered and what to work on next.">' + esc(dr.notes != null ? dr.notes : (d.notes || "")) + "</textarea></label>" +
          '<div><button class="btn btn-ghost" data-cdone="' + id + '">Save</button></div>') +
        "</section>";
    }
    var calCard = '<section class="card pad" style="display:flex;flex-direction:column;gap:10px"><div class="eyebrow">BOOKINGS COME FROM CALENDLY</div>' +
      '<div style="font-size:14px;line-height:1.6">Elite members book on your Calendly page inside their 1-1 Calls page. Set the times you\'re free in Calendly and they show up for members straight away.</div>' +
      (A.data.calendly ? "" : '<div class="note" style="color:var(--t-ffb26b)">Calendly isn\'t connected to the server yet, so bookings won\'t show here. Add CALENDLY_TOKEN on Render (sdxtradefeed).</div>') +
      '<div><a class="btn btn-ghost" href="https://calendly.com/app/availability/schedules" target="_blank" rel="noopener">Set my times in Calendly</a></div></section>';
    return (A.msg ? '<div class="note">' + esc(A.msg) + "</div>" : "") +
      '<div class="eyebrow">REQUESTS (' + requests.length + ")</div>" +
      (requests.length ? requests.map(reqCard).join("") : '<div class="card pad note" style="text-align:center">No requests right now.</div>') +
      (calUrl() ? calCard : (
      '<section class="card pad" style="display:flex;flex-direction:column;gap:14px"><div class="eyebrow">ADD TIMES</div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px">' +
      '<label class="field">Date<input class="input" id="caDate" type="date" value="' + esc(A.date) + '"></label>' +
      '<label class="field">Start times (UK)<input class="input" id="caTimes" placeholder="e.g. 13:00, 14:00, 15:30" value="' + esc(A.times) + '"></label>' +
      '<label class="field">Length<select class="input" id="caMins">' + ["20", "30", "45", "60"].map(function (m) { return "<option value=\"" + m + "\"" + (A.mins === m ? " selected" : "") + ">" + m + " mins</option>"; }).join("") + "</select></label>" +
      '<label class="field">Call link (optional)<input class="input" id="caLink" placeholder="Your Zoom link" value="' + esc(A.link) + '"></label></div>' +
      '<div><button class="btn btn-metal" id="caAdd">Add times</button></div></section>')) +
      '<div class="eyebrow">COMING UP (' + upcoming.length + ")</div>" +
      (upcoming.length ? upcoming.map(function (c) { return callCard(c, "upcoming"); }).join("") : '<div class="card pad note" style="text-align:center">No calls booked yet.</div>') +
      '<div class="eyebrow">NEEDS A RECORDING (' + waiting.length + ")</div>" +
      (waiting.length ? waiting.map(function (c) { return callCard(c, "waiting"); }).join("") : '<div class="card pad note" style="text-align:center">Nothing waiting.</div>') +
      (calUrl() && !open.length ? "" : '<div class="eyebrow">OPEN TIMES (' + open.length + ")</div>" +
      '<section class="card pad">' + (open.length ? '<div class="chips">' + open.map(function (s) { return '<span class="chip" style="display:inline-flex;gap:8px;align-items:center">' + esc(when(s.at)) + " · " + esc(s.mins || 30) + 'm<button type="button" data-crm="' + esc(s.id) + '" aria-label="Remove this time" style="border:none;background:none;color:inherit;cursor:pointer;font-size:15px;line-height:1">×</button></span>'; }).join("") + "</div>" : '<div class="note">No open times. Add some above.</div>') + "</section>") +
      '<div class="eyebrow">DONE (' + done.length + ")</div>" +
      (done.length ? done.map(function (c) { return callCard(c, "done"); }).join("") : '<div class="card pad note" style="text-align:center">No recordings uploaded yet.</div>');
  }

  function adminWire(page, redraw) {
    if (!A.data && !A.loading) { A.loading = true; adminLoad(function () { A.loading = false; redraw(); }); }
    function keepForm() { var d = $("#caDate", page); if (d) { A.date = d.value; A.times = $("#caTimes", page).value; A.mins = $("#caMins", page).value; A.link = $("#caLink", page).value; } }
    $$("[data-clink]", page).forEach(function (i) { i.oninput = function () { (A.draft[i.dataset.clink] = A.draft[i.dataset.clink] || {}).link = i.value; }; });
    $$("[data-crlink]", page).forEach(function (i) { i.oninput = function () { (A.draft[i.dataset.crlink] = A.draft[i.dataset.crlink] || {}).recording_link = i.value; }; });
    $$("[data-cnotes]", page).forEach(function (i) { i.oninput = function () { (A.draft[i.dataset.cnotes] = A.draft[i.dataset.cnotes] || {}).notes = i.value; }; });
    function put(id, data) { (A.data.calls || []).forEach(function (c) { if (String(c.id) === String(id)) c.data = data; }); delete A.draft[id]; }
    var add = $("#caAdd", page);
    if (add) add.onclick = async function () {
      keepForm();
      var times = A.times.split(/[,\s]+/).filter(Boolean);
      if (!A.date || !times.length) { A.msg = "Pick a date and at least one start time."; redraw(); return; }
      var bad = times.filter(function (t) { return !/^\d{1,2}[:.]\d{2}$/.test(t); });
      if (bad.length) { A.msg = "Write times like 13:00 or 15:30."; redraw(); return; }
      var slots = times.map(function (t) { var p = t.replace(".", ":").split(":"); return { at: new Date(A.date + "T" + ("0" + p[0]).slice(-2) + ":" + p[1] + ":00").toISOString(), mins: +A.mins, link: A.link.trim() }; });
      add.disabled = true; add.textContent = "Adding…";
      try { var r = await api("/admin/call-slots", { add: slots }); A.msg = r.added + (r.added === 1 ? " time added." : " times added.") + (r.added < slots.length ? " Times in the past were skipped." : ""); A.times = ""; A.data = null; }
      catch (e) { A.msg = "Couldn't add times: " + e.message; }
      redraw();
    };
    $$("[data-crm]", page).forEach(function (b) {
      b.onclick = async function () {
        try { await api("/admin/call-slots", { remove: [b.dataset.crm] }); A.data.slots = A.data.slots.filter(function (s) { return String(s.id) !== b.dataset.crm; }); A.msg = "Time removed."; }
        catch (e) { A.msg = "Couldn't remove: " + e.message; }
        redraw();
      };
    });
    function pickTime(prefix) { return ukIso(($('[data-' + prefix + 'd="1"]', page) || {}).value, ($('[data-' + prefix + 't="1"]', page) || {}).value); }
    async function adminSend(body, ok) {
      try { var r = await api("/admin/call", body); put(body.id, r.data); A.msg = ok; }
      catch (e) { A.msg = "Couldn't save: " + e.message; }
      redraw();
    }
    $$("[data-rbook]", page).forEach(function (b) {
      b.onclick = function () {
        if (b.dataset.sure !== "1") { b.dataset.sure = "1"; b.textContent = "Tap again to book " + b.textContent; return; }
        adminSend({ id: b.dataset.rbook, book_at: b.dataset.at, message: ($('[data-rmsg="' + b.dataset.rbook + '"]', page) || {}).value || "" }, "Booked. They'll see it on their 1-1 Calls page.");
      };
    });
    $$("[data-rprop]", page).forEach(function (b) {
      b.onclick = function () {
        var id = b.dataset.rprop, at = pickTime("rp" + id);
        if (!at || !future(at)) { A.msg = "Pick a date and time in the future first."; redraw(); return; }
        adminSend({ id: id, propose_at: at, message: $('[data-rmsg="' + id + '"]', page).value }, "Time suggested. They can say yes on their 1-1 Calls page.");
      };
    });
    $$("[data-rdecline]", page).forEach(function (b) {
      b.onclick = function () {
        if (b.dataset.sure !== "1") { b.dataset.sure = "1"; b.textContent = "Tap again to say no"; return; }
        adminSend({ id: b.dataset.rdecline, decline: true, message: $('[data-rmsg="' + b.dataset.rdecline + '"]', page).value }, "Done. They can ask for another time.");
      };
    });
    $$("[data-cmove]", page).forEach(function (b) {
      b.onclick = function () {
        var id = b.dataset.cmove, at = pickTime("mv" + id);
        if (!at || !future(at)) { A.msg = "Pick a date and time in the future first."; redraw(); return; }
        adminSend({ id: id, move_at: at, message: $('[data-mvmsg="' + id + '"]', page).value }, "Call moved. They'll see the new time.");
      };
    });
    $$("[data-csave]", page).forEach(function (b) {
      b.onclick = async function () {
        var id = b.dataset.csave;
        try { var r = await api("/admin/call", { id: id, link: $('[data-clink="' + id + '"]', page).value }); put(id, r.data); A.msg = "Call link saved. They can see it on their 1-1 Calls page."; }
        catch (e) { A.msg = "Couldn't save: " + e.message; }
        redraw();
      };
    });
    $$("[data-ccancel]", page).forEach(function (b) {
      b.onclick = async function () {
        if (b.dataset.sure !== "1") { b.dataset.sure = "1"; b.textContent = "Tap again to cancel"; return; }
        try { var r = await api("/admin/call", { id: b.dataset.ccancel, status: "cancelled" }); put(b.dataset.ccancel, r.data); A.data = null; A.msg = "Call cancelled and the time is open again."; }
        catch (e) { A.msg = "Couldn't cancel: " + e.message; }
        redraw();
      };
    });
    $$("[data-cdone]", page).forEach(function (b) {
      b.onclick = async function () {
        var id = b.dataset.cdone;
        var body = { id: id, notes: $('[data-cnotes="' + id + '"]', page).value, recording_link: $('[data-crlink="' + id + '"]', page).value };
        try { var r = await api("/admin/call", body); put(id, r.data); A.msg = (r.data.recording_link || r.data.recording_path) ? "Saved. They can watch it on their 1-1 Calls page now." : "Saved."; }
        catch (e) { A.msg = "Couldn't save: " + e.message; }
        redraw();
      };
    });
    $$("[data-cfile]", page).forEach(function (inp) {
      inp.onchange = async function (e) {
        var id = inp.dataset.cfile, f = (e.target.files || [])[0];
        if (!f) return;
        A.up[id] = true; A.msg = "Uploading " + f.name + " (" + Math.round(f.size / 1048576) + " MB). Keep this page open."; redraw();
        try {
          var s = await api("/admin/call-upload", { id: id, filename: f.name });
          var up = await X().sb.storage.from(s.bucket).uploadToSignedUrl(s.path, s.token, f, { contentType: f.type || "video/mp4" });
          if (up.error) throw up.error;
          var r = await api("/admin/call", { id: id, recording_path: s.path });
          put(id, r.data); A.msg = "Recording uploaded. They can watch it on their 1-1 Calls page now.";
        } catch (er) {
          var m = String(er.message || er);
          A.msg = /size|large|413|exceed/i.test(m) ? "That file is too big to upload here. Put it on Google Drive (or use the Zoom cloud link) and paste the link instead." : "Couldn't upload: " + m;
        }
        A.up[id] = false; redraw();
      };
    });
  }

  window.SDX_CALLS_ADMIN = {
    tab: adminTab, wire: adminWire,
    waiting: function () { return A.data ? (A.data.calls || []).filter(function (c) { return needsRec(c) || c.data.status === "requested"; }).length : 0; }
  };
})();
