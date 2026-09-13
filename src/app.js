/* ============================================================
   ОСІННЯ ПРИВІТАЛЬНА РОЗГОРТКА — інтерактив
   1) розкриття листа   2) навігація главами   3) 3D-кнопки
   4) паралакс і нахил  5) листопад на canvas  6) тема й ефекти
   ============================================================ */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  /* ---------- 1. Анімація тексту: слова та абзаци ---------- */
  function splitWords(root) {
    var i = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          if (!child.textContent.trim()) return;
          var frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(function (tok) {
            if (!tok) return;
            if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(tok)); return; }
            var outer = document.createElement('span');
            outer.className = 'w';
            var inner = document.createElement('span');
            inner.textContent = tok;
            inner.style.setProperty('--wd', (i++ * 0.055).toFixed(3) + 's');
            outer.appendChild(inner);
            frag.appendChild(outer);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1) {
          walk(child);
        }
      });
    })(root);
  }

  var chapters = $$('.chapter');
  chapters.forEach(function (ch) {
    var h = $('h2', ch);
    if (h) splitWords(h);
    $$('.chapter__body p', ch).forEach(function (p, i) {
      p.style.setProperty('--pd', (0.26 + i * 0.13).toFixed(2) + 's');
    });
  });

  /* ---------- 2. Навігація главами ---------- */
  var reader = $('#reader');
  var prevBtn = $('#prevBtn');
  var nextBtn = $('#nextBtn');
  var restartBtn = $('#restartBtn');
  var dotsBox = $('#dots');
  var counter = $('#counter');
  var bar = $('#bar');
  var total = chapters.length;
  var current = 0;
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };

  chapters.forEach(function (ch, i) {
    var d = document.createElement('button');
    d.type = 'button';
    d.className = 'dot' + (i === 0 ? ' is-on' : '');
    d.setAttribute('role', 'tab');
    d.setAttribute('aria-label', 'Сторінка ' + (i + 1) + ' з ' + total);
    d.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    d.addEventListener('click', function () { go(i); });
    dotsBox.appendChild(d);
    ch.setAttribute('aria-hidden', i === 0 ? 'false' : 'true');
  });
  var dots = $$('.dot', dotsBox);

  function go(index, silent) {
    index = clamp(index, 0, total - 1);
    if (index === current && silent !== false) {
      if (!chapters[index].classList.contains('is-active')) { /* дозволити перезапуск */ }
      else return;
    }
    current = index;
    chapters.forEach(function (ch, i) {
      ch.classList.remove('is-active', 'is-prev');
      if (i === index) ch.classList.add('is-active');
      else if (i < index) ch.classList.add('is-prev');
      ch.setAttribute('aria-hidden', i === index ? 'false' : 'true');
    });
    dots.forEach(function (d, i) {
      d.classList.toggle('is-on', i === index);
      d.setAttribute('aria-selected', i === index ? 'true' : 'false');
    });
    counter.textContent = pad(index + 1) + ' / ' + pad(total);
    bar.style.width = ((index + 1) / total * 100).toFixed(2) + '%';
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === total - 1;
    if (opened) scrollToReader();
  }

  /* на вузьких екранах контент має починатися з видимого місця */
  function scrollToTop(el) {
    if (!el || !window.matchMedia('(max-width: 960px)').matches) return;
    var top = el.getBoundingClientRect().top;
    window.scrollTo({
      top: Math.max(0, window.pageYOffset + top - 14),
      behavior: reduced ? 'auto' : 'smooth'
    });
  }
  function scrollToReader() {
    if (!window.matchMedia('(max-width: 960px)').matches) return;
    var top = reader.getBoundingClientRect().top;
    if (top > -8 && top < window.innerHeight * 0.45) return;
    scrollToTop(reader);
  }
  go(0, false);

  prevBtn.addEventListener('click', function () { go(current - 1); });
  nextBtn.addEventListener('click', function () { go(current + 1); });
  if (restartBtn) restartBtn.addEventListener('click', function () { go(0); });

  /* клавіатура */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight' || e.key === 'PageDown') { go(current + 1); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { go(current - 1); }
    else if (e.key === 'Home') { go(0); }
    else if (e.key === 'End') { go(total - 1); }
  });

  /* свайп */
  (function () {
    var x0 = null, y0 = null;
    reader.addEventListener('touchstart', function (e) {
      x0 = e.touches[0].clientX; y0 = e.touches[0].clientY;
    }, { passive: true });
    reader.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      var dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dx) > 56 && Math.abs(dx) > Math.abs(dy) * 1.6) go(current + (dx < 0 ? 1 : -1));
      x0 = y0 = null;
    }, { passive: true });
  })();

  /* ---------- 3. Розкриття листа ---------- */
  var openBtn = $('#openBtn');
  var opened = false;
  function openLetter() {
    if (opened) return;
    opened = true;
    document.body.classList.add('is-open');
    burst(openBtn, 16);
    setTimeout(function () { scrollToTop($('#spread')); }, 640);
    setTimeout(function () {
      var cover = $('#cover');
      if (cover) cover.setAttribute('aria-hidden', 'true');
      try { nextBtn.focus({ preventScroll: true }); } catch (e) {}
    }, 900);
  }
  openBtn.addEventListener('click', openLetter);

  /* ---------- 4. 3D-кнопки: нахил за курсором ---------- */
  if (fine && !reduced) {
    $$('.btn').forEach(function (btn) {
      var face = $('.btn__face', btn);
      if (!face) return;
      btn.addEventListener('pointermove', function (e) {
        if (btn.disabled) return;
        var r = face.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        face.style.setProperty('--ry', (px * 16).toFixed(2) + 'deg');
        face.style.setProperty('--rx', (-py * 13).toFixed(2) + 'deg');
      });
      btn.addEventListener('pointerleave', function () {
        face.style.setProperty('--ry', '0deg');
        face.style.setProperty('--rx', '0deg');
      });
      btn.addEventListener('pointerdown', function () { btn.classList.add('is-pressed'); });
      ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) {
        btn.addEventListener(ev, function () { btn.classList.remove('is-pressed'); });
      });
    });
  }

  /* ---------- 5. Паралакс гілок, нахил розгортки та портрета ---------- */
  if (fine && !reduced) {
    var branches = $$('.branch');
    var spread = $('#spreadWrap');
    var tilt = $('#portraitTilt');
    var portrait = $('#portrait');
    var tx = 0, ty = 0, cx = 0, cy = 0, pOver = false, pX = 0, pY = 0;

    window.addEventListener('pointermove', function (e) {
      tx = e.clientX / window.innerWidth - 0.5;
      ty = e.clientY / window.innerHeight - 0.5;
    }, { passive: true });

    if (portrait) {
      portrait.addEventListener('pointerenter', function () { pOver = true; });
      portrait.addEventListener('pointerleave', function () { pOver = false; });
      portrait.addEventListener('pointermove', function (e) {
        var r = portrait.getBoundingClientRect();
        pX = (e.clientX - r.left) / r.width - 0.5;
        pY = (e.clientY - r.top) / r.height - 0.5;
      });
    }

    var ptx = 0, pty = 0;
    (function frame() {
      cx += (tx - cx) * 0.055;
      cy += (ty - cy) * 0.055;
      branches.forEach(function (b) {
        var d = parseFloat(b.getAttribute('data-depth')) || 10;
        b.style.transform = 'translate3d(' + (cx * d).toFixed(2) + 'px,' + (cy * d * 0.7).toFixed(2) + 'px,0)';
      });
      if (spread) {
        spread.style.transform = 'rotateY(' + (cx * 2.2).toFixed(2) + 'deg) rotateX(' +
          (-cy * 1.5).toFixed(2) + 'deg) translateZ(0)';
      }
      if (tilt) {
        var gx = pOver ? pX : cx * 0.35;
        var gy = pOver ? pY : cy * 0.35;
        ptx += (gx - ptx) * 0.12;
        pty += (gy - pty) * 0.12;
        tilt.style.transform = 'rotateY(' + (ptx * 20).toFixed(2) + 'deg) rotateX(' +
          (-pty * 18).toFixed(2) + 'deg) scale(' + (pOver ? 1.035 : 1) + ')';
      }
      requestAnimationFrame(frame);
    })();
  }

  /* після відкриття — вивести листя на орбіту */
  (function () {
    var orbits = $$('.portrait__orbit');
    orbits.forEach(function (orb) {
      var kids = $$('.orbit-leaf', orb);
      kids.forEach(function (k, i) {
        var a = (i / kids.length) * Math.PI * 2 + (orb.classList.contains('o2') ? 0.8 : 0);
        k.style.left = (50 + Math.cos(a) * 50) + '%';
        k.style.top = (50 + Math.sin(a) * 50) + '%';
      });
    });
    setTimeout(function () { orbits.forEach(function (o) { o.classList.add('is-in'); }); }, 1400);
  })();

  /* ---------- 6. Листопад на canvas ---------- */
  var wind = (function () {
    var canvas = $('#leafCanvas');
    var ctx = canvas.getContext('2d');
    var W = 0, H = 0, dpr = 1, raf = null, on = true, t = 0;
    var MAPLE = new Path2D('M12 1.8c.5 1.6 1 3 1.9 4.3.7-.3 1.5-.7 2.3-1.2-.2 1.1-.4 2-.7 2.9 1.3-.2 2.6-.6 3.9-1.1-.5 1-1 1.9-1.6 2.7.5.3 1.1.5 1.8.7-1.5 1.1-3 2-4.6 2.7 1.4.6 3 1 4.7 1.2-.7.6-1.3 1.1-2 1.5.2.5.5 1 .9 1.5-1.9-.1-3.6-.4-5.2-.9.1 1.4.3 2.9.7 4.4-.9-.6-1.7-1.3-2.4-2-.6.7-1.4 1.4-2.3 2 .4-1.5.6-3 .7-4.4-1.6.5-3.3.8-5.2.9.4-.5.7-1 .9-1.5-.7-.4-1.3-.9-2-1.5 1.7-.2 3.3-.6 4.7-1.2-1.6-.7-3.1-1.6-4.6-2.7.7-.2 1.3-.4 1.8-.7-.6-.8-1.1-1.7-1.6-2.7 1.3.5 2.6.9 3.9 1.1-.3-.9-.5-1.8-.7-2.9.8.5 1.6.9 2.3 1.2.9-1.3 1.4-2.7 1.9-4.3Z');
    var SIMPLE = new Path2D('M21.2 2.6C11.9 3.9 5.2 8.9 3.4 16.5c-.5-1.4-.8-2.9-.9-4.6-.1-.5-.5-.8-1-.8-.5.1-.9.5-.8 1 .3 4 1.6 7 3.9 9.1.4.3 1 .3 1.3-.1.3-.4.3-1-.1-1.3-.5-.5-1-1-1.4-1.7C13.3 18.7 20 12.5 21.2 2.6Z');
    var PALETTES = {
      day:  ['#c2611f', '#e0932c', '#eab745', '#a8531c', '#8d7a30', '#d4762a', '#f0cb6b'],
      dusk: ['#c9722c', '#e0a047', '#f3c15c', '#a1491a', '#8b7a34', '#d9853a', '#6b4a1c']
    };
    var colors = PALETTES.day;
    var leaves = [];

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var want = clamp(Math.round(W * H / 34000), 12, 34);
      while (leaves.length < want) leaves.push(make(true));
      if (leaves.length > want) leaves.length = want;
    }

    function make(anywhere) {
      return {
        x: Math.random() * W,
        y: anywhere ? Math.random() * H : -40 - Math.random() * 120,
        s: 9 + Math.random() * 17,
        vy: 0.25 + Math.random() * 0.75,
        sway: 0.5 + Math.random() * 1.6,
        phase: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.02,
        rot: Math.random() * Math.PI * 2,
        flip: 0.4 + Math.random() * 0.6,
        op: 0.42 + Math.random() * 0.5,
        c: colors[(Math.random() * colors.length) | 0],
        shape: Math.random() > 0.42 ? MAPLE : SIMPLE
      };
    }

    function draw() {
      t += 0.006;
      ctx.clearRect(0, 0, W, H);
      var gust = Math.sin(t) * 0.7 + Math.sin(t * 0.43 + 1.2) * 0.45;
      for (var i = 0; i < leaves.length; i++) {
        var l = leaves[i];
        l.phase += 0.012 + l.vy * 0.006;
        l.y += l.vy + Math.abs(gust) * 0.16;
        l.x += Math.sin(l.phase) * l.sway * 0.55 + gust * 0.6;
        l.rot += l.spin + gust * 0.002;
        if (l.y - l.s > H) { leaves[i] = make(false); continue; }
        if (l.x < -80) l.x = W + 60; else if (l.x > W + 80) l.x = -60;

        ctx.save();
        ctx.translate(l.x, l.y);
        ctx.rotate(l.rot);
        var k = l.s / 24;
        ctx.scale(k * (Math.cos(l.phase * 0.8) * l.flip * 0.5 + 0.75), k);
        ctx.globalAlpha = l.op;
        ctx.fillStyle = l.c;
        ctx.translate(-12, -12);
        ctx.fill(l.shape);
        ctx.restore();
      }
      raf = requestAnimationFrame(draw);
    }

    function start() {
      if (raf || !on || reduced) return;
      raf = requestAnimationFrame(draw);
    }
    function stop() {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    }

    resize();
    window.addEventListener('resize', function () { resize(); if (reduced) paintOnce(); });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop(); else start();
    });

    function paintOnce() {
      ctx.clearRect(0, 0, W, H);
      leaves.forEach(function (l) {
        ctx.save();
        ctx.translate(l.x, l.y);
        ctx.rotate(l.rot);
        var k = l.s / 24;
        ctx.scale(k, k);
        ctx.globalAlpha = l.op * 0.8;
        ctx.fillStyle = l.c;
        ctx.translate(-12, -12);
        ctx.fill(l.shape);
        ctx.restore();
      });
    }

    if (reduced) paintOnce(); else start();

    return {
      toggle: function () {
        on = !on;
        if (on) { start(); } else { stop(); ctx.clearRect(0, 0, W, H); }
        return on;
      },
      isOn: function () { return on; },
      palette: function (name) {
        colors = PALETTES[name] || PALETTES.day;
        leaves.forEach(function (l) { l.c = colors[(Math.random() * colors.length) | 0]; });
        if (reduced) paintOnce();
      }
    };
  })();

  /* ---------- 7. Тема: день / вечір ---------- */
  var themeBtn = $('#themeBtn');
  var themeIcon = $('#themeIcon');
  function applyTheme(name) {
    document.documentElement.setAttribute('data-theme', name);
    themeIcon.innerHTML = '<use href="#' + (name === 'dusk' ? 'ic-sun' : 'ic-moon') + '"></use>';
    themeBtn.setAttribute('title', name === 'dusk' ? 'Увімкнути денне світло' : 'Увімкнути вечірнє світло');
    wind.palette(name);
    store.set('mg-theme', name);
  }
  applyTheme(store.get('mg-theme', 'day'));
  themeBtn.addEventListener('click', function () {
    applyTheme(document.documentElement.getAttribute('data-theme') === 'dusk' ? 'day' : 'dusk');
  });

  /* ---------- 8. Листопад: вимикач ---------- */
  var windBtn = $('#windBtn');
  windBtn.addEventListener('click', function () {
    var on = wind.toggle();
    windBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    toast(on ? 'Листопад увімкнено' : 'Листопад зупинено');
  });

  /* ---------- 9. Ефекти: салют із листя та сердець ---------- */
  var fxLayer = $('#fxLayer');
  var FX_COLORS = ['#b8531d', '#d98925', '#e9b13f', '#8a7a34', '#8d3a12'];
  function burst(origin, count) {
    if (reduced) return;
    var r = origin.getBoundingClientRect();
    var ox = r.left + r.width / 2;
    var oy = r.top + r.height / 2;
    for (var i = 0; i < count; i++) {
      (function (i) {
        var el = document.createElement('span');
        el.className = 'fx';
        var heart = Math.random() > 0.55;
        var size = 12 + Math.random() * 18;
        var ang = -Math.PI / 2 + (Math.random() - 0.5) * 2.1;
        var dist = 90 + Math.random() * 210;
        el.style.left = (ox - size / 2) + 'px';
        el.style.top = (oy - size / 2) + 'px';
        el.style.setProperty('--s', size + 'px');
        el.style.setProperty('--c', heart ? '#b8531d' : FX_COLORS[(Math.random() * FX_COLORS.length) | 0]);
        el.style.setProperty('--dx', (Math.cos(ang) * dist).toFixed(0) + 'px');
        el.style.setProperty('--dy', (Math.sin(ang) * dist - 40).toFixed(0) + 'px');
        el.style.setProperty('--dr', ((Math.random() - 0.5) * 540).toFixed(0) + 'deg');
        el.style.setProperty('--d', (1.1 + Math.random() * 0.9).toFixed(2) + 's');
        el.style.animationDelay = (i * 0.018).toFixed(3) + 's';
        el.innerHTML = '<svg fill="currentColor"><use href="#' +
          (heart ? 'ic-heart' : (Math.random() > 0.5 ? 'ic-maple' : 'ic-leaf')) + '"></use></svg>';
        fxLayer.appendChild(el);
        setTimeout(function () { el.remove(); }, 2400);
      })(i);
    }
  }

  var toastEl = $('#toast');
  var toastTimer = null;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-on'); }, 2400);
  }

  var hugBtn = $('#hugBtn');
  if (hugBtn) {
    hugBtn.addEventListener('click', function () {
      var n = parseInt(store.get('mg-hugs', '0'), 10) + 1;
      store.set('mg-hugs', String(n));
      burst(hugBtn, 26);
      toast(n === 1 ? 'Обійми надіслано ♥' : 'Обійми надіслано ♥ ×' + n);
    });
  }

  /* ---------- 10. Дрібниці ---------- */
  /* сторінка готова — прибрати попереднє приховування */
  document.body.classList.add('is-ready');
})();
