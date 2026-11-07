// Arrow landing: the live app fragment, the plan stage and section entrances.
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // Story: the step nearest the reading line decides which screen the phone shows.
  const story = $('.story'), screens = $$('.story .screen'), steps = $$('.story .step');
  if (story) {
    story.classList.add('story-live');
    const show = (id) => {
      steps.forEach(s => s.classList.toggle('is-on', s.dataset.step === id));
      screens.forEach(s => s.classList.toggle('is-on', s.dataset.screen === id));
      story.dataset.active = id;
    };
    // The reading line sits mid-screen on a desktop and below the pinned phone on a phone.
    const narrow = matchMedia('(max-width:900px)');
    let current = '', ticking = false;
    const pick = () => {
      ticking = false;
      const y = innerHeight * (narrow.matches ? 0.9 : 0.5);
      let id = steps[0].dataset.step;
      for (const s of steps) if (s.getBoundingClientRect().top <= y) id = s.dataset.step;
      // On a phone, words that start sliding under the pinned phone step aside instead.
      if (narrow.matches) {
        const copy = steps.find(s => s.dataset.step === id).firstElementChild.getBoundingClientRect();
        if (copy.top < $('.stage-sticky').getBoundingClientRect().bottom - 2) { steps.forEach(s => s.classList.remove('is-on')); current = ''; return; }
      }
      if (id !== current) { current = id; show(id); }
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(pick); } }, { passive: true });
    addEventListener('resize', pick);
    pick();
  }

  // The live thing: a repeat feeding by someone else is held until confirmed.
  const sheet = $('.ui-sheet'), toast = $('.ui-toast');
  $$('[data-sheet]').forEach(b => b.addEventListener('click', () => {
    sheet.hidden = true;
    toast.textContent = b.dataset.sheet === 'log' ? 'Second meal logged. The family sees two.' : 'Nothing logged. Luna is fed.';
    toast.hidden = false;
    clearTimeout(toast.t); toast.t = setTimeout(() => { toast.hidden = true; sheet.hidden = false; }, 2400);
  }));

  // The pre-walk checklist: each thing you grab can be ticked on the phone.
  $$('.pack').forEach(b => b.addEventListener('click', () => b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true'))));

  // Pricing: one stage, contents follow the selected plan.
  const plans = {
    free: ['$0', 'forever', "Your whole family with no limit on people. Turns, rotations and asking for help, the daily log, walks with a map, health records, medicines and reminders, 60 medals. Two pets, eight lessons, ten documents.", 'Coming to iPhone'],
    year: ['$39.99', 'a year', 'Everything in Free, plus unlimited pets, all 24 lessons and unlimited documents. Seven days free.', 'Coming to iPhone'],
    month: ['$4.99', 'a month', 'Everything in Plus, billed monthly. Cancel any time in your Apple ID settings. Seven days free.', 'Coming to iPhone']
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
    $$('main section:not(.story):not(.hero)').forEach(sec => {
      const parts = $$('h1,h2,p,.btn,figure,.phone,.bar .seg,.card,.plans button', sec);
      parts.forEach((el, i) => { el.dataset.reveal = ''; el.style.transitionDelay = (Math.min(i, 8) * 75) + 'ms'; });
      new IntersectionObserver((entries, io) => entries.forEach(e => { if (e.isIntersecting) { parts.forEach(p => p.classList.add('in')); io.disconnect(); } }), { threshold: 0.12 }).observe(sec);
    });
  }
})();
