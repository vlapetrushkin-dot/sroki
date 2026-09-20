/* ==========================================================================
   THEME — тёмная / светлая. Выбор запоминается, по умолчанию берётся
   системная настройка. Чтобы не было вспышки светлого фона при загрузке,
   data-theme ставится инлайн-скриптом в <head>; здесь только переключение.
   ========================================================================== */

window.App = window.App || {};

window.App.theme = (function () {
  "use strict";

  var u = window.App.utils;
  var root = document.documentElement;

  function currentTheme() {
    return root.getAttribute("data-theme") === "light" ? "light" : "dark";
  }

  function set(theme) {
    /* Глушим переходы на время смены темы — иначе элементы с
       transition по var()-цвету застревают на цвете прежней темы.
       Подробности в reset.css. */
    root.classList.add("is-theme-switching");

    root.setAttribute("data-theme", theme);
    u.write("theme", theme);

    var meta = u.$('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "light" ? "#f4f5f3" : "#0b0c0e");

    /* Два кадра: первый отдаём под пересчёт стилей без переходов,
       на втором возвращаем анимации. */
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        root.classList.remove("is-theme-switching");
        /* Холст рисует своими цветами и о смене темы сам не узнает. */
        root.dispatchEvent(new CustomEvent("themechange", { detail: theme }));
      });
    });
  }

  function toggle() {
    set(currentTheme() === "light" ? "dark" : "light");
  }

  function init() {
    /* Если инлайн-скрипт не отработал — выставляем тему здесь. */
    if (!root.getAttribute("data-theme")) {
      var saved = u.read("theme");
      var systemLight = window.matchMedia("(prefers-color-scheme: light)").matches;
      set(saved || (systemLight ? "light" : "dark"));
    }

    u.$$("[data-theme-toggle]").forEach(function (btn) {
      u.on(btn, "click", toggle);
    });
  }

  return {
    init: init,
    toggle: toggle,
    set: set
  };
})();
