/* ==========================================================================
   MAGNETIC — элементы слегка тянутся к курсору.

   Вешается на [data-magnetic]. Сдвиг небольшой и всегда возвращается в
   ноль: это отклик на приближение, а не перемещение элемента. Слишком
   большой сдвиг ломает попадание по кнопке — курсор целится в одно место,
   а кнопка уезжает в другое.

   Только при тонком указателе: на тач-экране нет ни курсора, ни hover.
   ========================================================================== */

window.App = window.App || {};

window.App.magnetic = (function () {
  "use strict";

  var u = window.App.utils;
  var STRENGTH = 0.22;   /* доля расстояния до курсора */
  var MAX = 8;           /* предел сдвига в пикселях */

  function attach(el) {
    var frame = null;

    function move(e) {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(function () {
        var r = el.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) * STRENGTH;
        var dy = (e.clientY - (r.top + r.height / 2)) * STRENGTH;

        dx = Math.max(-MAX, Math.min(MAX, dx));
        dy = Math.max(-MAX, Math.min(MAX, dy));

        el.style.transform = "translate(" + dx.toFixed(1) + "px," + dy.toFixed(1) + "px)";
      });
    }

    function reset() {
      if (frame) cancelAnimationFrame(frame);
      el.style.transform = "";
    }

    u.on(el, "pointermove", move);
    u.on(el, "pointerleave", reset);
    /* После нажатия элемент может остаться смещённым — сбрасываем. */
    u.on(el, "blur", reset);
  }

  function init() {
    if (u.prefersReducedMotion()) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    u.$$("[data-magnetic]").forEach(attach);
  }

  return { init: init };
})();
