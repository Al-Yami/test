(() => {
  const root = document.documentElement;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  /* ---------- About statement: masked words, staggered per line, play when scrolled into view ---------- */
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    /* About statement: split into masked words, stagger them per line, play when scrolled into view */
    const stmt = $('.about-text');
    if (stmt) {
      const text = stmt.textContent.trim();
      stmt.setAttribute('aria-label', text);
      stmt.textContent = '';
      const words = text.split(/\s+/).map((t, i, a) => {
        const w = document.createElement('span'), s = document.createElement('span');
        w.className = 'w'; w.setAttribute('aria-hidden', 'true'); s.textContent = t; w.appendChild(s);
        stmt.appendChild(w);
        if (i < a.length - 1) stmt.appendChild(document.createTextNode(' '));
        return w;
      });
      const stagger = () => {                       // one delay step per wrapped line, a hair more per word
        let line = -1, top = null, n = 0;
        words.forEach((w) => {
          if (top === null || Math.abs(w.offsetTop - top) > 4) { line++; top = w.offsetTop; n = 0; }
          w.firstChild.style.setProperty('--d', (line * 0.13 + n++ * 0.025).toFixed(3) + 's');
        });
      };
      stagger();
      stmt.classList.add('split');            // words snap to the hidden state first...
      void stmt.offsetWidth;
      requestAnimationFrame(() => stmt.classList.add('ready'));   // ...then transitions are switched on
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(stagger);
      new ResizeObserver(stagger).observe(stmt);
      const io3 = new IntersectionObserver((es) => {
        if (es.some((e) => e.isIntersecting)) { stmt.classList.add('in'); io3.disconnect(); }
      }, { threshold: 0.5 });
      io3.observe(stmt);
    }
  }

  /* ---------- Hero animation ---------- */
  /* ---------- "Ordinary" ASCII hover effect ---------- */
  const ASCII = ["                                                      ########@   ######                                                                              ", "        ############                                ##:::::::@   ##:::::#                                                                             ", "     ###::::::::::::##-                               ##:::::@    @::::#-                                                                             ", "   ##::::::::::::::::::#                              @:::::#      ####                                     -####-                                    ", "  #:::::::::::::::::::::#  ########  -#####-    #######:::::@  ########   ########   -######         ########::::@  ########  ######  ######-   ######", " @::::::::::::::::::::::@#@#::::::###::::::@ ##::::::::::::#-#@#:::::::##@#::::::# -#::::::##     -##:::::::::::@ #@#::::::@ #:::::###:::::::#   #:::@", "@:::::::::::::::::::::::#   @:::::@@:##:::###::::::::::::::@    @:::::@    @:::::@####:::::@     #::::::::::::::@    @:::::@#:#::::#@:##:::::##  #:::@", "@:::::::::::::::::::::::@   #:::::@## @##-#:::::::::::::::##   ##:::::@   -#:::::@###::::::#   ##::::::::::::::@    #:::::######## ##@  @:::::@  ##::#", "@:::::::::::::::::::::::@  @::::::##     @::::::::::::::::@    @:::::@    @::::::## @:::::@   ##:::::::::::::::@    @::::::#       @##  @:::::@  #::@ ", "@::::::::::::::::::::::#   #:::::##     ##:::::::::::::::###@###:::::@###-#:::::## #::::::@##@#:::::::::::::::@##@ #::::::#             @:::::@  @:@  ", " @:::::::::::::::::::##   @::::::#      @:::::::::##:::::#### @::::::#:# @:::::##  @::::::###@:::::::::@#:::::#:#  @:::::##             ##::::@ @:#   ", "  ##:::::::::::::::##     #:::::@       @::::::::#@:::::::#  ##::::::## ##:::::@  #:::::::#- @:::::::##@:::::::#  #::::::@              #:::::@@##    ", "    ###:::::::#####      @::####         #::::##- ##::###-   -#:::###   @::####   ##:::###    #::::##  #:::###    @::###@               @:::::##      ", "        #####-            #                ##-      --         --        #          --          ##       -         -             ###    @::::##       ", "                                                                                                                               ##:::## #:::##         ", "                                                                                                                               @:::::###:##           ", "                                                                                                                                ########              "];
  const wrap = $('.ordinary-wrap');
  const ordImg = $('.ordinary');
  const cv = document.createElement('canvas');
  cv.className = 'ascii';
  cv.setAttribute('aria-hidden', 'true');
  wrap.appendChild(cv);
  const ctx = cv.getContext('2d');
  const R = ASCII.length, C = ASCII[0].length;
  const SCRAMBLE = '@#%&*+=-:.01/\\|';
  const FONT = 'ui-monospace, "SF Mono", Menlo, Consolas, "DejaVu Sans Mono", monospace';
  const seeds = Float32Array.from({ length: R * C }, () => Math.random());
  let W = 0, H = 0, target = 0, prog = 0, last = 0, time = 0, raf = 0, touchTimer = 0;
  const mouse = { x: -1, y: -1 };
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  const fit = () => {
    const r = wrap.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  new ResizeObserver(fit).observe(wrap);

  function draw() {
    ctx.clearRect(0, 0, W, H);
    if (prog <= 0) return;
    const cw = W / C, ch = H / R, rad = W * 0.07;
    ctx.font = `${ch * 0.98}px ${FONT}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let r = 0; r < R; r++) {
      const row = ASCII[r];
      for (let c = 0; c < C; c++) {
        const t = row[c];
        if (t === ' ') continue;
        const i = r * C + c, k = prog * 1.5 - ((c / C) * 0.9 + seeds[i] * 0.25);
        if (k < 0) continue;                       // not reached yet
        const x = (c + 0.5) * cw, y = (r + 0.5) * ch;
        let g = t, hot = false;
        if (k < 0.25) { g = SCRAMBLE[(seeds[i] * 97 + time * 30 | 0) % SCRAMBLE.length]; hot = true; }
        else if (target) {
          const d = Math.hypot(x - mouse.x, y - mouse.y);
          if (d < rad) { g = SCRAMBLE[(seeds[i] * 53 + time * 24 | 0) % SCRAMBLE.length]; hot = true; }
          else if (Math.sin(time * 2.2 + seeds[i] * 80) > 0.992) { g = SCRAMBLE[(time * 12 + seeds[i] * 9 | 0) % SCRAMBLE.length]; hot = true; }
        }
        ctx.fillStyle = hot ? '#e0442a' : 'rgba(233,208,202,0.95)';
        ctx.fillText(g, x, y);
      }
    }
  }

  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; time += dt;
    prog = clamp(prog + (target ? 1 : -1) * dt * (target ? 1.7 : 2.4));
    ordImg.style.opacity = 1 - clamp((prog - 0.1) / 0.5);   // original fades as the ASCII takes over
    draw();
    if (target || prog > 0) raf = requestAnimationFrame(tick); else { raf = 0; ordImg.style.opacity = ''; }
  }
  const setHover = (on) => {
    target = on ? 1 : 0;
    if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); }
  };
  wrap.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'touch') setHover(true); });
  wrap.addEventListener('pointerleave', (e) => { if (e.pointerType !== 'touch') { setHover(false); mouse.x = mouse.y = -1; } });
  wrap.addEventListener('pointermove', (e) => {
    const r = wrap.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
  }, { passive: true });
  wrap.addEventListener('pointerdown', (e) => {   // touch: tap to flip to ASCII for a moment
    if (e.pointerType !== 'touch') return;
    setHover(true); clearTimeout(touchTimer); touchTimer = setTimeout(() => setHover(false), 2600);
  });

  wrap.addEventListener('ascii-flash', () => {    // a short automatic burst (played once by the intro)
    setHover(true); clearTimeout(touchTimer); touchTimer = setTimeout(() => setHover(false), 1100);
  });

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!window.gsap || reduce) { root.classList.remove('js'); return; }

  // safety net: never leave content hidden if something goes wrong
  setTimeout(() => root.classList.remove('js'), 7000);

  const tiles = $$('.tile');
  const imgs = $$('.tile img');
  const col = (t) => parseFloat(getComputedStyle(t).getPropertyValue('--c')) || 0;
  const byCol = tiles.slice().sort((x, y) => col(x) - col(y));          // wall builds left -> right
  const byColImgs = byCol.map((t) => t.querySelector('img'));

  /* split a line of text into masked words that can rise */
  const maskWords = (el) => {
    const text = el.textContent.trim(); el.textContent = '';
    return text.split(/\s+/).map((t, i, a) => {
      const w = document.createElement('span'), s = document.createElement('span');
      w.className = 'w'; w.setAttribute('aria-hidden', 'true'); s.textContent = t; w.appendChild(s); el.appendChild(w);
      if (i < a.length - 1) el.appendChild(document.createTextNode(' '));
      return s;
    });
  };
  const sub = $('.sub');
  if (sub) sub.setAttribute('aria-label', sub.textContent.trim());
  const subWords = sub ? maskWords(sub) : [];

  const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
  /* nav: quick intro, the logo letters roll in (nav.js then repeats it every ~7s) */
  tl.set('.nav > *', { opacity: 1 }, 0)
    .call(() => window.navFx && window.navFx.intro(), null, 0)
    /* headline: words swing up out of their masks */
    .fromTo('.word > span', { yPercent: 125, rotate: 6, transformOrigin: '0% 100%', opacity: 1 },
      { yPercent: 0, rotate: 0, opacity: 1, duration: 1.2, stagger: 0.12 }, 0.2)
    .fromTo('.ordinary', { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 1.5, ease: 'power3.inOut' }, 0.45)
    .call(() => $('.ordinary-wrap').dispatchEvent(new Event('ascii-flash')), null, 1.55)   // ASCII burst once it lands
    .set('.sub', { opacity: 0.85 }, 0.95)
    .fromTo(subWords, { yPercent: 118 }, { yPercent: 0, duration: 1, stagger: 0.035 }, 0.95)
    /* wall: grid draws down, tiles wipe up column by column while their photos settle */
    .fromTo('.grid-bg', { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 1.4, ease: 'power2.inOut' }, 0.5)
    .fromTo(byCol, { clipPath: 'inset(100% 0 0 0)' },
      { clipPath: 'inset(0% 0 0 0)', duration: 1.2, ease: 'power4.inOut', stagger: 0.11 }, 1)
    .fromTo(byColImgs, { scale: 1.55 },
      { scale: 1.12, duration: 2, stagger: 0.11, ease: 'power3.out' }, 1);

  /* ---------- Pointer parallax (mouse devices only) ---------- */
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const movers = imgs.map((img, i) => ({
      x: gsap.quickTo(img, 'x', { duration: 0.9, ease: 'power3.out' }),
      y: gsap.quickTo(img, 'y', { duration: 0.9, ease: 'power3.out' }),
      depth: 6 + (i % 4) * 3, // px of travel, varied per tile
    }));
    tl.eventCallback('onComplete', () => {
      addEventListener('pointermove', (e) => {
        const nx = e.clientX / innerWidth - 0.5;
        const ny = e.clientY / innerHeight - 0.5;
        movers.forEach((m) => { m.x(-nx * m.depth * 2); m.y(-ny * m.depth * 2); });
      }, { passive: true });
    });
  }
})();


/* ---------- My Work: "Blueprint" logo hover ----------
   A construction grid fades in, each outline is traced in selection-blue,
   then the real fills come back. Plays while the card is hovered / focused. */
(() => {
  if (!window.gsap || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const NS = 'http://www.w3.org/2000/svg';
  const UI = '#4da3ff';
  const lengths = new WeakMap();
  const lenOf = (el) => {
    if (!lengths.has(el)) lengths.set(el, el.getTotalLength());
    return lengths.get(el);
  };
  const mk = (tag, attrs, parent) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    parent.appendChild(e);
    return e;
  };

  function blueprint(svg) {
    const vb = svg.viewBox.baseVal;
    const parts = [...svg.querySelectorAll('path,rect,polygon')];
    const k = vb.width / (svg.getBoundingClientRect().width || vb.width); // viewBox units per screen px
    const step = vb.width / 10;                                           // ~10 grid columns
    const x0 = vb.x - step, x1 = vb.x + vb.width + step;
    const y0 = vb.y - step, y1 = vb.y + vb.height + step;

    const ov = mk('g', { 'pointer-events': 'none' }, svg);
    const vl = [], hl = [];
    for (let x = x0; x <= x1 + 0.01; x += step)
      vl.push(mk('line', { x1: x, y1: y0, x2: x, y2: y1, stroke: UI, 'stroke-width': k, opacity: 0 }, ov));
    for (let y = vb.y - step; y <= y1 + 0.01; y += step)
      hl.push(mk('line', { x1: x0, y1: y, x2: x1, y2: y, stroke: UI, 'stroke-width': k, opacity: 0 }, ov));

    parts.forEach((el) => {
      const L = lenOf(el);
      gsap.set(el, { fillOpacity: 0, stroke: UI, strokeWidth: 1.2 * k, strokeDasharray: L, strokeDashoffset: L });
    });

    const tl = gsap.timeline();
    tl.fromTo(vl, { opacity: 0 }, { opacity: 0.22, duration: 0.4, stagger: { amount: 0.7, from: 'center' } }, 0)
      .fromTo(hl, { opacity: 0 }, { opacity: 0.22, duration: 0.4, stagger: { amount: 0.7, from: 'center' } }, 0)
      .to(parts, { strokeDashoffset: 0, duration: 1.4, ease: 'power2.inOut', stagger: 0.05 }, 0.5)
      .to(parts, { fillOpacity: 1, duration: 0.7 }, '>-.1')
      .to(parts, { strokeWidth: 0, duration: 0.4 }, '<')
      .to([...vl, ...hl], { opacity: 0.08, duration: 0.6 }, '<');

    return { parts, ov, tl };
  }

  const isTouch = matchMedia('(hover: none)').matches;

  document.querySelectorAll('.work .card').forEach((card) => {
    const svg = card.querySelector('.card-logo .logo-svg');
    if (!svg) return;
    let run = null, active = false;

    const reset = (r) => {
      r.tl.kill();
      gsap.to(r.ov, { opacity: 0, duration: 0.35, onComplete: () => r.ov.remove() });
      gsap.to(r.parts, {
        fillOpacity: 1, strokeWidth: 0, strokeDashoffset: 0, duration: 0.5, ease: 'power3.out', overwrite: true,
        onComplete: () => r.parts.forEach((el) => { gsap.set(el, { clearProps: 'all' }); el.removeAttribute('style'); }),
      });
    };

    const play = () => {
      if (active) return;
      active = true;
      run = blueprint(svg);
      if (isTouch) run.tl.eventCallback('onComplete', stop);   // a tap plays it once through
    };
    const stop = () => {
      if (!active) return;
      active = false;
      const r = run; run = null;
      reset(r);
    };

    card.addEventListener('pointerenter', play);
    card.addEventListener('focus', () => { if (card.matches(':focus-visible')) play(); });
    card.addEventListener('blur', stop);
    if (!isTouch) card.addEventListener('pointerleave', stop);
  });
})();


/* ---------- My Work: "Work" word -> ASCII on hover, shockwave on click ---------- */
const WORK_ASCII = ["                                                       ##@@@@@@      ", "@@@@@@@@@  @@@@@@@@@  #@@@@@                           @@::::@       ", "  @::::@    @::::@      @@                              @::::@       ", "  @::::@    @::::@     @@    #@@@@@@#     #@@@@   #@@@  @:::@   @@@@#", "  @::::@    @::::@#   @@  #@@@::::::@@# #@@::::@ @@:::@#@:::@ @@::::@", "  #@:::@#  @@:::::@  @@  @@:::::::::::@#  @:::::@@@@@@ @:::@#@:::::@@", "   @::::@ @@ @::::@ @#  @:::::::::::::@#  @::::@#     #@::::@::::@@  ", "   @:::::@#  @:::::@#   @:::::::::::::@  @::::@       @::::@::::@    ", "   @::::@#   #@:::@#    @::::::::::::@#  @:::@#      #@:::@#@::::@   ", "   #@::@      @::@#      @@:::::::@@@   @:::@@       @::@@#  @::::@  ", "    @@@       @@@#        #@@@@@@@#     @@@@#        @@@##    @@@@@@ "];
const ME_ASCII = ["     @@@@@@@@@@        #@@@@@@@@@              ", "       @@:::::@       @@:::::@                 ", "      #@@@::::@#     @@@@:::@@         ##@@@@# ", "      @@ @@::::@   #@@ @::::@@      #@@@@@@@@@@", "     #@# #@::::@# #@# #@::::@#    #@@@::::::@@@", "     @@   @@::::@#@#  #@::::@    @@:::::@@@@@# ", "    #@#   #@::::@@    @@:::@@   @@:::@@@@@#    ", "    @@     @@::@@     @::::@#  #@:::@@      ## ", "   #@#     #@:@#     #@::::@#  #@::::@#  ##@@  ", "  #@@##     @@#     #@@@@@@@#   @@@:::@@@@@#   ", "@@@@@@@@    ##     @@@@@@@@@@@   #@@@@@@@#     "];

const initAsciiWord = (wrap, img, ASCII) => {
  if (!wrap || !img || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const R = ASCII.length, C = ASCII[0].length;
  const SCRAMBLE = '@#%&*+=-:.01/\\|';
  const FONT = 'ui-monospace, "SF Mono", Menlo, Consolas, "DejaVu Sans Mono", monospace';
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const seeds = Float32Array.from({ length: R * C }, () => Math.random());

  /* the canvas is bigger than the word so click debris can fly out past its edges */
  const cv = document.createElement('canvas');
  cv.className = 'work-ascii';
  cv.setAttribute('aria-hidden', 'true');
  wrap.appendChild(cv);
  const ctx = cv.getContext('2d');

  let W = 0, H = 0, PAD = 0, target = 0, prog = 0, last = 0, time = 0, raf = 0, touchTimer = 0;
  const mouse = { x: -1, y: -1 };
  const shocks = [];      // { x, y, t }  click shockwaves (word coordinates)
  const bits = [];        // debris glyphs thrown out by a click

  const fit = () => {
    const cs = getComputedStyle(wrap), dpr = Math.min(window.devicePixelRatio || 1, 2);   // layout size: unaffected by the rotated title
    W = parseFloat(cs.width); H = parseFloat(cs.height); PAD = Math.round(H * 1.4);
    cv.style.left = cv.style.top = -PAD + 'px';
    cv.style.width = (W + PAD * 2) + 'px';
    cv.style.height = (H + PAD * 2) + 'px';
    cv.width = Math.round((W + PAD * 2) * dpr); cv.height = Math.round((H + PAD * 2) * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  new ResizeObserver(fit).observe(wrap);

  const SHOCK_LIFE = 1.5;

  function draw() {
    ctx.clearRect(0, 0, cv.width, cv.height);
    if (prog <= 0 && !bits.length) return;
    ctx.save();
    ctx.translate(PAD, PAD);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

    if (prog > 0) {
      const cw = W / C, ch = H / R, rad = W * 0.16, band = W * 0.11, speed = W * 1.25;
      ctx.font = `${ch * 1.05}px ${FONT}`;
      for (let r = 0; r < R; r++) {
        const row = ASCII[r];
        for (let c = 0; c < C; c++) {
          const t = row[c];
          if (t === ' ') continue;
          const i = r * C + c, k = prog * 1.5 - ((c / C) * 0.9 + seeds[i] * 0.25);
          if (k < 0) continue;
          let x = (c + 0.5) * cw, y = (r + 0.5) * ch;
          let g = t, hot = false;
          if (k < 0.25) { g = SCRAMBLE[(seeds[i] * 97 + time * 30 | 0) % SCRAMBLE.length]; hot = true; }
          else if (target) {
            const d = Math.hypot(x - mouse.x, y - mouse.y);
            if (d < rad) { g = SCRAMBLE[(seeds[i] * 53 + time * 24 | 0) % SCRAMBLE.length]; hot = true; }
            else if (Math.sin(time * 2.2 + seeds[i] * 80) > 0.992) { g = SCRAMBLE[(time * 12 + seeds[i] * 9 | 0) % SCRAMBLE.length]; hot = true; }
          }
          /* click shockwave: a ring races outward, shoving glyphs and scrambling them red */
          for (const s of shocks) {
            const dx = x - s.x, dy = y - s.y, d = Math.hypot(dx, dy) || 1;
            const off = Math.abs(d - s.t * speed);
            if (off < band) {
              const f = (1 - off / band) * (1 - s.t / SHOCK_LIFE);
              const push = f * ch * 2.6;
              x += (dx / d) * push; y += (dy / d) * push * 1.4 - f * ch * 1.2;
              g = SCRAMBLE[(seeds[i] * 71 + time * 40 | 0) % SCRAMBLE.length]; hot = true;
            }
          }
          ctx.fillStyle = hot ? '#e0442a' : 'rgba(233,208,202,0.95)';
          ctx.fillText(g, x, y);
        }
      }
    }

    /* debris */
    for (const b of bits) {
      const a = clamp(1 - b.age / b.life);
      ctx.globalAlpha = a;
      ctx.fillStyle = b.hot ? '#e0442a' : '#e9d0ca';
      ctx.font = `${b.size}px ${FONT}`;
      ctx.fillText(b.g, b.x, b.y);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; time += dt;
    prog = clamp(prog + (target ? 1 : -1) * dt * (target ? 1.7 : 2.4));

    for (let i = shocks.length - 1; i >= 0; i--) { shocks[i].t += dt; if (shocks[i].t > SHOCK_LIFE) shocks.splice(i, 1); }
    for (let i = bits.length - 1; i >= 0; i--) {
      const b = bits[i];
      b.age += dt; b.vy += 520 * dt; b.vx *= 1 - 1.4 * dt;
      b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.age > b.life) bits.splice(i, 1);
      else if (Math.random() < 0.08) b.g = SCRAMBLE[Math.random() * SCRAMBLE.length | 0];
    }

    img.style.opacity = 1 - clamp((prog - 0.1) / 0.5);   // the real word fades as ASCII takes over
    draw();
    if (target || prog > 0 || shocks.length || bits.length) raf = requestAnimationFrame(tick);
    else { raf = 0; img.style.opacity = ''; ctx.clearRect(0, 0, cv.width, cv.height); }
  }
  const wake = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); } };
  const setHover = (on) => { target = on ? 1 : 0; wake(); };

  const local = (e) => {   // offsetX/Y are in the element's own (unrotated) space; fall back to the rect
    if ((e.target === img || e.target === wrap) && typeof e.offsetX === 'number') return { x: e.offsetX, y: e.offsetY };
    const r = wrap.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  function boom(x, y) {
    shocks.push({ x, y, t: 0 });
    const n = 46;
    for (let i = 0; i < n; i++) {
      const ang = Math.random() * Math.PI * 2, sp = 90 + Math.random() * 420;
      bits.push({
        x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 120,
        g: SCRAMBLE[Math.random() * SCRAMBLE.length | 0],
        size: H / R * (0.9 + Math.random() * 1.6),
        age: 0, life: 0.7 + Math.random() * 0.8, hot: Math.random() < 0.6,
      });
    }
    wake();
  }

  wrap.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'touch') setHover(true); });
  wrap.addEventListener('pointerleave', (e) => { if (e.pointerType !== 'touch') { setHover(false); mouse.x = mouse.y = -1; } });
  wrap.addEventListener('pointermove', (e) => { const p = local(e); mouse.x = p.x; mouse.y = p.y; }, { passive: true });
  wrap.addEventListener('ascii-flash', () => {      // played once when the word scrolls in
    setHover(true); clearTimeout(touchTimer); touchTimer = setTimeout(() => setHover(false), 1000);
  });
  wrap.addEventListener('pointerdown', (e) => {
    const p = local(e);
    if (e.pointerType === 'touch') {                      // touch: flip to ASCII for a moment
      setHover(true); clearTimeout(touchTimer); touchTimer = setTimeout(() => setHover(false), 2600);
    }
    boom(p.x, p.y);
  });
};

initAsciiWord(document.querySelector('.work-word-wrap:not(.me-word-wrap)'), document.querySelector('.work-word:not(.me-word)'), WORK_ASCII);
initAsciiWord(document.querySelector('.me-word-wrap'), document.querySelector('.me-word'), ME_ASCII);



/* ---------- About: portrait -> ASCII lens (follows the cursor; tap on touch) ---------- */
(() => {
  const fig = document.querySelector('.portrait');
  if (!fig || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const ASCII = ["                                                                                ", "                                                                                ", "                                                    ....                        ", "                                           .:-+*#%@@@%%%%%#++=-::::.            ", "                                   .:-=+*#**++=-----:--:------===+**#*=         ", "                              .:---:.                              :=+*#.       ", "                                                                    .=*#%       ", "                   :                                                 :+%@-      ", "                 -#:                                                 -#@@-      ", "                +*=                                                 :#@@#       ", "              .+#+++***+++==--:..                .  .......       .+@@@*        ", "           .-=+++++++***#%%@@@@@@@@@%%%%##************########*##%@@@+.         ", "          -------=======+++++*#%@@@@@@@@@%%%%%%####%%%%%%@@@@@%%%+-.            ", "         --------------==--=====+*#%%%%%%%%%%%%%%%%%@@@@@@@%#**+-               ", "        :------------------------==+*#%%%%%%%%@@@@@@@@@%##****++-               ", "        -----------:---------------==+*##%%%@@@@@@@@@%####*****+-               ", "       .-----------:----------------=+*#####%%%@@%%########***++-               ", "       -----------::----------------=+******++++++++***#####**++-               ", "       ----------:..--------::::...::--=============--::::------:               ", "       ---------::           ...   ...::::--=======--::........                 ", "      .--------::.        ....           .::-===-:..      ...::                 ", "      :-------:::        .....         ....:-=+=-:...     .::::                 ", "      :-------:::        ....    -    : ...:-+*+:...:   .: .:::                 ", "      :-------::.       .:::...::-=..::...:-+***-..:::..:..:::-                 ", "      :---::-:::..      .::::-===-::::::-=++**#*+::::::::::----                 ", "      ---::--:::..      .:::-=+****+++++******#*+-------=======                 ", "      --::--::::...     .:::-=****************##*+--======+++=-                 ", "      .-:---:::....     ..::-+**********++**###**+=-=+++++++++.                 ", "        ---:::::::...   ..::-=+*******+++********++==++****+++                  ", "       :---::::::::.......::-=+++***++++++++=+**+====++****++=                  ", "      .----::::::::....  .::-=++++++++***+-:--==-:-==+++*****.                  ", "      ------::::::::..   .:::-=++++++++++++=:--:..:-==+++***+                   ", "     :------:::::::::..  ..::-==++++=-==+++++==-----:-=+++**.                   ", "     -------::::::::::.   .:::-==++=:.::----------:::-=+++*=                    ", "    .------::::::::::::.....:::-===-:--=---====--:.::-=++++                     ", "    ------------:::::::.:....:::-=--==+===+==---------====                      ", "    ------------::::::::-.....:::--=====-----------------.                      ", "    -----------::::::::-=:.....:::-=======--::::-----:--::                      ", "    ----------:::::::::-==:.....:::-==++++++=====---:::.:+                      ", "   .---------::::::::---===-:... .::-=++++++++====---.:+##:                     ", "   .-------:::::::--==-======-:... .::-=++++++++==-:=*#####-                    ", "   :----::::::----============+=-:.....:--=====+++##########%#-.                ", "  .=----------================+++=++++==-:.:=*##**#########%%%%%%%*=-..         ", "=====--------=================++=====+*#%%*#*#######***#*###%%%%%%%%%%%%%%#*+=:.", "-====----==-----==============+=====+*###%%%%#**********#*###%#%%%%@@@@@@@@@%%%%", "======---===---=============++=---==+*###%%%%%#####*****#########%%%%@@@@@@@@@@@", "---====---===--============+++---==+*###%%%%%%%#####*****##########%%%%@@@@@@@@@", "----===---===---==========+++======+##%%%%%%%%%##########*##########%%%%@@@@@@@@", "----===---====--==========++======+*#%%@@@@@@@@@##########*###########%%%@@@@@@@", "----===---====---=========+===+++++#@@@@@@@@@@@@######%%%#############%%%%@@@@@@", "----====--=====--===========++++++*#@@@@@@@@@@@@%%%@@@@@%%%############%%%%@@@@@", "----====--=====--=======++==++*++**#@@@@@@@@@@@@@%@@@@@@@@%%%%%%%%######%%%%@@@@", "----====--======-======++++++++*+*#%@@@@@@@@@@@@@%@@@@@@@%%%%@@@@@%%%%##%%%%@@@@", "----=====-======-======++++++++***#%@@@@@@@@@@@@@%%@@@@@@%%%@@@@@@@@@@%%%%%%%@@@", "----=====-==============++++++++*#%@@@@@@@@@@@@@@@%@@@@@@%%%@@@@@@@@@@@@@@@@@@@@", "----=====--=============++++++++*#%@@@@@@@@@@@@@@@%@@@@@@%%%@@@@@@@@@@@@@@@@@@@@"];
  const R = ASCII.length, C = ASCII[0].length;
  const RAMP = ' .:-=+*#%@';
  const SCRAMBLE = '@#%&*+=-:.01/\\|';
  const FONT = 'ui-monospace, "SF Mono", Menlo, Consolas, "DejaVu Sans Mono", monospace';
  const ASPECT = 2000 / 1572;                       // the photo's own proportions
  const seeds = Float32Array.from({ length: R * C }, () => Math.random());

  const cv = document.createElement('canvas');
  cv.className = 'portrait-ascii';
  cv.setAttribute('aria-hidden', 'true');
  fig.appendChild(cv);
  const ctx = cv.getContext('2d');

  let W = 0, H = 0, rad = 0, target = 0, full = 0, last = 0, time = 0, raf = 0, touchTimer = 0;
  const mouse = { x: -999, y: -999 }, lens = { x: -999, y: -999 };

  const fit = () => {
    const r = fig.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  new ResizeObserver(fit).observe(fig);

  function draw() {
    ctx.clearRect(0, 0, W, H);
    if (rad < 1) return;
    const cw = W / C, ch = (W * ASPECT) / R;
    const hole = ctx.createRadialGradient(lens.x, lens.y, rad * 0.55, lens.x, lens.y, rad);
    hole.addColorStop(0, 'rgba(6,7,10,.93)'); hole.addColorStop(1, 'rgba(6,7,10,0)');
    ctx.fillStyle = hole;
    ctx.fillRect(lens.x - rad, lens.y - rad, rad * 2, rad * 2);

    ctx.font = `${cw / 0.6}px ${FONT}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const r0 = Math.max(0, Math.floor((lens.y - rad) / ch)), r1 = Math.min(R - 1, Math.ceil((lens.y + rad) / ch));
    const c0 = Math.max(0, Math.floor((lens.x - rad) / cw)), c1 = Math.min(C - 1, Math.ceil((lens.x + rad) / cw));
    for (let r = r0; r <= r1; r++) {
      const row = ASCII[r];
      for (let c = c0; c <= c1; c++) {
        const t = row[c];
        if (t === ' ') continue;
        const x = (c + 0.5) * cw, y = (r + 0.5) * ch;
        if (y > H + ch) continue;
        const e = Math.hypot(x - lens.x, y - lens.y) / rad;
        if (e > 1) continue;
        const i = r * C + c;
        const tone = RAMP.indexOf(t) / 9;
        const rim = e > 0.8;                                        // outer ring: scrambled + red
        const hot = rim && (seeds[i] + e * 3 + time * 0.8) % 1 < 0.55;
        const g = hot ? SCRAMBLE[(seeds[i] * 97 + time * 26 | 0) % SCRAMBLE.length] : t;
        ctx.globalAlpha = (0.3 + 0.7 * tone) * (e > 0.9 ? (1 - e) * 10 : 1);
        ctx.fillStyle = hot ? '#e0442a' : '#e9d0ca';
        ctx.fillText(g, x, y);
      }
    }
    ctx.globalAlpha = 1;
  }

  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; time += dt;
    const want = target ? (full ? Math.hypot(W, H) * 1.05 : Math.min(W, H) * 0.46) : 0;
    rad += (want - rad) * Math.min(1, dt * (target ? 7 : 10));
    lens.x += (mouse.x - lens.x) * Math.min(1, dt * 16);
    lens.y += (mouse.y - lens.y) * Math.min(1, dt * 16);
    draw();
    if (target || rad > 1) raf = requestAnimationFrame(tick);
    else { raf = 0; ctx.clearRect(0, 0, W, H); }
  }
  const wake = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); } };
  const place = (e) => { const r = fig.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; };

  fig.addEventListener('pointerenter', (e) => {
    if (e.pointerType === 'touch') return;
    place(e); if (rad < 1) { lens.x = mouse.x; lens.y = mouse.y; }
    target = 1; full = 0; wake();
  });
  fig.addEventListener('pointermove', (e) => { if (e.pointerType !== 'touch') place(e); }, { passive: true });
  fig.addEventListener('pointerleave', (e) => { if (e.pointerType !== 'touch') { target = 0; wake(); } });
  fig.addEventListener('pointerdown', (e) => {          // touch: the whole portrait flips to ASCII for a moment
    if (e.pointerType !== 'touch') return;
    place(e); lens.x = mouse.x; lens.y = mouse.y;
    target = 1; full = 1; wake();
    clearTimeout(touchTimer); touchTimer = setTimeout(() => { target = 0; full = 0; wake(); }, 2600);
  });
})();


