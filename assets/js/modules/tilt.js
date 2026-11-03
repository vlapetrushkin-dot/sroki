/* ==========================================================================
   TILT — свет за курсором на карточках работ.

   Карточек восемнадцать, и вешать слушатель на каждую накладно. Слушаем
   один pointermove на контейнере групп и пишем координаты в ту карточку,
   над которой курсор. Запись идёт в кадре — координаты копятся в
   переменной, в стиль попадает последняя.

   Пишем только --mx/--my: саму подсветку рисует CSS. Наклона по осям нет
   намеренно — на карточке с текстом он мешает читать.
   ========================================================================== */

window.App = window.App || {};

window.App.tilt = (function () {
  "use strict";

  var u = window.App.utils;

  var active = null;
  var point = { x: 0, y: 0 };
  var queued = false;

  function apply() {
    queued = false;
    if (!active) return;

    var box = active.getBoundingClientRect();
    if (!box.width || !box.height) return;

    active.style.setProperty("--mx", ((point.x - box.left) / box.width * 100).toFixed(2) + "%");
    active.style.setProperty("--my", ((point.y - box.top) / box.height * 100).toFixed(2) + "%");
  }

  function onMove(event) {
    var card = event.target.closest ? event.target.closest(".project-card") : null;

    if (card !== active && active) {
      active.style.removeProperty("--mx");
      active.style.removeProperty("--my");
    }

    active = card;
    if (!active) return;

    point.x = event.clientX;
    point.y = event.clientY;

    if (!queued) {
      queued = true;
      window.requestAnimationFrame(apply);
    }
  }

  function init() {
    if (u.prefersReducedMotion()) return;
    /* Тач-устройства шлют pointermove только во время касания — подсветка
       там только мешала бы прокрутке. */
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    var root = u.$("[data-works-groups]");
    if (!root) return;

    root.addEventListener("pointermove", onMove, { passive: true });
    root.addEventListener("pointerleave", function () {
      if (!active) return;
      active.style.removeProperty("--mx");
      active.style.removeProperty("--my");
      active = null;
    }, { passive: true });
  }

  return { init: init };
})();
