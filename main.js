/* MileZero landing: no cookies, no storage, no network calls. */
(function () {
  'use strict';
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

  window.addEventListener('scroll', onScroll, { passive: true });

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

  /* ===== tyre tracks + a car that drives down the page with the scroll ===== */
  var road = $('#road');
  if (road && road.querySelector && $('#roadCentre').getTotalLength) {
    var centre = $('#roadCentre'), tL = $('#trackL'), tR = $('#trackR'), hL = $('#hotL'), hR = $('#hotR');
    var maskP = $('#maskPath'), hotP = $('#hotMaskPath'), car = $('#car');
    var STEP = 6, HOT = 240, samples = [], total = 0, cur = 0, target = 0, raf = 0, built = false;

    var build = function () {
      road.style.height = '0px';
      var W = document.documentElement.clientWidth, H = document.documentElement.scrollHeight;
      road.style.height = H + 'px';
      road.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      ['mReveal', 'mHot'].forEach(function (id) {
        var m = document.getElementById(id);
        m.setAttribute('x', -100); m.setAttribute('y', -200); m.setAttribute('width', W + 200); m.setAttribute('height', H + 400);
      });
      var mob = W < 700, seg = Math.max(620, innerHeight * 0.85), xs = mob ? [0.12, 0.88] : [0.07, 0.93];
      var x0 = W * 0.5, y0 = -80, d = 'M' + x0 + ' ' + y0, i = 0;
      while (y0 < H + 60) {
        var y1 = Math.min(y0 + (i === 0 ? seg * 0.8 : seg), H + 60), x1 = W * xs[i % 2], k = (y1 - y0) * 0.55;
        d += ' C' + x0 + ' ' + (y0 + k) + ' ' + x1 + ' ' + (y1 - k) + ' ' + x1 + ' ' + y1;
        x0 = x1; y0 = y1; i++;
      }
      centre.setAttribute('d', d);
      total = centre.getTotalLength(); samples = [];
      for (var l = 0; l <= total; l += STEP) { var p = centre.getPointAtLength(l); samples.push([p.x, p.y]); }
      var off = mob ? 7 : 10, a = '', b = '';
      for (var j = 0; j < samples.length; j++) {
        var p0 = samples[Math.max(0, j - 1)], p1 = samples[Math.min(samples.length - 1, j + 1)];
        var dx = p1[0] - p0[0], dy = p1[1] - p0[1], m2 = Math.hypot(dx, dy) || 1, nx = -dy / m2, ny = dx / m2, s = samples[j];
        a += (j ? 'L' : 'M') + (s[0] + nx * off).toFixed(1) + ' ' + (s[1] + ny * off).toFixed(1);
        b += (j ? 'L' : 'M') + (s[0] - nx * off).toFixed(1) + ' ' + (s[1] - ny * off).toFixed(1);
      }
      tL.setAttribute('d', a); hL.setAttribute('d', a); tR.setAttribute('d', b); hR.setAttribute('d', b);
      [tL, tR, hL, hR].forEach(function (e) { e.setAttribute('stroke-width', mob ? 6 : 8); });
      maskP.setAttribute('d', d); hotP.setAttribute('d', d);
      maskP.setAttribute('stroke-dasharray', total + ' ' + total);
      hotP.setAttribute('stroke-dasharray', HOT + ' ' + (total * 2));
      car.setAttribute('class', mob ? 'sm' : '');
      target = lenForScroll();
      cur = reduce ? total : (built ? Math.min(cur, total) : 0);
      built = true;
      draw(); kick();
    };

    var lenForScroll = function () {
      var y = window.scrollY + innerHeight * 0.6, lo = 0, hi = samples.length - 1;
      while (lo < hi) { var mid = (lo + hi) >> 1; if (samples[mid][1] < y) lo = mid + 1; else hi = mid; }
      return lo * STEP;
    };

    var draw = function () {
      maskP.setAttribute('stroke-dashoffset', (total - cur).toFixed(1));
      hotP.setAttribute('stroke-dashoffset', (-(cur - HOT)).toFixed(1));
      var n = samples.length - 1, idx = Math.min(n, Math.max(0, Math.round(cur / STEP)));
      var pa = samples[Math.max(0, idx - 2)], pb = samples[Math.min(n, idx + 2)], pt = samples[idx];
      var ang = Math.atan2(pb[1] - pa[1], pb[0] - pa[0]) * 180 / Math.PI;
      car.setAttribute('transform', 'translate(' + pt[0].toFixed(1) + ' ' + pt[1].toFixed(1) + ') rotate(' + ang.toFixed(1) + ')');
    };

    var tick = function () {
      var diff = target - cur;
      cur += diff * 0.07;
      if (Math.abs(diff) < 0.6) cur = target;
      draw();
      raf = cur !== target ? requestAnimationFrame(tick) : 0;
    };
    var kick = function () { if (!reduce && !raf) raf = requestAnimationFrame(tick); };

    window.addEventListener('scroll', function () {
      if (prog) {
        var max = document.documentElement.scrollHeight - innerHeight;
        prog.style.transform = 'scaleX(' + (max > 0 ? window.scrollY / max : 0).toFixed(4) + ')';
      }
      if (built) { target = lenForScroll(); kick(); }
    }, { passive: true });

    var t;
    var rebuild = function () { clearTimeout(t); t = setTimeout(build, 180); };
    window.addEventListener('resize', rebuild);
    if ('ResizeObserver' in window) new ResizeObserver(rebuild).observe($('main'));
    if (document.readyState === 'complete') build(); else window.addEventListener('load', build);
  }
})();
