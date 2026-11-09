/* MileZero landing: no cookies, no network calls. Stores one item: that the cookie notice was accepted. */
(function () {
  'use strict';
  /* Clickjacking guard: GitHub Pages can't send X-Frame-Options or a frame-ancestors header,
     so this is the only available defence. If another site frames this page, break out of it. */
  try { if (window.top !== window.self) { window.top.location = window.self.location.href; } } catch (e) { document.documentElement.style.display = 'none'; }

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  $$('[data-d]').forEach(function (el) { el.style.setProperty('--d', el.dataset.d); });

  /* nav background after scroll */
  var nav = $('.nav');
  function onScroll() { nav.classList.toggle('solid', window.scrollY > 24); }
  onScroll();

  /* reveal on scroll */
  var rv = $$('.rv');
  /* each section's content arrives from a different side: headings from the left,
     the rest alternating right / left, every third item from below */
  $$('main section').forEach(function (sec, si) {
    $$('.rv', sec).forEach(function (el, i) {
      var from;
      if (/^H[1-3]$/.test(el.tagName) || el.classList.contains('eyebrow')) from = 'left';
      else if (i % 3 === 2) from = 'bottom';
      else from = (i + si) % 2 ? 'right' : 'left';
      if (from !== 'bottom') el.setAttribute('data-from', from);
    });
  });
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
    rv.forEach(function (el) { io.observe(el); });
  } else {
    rv.forEach(function (el) { el.classList.add('in'); });
  }

  /* count-up numbers */
  var counters = $$('[data-count]');
  function runCount(el) {
    var end = parseFloat(el.dataset.count), dec = (el.dataset.count.split('.')[1] || '').length;
    if (reduce) { el.textContent = end.toFixed(dec); return; }
    var t0 = null, dur = 1400;
    function f(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = (end * e).toFixed(dec);
      if (p < 1) requestAnimationFrame(f);
    }
    requestAnimationFrame(f);
  }
  if ('IntersectionObserver' in window) {
    var co = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { runCount(e.target); co.unobserve(e.target); } });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { co.observe(c); });
  } else { counters.forEach(runCount); }

  /* verdict rule: fare / total minutes against the driver's own limit */
  function verdict(fare, mins, limit) {
    var pm = mins > 0 ? fare / mins : 0;
    return { pm: pm, good: pm >= limit };
  }
  var eur = function (n) { return '€' + n.toFixed(2).replace('.', ','); };

  /* hero phone demo loop */
  var band = $('#band'), bandWord = $('#bandWord'), bandInfo = $('#bandInfo');
  var fareEl = $('#fare'), pickEl = $('#pick'), tripEl = $('#trip'), totEl = $('#tot'), appEl = $('#app'), timer = $('#timer');
  var offers = [
    { app: 'UberX', fare: 54.56, pick: 9, trip: 57 },
    { app: 'Bolt', fare: 6.20, pick: 8, trip: 14 },
    { app: 'UberX', fare: 14.80, pick: 5, trip: 21 },
    { app: 'Bolt', fare: 11.90, pick: 6, trip: 19 }
  ];
  var LIMIT = 0.50, idx = 0, timers = [], visible = true;
  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function show(o) {
    var tot = o.pick + o.trip, v = verdict(o.fare, tot, LIMIT);
    appEl.textContent = o.app; fareEl.textContent = eur(o.fare);
    pickEl.textContent = o.pick + ' min'; tripEl.textContent = o.trip + ' min'; totEl.textContent = tot + ' min';
    band.className = 'band'; bandWord.textContent = 'Reading'; bandInfo.textContent = '…';
    timer.className = ''; void timer.offsetWidth; timer.className = 'run';
    later(function () {
      band.className = 'band ' + (v.good ? 'good' : 'bad');
      bandWord.textContent = v.good ? 'Good ride' : 'Bad ride';
      bandInfo.textContent = eur(v.pm) + ' / min';
    }, 900);
  }
  function loop() {
    if (!visible) return;
    show(offers[idx]); idx = (idx + 1) % offers.length;
    later(loop, 5200);
  }
  if (band) {
    if (reduce) { idx = 0; show(offers[0]); timer.className = ''; }
    else {
      loop();
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (es) {
          var now = es[0].isIntersecting;
          if (now && !visible) { visible = true; loop(); }
          if (!now) { visible = false; timers.forEach(clearTimeout); timers = []; }
        }, { threshold: 0.05 }).observe($('.hero'));
      }
    }
  }

  /* menu bar: hides while scrolling down, returns when scrolling up (always shown at the very top
     and while keyboard focus is inside it) */
  var lastY = window.scrollY;
  function navVisibility() {
    var y = window.scrollY, d = y - lastY;
    if (y < 80 || nav.contains(document.activeElement)) nav.classList.remove('hide');
    else if (d > 6) nav.classList.add('hide');
    else if (d < -6) nav.classList.remove('hide');
    if (Math.abs(d) > 6) lastY = y;
  }
  window.addEventListener('scroll', function () { onScroll(); navVisibility(); }, { passive: true });
  nav.addEventListener('focusin', function () { nav.classList.remove('hide'); });

  /* try-the-rule calculator */
  var rf = $('#rFare'), rm = $('#rMin'), rl = $('#rLimit');
  if (rf) {
    var vEl = $('#verdict'), vW = $('#vWord'), vI = $('#vInfo');
    var upd = function () {
      var fare = +rf.value, mins = +rm.value, limit = +rl.value / 100, v = verdict(fare, mins, limit);
      $('#oFare').textContent = eur(fare); $('#oMin').textContent = mins + ' min'; $('#oLimit').textContent = eur(limit) + ' / min';
      vEl.className = 'verdict ' + (v.good ? 'good' : 'bad');
      vW.textContent = v.good ? 'Good ride' : 'Bad ride';
      vI.textContent = eur(v.pm) + ' / min vs ' + eur(limit);
    };
    [rf, rm, rl].forEach(function (r) { r.addEventListener('input', upd); });
    upd();
  }

  var prog = null;

  /* nav: highlight the link of the section on screen */
  var navLinks = $$('.nav ul a');
  if ('IntersectionObserver' in window && navLinks.length) {
    var navIO = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        navLinks.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main section[id]').forEach(function (s) { navIO.observe(s); });
  }

  /* cookie notice: shown until accepted. The only thing stored is that choice (strictly necessary). */
  var consent = $('#consent'), KEY = 'mz-cookie-notice-v1', seen = false;
  try { seen = !!localStorage.getItem(KEY); } catch (e) { seen = false; }
  if (consent && !seen) {
    consent.hidden = false;
    setTimeout(function () { consent.classList.add('show'); }, reduce ? 0 : 600);
    $('#consentOk').addEventListener('click', function () {
      try { localStorage.setItem(KEY, 'accepted ' + new Date().toISOString().slice(0, 10)); } catch (e) {}
      consent.classList.remove('show');
      setTimeout(function () { consent.hidden = true; }, reduce ? 0 : 500);
    });
  }
})();
