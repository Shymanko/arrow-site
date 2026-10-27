// Arrow motion: smooth scroll, the hero opening, a phone you can almost hold, a rolling clock and a medal wall with depth.
// Everything here is decoration on top of a page that already works; with reduced motion or no GSAP it simply does nothing.
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !window.gsap) return;
  const { gsap } = window, $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const fine = matchMedia('(pointer: fine)').matches;
  if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
  if (window.SplitText) gsap.registerPlugin(SplitText);

  // Smooth, weighted scrolling; anchor links glide instead of jumping.
  if (window.Lenis) {
    const lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.9 });
    if (window.ScrollTrigger) lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    document.documentElement.style.scrollBehavior = 'auto';
    $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const target = a.getAttribute('href').length > 1 && $(a.getAttribute('href'));
      if (target) { e.preventDefault(); lenis.scrollTo(target, { offset: -72, duration: 1.2 }); }
    }));
  }

  // Hero: the words rise one by one, the photo opens out of the app-icon window, then drifts as you scroll.
  const title = $('#hero-title'), photos = $('.hero-photos');
  document.fonts.ready.then(() => {
    if (title && window.SplitText) {
      const split = new SplitText(title, { type: 'words', mask: 'words' });
      gsap.from(split.words, { yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: 0.07, delay: 0.15 });
    }
    gsap.from('.hero .lede, .hero .btn, .hero-links', { y: 24, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.1, delay: 0.6 });
    gsap.from('.hero-mark', { scale: 0.86, opacity: 0, duration: 1, ease: 'expo.out' });
  });
  if (photos) {
    gsap.fromTo(photos, { clipPath: 'inset(9% 14% 9% 14% round 120px)' }, { clipPath: 'inset(0% 0% 0% 0% round 28px)', duration: 1.6, ease: 'expo.inOut', delay: 0.2 });
    if (window.ScrollTrigger) gsap.to(photos, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  }

  // The phone: tilts toward the pointer like something in your hand, and leans a little as the day goes by.
  const phone = $('.story .phone'), stage = $('.story .stage-sticky');
  if (phone && stage) {
    gsap.set(phone, { transformPerspective: 1100, transformStyle: 'preserve-3d' });
    if (fine) {
      const rx = gsap.quickTo(phone, 'rotationX', { duration: 0.6, ease: 'power3.out' }), ry = gsap.quickTo(phone, 'rotationY', { duration: 0.6, ease: 'power3.out' });
      stage.addEventListener('pointermove', e => {
        const r = stage.getBoundingClientRect();
        ry(((e.clientX - r.left) / r.width - 0.5) * 16); rx(-((e.clientY - r.top) / r.height - 0.5) * 12);
      });
      stage.addEventListener('pointerleave', () => { rx(0); ry(0); });
    }
    if (window.ScrollTrigger) gsap.fromTo(phone, { rotationZ: -2 }, { rotationZ: 2, ease: 'none', scrollTrigger: { trigger: '.story-steps', start: 'top center', end: 'bottom center', scrub: true } });
  }

  // The clock of each moment rolls in like a departure board when its moment arrives.
  $$('.step-time time').forEach(t => {
    t.innerHTML = [...t.textContent].map(c => `<span class="roll"><span>${c === ' ' ? '&nbsp;' : c}</span></span>`).join('');
  });
  const roll = step => gsap.fromTo($$('.roll > span', step), { yPercent: 105 }, { yPercent: 0, duration: 0.7, ease: 'expo.out', stagger: 0.04, overwrite: true });
  new MutationObserver(list => list.forEach(m => { if (m.target.classList.contains('is-on') && !m.oldValue?.includes('is-on')) roll(m.target); }))
    .observe($('.story-steps') || document.body, { attributes: true, attributeFilter: ['class'], attributeOldValue: true, subtree: true });

  // Medal wall: medals arrive in a wave from the centre, then float at different depths and follow the pointer.
  const wall = $('.wall');
  if (wall) {
    const medals = $$('.wall img', wall);
    if (window.ScrollTrigger) gsap.from(medals, { scale: 0.4, opacity: 0, y: 40, duration: 1, ease: 'back.out(1.6)', stagger: { each: 0.035, from: 'center', grid: 'auto' }, scrollTrigger: { trigger: wall, start: 'top 75%' } });
    medals.forEach((m, i) => gsap.to(m, { y: i % 2 ? -10 : 10, rotation: i % 3 ? 3 : -3, duration: 2.6 + (i % 5) * 0.3, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: (i % 7) * 0.2 }));
    if (fine) {
      const movers = medals.map(m => ({ x: gsap.quickTo(m, 'x', { duration: 0.9, ease: 'power3.out' }), depth: +(m.dataset.depth || 1) }));
      wall.addEventListener('pointermove', e => {
        const r = wall.getBoundingClientRect(), dx = (e.clientX - r.left) / r.width - 0.5;
        movers.forEach(m => m.x(dx * 36 * m.depth));
      });
      wall.addEventListener('pointerleave', () => movers.forEach(m => m.x(0)));
    }
  }

  // Buttons lean toward the pointer a little, like they want to be pressed.
  if (fine) $$('.btn').forEach(b => {
    const x = gsap.quickTo(b, 'x', { duration: 0.4, ease: 'power3.out' }), y = gsap.quickTo(b, 'y', { duration: 0.4, ease: 'power3.out' });
    b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); x((e.clientX - r.left - r.width / 2) * 0.25); y((e.clientY - r.top - r.height / 2) * 0.3); });
    b.addEventListener('pointerleave', () => { x(0); y(0); });
  });
})();
