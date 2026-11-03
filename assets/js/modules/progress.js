/* ==========================================================================
   PROGRESS — доля прочитанной страницы, линией под шапкой.

   Считается не чаще кадра: обработчик прокрутки только поднимает флаг,
   запись в стиль идёт в requestAnimationFrame. Иначе на тачпаде получаем
   сотню пересчётов макета в секунду.
   ========================================================================== */

window.App = window.App || {};

window.App.progress = (function () {
  "use strict";

  var u = window.App.utils;

  var bar = null;
  var queued = false;

  function apply() {
    queued = false;

    var scrollable = document.documentElement.scrollHeight - window.innerHeight;
    /* Страница короче экрана — делить не на что, прогресс всегда полный. */
    var value = scrollable > 0 ? window.scrollY / scrollable : 0;

    bar.style.setProperty("--progress", Math.min(1, Math.max(0, value)).toFixed(4));
  }

  function request() {
    if (queued) return;
    queued = true;
    window.requestAnimationFrame(apply);
  }

  function init() {
    var header = u.$("[data-header]");
    if (!header) return;

    bar = document.createElement("span");
    bar.className = "header__progress";
    bar.setAttribute("aria-hidden", "true");
    header.appendChild(bar);

    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request, { passive: true });
    apply();
  }

  return { init: init };
})();
