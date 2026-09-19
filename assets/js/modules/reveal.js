/* ==========================================================================
   REVEAL — появление блоков при прокрутке.

   Элемент помечается data-reveal. Если IntersectionObserver недоступен или
   пользователь отключил анимации, всё просто остаётся видимым: анимация
   здесь украшение, а не условие читаемости.
   ========================================================================== */

window.App = window.App || {};

window.App.reveal = (function () {
  "use strict";

  var u = window.App.utils;

  function init() {
    var items = u.$$("[data-reveal]");
    if (!items.length) return;

    if (u.prefersReducedMotion() || !("IntersectionObserver" in window)) {
      items.forEach(function (el) {
        el.classList.add("is-revealed");
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
    );

    items.forEach(function (el, i) {
      /* Лесенка внутри одной группы, чтобы шаги проявлялись по очереди. */
      var group = el.closest("[data-reveal-group]");
      if (group) {
        var siblings = u.$$("[data-reveal]", group);
        el.style.transitionDelay = siblings.indexOf(el) * 70 + "ms";
      }
      observer.observe(el);
    });
  }

  return { init: init };
})();