/* =====================================================================
   Scroll animations (GSAP + ScrollTrigger)
   ===================================================================== */
(() => {
  if (!window.gsap || !window.ScrollTrigger || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  gsap.registerPlugin(ScrollTrigger);
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const flash = (el) => el && el.dispatchEvent(new Event('ascii-flash'));
  const once = (trigger, start = 'top 80%') => ({ trigger, start, once: true });

  /* hero text drifts up slower than the page as you leave it */
  gsap.to('.hero h1', { yPercent: -16, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.6 } });
  gsap.to('.sub', { yPercent: -35, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.6 } });

  /* ---- My Work ---- */
  if ($('.work-main')) {
    const workWrap = $('.work-word-wrap:not(.me-word-wrap)');
    gsap.timeline({ scrollTrigger: once('.work-main', 'top 80%') })
      .fromTo('.work-title .my', { clipPath: 'inset(0 0 100% 0)', yPercent: 70 }, { clipPath: 'inset(0 0 -20% 0)', yPercent: 0, duration: 1, ease: 'power4.out' }, 0)
      .fromTo('.work-title .work-word', { clipPath: 'inset(100% 0 0 0)', yPercent: 60 }, { clipPath: 'inset(0% 0 0 0)', yPercent: 0, duration: 1.15, ease: 'power4.out' }, 0.12)
      .call(() => flash(workWrap), null, 0.95)
      .fromTo('.work .discover', { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 1.1, ease: 'power4.inOut' }, 0.3)
      .set(['.work-title .my', '.work-title .work-word', '.work .discover'], { clearProps: 'clipPath,transform' });

    /* cards rise one after another; each one's name, logo and button settle in behind it */
    const cards = $$('.work .card');
    cards.forEach((card) => {
      gsap.set(card, { clipPath: 'inset(100% 0 0 0)' });
      gsap.set($$('.card-head > *', card), { y: 16, opacity: 0 });
      gsap.set($('.card-logo', card), { scale: 0.7, opacity: 0 });
      gsap.set($('.card-btn', card), { y: 18, opacity: 0 });
    });
    ScrollTrigger.batch(cards, {
      start: 'top 92%', once: true,
      onEnter: (batch) => batch.forEach((card, i) => {
        const t = gsap.timeline({ delay: i * 0.12 });
        t.to(card, { clipPath: 'inset(0% 0 0 0)', duration: 1.15, ease: 'power4.out' }, 0)
          .to($$('.card-head > *', card), { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', stagger: 0.07 }, 0.35)
          .to($('.card-logo', card), { scale: 1, opacity: 1, duration: 1.3, ease: 'back.out(1.5)' }, 0.4)
          .to($('.card-btn', card), { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }, 0.65)
          .set([card, ...$$('.card-head > *', card), $('.card-logo', card), $('.card-btn', card)], { clearProps: 'clipPath,transform,opacity' });
      }),
    });
  }

  /* ---- ticker strips: borders open from the centre, speed follows your scrolling ---- */
  $$('.marquee').forEach((m) => {
    gsap.fromTo(m, { clipPath: 'inset(0 50% 0 50%)' }, {
      clipPath: 'inset(0 0% 0 0%)', duration: 1.4, ease: 'power4.inOut',
      scrollTrigger: once(m, 'top 94%'), onComplete: () => gsap.set(m, { clearProps: 'clipPath' }),
    });
  });
  const mq = $$('.marquee-track').map((t) => t.getAnimations().find((a) => a.animationName === 'marquee')).filter(Boolean);
  if (mq.length) {
    let boost = 0, speed = 1, sign = 1, dir = 1;
    ScrollTrigger.create({ onUpdate: (self) => { boost = Math.min(7, Math.abs(self.getVelocity()) / 380); if (self.direction) dir = self.direction; } });
    gsap.ticker.add(() => {
      boost *= 0.94;
      speed += (1 + boost - speed) * 0.1;
      sign += (dir - sign) * 0.08;                       // scrolling up flips the ticker
      mq.forEach((a) => { a.playbackRate = speed * sign || 0.001; });
    });
  }

  /* ---- About ---- */
  if ($('.about-row')) {
    const meWrap = $('.me-word-wrap');
    gsap.timeline({ scrollTrigger: once('.about-row', 'top 78%') })
      .fromTo('.about-title .thin', { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 -5% 0 0)', duration: 1.2, ease: 'power4.inOut' }, 0)
      .fromTo('.me-word', { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 1.1, ease: 'power4.inOut' }, 0.3)
      .call(() => flash(meWrap), null, 1.2)
      .fromTo('.about-visual', { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 1.3, ease: 'power3.inOut' }, 0.1)
      .fromTo('.portrait', { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: 1.4, ease: 'power4.inOut' }, 0.55)
      .fromTo('.portrait img', { scale: 1.4 }, { scale: 1, duration: 2, ease: 'power3.out' }, 0.55)
      .set(['.about-title .thin', '.me-word', '.about-visual', '.portrait', '.portrait img'], { clearProps: 'clipPath,transform' });
  }

  addEventListener('load', () => ScrollTrigger.refresh());
})();
