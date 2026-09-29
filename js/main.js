/* EDGE® — interakcije i animacije.
   Skrol animacije se računaju jednom po frejmu (requestAnimationFrame) i menjaju samo
   transform/opacity, što pregledač iscrtava na grafičkoj kartici bez ponovnog raspoređivanja stranice. */
(function () {
  'use strict';

  var doc = document.documentElement;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b === undefined ? 1 : b, Math.max(a || 0, v)); };
  var pad2 = function (n) { return (n < 10 ? '0' : '') + n; };

  var mqDesk = window.matchMedia('(min-width: 1024px)');
  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var mqHover = window.matchMedia('(hover: hover)');
  var mqFine = window.matchMedia('(hover: hover) and (pointer: fine)');
  var remPx = function () { return parseFloat(getComputedStyle(doc).fontSize) || 10; };

  /* ---------------------------------------------------------------------
     Uvod: kreće kad se fontovi učitaju (ili najkasnije posle 700 ms)
     --------------------------------------------------------------------- */
  var fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  Promise.race([fontsReady, new Promise(function (r) { setTimeout(r, 700); })]).then(function () {
    requestAnimationFrame(function () { doc.classList.add('is-in'); });
  });

  /* ---------------------------------------------------------------------
     Slike: blago pojavljivanje kad se učitaju
     --------------------------------------------------------------------- */
  $$('.pic img[loading="lazy"]').forEach(function (img) {
    var done = function () { img.classList.add('is-loaded'); };
    if (img.complete && img.naturalWidth) done();
    else { img.addEventListener('load', done, { once: true }); img.addEventListener('error', done, { once: true }); }
  });

  /* ---------------------------------------------------------------------
     Dugmad: sloj u obrnutim bojama koji se „prebriše" na hover (vidi .fx u CSS-u)
     --------------------------------------------------------------------- */
  $$('.btn, .sq-btn, .menu-btn').forEach(function (el) {
    var fill = document.createElement('span');
    fill.className = 'fx__fill';
    fill.setAttribute('aria-hidden', 'true');
    Array.prototype.forEach.call(el.childNodes, function (n) { fill.appendChild(n.cloneNode(true)); });
    el.appendChild(fill);
    el.classList.add('fx');
  });

  /* ---------------------------------------------------------------------
     Brojači koji se „okreću" kad se promeni vrednost (01 → 02)
     --------------------------------------------------------------------- */
  function roll(el, text, dir) {
    if (!el._busy && el.textContent === text) return;
    if (mqReduce.matches || !el.animate) { el.textContent = text; return; }
    el._next = text;
    if (el._busy) return;
    el._busy = true;
    var d = dir < 0 ? -1 : 1;
    el.animate([{ transform: 'none', opacity: 1 }, { transform: 'translate3d(0,' + (-0.45 * d) + 'em,0)', opacity: 0 }],
      { duration: 160, easing: 'cubic-bezier(.55,0,1,.45)' }).onfinish = function () {
      el.textContent = el._next;
      el.animate([{ transform: 'translate3d(0,' + (0.45 * d) + 'em,0)', opacity: 0 }, { transform: 'none', opacity: 1 }],
        { duration: 450, easing: 'cubic-bezier(.19,1,.22,1)' }).onfinish = function () {
        el._busy = false;
        if (el._next !== el.textContent) roll(el, el._next, dir);
      };
    };
  }
  $$('[data-hero-n], [data-hero-type], [data-p-n], [data-p-type], [data-p-place], [data-proc-n], [data-t-n]').forEach(function (el) {
    el.setAttribute('data-roll', '');
  });

  /* ---------------------------------------------------------------------
     Meni
     --------------------------------------------------------------------- */
  var menu = $('#menu');
  var menuBtn = $('.menu-btn');
  var menuLbls = $$('.menu-btn__lbl');
  var outside = [$('#main'), $('.ftr'), $('.after'), $('.skip')];

  function setMenu(open) {
    doc.classList.toggle('is-menu', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuLbls.forEach(function (l) { l.textContent = open ? 'ZATVORI' : 'MENI'; });
    menu.inert = !open;
    outside.forEach(function (el) { if (el) el.inert = open; });
    if (open) {
      var first = $('.menu__nav a', menu);
      setTimeout(function () { if (first) first.focus({ preventScroll: true }); }, 50);
    }
  }
  menuBtn.addEventListener('click', function () { setMenu(!doc.classList.contains('is-menu')); });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && doc.classList.contains('is-menu')) { setMenu(false); menuBtn.focus(); }
  });

  /* ---------------------------------------------------------------------
     Hero slajder
     --------------------------------------------------------------------- */
  var hero = $('.hero');
  var slides = $$('.slide', hero);
  var heroN = $('[data-hero-n]', hero);
  var heroType = $('[data-hero-type]', hero);
  var HERO_MS = 3500;
  var cur = 0, prev = slides.length - 1, heroTimer = 0, heroInView = true;

  function heroShow() {
    slides.forEach(function (s, i) {
      s.classList.toggle('is-on', i === cur);
      s.classList.toggle('is-prev', i === prev);
    });
    roll(heroN, pad2(cur + 1), 1);
    roll(heroType, slides[cur].dataset.type.toUpperCase(), 1);
  }
  function heroLoop() {
    clearTimeout(heroTimer);
    if (mqReduce.matches || !heroInView || document.hidden) return;
    heroTimer = setTimeout(function () {
      prev = cur;
      cur = (cur + 1) % slides.length;
      heroShow();
      heroLoop();
    }, HERO_MS);
  }

  /* ---------------------------------------------------------------------
     Projekti: bubanj sa naslovima + slike koje se otkrivaju odozdo
     --------------------------------------------------------------------- */
  var projPin = $('.pin--proj');
  var drumT = $$('.drum__t', projPin);
  var pimgs = $$('.pimg', projPin).map(function (el, i) {
    el.style.zIndex = i + 1;
    return { type: el.dataset.type.toUpperCase(), o: $('.pimg__o', el), i: $('.pimg__i', el), m: $('.pimg__m', el), t: -1 };
  });
  // grad, godina i opis za svaki projekat (redom kao slike i naslovi)
  var P_INFO = [
    { place: 'MIAMI · 2025', desc: 'Moderna stambena zgrada čistih linija i savremenog karaktera, projektovana sa fokusom na udobnost i kvalitet svakodnevnog života.' },
    { place: 'NEW YORK · 2024', desc: 'Savremena poslovna zgrada definisana staklenom fasadom, prirodnim svetlom i otvorenim kancelarijskim prostorima.' },
    { place: 'CHICAGO · 2025', desc: 'Reprezentativan javni prostor koji povezuje široko stepenište sa ulazom u savremenu arhitektonsku celinu.' },
    { place: 'LOS ANGELES · 2024', desc: 'Elegantna moderna vila okružena pažljivo oblikovanim pejzažom, sa bazenom koji postaje centralni deo spoljašnjeg prostora.' },
    { place: 'SEATTLE · 2023', desc: 'Savremeno oblikovana autobuska stanica koja pruža funkcionalno i prijatno zaklonjeno mesto za svakodnevne korisnike javnog prevoza.' },
    { place: 'AUSTIN · 2025', desc: 'Prostran savremeni kancelarijski enterijer oblikovan za timski rad, sa prijatnom atmosferom, prirodnim materijalima i čistim linijama.' }
  ];
  var pN = $$('[data-p-n]', projPin);
  var pType = $$('[data-p-type]', projPin);
  var pPlace = $('[data-p-place]', projPin);
  var pDesc = $('[data-p-desc]', projPin);
  var pBar = $('.proj__bar i', projPin);
  var pIdx = 0;

  function projRender(p) {
    var N = pimgs.length, pos = p * (N - 1), idx = Math.round(pos);
    drumT.forEach(function (t, i) {
      var off = i - pos, a = Math.abs(off);
      if (a > 2.5) { t.style.opacity = 0; return; }
      t.style.transform = 'translate3d(0,' + (off * 100).toFixed(2) + '%,0) rotateX(' + (-off * 38).toFixed(2) + 'deg)';
      t.style.opacity = Math.max(0, 1 - a * 0.45).toFixed(3);
    });
    pimgs.forEach(function (im, i) {
      var t = clamp(i - pos);
      if (Math.abs(t - im.t) < 0.0005) return;
      im.t = t;
      var y = (t * 100).toFixed(3);
      im.o.style.transform = 'translate3d(0,' + y + '%,0)';
      im.i.style.transform = 'translate3d(0,-' + y + '%,0)';
      im.m.style.transform = 'scale(' + (1 + t * 0.18).toFixed(4) + ')';
    });
    if (idx !== pIdx) {
      var dir = idx > pIdx ? 1 : -1;
      pIdx = idx;
      pN.forEach(function (el) { roll(el, pad2(idx + 1), dir); });
      pType.forEach(function (el) { roll(el, pimgs[idx].type, dir); });
      roll(pPlace, P_INFO[idx].place, dir);
      roll(pDesc, P_INFO[idx].desc, dir);
    }
    pBar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
  }

  /* ---------------------------------------------------------------------
     O nama: prsten kartica + reči koje se pale
     --------------------------------------------------------------------- */
  var aboutPin = $('.pin--about');
  var ring = $('.ring', aboutPin);
  var cards = $$('.ring__card', ring).map(function (el) { return { el: el, z: -1 }; });
  var aboutHead = $('.about__h', aboutPin);
  var wordsEl = $('[data-words]', aboutPin);
  var words = [];
  (function splitWords() {
    var parts = wordsEl.textContent.trim().split(/\s+/);
    wordsEl.textContent = '';
    parts.forEach(function (w, i) {
      var s = document.createElement('span');
      s.textContent = w + (i < parts.length - 1 ? ' ' : '');
      wordsEl.appendChild(s);
      words.push({ el: s, op: -1 });
    });
  })();
  var ringR = { rx: 0, ry: 0 };

  function aboutMeasure(frameH) {
    var cs = getComputedStyle(ring), r = remPx();
    ringR.rx = parseFloat(cs.getPropertyValue('--rx')) * r;
    ringR.ry = Math.min(parseFloat(cs.getPropertyValue('--ry')) * r, parseFloat(cs.getPropertyValue('--ryv')) * frameH);
  }
  function aboutRender(p) {
    var rot = p * 320 - 90;
    cards.forEach(function (c, i) {
      var a = (i * 45 + rot) * Math.PI / 180, s = Math.sin(a), d = (s + 1) / 2;
      c.el.style.transform = 'translate3d(' + (Math.cos(a) * ringR.rx).toFixed(1) + 'px,' + (s * ringR.ry).toFixed(1) + 'px,0) scale(' + (0.78 + d * 0.22).toFixed(3) + ')';
      var z = Math.round(d * 10);
      if (z !== c.z) { c.z = z; c.el.style.zIndex = z; }
    });
    var N = words.length;
    words.forEach(function (w, i) {
      var th = 0.12 + 0.62 * i / N;
      var op = Math.round((0.16 + clamp((p - th) / 0.08) * 0.84) * 100) / 100;
      if (op !== w.op) { w.op = op; w.el.style.opacity = op; }
    });
    var v = Math.min(1, p / 0.1);
    aboutHead.style.opacity = v.toFixed(3);
    aboutHead.style.transform = 'translate3d(0,' + ((1 - v) * 24).toFixed(1) + 'px,0)';
  }

  /* ---------------------------------------------------------------------
     Proces: na desktopu pinovano, na telefonu/tabletu prati skrol kroz listu
     --------------------------------------------------------------------- */
  var procPin = $('.pin--proc');
  var steps = $$('.step', procPin);
  var stepsList = $('.steps', procPin);
  var procLine = $('.proc__line i', procPin);
  var procN = $('[data-proc-n]', procPin);
  var procIdx = 0;

  function procSet(p, idx) {
    procLine.style.transform = 'scaleY(' + p.toFixed(4) + ')';
    if (idx === procIdx) return;
    var dir = idx > procIdx ? 1 : -1;
    procIdx = idx;
    steps.forEach(function (s, i) {
      s.classList.toggle('is-cur', i === idx);
      s.classList.toggle('is-past', i <= idx);
    });
    roll(procN, pad2(idx + 1), dir);
  }

  /* ---------------------------------------------------------------------
     Merenje i skrol petlja.
     Pinovane animacije ne skaču direktno na poziciju skrola, već je blago
     „dostižu" (lerp) — zato pokret deluje mekano i kad se skroluje točkićem.
     --------------------------------------------------------------------- */
  var pins = [
    { el: projPin, render: projRender },
    { el: aboutPin, render: aboutRender, measure: aboutMeasure },
    { el: procPin, render: function (p) { procSet(p, Math.min(3, Math.floor(p * 4))); }, deskOnly: true }
  ];
  pins.forEach(function (p) { p.frame = $('.pin__frame', p.el); p.cur = 0; p.target = 0; p.active = false; });
  var flow = { top: 0, h: 1, stepTops: [] };
  var vh = window.innerHeight, vw = window.innerWidth;
  var ticking = false, animating = false, lastT = 0;
  var SMOOTH = 0.14; // 1 = bez uglađivanja

  // nazivi projekata u „bubnju" dobijaju istu veličinu, tako da i najduži stane u kolonu
  var drum = $('.drum', projPin);
  function fitDrum() {
    drumT.forEach(function (t) { t.style.fontSize = ''; });
    var fs = parseFloat(getComputedStyle(drumT[0]).fontSize), avail = drum.clientWidth, max = 0;
    drumT.forEach(function (t) { max = Math.max(max, t.scrollWidth); });
    if (max > avail) {
      var f = (fs * avail / max * 0.98).toFixed(2) + 'px';
      drumT.forEach(function (t) { t.style.fontSize = f; });
    }
  }

  function measure() {
    fitDrum();
    var y = window.scrollY, desk = mqDesk.matches;
    vh = window.innerHeight;
    vw = window.innerWidth;
    pins.forEach(function (p) {
      var r = p.el.getBoundingClientRect();
      p.top = r.top + y;
      p.h = r.height;
      p.fh = p.frame.offsetHeight;
      p.dist = Math.max(1, p.h - p.fh);
      if (p.measure) p.measure(p.fh);
      if (p.deskOnly && !desk) return;
      p.cur = p.target = clamp((y - p.top) / p.dist);
      p.render(p.cur);
    });
    var lr = stepsList.getBoundingClientRect();
    flow.top = lr.top + y;
    flow.h = Math.max(1, lr.height);
    flow.stepTops = steps.map(function (s) { return s.getBoundingClientRect().top + y; });
    update();
  }

  function update() {
    ticking = false;
    // promena veličine (npr. adresna traka na telefonu) — ponovo izmeri
    if (window.innerWidth !== vw || window.innerHeight !== vh) { measure(); return; }
    var y = window.scrollY, desk = mqDesk.matches;
    pins.forEach(function (p) {
      p.active = !(p.deskOnly && !desk) && !(y + vh < p.top - vh * 0.25 || y > p.top + p.h + vh * 0.25);
      p.target = clamp((y - p.top) / p.dist);
    });
    if (!desk) {
      var mark = y + vh * 0.6;
      var fp = clamp((mark - flow.top) / flow.h);
      var idx = 0;
      flow.stepTops.forEach(function (t, i) { if (mark >= t) idx = i; });
      procSet(fp, idx);
    }
    if (!animating) { animating = true; lastT = performance.now(); requestAnimationFrame(tick); }
  }

  function tick(t) {
    var dt = Math.min(64, Math.max(1, t - lastT));
    lastT = t;
    var k = mqReduce.matches ? 1 : 1 - Math.pow(1 - SMOOTH, dt / 16.667);
    var busy = false;
    pins.forEach(function (p) {
      if (!p.active) return;
      var d = p.target - p.cur;
      if (Math.abs(d) < 0.0002) {
        if (p.cur !== p.target) { p.cur = p.target; p.render(p.cur); }
        return;
      }
      p.cur += d * k;
      p.render(p.cur);
      busy = true;
    });
    if (busy) requestAnimationFrame(tick); else animating = false;
  }

  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }

  var resizeT = 0;
  function onResize() {
    clearTimeout(resizeT);
    resizeT = setTimeout(measure, 100);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);
  window.addEventListener('load', measure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  if ('ResizeObserver' in window) new ResizeObserver(onResize).observe(document.body);
  measure();

  /* ---------------------------------------------------------------------
     Pristup: hover na desktopu, harmonika na dodir
     --------------------------------------------------------------------- */
  var prs = $$('.pr');
  function prOpen(i, allowClose) {
    prs.forEach(function (el, j) {
      var on = j === i && !(allowClose && el.classList.contains('is-open'));
      el.classList.toggle('is-open', on);
      $('.pr__toggle', el).setAttribute('aria-expanded', String(on));
    });
  }
  prs.forEach(function (el, i) {
    el.addEventListener('pointerenter', function (e) {
      if (mqDesk.matches && e.pointerType === 'mouse') prOpen(i, false);
    });
    $('.pr__toggle', el).addEventListener('click', function () { prOpen(i, !mqDesk.matches); });
  });

  /* ---------------------------------------------------------------------
     Iskustva klijenata
     --------------------------------------------------------------------- */
  var testi = $('.testi');
  var tq = $$('.tq', testi), tpics = $$('.tpic', testi), tnames = $$('.tname', testi);
  var tN = $('[data-t-n]', testi);
  var TN = tq.length, T_MS = 7000;
  var tc = 0, tTimer = 0, testiInView = false;

  function tGo(d) {
    var next = (tc + d + TN) % TN;
    var np = tpics[next], nq = tq[next];
    // novi element prvo postavimo na startnu poziciju (bez animacije), pa ga animiramo
    np.classList.add('no-tr');
    np.classList.remove('is-on', 'is-prev');
    np.dataset.dir = d > 0 ? 'r' : 'l';
    nq.classList.add('no-tr');
    nq.classList.remove('is-on');
    nq.style.setProperty('--ty', (20 * d / 10) + 'rem');
    void np.offsetWidth;
    np.classList.remove('no-tr');
    nq.classList.remove('no-tr');

    tpics.forEach(function (el, i) { el.classList.toggle('is-prev', i === tc); el.classList.toggle('is-on', i === next); });
    tq.forEach(function (el, i) {
      if (i !== next) el.style.setProperty('--ty', ((i === tc ? -20 : 20) * d / 10) + 'rem');
      el.classList.toggle('is-on', i === next);
      el.setAttribute('aria-hidden', String(i !== next));
    });
    tnames.forEach(function (el, i) { el.classList.toggle('is-on', i === next); el.setAttribute('aria-hidden', String(i !== next)); });
    roll(tN, pad2(next + 1), d);
    tc = next;
    tLoop();
  }
  function tLoop() {
    clearTimeout(tTimer);
    if (mqReduce.matches || !testiInView || document.hidden) return;
    tTimer = setTimeout(function () { tGo(1); }, T_MS);
  }
  $('.testi__prev', testi).addEventListener('click', function () { tGo(-1); });
  $('.testi__next', testi).addEventListener('click', function () { tGo(1); });

  /* ---------------------------------------------------------------------
     Pauziranje automatskih slajdera kad nisu na ekranu ili je tab u pozadini
     --------------------------------------------------------------------- */
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { heroInView = en[0].isIntersecting; heroLoop(); }).observe(hero);
    new IntersectionObserver(function (en) { testiInView = en[0].isIntersecting; tLoop(); }).observe(testi);
  } else {
    testiInView = true;
  }
  document.addEventListener('visibilitychange', function () { heroLoop(); tLoop(); });
  heroLoop();

  /* ---------------------------------------------------------------------
     Otkrivanje sadržaja pri skrolu: naslovi red po red, ostalo blago odozdo
     [selektor, vrsta, kašnjenje (s), razmak između više elemenata (s)]
     --------------------------------------------------------------------- */
  var REVEAL = [
    ['.projects__intro .label', 'up'], ['.projects__intro h2', 'lines'], ['.projects__intro .lead', 'up', 0.2], ['.projects__hint', 'up', 0.35],
    ['.approach > .label', 'up'], ['.approach > h2', 'lines'], ['.pr-wrap', 'up', 0.2],
    ['.proc__l .label', 'up'], ['.proc__l h2', 'lines'], ['.proc__l .lead', 'up', 0.2], ['.proc__num', 'up', 0.3],
    ['.testi__head .label', 'up'], ['.testi__head h2', 'lines'], ['.testi__head .lead', 'up', 0.2],
    ['.testi__quotes', 'up', 0.1], ['.testi__who', 'up', 0.25],
    ['.cta', 'up'], ['.ftr__row', 'up', 0.1], ['.ftr__logo', 'lines'], ['.ftr__brand .mono', 'up', 0.2],
    ['.ftr__col', 'up', 0.05, 0.08]
  ];
  function splitLines(el) {
    Array.prototype.slice.call(el.childNodes).forEach(function (n) {
      if (n.nodeType !== 3) return;
      var frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
        var w = document.createElement('span'), inner = document.createElement('span');
        w.className = 'rw';
        inner.textContent = part;
        w.appendChild(inner);
        frag.appendChild(w);
      });
      el.replaceChild(frag, n);
    });
  }
  if ('IntersectionObserver' in window && !mqReduce.matches) {
    var rio = new IntersectionObserver(function (en) {
      en.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        rio.unobserve(el);
        if (el.classList.contains('r-lines')) {
          // kašnjenje po redu u kome je reč (radi na svakoj širini ekrana)
          var ws = $$('.rw', el), tops = [];
          ws.forEach(function (w) { if (tops.indexOf(w.offsetTop) < 0) tops.push(w.offsetTop); });
          tops.sort(function (a, b) { return a - b; });
          var base = parseFloat(el.style.getPropertyValue('--rd')) || 0;
          ws.forEach(function (w) { w.firstChild.style.transitionDelay = (base + tops.indexOf(w.offsetTop) * 0.09).toFixed(2) + 's'; });
        }
        el.classList.add('r-in');
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    REVEAL.forEach(function (r) {
      $$(r[0]).forEach(function (el, i) {
        if (r[1] === 'lines') splitLines(el);
        el.classList.add(r[1] === 'lines' ? 'r-lines' : 'r-up');
        var d = (r[2] || 0) + (r[3] || 0) * i;
        if (d) el.style.setProperty('--rd', d + 's');
        rio.observe(el);
      });
    });
  }

  /* ---------------------------------------------------------------------
     Krug „Pogledajte projekat": blago se privlači ka kursoru
     --------------------------------------------------------------------- */
  var circle = $('.circle');
  var cEv = null, cRaf = 0;
  circle.addEventListener('pointermove', function (e) {
    if (!mqFine.matches || mqReduce.matches) return;
    cEv = e;
    if (cRaf) return;
    cRaf = requestAnimationFrame(function () {
      cRaf = 0;
      var r = circle.getBoundingClientRect();
      var dx = cEv.clientX - (r.left + r.width / 2), dy = cEv.clientY - (r.top + r.height / 2);
      circle.style.setProperty('--mx', (dx * 0.4).toFixed(1) + 'px');
      circle.style.setProperty('--my', (dy * 0.4).toFixed(1) + 'px');
      circle.style.setProperty('--lx', (dx * 0.15).toFixed(1) + 'px');
      circle.style.setProperty('--ly', (dy * 0.15).toFixed(1) + 'px');
    });
  });
  circle.addEventListener('pointerleave', function () {
    ['--mx', '--my', '--lx', '--ly'].forEach(function (p) { circle.style.removeProperty(p); });
  });

  /* ---------------------------------------------------------------------
     Veliki CTA u podnožju: na dodir prvi tap otkriva, drugi otvara link
     --------------------------------------------------------------------- */
  var cta = $('.cta');
  cta.addEventListener('click', function (e) {
    if (mqHover.matches) return;
    if (!cta.classList.contains('is-on')) { e.preventDefault(); cta.classList.add('is-on'); }
  });

  /* Promena rasporeda (npr. okretanje tableta) */
  var onMode = function () { measure(); };
  if (mqDesk.addEventListener) mqDesk.addEventListener('change', onMode); else mqDesk.addListener(onMode);
})();
