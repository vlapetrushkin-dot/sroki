/* ==========================================================================
   SCENE — прогресс прокрутки для сцен с персонажами.

   Считает, насколько сцена прошла по экрану, и пишет значение 0…1 в
   переменную --p. Всё движение описано в CSS через эту переменную —
   скрипт только сообщает «где мы», а не двигает элементы сам.

   Замеры собираются пачкой и применяются одним кадром: чтение
   getBoundingClientRect и запись стилей вперемешку заставляли бы браузер
   пересчитывать раскладку на каждой сцене.
   ========================================================================== */

window.App = window.App || {};

window.App.scene = (function () {
  "use strict";

  var u = window.App.utils;
  var scenes = [];
  var ticking = false;

  function clamp(v) {
    return v < 0 ? 0 : v > 1 ? 1 : v;
  }

  function measure() {
    var vh = window.innerHeight;
    var out = [];

    for (var i = 0; i < scenes.length; i++) {
      var rect = scenes[i].getBoundingClientRect();

      /* 0 — сцена только показалась снизу, 1 — поднялась до верхней трети.
         Нижняя граница чуть выше края экрана: иначе выезд начинается,
         когда сцену ещё не видно. */
      var from = vh * 0.88;
      var to = vh * 0.38;
      out.push(clamp((from - rect.top) / (from - to)));
    }
    return out;
  }

  function apply(values) {
    for (var i = 0; i < scenes.length; i++) {
      scenes[i].style.setProperty("--p", values[i].toFixed(3));
    }
  }

  function update() {
    apply(measure());
    ticking = false;
  }

  function request() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }

  var bound = false;

  /** Пересобирает список сцен. Карточки работ перерисовываются при смене
      языка, вместе с ними пересоздаются и сцены — старые ссылки протухают. */
  function refresh() {
    if (u.prefersReducedMotion()) return;

    scenes = u.$$("[data-scene]");
    if (!scenes.length) return;

    update();

    /* Картинки грузятся лениво: пока персонаж не подгрузился, высота
       сцены другая, и прогресс посчитан по старой раскладке. */
    u.$$("[data-scene] img").forEach(function (img) {
      if (img.complete) return;
      u.on(img, "load", request);
    });
  }

  function init() {
    if (u.prefersReducedMotion()) return;

    refresh();

    /* Слушатели вешаются один раз: refresh может вызываться многократно. */
    if (!bound) {
      bound = true;
      u.on(window, "scroll", request, { passive: true });
      u.on(window, "resize", request);
    }
  }

  return {
    init: init,
    refresh: refresh,
    update: update
  };
})();
