/* Arrow — dog feeding calculator.
   Uses the standard veterinary energy equations:
     RER (kcal/day) = 70 x (body weight in kg)^0.75
     MER (kcal/day) = RER x life-stage factor   (Merck Veterinary Manual factors)
   Portion size is then derived from the energy density printed on the owner's own
   bag of food, because "cups per day" charts are meaningless without it.
   This is a starting point for a healthy dog, not a prescription. */
(function () {
  "use strict";

  var f = document.getElementById("feed-form");
  if (!f) return;
  var out = document.getElementById("feed-result");

  // Life-stage multipliers, Merck Veterinary Manual.
  var FACTORS = {
    "puppy-under4": { k: 3.0, label: "Puppy under 4 months", meals: 4 },
    "puppy-over4":  { k: 2.0, label: "Puppy 4–12 months", meals: 3 },
    "adult-neutered": { k: 1.6, label: "Adult, neutered or spayed", meals: 2 },
    "adult-intact":   { k: 1.8, label: "Adult, not neutered", meals: 2 },
    "obese-prone":    { k: 1.4, label: "Adult prone to weight gain", meals: 2 },
    "senior-inactive": { k: 1.2, label: "Older or low-activity adult", meals: 2 }
  };

  function round(n, step) { return Math.round(n / step) * step; }

  function energyPerGram() {
    var mode = f.querySelector('input[name="density-mode"]:checked').value;
    var v = parseFloat(document.getElementById("density").value);
    if (!isFinite(v) || v <= 0) return null;
    if (mode === "per100g") return { perGram: v / 100, unit: "g", cup: null };
    if (mode === "perkg") return { perGram: v / 1000, unit: "g", cup: null };
    // kcal per cup -> we can only give cups, not grams
    return { perGram: null, unit: "cup", cup: v };
  }

  f.addEventListener("submit", function (e) {
    e.preventDefault();

    var w = parseFloat(document.getElementById("weight").value);
    var unit = f.querySelector('input[name="wunit"]:checked').value;
    var kg = unit === "lb" ? w * 0.45359237 : w;
    var stageKey = document.getElementById("stage").value;
    var stage = FACTORS[stageKey];

    if (!isFinite(w) || w <= 0) {
      out.hidden = false;
      out.innerHTML = '<p class="error">Enter your dog&rsquo;s current weight.</p>';
      return;
    }
    if (kg < 0.5 || kg > 100) {
      out.hidden = false;
      out.innerHTML = '<p class="error">That weight is outside the range this calculator ' +
        'handles (0.5–100 kg / 1–220 lb). For dogs outside it, ask your vet to run the ' +
        'numbers directly.</p>';
      return;
    }

    var rer = 70 * Math.pow(kg, 0.75);
    var mer = rer * stage.k;
    var treatMax = mer * 0.10;
    var mealKcal = mer - treatMax; // the 90% that must come from complete food
    var meals = parseInt(document.getElementById("meals").value, 10) || stage.meals;

    var html = "";
    html += "<h3>Starting point for a " + Math.round(kg * 10) / 10 + " kg (" +
            Math.round(kg / 0.45359237) + " lb) dog</h3>";
    html += '<span class="big">' + Math.round(mer / 5) * 5 + " kcal a day</span>";
    html += "<p>Total daily calories for &ldquo;" + stage.label.toLowerCase() +
            "&rdquo;. That is a resting requirement of " + Math.round(rer) +
            " kcal &times; " + stage.k + ".</p>";

    html += "<h3>How to split it</h3><ul>";
    html += "<li><strong>" + Math.round(mealKcal / 5) * 5 + " kcal from complete food</strong>" +
            " — split across " + meals + " meal" + (meals > 1 ? "s" : "") + ", so about <strong>" +
            Math.round(mealKcal / meals / 5) * 5 + " kcal per meal</strong>.</li>";
    html += "<li><strong>Up to " + Math.round(treatMax) + " kcal from treats</strong>, chews, " +
            "training rewards and anything handed over from the table — combined, across " +
            "everyone in the house. This is the 10% rule.</li>";
    html += "</ul>";

    var dens = energyPerGram();
    if (dens) {
      html += "<h3>In actual food</h3><ul>";
      if (dens.perGram) {
        var gPerDay = mealKcal / dens.perGram;
        html += "<li><strong>" + round(gPerDay, 5) + " g a day</strong> of your food" +
                " &mdash; about <strong>" + round(gPerDay / meals, 5) + " g per meal</strong>.</li>";
        html += "<li>Weigh it on a kitchen scale once and mark the level on a cup or scoop. " +
                "Scooped portions drift by 20–30% between people; a scale does not.</li>";
      } else {
        var cups = mealKcal / dens.cup;
        html += "<li><strong>" + (Math.round(cups * 8) / 8) + " cups a day</strong>" +
                " &mdash; about <strong>" + (Math.round(cups / meals * 8) / 8) +
                " cups per meal</strong>, using a proper measuring cup, levelled off.</li>";
        html += "<li>Grams are more reliable than cups. If your bag lists kcal per kg, " +
                "switch the unit above and weigh instead.</li>";
      }
      html += "</ul>";
    } else {
      html += '<div class="note"><p><strong>Add your food&rsquo;s calorie density to get a ' +
        'portion size.</strong> Look on the bag or tin for &ldquo;kcal/kg&rdquo;, ' +
        '&ldquo;kcal per 100 g&rdquo; or &ldquo;kcal per cup&rdquo; — it is usually in small ' +
        'print near the feeding chart. Without it, calories cannot be converted into grams: ' +
        'foods range from roughly 300 to 500 kcal per 100 g.</p></div>';
    }

    if (stageKey === "puppy-under4" || stageKey === "puppy-over4") {
      html += '<div class="note"><p><strong>Puppies are the exception to &ldquo;set it and ' +
        'forget it&rdquo;.</strong> A growing puppy&rsquo;s requirement changes every few ' +
        'weeks. Re-run this after each weigh-in, and feed a food formulated for growth — ' +
        'large breeds need one formulated for large-breed growth specifically.</p></div>';
    }

    html += "<h3>Then adjust to the dog in front of you</h3>";
    html += "<p>Individual needs vary by as much as 50% either side of these equations. " +
            "Treat the number above as week one, then let your dog&rsquo;s body do the " +
            "talking: weigh every 2–4 weeks and run a body condition check with your hands. " +
            "If the ribs are getting harder to feel, take about 10% off. If the waist is " +
            "becoming sharp and the ribs obvious, add about 10%.</p>";
    html += '<p><a href="/guides/is-my-dog-overweight-body-condition-score/">' +
            "How to run a 30-second body condition check &rarr;</a></p>";

    html += '<p><small>A starting estimate for a healthy dog, from the standard ' +
            'RER/MER equations. It is not a weight-loss plan and not a substitute for ' +
            'your vet. Dogs that are already overweight, pregnant, nursing, recovering ' +
            'from illness, or on a prescription diet need a plan calculated by a ' +
            'veterinarian from a target weight — not from today&rsquo;s weight.</small></p>';

    out.hidden = false;
    out.innerHTML = html;
    out.setAttribute("tabindex", "-1");
    out.focus();
  });

  // Keep the default meal count in step with life stage until the user overrides it.
  var mealsEl = document.getElementById("meals");
  var touched = false;
  mealsEl.addEventListener("change", function () { touched = true; });
  document.getElementById("stage").addEventListener("change", function (e) {
    if (touched) return;
    var s = FACTORS[e.target.value];
    if (s) mealsEl.value = String(s.meals);
  });

  f.addEventListener("reset", function () {
    out.hidden = true;
    out.innerHTML = "";
    touched = false;
  });
})();
