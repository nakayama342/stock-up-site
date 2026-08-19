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

