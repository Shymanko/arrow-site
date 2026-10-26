/* Arrow — potty break calculator.
   Vanilla JS, no dependencies. Produces an age-based potty-break interval and a
   suggested daily schedule. Every number it prints is traceable to a source
   listed on the page; nothing here is a diagnosis. */
(function () {
  "use strict";

  var f = document.getElementById("potty-form");
  if (!f) return;

  var out = document.getElementById("potty-result");
  var stageInputs = f.querySelectorAll('input[name="stage"]');
  var puppyField = document.getElementById("puppy-age-field");

  function togglePuppy() {
    var isPuppy = f.querySelector('input[name="stage"]:checked').value === "puppy";
    puppyField.hidden = !isPuppy;
  }
  Array.prototype.forEach.call(stageInputs, function (el) {
    el.addEventListener("change", togglePuppy);
  });
  togglePuppy();

  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

  function pad(n) { return (n < 10 ? "0" : "") + n; }

  function fmt(mins) {
    var h = Math.floor(mins / 60) % 24, m = Math.round(mins % 60);
    return pad(h) + ":" + pad(m);
  }

  function plan(data) {
    var stage = data.stage, months = data.months;
    var r = { flags: [] };

    if (stage === "puppy") {
      // Widely used trainer/vet rule of thumb: a puppy can hold its bladder about
      // one hour per month of age. Scheduled breaks are deliberately more frequent
      // than the maximum hold.
      var hold = clamp(months, 1, 8);
      r.dayLow = clamp(Math.max(1, months - 1), 1, 4);
      r.dayHigh = clamp(months, 1, 5);
      r.night = clamp(hold + 1, 2, 8);
      r.maxHold = hold;
      r.label = months < 4 ? "Young puppy" : "Older puppy";
      r.extra = [
        "Go out straight after every nap, meal, drink and play session — those are the four moments puppies are most likely to need it.",
        "Puppies often go within about 15 minutes of eating or drinking, so take yours out within 10 minutes of a meal.",
        "Accidents indoors are a schedule problem, not a discipline problem. Shorten the interval before you change anything else."
      ];
      if (months <= 3) {
        r.flags.push("Under 3 months, set a night alarm. Most puppies this age cannot last the night yet.");
      }
    } else if (stage === "adult") {
      r.dayLow = 4; r.dayHigh = 6; r.night = 8; r.maxHold = 10;
      r.label = "Healthy adult dog";
      r.extra = [
        "Three to five trips a day is the normal range for a healthy adult dog.",
        "Overnight is different from daytime: the body slows urine production during sleep, which is why 8 hours overnight is fine but 8 hours mid-afternoon is not.",
        "10–12 hours is an upper limit, not a target. Routinely pushing to it is linked to urinary problems and accidents."
      ];
    } else {
      r.dayLow = 3; r.dayHigh = 5; r.night = 6; r.maxHold = 8;
      r.label = "Senior dog";
      r.extra = [
        "Bladder control usually shortens with age. A senior who used to sleep 8 hours may now need to go out after 5 or 6.",
        "A sudden change in how often your dog needs to go — in either direction — is worth a vet call, not a schedule change.",
        "Make the route to the door easy: no stairs, no slippery floors, a light on at night."
      ];
    }

    // Modifiers
    if (data.meds) {
      r.dayLow = Math.max(1, r.dayLow - 1);
      r.dayHigh = Math.max(2, r.dayHigh - 1);
      r.night = Math.max(2, r.night - 2);
      r.flags.push("You told us your dog is on diuretics or steroids, or has a kidney, diabetes or incontinence diagnosis. These all increase urine output. Use the shorter end of the range and ask your vet what interval they want for your dog specifically.");
    }
    if (data.hot) {
      r.dayLow = Math.max(1, r.dayLow - 1);
      r.dayHigh = Math.max(2, r.dayHigh - 1);
      r.flags.push("Hot weather and hard exercise both raise water intake, and more water in means more out.");
    }
    if (data.newHome) {
      r.flags.push("A dog in a new home — just adopted, or staying with family — often needs extra trips for the first week or two until the routine settles.");
    }
    return r;
  }

  function schedule(wake, bed, low, high) {
    var step = Math.round(((low + high) / 2) * 60);
    var start = wake, end = bed;
    if (end <= start) end += 24 * 60;
    var times = [];
    var t = start;
    while (t < end - 15) {
      times.push(t);
      t += step;
    }
    // Don't schedule a break and then "last call" an hour apart — fold the last
    // regular break into bedtime if they land close together.
    if (times.length > 1 && end - times[times.length - 1] < 75) times.pop();
    times.push(end); // last call before bed
    var labels = [];
    for (var i = 0; i < times.length; i++) {
      var label;
      if (i === 0) label = "First thing — before anything else";
      else if (i === times.length - 1) label = "Last call before bed";
      else label = "Break " + (i + 1);
      labels.push({ time: fmt(times[i]), label: label });
    }
    return labels;
  }

  function parseTime(v) {
    var m = /^(\d{1,2}):(\d{2})$/.exec(v || "");
    if (!m) return null;
    return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
  }

  f.addEventListener("submit", function (e) {
    e.preventDefault();
    var stage = f.querySelector('input[name="stage"]:checked').value;
    var months = parseFloat(document.getElementById("puppy-months").value);

    if (stage === "puppy" && (!isFinite(months) || months < 1 || months > 18)) {
      out.hidden = false;
      out.innerHTML = '<p class="error">Enter your puppy&rsquo;s age in months (1–18).</p>';
      out.focus();
      return;
    }

    var data = {
      stage: stage,
      months: months,
      meds: document.getElementById("c-meds").checked,
      hot: document.getElementById("c-hot").checked,
      newHome: document.getElementById("c-new").checked
    };

    var r = plan(data);
    var wake = parseTime(document.getElementById("wake").value) || 7 * 60;
    var bed = parseTime(document.getElementById("bed").value) || 23 * 60;
    var list = schedule(wake, bed, r.dayLow, r.dayHigh);

    var html = "";
    html += "<h3>" + r.label + "</h3>";
    html += '<span class="big">Every ' + r.dayLow + "–" + r.dayHigh + " hours</span>";
    html += "<p>during the day, which works out to about <strong>" + list.length +
            " trips</strong> between " + fmt(wake) + " and " + fmt(bed) +
            ". Overnight, aim for no more than <strong>" + r.night + " hours</strong>.</p>";

    html += "<h3>A schedule you can share with the household</h3><ul class=\"schedule-list\">";
    list.forEach(function (s) {
      html += '<li><span class="time">' + s.time + "</span><span>" + s.label + "</span></li>";
    });
    html += "</ul>";

    html += "<h3>What else matters for your dog</h3><ul>";
    r.extra.forEach(function (t) { html += "<li>" + t + "</li>"; });
    html += "</ul>";

    if (r.flags.length) {
      html += '<h3>Because of what you told us</h3><ul>';
      r.flags.forEach(function (t) { html += "<li>" + t + "</li>"; });
      html += "</ul>";
    }

    html += '<p><small>General guidance for a dog with no diagnosed urinary, kidney or ' +
            'behavioural condition. Straining, blood, accidents from a previously reliable ' +
            'dog, or a sudden change in frequency are all reasons to call your vet today ' +
            'rather than adjust a schedule.</small></p>';

    out.hidden = false;
    out.innerHTML = html;
    out.setAttribute("tabindex", "-1");
    out.focus();
  });

  f.addEventListener("reset", function () {
    out.hidden = true;
    out.innerHTML = "";
    setTimeout(togglePuppy, 0);
  });
})();
