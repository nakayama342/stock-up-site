/* ==========================================================================
   main.js — モバイルメニュー（ハンバーガー）の開閉
   ========================================================================== */
(function () {
  'use strict';

  var burger  = document.querySelector('[data-menu-open]');
  var closeBt = document.querySelector('[data-menu-close]');
  var overlay = document.querySelector('[data-menu-overlay]');
  var drawer  = document.querySelector('[data-menu-drawer]');

  if (!burger || !drawer || !overlay) return;

  function open() {
    drawer.hidden = false;
    overlay.hidden = false;
    burger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    if (closeBt) closeBt.focus();
  }

  function close() {
    drawer.hidden = true;
    overlay.hidden = true;
    burger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    if (drawer.contains(document.activeElement)) burger.focus();
  }

  burger.addEventListener('click', open);
  overlay.addEventListener('click', close);
  if (closeBt) closeBt.addEventListener('click', close);

  // ドロワー内のリンクを押したら閉じる
  Array.prototype.forEach.call(drawer.querySelectorAll('a'), function (a) {
    a.addEventListener('click', close);
  });

  // Esc キーで閉じる
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !drawer.hidden) close();
  });

  // PC幅に戻ったら閉じる
  window.addEventListener('resize', function () {
    if (window.innerWidth > 960 && !drawer.hidden) close();
  });
})();

/* ==========================================================================
   モーション：スクロール連動フェードイン / ヒーロー登場 / パララックス / 数字カウント
   ========================================================================== */
(function () {
  'use strict';

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. スクロール連動フェードイン ---------- */
  var targets = [
    '.message__grid > *',
    '.greeting__side', '.greeting__main',
    '.section__heading', '.service-row', '.company__lead', '.company-row',
    '.docs__head', '.marquee',
    '.home-news__list .news-row',
    '.access__head', '.access__map',
    '.news-hero > *', '.featured__card', '.news-list .news-row',
    '.sub-hero > *', '.article', '.article-nav'
  ];
  var nodes = [];
  targets.forEach(function (sel) {
    Array.prototype.forEach.call(document.querySelectorAll(sel), function (el) {
      if (nodes.indexOf(el) === -1) nodes.push(el);
    });
  });

  if (!reduce && 'IntersectionObserver' in window && nodes.length) {
    // 同じ親の中で順番に時間差をつける
    nodes.forEach(function (el) {
      el.classList.add('reveal');
      var key = el.parentNode;
      var idx = 0;
      if (key.__revealCount === undefined) key.__revealCount = 0;
      idx = key.__revealCount++;
      el.style.setProperty('--reveal-delay', Math.min(idx, 6) * 90 + 'ms');
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
          if (e.target.classList.contains('service-row')) countUp(e.target.querySelector('.service-row__num'));
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    nodes.forEach(function (el) { io.observe(el); });
  } else {
    nodes.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- 4. 数字カウントアップ（事業内容 01〜04） ---------- */
  function countUp(el) {
    if (!el || reduce) return;
    var text = el.textContent.trim();
    var target = parseInt(text, 10);
    if (isNaN(target)) return;
    var digits = text.length, start = null, dur = 900;
    function pad(n) { var s = String(n); while (s.length < digits) s = '0' + s; return s; }
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min(1, (ts - start) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = pad(Math.round(target * eased));
      if (p < 1) requestAnimationFrame(step); else el.textContent = text;
    }
    el.textContent = pad(0);
    requestAnimationFrame(step);
  }

  /* ---------- 2. ヒーロー登場（ローディング後） ---------- */
  function ready() { document.body.classList.add('is-ready'); }
  if (document.getElementById('loader')) {
    document.addEventListener('su:loaded', ready);
  } else if (document.readyState === 'complete') {
    ready();
  } else {
    window.addEventListener('load', ready);
  }

  /* ---------- 3. 積み木のパララックス + マウス追従（PCのみ） ---------- */
  var img = document.querySelector('.hero-card__image');
  if (img && !reduce) {
    var inner = document.createElement('div');
    inner.className = 'hero-card__image-inner';
    img.appendChild(inner);
    img.style.backgroundImage = 'none';
    inner.style.backgroundImage = getComputedStyle(img).backgroundImage === 'none'
      ? "url('assets/hero-blocks-cut.webp')" : getComputedStyle(img).backgroundImage;
    inner.style.backgroundSize = 'contain';
    inner.style.backgroundPosition = 'center bottom';
    inner.style.backgroundRepeat = 'no-repeat';

    var sy = 0, mx = 0, my = 0, raf = null;
    var fine = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    function render() {
      raf = null;
      var t = 'translate3d(' + (mx * 10) + 'px,' + (-sy * 0.10 + my * 6) + 'px,0)'
            + ' rotateX(' + (-my * 3) + 'deg) rotateY(' + (mx * 4) + 'deg)';
      inner.style.transform = t;
    }
    function queue() { if (!raf) raf = requestAnimationFrame(render); }

    window.addEventListener('scroll', function () {
      sy = Math.min(window.scrollY || 0, 600);
      queue();
    }, { passive: true });

    if (fine) {
      var zone = document.querySelector('.hero-zone') || document.body;
      zone.addEventListener('mousemove', function (e) {
        var r = zone.getBoundingClientRect();
        mx = ((e.clientX - r.left) / r.width - 0.5) * 2;   // -1 〜 1
        my = ((e.clientY - r.top) / r.height - 0.5) * 2;
        queue();
      });
      zone.addEventListener('mouseleave', function () { mx = 0; my = 0; queue(); });
    }
  }
})();
