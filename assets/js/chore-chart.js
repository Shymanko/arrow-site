/* Arrow — family dog chore chart generator.
   Builds a printable week chart: chores down the side, the seven days across the top,
   a name in each cell so nobody has to ask whose turn it is. Everything stays in the
   browser (localStorage only) — nothing is uploaded. */
(function () {
  "use strict";

  var f = document.getElementById("chart-form");
  if (!f) return;

  var KEY = "arrow.chorechart.v1";
  var peopleWrap = document.getElementById("people");
  var choresWrap = document.getElementById("chores");
  var out = document.getElementById("chart-out");
  var DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  var DEFAULT_CHORES = [
    ["Morning feed", true],
    ["Evening feed", true],
    ["Fresh water", true],
    ["Morning walk", true],
    ["Midday potty break", false],
    ["Evening walk", true],
    ["Last call before bed", true],
    ["Medication / supplement", false],
    ["Pick up the yard", false],
    ["5 minutes of training", false],
    ["Brush", false],
    ["Wash bowls", false]
  ];

  // ---------- people rows ----------
  function personRow(value) {
    var div = document.createElement("div");
    div.className = "person-row";
    div.style.cssText = "display:flex;gap:.5rem;margin-bottom:.5rem";
    var input = document.createElement("input");
    input.type = "text";
    input.className = "person";
    input.placeholder = "Name";
    input.value = value || "";
    input.setAttribute("aria-label", "Household member name");
    var rm = document.createElement("button");
    rm.type = "button";
    rm.className = "btn btn-ghost";
    rm.style.cssText = "padding:.4rem .8rem;flex:none";
    rm.textContent = "Remove";
    rm.addEventListener("click", function () {
      if (peopleWrap.querySelectorAll(".person").length > 1) div.remove();
    });
    div.appendChild(input);
    div.appendChild(rm);
    return div;
  }

  document.getElementById("add-person").addEventListener("click", function () {
    peopleWrap.appendChild(personRow(""));
    peopleWrap.lastChild.querySelector("input").focus();
  });

  // ---------- chore checkboxes ----------
  function choreRow(name, checked) {
    var label = document.createElement("label");
    label.style.cssText = "display:flex;gap:.5rem;align-items:center;font-weight:400;margin-bottom:.35rem";
    var cb = document.createElement("input");
    cb.type = "checkbox";
    cb.className = "chore";
    cb.value = name;
    cb.checked = !!checked;
    cb.style.accentColor = "#CD1F1D";
    label.appendChild(cb);
    label.appendChild(document.createTextNode(name));
    return label;
  }

  document.getElementById("add-chore").addEventListener("click", function () {
    var input = document.getElementById("custom-chore");
    var v = input.value.trim();
    if (!v) { input.focus(); return; }
    choresWrap.appendChild(choreRow(v, true));
    input.value = "";
    input.focus();
  });
  document.getElementById("custom-chore").addEventListener("keydown", function (e) {
    if (e.key === "Enter") { e.preventDefault(); document.getElementById("add-chore").click(); }
  });

  // ---------- dates ----------
  function mondayOf(d) {
    var x = new Date(d.getTime());
    var day = (x.getDay() + 6) % 7; // 0 = Monday
    x.setDate(x.getDate() - day);
    x.setHours(12, 0, 0, 0);
    return x;
  }
  function addDays(d, n) {
    var x = new Date(d.getTime());
    x.setDate(x.getDate() + n);
    return x;
  }
  function dayLabel(d, i) {
    return DAYS[i] + " " + d.getDate() + "/" + (d.getMonth() + 1);
  }

  // ---------- generate ----------
  function readForm() {
    var people = Array.prototype.map.call(
      peopleWrap.querySelectorAll(".person"), function (i) { return i.value.trim(); }
    ).filter(Boolean);
    var chores = Array.prototype.map.call(
      choresWrap.querySelectorAll(".chore:checked"), function (i) { return i.value; }
    );
    var startVal = document.getElementById("week-start").value;
    var start = mondayOf(startVal ? new Date(startVal + "T12:00:00") : new Date());
    return {
      dog: document.getElementById("dog-name").value.trim(),
      people: people,
      chores: chores,
      mode: f.querySelector('input[name="mode"]:checked').value,
      start: start
    };
  }

  function assignee(d, choreIdx, dayIdx) {
    if (d.mode === "blank" || !d.people.length) return "";
    if (d.mode === "fixed") return d.people[choreIdx % d.people.length];
    // rotate: shift by chore and by day so no one owns the same slot all week
    return d.people[(choreIdx + dayIdx) % d.people.length];
  }

  f.addEventListener("submit", function (e) {
    e.preventDefault();
    var d = readForm();

    if (!d.chores.length) {
      out.innerHTML = '<p class="error">Pick at least one job to put on the chart.</p>';
      return;
    }
    if (d.mode !== "blank" && !d.people.length) {
      out.innerHTML = '<p class="error">Add at least one name, or switch to ' +
        '&ldquo;Leave names blank&rdquo;.</p>';
      return;
    }

    var dates = [];
    for (var i = 0; i < 7; i++) dates.push(addDays(d.start, i));

    var title = (d.dog ? d.dog + "&rsquo;s" : "Our dog&rsquo;s") + " week";
    var html = '<div class="chart-out">';
    html += "<h2>" + title + "</h2>";
    html += '<p class="no-print">Names are editable — click any cell to change it before ' +
            'you print. Tick a box when the job is done.</p>';
    html += '<div class="table-scroll"><table id="chart-table"><caption>Week of ' +
            dates[0].toDateString() + (d.dog ? " &middot; " + d.dog : "") +
            '</caption><thead><tr><th scope="col">Job</th>';
    dates.forEach(function (dt, i) {
      html += '<th scope="col">' + dayLabel(dt, i) + "</th>";
    });
    html += "</tr></thead><tbody>";

    d.chores.forEach(function (chore, ci) {
      html += '<tr><th scope="row">' + chore + "</th>";
      for (var di = 0; di < 7; di++) {
        var who = assignee(d, ci, di);
        html += '<td><span class="tick"></span>' +
                (who ? '<span class="who" contenteditable="true">' + who + "</span>"
                     : '<span class="who" contenteditable="true">&nbsp;</span>') +
                "</td>";
      }
      html += "</tr>";
    });
    html += "</tbody></table></div>";

    html += '<div class="no-print" style="display:flex;gap:.6rem;flex-wrap:wrap;margin-top:1rem">' +
            '<button type="button" class="btn" id="print-chart">Print or save as PDF</button>' +
            '<button type="button" class="btn btn-ghost" id="copy-chart">Copy as text</button>' +
            "</div>";
    html += '<p class="no-print"><small>Sticking it on the fridge works. So does putting the ' +
            'same rota in <a href="/arrow-site/#get-arrow">Arrow</a>, which sends the reminder only to ' +
            'whoever is on duty and tells everyone else it is done.</small></p>';
    html += "</div>";

    out.innerHTML = html;

    document.getElementById("print-chart").addEventListener("click", function () {
      window.print();
    });
    document.getElementById("copy-chart").addEventListener("click", function (ev) {
      var txt = asText(d, dates);
      var btn = ev.currentTarget;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(txt).then(function () {
          btn.textContent = "Copied";
          setTimeout(function () { btn.textContent = "Copy as text"; }, 2000);
        });
      } else {
        window.prompt("Copy the chart:", txt);
      }
    });

    save(d);
    out.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  function asText(d, dates) {
    var lines = [(d.dog || "Dog") + " — week of " + dates[0].toDateString(), ""];
    for (var di = 0; di < 7; di++) {
      lines.push(dayLabel(dates[di], di));
      d.chores.forEach(function (chore, ci) {
        var who = assignee(d, ci, di);
        lines.push("  [ ] " + chore + (who ? " — " + who : ""));
      });
      lines.push("");
    }
    lines.push("Made with the free chore chart maker at shymanko.github.io/arrow-site");
    return lines.join("\n");
  }

  // ---------- persistence ----------
  function save(d) {
    try {
      localStorage.setItem(KEY, JSON.stringify({
        dog: d.dog, people: d.people, chores: d.chores, mode: d.mode
      }));
    } catch (e) { /* private browsing — not worth bothering the user about */ }
  }

  function restore() {
    var saved = null;
    try { saved = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) {}

    var people = (saved && saved.people && saved.people.length) ? saved.people : ["", ""];
    people.forEach(function (p) { peopleWrap.appendChild(personRow(p)); });

    var chosen = saved && saved.chores ? saved.chores : null;
    var seen = {};
    DEFAULT_CHORES.forEach(function (c) {
      seen[c[0]] = true;
      choresWrap.appendChild(choreRow(c[0], chosen ? chosen.indexOf(c[0]) !== -1 : c[1]));
    });
    if (chosen) {
      chosen.forEach(function (c) {
        if (!seen[c]) choresWrap.appendChild(choreRow(c, true));
      });
    }

    if (saved && saved.dog) document.getElementById("dog-name").value = saved.dog;
    if (saved && saved.mode) {
      var el = f.querySelector('input[name="mode"][value="' + saved.mode + '"]');
      if (el) el.checked = true;
    }

    var ws = document.getElementById("week-start");
    var m = mondayOf(new Date());
    ws.value = m.getFullYear() + "-" +
               ("0" + (m.getMonth() + 1)).slice(-2) + "-" +
               ("0" + m.getDate()).slice(-2);
  }

  restore();
})();
