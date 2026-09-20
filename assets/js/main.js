/* ==========================================================================
   MAIN — точка сборки. Порядок: язык → тема → навигация.
   Новые модули этапов 2-8 добавляются сюда одной строкой.
   ========================================================================== */

(function () {
  "use strict";

  function init() {
    /* Класс js ставится до отрисовки секций: на нём висят состояния,
       которые без скрипта включать нельзя (например, скрытые до появления
       блоки — иначе при отключённом JS они остались бы невидимыми). */
    document.documentElement.classList.remove("no-js");
    document.documentElement.classList.add("js");

    window.App.i18n.init();
    window.App.theme.init();
    window.App.nav.init();

    /* Порядок внутри работ важен: lightbox ждёт данные, filters — works. */
    window.App.lightbox.init();
    window.App.works.init();
    window.App.filters.init();

    window.App.form.init();
    window.App.reveal.init();

    /* Сцены существуют только после отрисовки работ — отсюда и порядок. */
    window.App.scene.init();
    window.App.constellation.init();
    window.App.magnetic.init();

    /* Год в подвале — чтобы не устаревал. */
    var year = document.querySelector("[data-year]");
    if (year) year.textContent = new Date().getFullYear();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
