/* ============================================================
   climaSUS — immersive site · scroll choreography engine
   Framework-free. Respects prefers-reduced-motion.
   ============================================================ */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var docEl = document.documentElement;

  /* ---------- utils ---------- */
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function hexToRgb(h) {
    h = h.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  function mixRgb(c1, c2, t) {
    return 'rgb(' + Math.round(lerp(c1[0], c2[0], t)) + ',' +
      Math.round(lerp(c1[1], c2[1], t)) + ',' +
      Math.round(lerp(c1[2], c2[2], t)) + ')';
  }

  /* ============================================================
     1 — SCROLL REVEALS  ([data-reveal])
     ============================================================ */
  function initReveals() {
    var items = [].slice.call(document.querySelectorAll('[data-reveal]'));
    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ============================================================
     2 — STICKY / CONDENSING NAV
     ============================================================ */
  function initNav() {
    var nav = document.querySelector('[data-nav]');
    var hero = document.querySelector('[data-hero]');
    if (!nav) return;
    var trigger = hero ? hero.offsetHeight * 0.6 : 400;
    var lastY = 0;
    function update() {
      var y = window.pageYOffset;
      if (y > trigger) nav.classList.add('nav--solid');
      else nav.classList.remove('nav--solid');
      // hide on scroll-down, reveal on scroll-up (past hero)
      if (y > trigger && y > lastY + 4) nav.classList.add('nav--hidden');
      else if (y < lastY - 4 || y <= trigger) nav.classList.remove('nav--hidden');
      lastY = y;
    }
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  /* ============================================================
     3 — PARALLAX  ([data-parallax] speed via data-speed)
     ============================================================ */
  var parallaxEls = [];
  function initParallax() {
    if (reduceMotion) return;
    parallaxEls = [].slice.call(document.querySelectorAll('[data-parallax]'));
  }
  function updateParallax() {
    var vh = window.innerHeight;
    parallaxEls.forEach(function (el) {
      var r = el.getBoundingClientRect();
      var center = r.top + r.height / 2;
      var off = (center - vh / 2) / vh; // -1..1 roughly
      var speed = parseFloat(el.getAttribute('data-speed')) || 0.15;
      el.style.transform = 'translate3d(0,' + (off * speed * -100).toFixed(2) + 'px,0)';
    });
  }

  /* ============================================================
     4 — ANIMATED COUNTERS  ([data-count])
     ============================================================ */
  function initCounters() {
    var els = [].slice.call(document.querySelectorAll('[data-count]'));
    if (!els.length) return;
    function run(el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var dec = parseInt(el.getAttribute('data-decimals') || '0', 10);
      var prefix = el.getAttribute('data-prefix') || '';
      var suffix = el.getAttribute('data-suffix') || '';
      if (reduceMotion) {
        el.textContent = prefix + target.toFixed(dec).replace('.', ',') + suffix;
        return;
      }
      var dur = 1500, start = null;
      function frame(ts) {
        if (!start) start = ts;
        var p = clamp((ts - start) / dur, 0, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        var val = (target * eased).toFixed(dec).replace('.', ',');
        el.textContent = prefix + val + suffix;
        if (p < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }
    if (!('IntersectionObserver' in window)) { els.forEach(run); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { run(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ============================================================
     5 — WORD-BY-WORD STATEMENT REVEAL  ([data-words])
     Each word brightens as it scrolls through the viewport band.
     ============================================================ */
  var wordBlocks = [];
  function initWords() {
    var blocks = [].slice.call(document.querySelectorAll('[data-words]'));
    blocks.forEach(function (block) {
      var html = block.innerHTML;
      // wrap each word in a span, keep <br> and existing tags reasonably
      var tmp = document.createElement('div');
      tmp.innerHTML = html;
      function wrapTextNodes(node) {
        [].slice.call(node.childNodes).forEach(function (child) {
          if (child.nodeType === 3) {
            var frag = document.createDocumentFragment();
            child.nodeValue.split(/(\s+)/).forEach(function (tok) {
              if (/^\s+$/.test(tok) || tok === '') { frag.appendChild(document.createTextNode(tok)); }
              else {
                var s = document.createElement('span');
                s.className = 'word';
                s.textContent = tok;
                frag.appendChild(s);
              }
            });
            child.parentNode.replaceChild(frag, child);
          } else if (child.nodeType === 1 && child.tagName !== 'BR') {
            wrapTextNodes(child);
          }
        });
      }
      wrapTextNodes(tmp);
      block.innerHTML = tmp.innerHTML;
      if (reduceMotion) {
        [].slice.call(block.querySelectorAll('.word')).forEach(function (w) { w.classList.add('lit'); });
      } else {
        wordBlocks.push(block);
      }
    });
  }
  function updateWords() {
    var vh = window.innerHeight;
    wordBlocks.forEach(function (block) {
      var words = block.querySelectorAll('.word');
      var r = block.getBoundingClientRect();
      // progress of block through a band (from 80% to 30% of viewport)
      var p = clamp((vh * 0.85 - r.top) / (r.height + vh * 0.3), 0, 1);
      var n = words.length;
      var litCount = Math.round(p * n);
      for (var i = 0; i < n; i++) {
        if (i < litCount) words[i].classList.add('lit');
        else words[i].classList.remove('lit');
      }
    });
  }

  /* ============================================================
     6 — PINNED COLOR-SCRUB  (the 3 alert systems)
     Section [data-scrub] is tall; inner [data-scrub-stage] is sticky.
     Background interpolates through color stops; horizontal track
     slides; active card highlights.
     ============================================================ */
  var scrub = null;
  function initScrub() {
    var section = document.querySelector('[data-scrub]');
    if (!section) return;
    var stage = section.querySelector('[data-scrub-stage]');
    var track = section.querySelector('[data-scrub-track]');
    var cards = [].slice.call(section.querySelectorAll('[data-scrub-card]'));
    var stops = (section.getAttribute('data-stops') || '').split(',').map(function (s) { return hexToRgb(s.trim()); });
    var inkStops = (section.getAttribute('data-ink') || '').split(',').map(function (s) { return hexToRgb(s.trim()); });
    var progressBar = section.querySelector('[data-scrub-progress]');
    var dots = [].slice.call(section.querySelectorAll('[data-scrub-dot]'));
    scrub = { section: section, stage: stage, track: track, cards: cards, stops: stops, inkStops: inkStops, progressBar: progressBar, dots: dots, n: cards.length };
  }
  function updateScrub() {
    if (!scrub) return;
    var s = scrub;
    var rect = s.section.getBoundingClientRect();
    var total = s.section.offsetHeight - window.innerHeight;
    var p = clamp(-rect.top / total, 0, 1);
    var seg = s.n - 1; // number of transitions
    var fpos = p * seg;
    var idx = clamp(Math.floor(fpos), 0, seg - 1);
    var local = fpos - idx;

    // background + ink color interpolation
    if (s.stops.length >= 2) {
      var c1 = s.stops[idx], c2 = s.stops[idx + 1];
      s.stage.style.background = mixRgb(c1, c2, local);
    }
    if (s.inkStops.length >= 2) {
      var k1 = s.inkStops[idx], k2 = s.inkStops[idx + 1];
      s.stage.style.color = mixRgb(k1, k2, local);
    }

    // horizontal track slide (one card width per stop)
    if (s.track) {
      var shift = -(p * (s.track.scrollWidth - s.stage.clientWidth));
      if (reduceMotion) shift = 0;
      s.track.style.transform = 'translate3d(' + shift.toFixed(1) + 'px,0,0)';
    }

    // active card / dots
    var active = clamp(Math.round(fpos), 0, s.n - 1);
    s.cards.forEach(function (c, i) { c.classList.toggle('active', i === active); });
    s.dots.forEach(function (d, i) { d.classList.toggle('active', i === active); });
    if (s.progressBar) s.progressBar.style.transform = 'scaleX(' + p + ')';
  }

  /* ============================================================
     7 — HERO PARALLAX TILT (pointer) + scroll fade
     ============================================================ */
  function initHero() {
    var hero = document.querySelector('[data-hero]');
    if (!hero) return;
    var layers = [].slice.call(hero.querySelectorAll('[data-hero-layer]'));
    var content = hero.querySelector('[data-hero-content]');
    if (!reduceMotion) {
      hero.addEventListener('pointermove', function (e) {
        var cx = (e.clientX / window.innerWidth - 0.5);
        var cy = (e.clientY / window.innerHeight - 0.5);
        layers.forEach(function (l) {
          var d = parseFloat(l.getAttribute('data-depth')) || 10;
          l.style.transform = 'translate3d(' + (cx * d).toFixed(1) + 'px,' + (cy * d).toFixed(1) + 'px,0)';
        });
      });
    }
    function onScroll() {
      var y = window.pageYOffset;
      var vh = window.innerHeight;
      var p = clamp(y / vh, 0, 1);
      if (content && !reduceMotion) {
        content.style.transform = 'translate3d(0,' + (p * 80).toFixed(1) + 'px,0)';
        content.style.opacity = (1 - p * 1.1).toFixed(3);
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ============================================================
     8 — TOP PROGRESS BAR
     ============================================================ */
  function initTopProgress() {
    var bar = document.querySelector('[data-top-progress]');
    if (!bar) return;
    function update() {
      var h = docEl.scrollHeight - window.innerHeight;
      var p = h > 0 ? window.pageYOffset / h : 0;
      bar.style.transform = 'scaleX(' + clamp(p, 0, 1) + ')';
    }
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  /* ============================================================
     RAF LOOP  (for scroll-tied transforms)
     ============================================================ */
  var ticking = false;
  function onScrollRAF() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(function () {
        updateParallax();
        updateWords();
        updateScrub();
        ticking = false;
      });
    }
  }

  /* ---------- smooth anchor scroll ---------- */
  function initAnchors() {
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var t = document.querySelector(id);
      if (!t) return;
      e.preventDefault();
      t.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    });
  }

  /* ---------- boot ---------- */
  function revealHero() { docEl.classList.remove('preload'); }
  function settleHero() { docEl.classList.add('settled'); }
  function boot() {
    // Entrance is class-toggled transition (robust to rAF throttling).
    // Remove preload on next macrotask so the initial hidden state paints first.
    setTimeout(revealHero, 30);
    window.addEventListener('load', revealHero);
    // Safety net: force the visible end-state after the entrance window,
    // so content is never stuck hidden (export/frozen/no-rAF contexts).
    setTimeout(settleHero, 1500);
    initReveals();
    initNav();
    initParallax();
    initCounters();
    initWords();
    initScrub();
    initHero();
    initTopProgress();
    initAnchors();
    window.addEventListener('scroll', onScrollRAF, { passive: true });
    window.addEventListener('resize', onScrollRAF, { passive: true });
    onScrollRAF();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else { boot(); }
})();
