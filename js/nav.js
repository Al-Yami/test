/* =====================================================================
   Nav + off-canvas menu
   GSAP (+ SplitText, ScrollTrigger) and Lenis are loaded as globals from
   index.html. This file must load BEFORE main.js so ScrollTrigger already
   points at the .page scroller when main.js creates its triggers.
   ===================================================================== */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  const page = $('#page');
  const menu = $('#menu');
  const toggle = $('.toggle');
  const logo = $('.nav-logo');
  const links = $$('.menu-link');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const { gsap, ScrollTrigger, SplitText, Lenis } = window;

  /* ---------- 1. Register plugins ---------- */
  if (gsap) gsap.registerPlugin(...[ScrollTrigger, SplitText].filter(Boolean));

  /* ---------- 2. Lenis: the page container is both wrapper and content ---------- */
  let lenis = null;
  if (Lenis) {
    lenis = new Lenis({ wrapper: page, content: page, autoRaf: true, smoothWheel: !reduce });
    if (ScrollTrigger) lenis.on('scroll', ScrollTrigger.update);
  }
  if (ScrollTrigger) ScrollTrigger.defaults({ scroller: page });

  /* ---------- 3. Split the menu link text into masked words ---------- */
  const maskWords = (el) => {                  // fallback when SplitText did not load
    const text = el.textContent.trim();
    el.textContent = '';
    const mask = document.createElement('span');
    const word = document.createElement('span');
    mask.className = 'word-mask';
    mask.style.cssText = 'display:inline-block;overflow:hidden;vertical-align:top';
    word.className = 'menu-word';
    word.textContent = text;
    mask.appendChild(word);
    el.appendChild(mask);
    el.setAttribute('aria-label', text);
    return [word];
  };

  // one group of words per link: the label words + its small index number
  const groups = links.map((a) => {
    const text = $('.menu-link-text', a);
    const words = SplitText
      ? SplitText.create(text, { type: 'words', mask: 'words', wordsClass: 'menu-word' }).words
      : maskWords(text);
    return [...words, $('.num', a)];
  });
  const allWords = groups.flat();
  if (gsap) gsap.set(allWords, { y: 0, yPercent: 100 });   // y:0 clears the CSS translateY so only yPercent drives it

  /* ---------- 3b. Logo: letters roll in, rest ~7s, roll out and back in, repeat ---------- */
  // the SVG's paths are not stored in reading order, so sort by position: strictly left to right
  const letters = $$('.nav-logo-svg path').sort((a, b) => a.getBBox().x - b.getBBox().x);
  const LOGO_WAIT = 7;                                              // seconds of rest between animations
  let logoTl = null, logoWait = null;
  const playLogo = (first = false) => {
    if (!gsap || reduce) return;
    if (logoTl) logoTl.kill();
    if (logoWait) logoWait.kill();
    logoTl = gsap.timeline({ onComplete: () => { logoWait = gsap.delayedCall(LOGO_WAIT, () => playLogo()); } });
    if (first) {
      logoTl.fromTo(letters, { y: 50, rotate: 8, transformOrigin: '50% 100%' },
        { y: 0, rotate: 0, duration: 0.8, ease: 'power4.out', stagger: 0.045 });
    } else {
      logoTl
        .to(letters, { y: -50, rotate: -8, transformOrigin: '50% 100%', duration: 0.35, ease: 'power3.in', stagger: 0.03 })
        .set(letters, { y: 50, rotate: 8 })
        .to(letters, { y: 0, rotate: 0, duration: 0.8, ease: 'power4.out', stagger: 0.045 });
    }
  };
  if (gsap && letters.length) gsap.set(letters, { y: 50 });         // hidden until the intro plays
  const canHover = matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (canHover) logo.addEventListener('pointerenter', () => { if (!logoTl || !logoTl.isActive()) playLogo(); });

  /* nav intro: quick wipe-in; the logo letters roll in. Called by the hero timeline in main.js */
  window.navFx = {
    intro() {
      if (!gsap) return;
      const icon = $('.toggle-icon', toggle);
      gsap.set(letters, { y: 50 });
      playLogo(true);
      gsap.fromTo(toggle, { opacity: 0, x: 24 }, { opacity: 1, x: 0, duration: 0.5, ease: 'power4.out' });
      gsap.fromTo(icon, { clipPath: 'inset(0 0 0 100%)' }, { clipPath: 'inset(0 0 0 0%)', duration: 0.45, delay: 0.12, ease: 'power4.out', clearProps: 'clipPath' });
    },
  };
  if (gsap && reduce) gsap.set(letters, { y: 0 });

  /* ---------- 4. Helpers ---------- */
  const isDesktop = () => matchMedia('(min-width: 1000px)').matches;
  const svh = () => {                                       // 1svh in px (falls back to innerHeight)
    const probe = document.createElement('div');
    probe.style.cssText = 'position:fixed;top:0;height:100svh;width:0;visibility:hidden;pointer-events:none';
    document.body.appendChild(probe);
    const h = probe.offsetHeight || innerHeight;
    probe.remove();
    return h / 100;
  };
  // scale must match the --edge variable in the CSS: (1 - scale) / 2 = 2.5vw desktop, 5vw below 1000px
  const openState = () => ({
    y: svh() * (isDesktop() ? 50 : 65),
    scale: isDesktop() ? 0.95 : 0.9,
  });
  const offsetTopIn = (el) => {                             // layout offset, not affected by the page's scale
    let y = 0;
    for (let n = el; n && n !== page; n = n.offsetParent) y += n.offsetTop;
    return y;
  };
  const scrollToTarget = (hash) => {
    const y = hash === '#top' ? 0 : (() => { const el = $(hash); return el ? offsetTopIn(el) : null; })();
    if (y === null) return;
    if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
    else page.scrollTop = y;
  };

  let isMenuOpen = false;
  let tl = null;


  let lockCurrent = false;                                  // freeze the bold link while the menu is open / closing

  /* ---------- 4b. Bold the link of the section you are in ---------- */
  const trackable = links
    .map((a) => ({ a, hash: a.getAttribute('href') }))
    .filter(({ hash }) => hash === '#top' || $(hash));              // Process / Contact have no section yet
  const updateCurrent = () => {
    if (lockCurrent) return;
    const probe = page.scrollTop + innerHeight * 0.4;
    let active = trackable[0];
    trackable.forEach((t) => {
      const y = t.hash === '#top' ? 0 : offsetTopIn($(t.hash));
      if (y <= probe) active = t;
    });
    links.forEach((a) => {
      const on = a === active.a;
      a.classList.toggle('is-current', on);
      on ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current');
    });
  };
  page.addEventListener('scroll', updateCurrent, { passive: true });
  addEventListener('resize', updateCurrent);
  addEventListener('load', updateCurrent);
  updateCurrent();

  /* ---------- 5. Hide the nav on scroll down, bring it back on scroll up ---------- */
  let isNavHidden = false;
  const slideNav = (hide) => {
    isNavHidden = hide;
    gsap.to(logo, { x: hide ? -300 : 0, duration: 1.5, ease: 'power4.out', overwrite: true });
    gsap.to(toggle, { x: hide ? 300 : 0, duration: 1, ease: 'power4.out', overwrite: true });
  };
  if (gsap && lenis) {
    lenis.on('scroll', ({ direction }) => {                 // 1 = down, -1 = up
      if (isMenuOpen) return;
      if (direction === 1 && !isNavHidden) slideNav(true);          // only runs when direction flips
      else if (direction === -1 && isNavHidden) slideNav(false);
    });
  }

  /* ---------- 6. Open / close ---------- */

  const toggleMenu = () => {
    isMenuOpen = !isMenuOpen;
    toggle.classList.toggle('open', isMenuOpen);
    toggle.setAttribute('aria-expanded', String(isMenuOpen));
    toggle.setAttribute('aria-label', isMenuOpen ? 'Close menu' : 'Open menu');
    if (lenis) (isMenuOpen ? lenis.stop() : lenis.start());
    lockCurrent = true;
    if (isMenuOpen) menu.classList.add('is-visible');

    /* no GSAP (blocked / offline): plain CSS transition fallback */
    if (!gsap) {
      const o = openState();
      page.style.transition = 'transform .9s cubic-bezier(.76,0,.24,1)';
      page.style.transform = isMenuOpen ? `translateY(${o.y}px) scale(${o.scale})` : '';
      allWords.forEach((w) => { w.style.transform = isMenuOpen ? 'none' : ''; });
      if (!isMenuOpen) setTimeout(() => { if (!isMenuOpen) { menu.classList.remove('is-visible'); lockCurrent = false; updateCurrent(); } }, 900);
      return;
    }

    if (tl) tl.kill();                                      // always rebuild from scratch
    tl = gsap.timeline();

    if (isMenuOpen) {
      if (isNavHidden) slideNav(false);
      tl.to(page, { ...openState(), duration: 1, ease: 'power4.inOut' }, 0);
      groups.forEach((words, i) => {                        // cascade: 0.65s + 0.1s per link
        tl.to(words, { yPercent: 0, duration: 1, ease: 'power4.out' }, 0.65 + 0.1 * i);
      });
    } else {
      tl.to(page, { y: 0, scale: 1, duration: 1, ease: 'power4.inOut' }, 0)
        .to(allWords, { yPercent: 100, duration: 0.75, ease: 'power4.in' }, 0.1)   // all together, no stagger
        .call(() => { menu.classList.remove('is-visible'); lockCurrent = false; updateCurrent(); });
    }
    if (reduce) tl.timeScale(20);
  };

  toggle.addEventListener('click', toggleMenu);

  /* menu links: close, then jump to the section behind the closing card */
  links.forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    const hash = a.getAttribute('href');
    if (isMenuOpen) toggleMenu();
    scrollToTarget(hash);
  }));

  /* logo: back to top */
  logo.addEventListener('click', (e) => {
    e.preventDefault();
    if (isMenuOpen) toggleMenu();
    if (lenis) lenis.scrollTo(0); else page.scrollTop = 0;
  });

  /* clicking the shrunken page, or pressing Esc, closes the menu */
  page.addEventListener('click', (e) => {
    if (!isMenuOpen) return;
    e.preventDefault();
    e.stopPropagation();
    toggleMenu();
  }, true);
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && isMenuOpen) toggleMenu(); });

  /* keep the open card aligned when the viewport changes */
  addEventListener('resize', () => {
    if (!isMenuOpen || !gsap) return;
    gsap.set(page, openState());
  });
})();
