// Arrow landing: the live app fragment, the plan stage and section entrances.
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // Showcase: choosing a name swaps the phone screen and the squircle colour.
  const showcase = $('.showcase'), fact = $('.show-fact');
  const facts = {
    today: 'Try it: tap <b>Fed</b>. Max already fed Luna, so Arrow asks first.',
    turns: 'Turns rotate fairly. Ask for a swap and it moves in one tap.',
    reminders: 'Only the person on duty is pinged, and it clears for everyone once done.',
    training: '24 lessons, one moment per step, with a timer that keeps sessions short.',
    awards: '60 medals reward the household for showing up, not for perfection.'
  };
  $$('[data-show]').forEach(tab => tab.addEventListener('click', () => {
    const id = tab.dataset.show;
    $$('[data-show]').forEach(t => t.setAttribute('aria-selected', String(t === tab)));
    $$('.screen').forEach(s => { s.hidden = s.dataset.screen !== id; });
    showcase.dataset.active = id; fact.innerHTML = facts[id];
  }));

  // The live thing: a repeat feeding by someone else is held until confirmed.
  const sheet = $('.ui-sheet'), toast = $('.ui-toast');
  const say = (text) => { toast.textContent = text; toast.hidden = false; clearTimeout(say.t); say.t = setTimeout(() => { toast.hidden = true; }, 2200); };
  $$('[data-log]').forEach(b => b.addEventListener('click', () => {
    const kind = b.dataset.log;
    if (kind === 'food') { sheet.hidden = false; $('[data-sheet=cancel]', sheet).focus(); return; }
    say(kind === 'walk' ? 'Walk logged — Max and Sofia see it now' : 'Water logged. Everyone sees it.');
  }));
  $$('[data-sheet]').forEach(b => b.addEventListener('click', () => {
    sheet.hidden = true;
    say(b.dataset.sheet === 'log' ? 'Second meal logged — the family sees two' : 'Nothing logged. Luna is fed.');
  }));

  // Pricing: one stage, contents follow the selected plan.
  const plans = {
    free: ['$0', 'forever', 'One home, two pets, two people. Daily logging, the first eight lessons and medication reminders — reminders stay free forever.', 'Start free'],
    year: ['$39.99', 'a year', 'One subscription for the whole home: unlimited family and sitters, turns and hand-offs, care stats over time, all 24 lessons, the home camera and unlimited documents. Seven days free.', 'Start Family, yearly'],
    month: ['$4.99', 'a month', 'Everything in Family, billed monthly. Cancel any time in your Apple ID settings. Seven days free.', 'Start Family, monthly']
  };
  const stage = $('.plan-stage');
  $$('[data-plan]').forEach(b => {
    const pick = () => {
      $$('[data-plan]').forEach(x => x.setAttribute('aria-selected', String(x === b)));
      const [p, per, text, cta] = plans[b.dataset.plan];
      $('[data-price]').textContent = p; $('[data-period]').textContent = per; $('[data-text]').textContent = text; $('[data-cta]').textContent = cta;
      stage.classList.remove('swap'); void stage.offsetWidth; stage.classList.add('swap');
    };
    b.addEventListener('click', pick); b.addEventListener('focus', pick);
  });

  // FAQ: one card open at a time.
  $$('.card').forEach(c => c.addEventListener('toggle', () => { if (c.open) $$('.card').forEach(o => { if (o !== c) o.open = false; }); }));

  // Entrances: each section's heading, text, then picture, staggered once.
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('reveal-on');
    $$('main section').forEach(sec => {
      const parts = $$('h1,h2,p,.btn,figure,.phone,.bar .seg,.spec,.card,.plans button,.tile', sec);
      parts.forEach((el, i) => { el.dataset.reveal = ''; el.style.transitionDelay = (Math.min(i, 8) * 75) + 'ms'; });
      new IntersectionObserver((entries, io) => entries.forEach(e => { if (e.isIntersecting) { parts.forEach(p => p.classList.add('in')); io.disconnect(); } }), { threshold: 0.12 }).observe(sec);
    });
  }
})();
