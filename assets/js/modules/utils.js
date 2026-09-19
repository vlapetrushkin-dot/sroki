/* ==========================================================================
   UTILS — общая мелочь. Скрипты подключаются классическими <script defer>,
   без ES-модулей: так сайт работает и при открытии файла двойным кликом
   (file:// блокирует import из-за CORS).
   ========================================================================== */

window.App = window.App || {};

window.App.utils = (function () {
  "use strict";

  var STORE_PREFIX = "krich:";

  /** localStorage может быть недоступен (приватный режим, file://). */
  function read(key) {
    try {
      return window.localStorage.getItem(STORE_PREFIX + key);
    } catch (e) {
      return null;
    }
  }

  function write(key, value) {
    try {
      window.localStorage.setItem(STORE_PREFIX + key, value);
    } catch (e) {
      /* молча — не критично для работы сайта */
    }
  }

  /** Пропускаем анимации, если пользователь их отключил в системе. */
  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function on(el, event, handler, options) {
    if (el) el.addEventListener(event, handler, options || false);
  }

  function $(selector, scope) {
    return (scope || document).querySelector(selector);
  }

  function $$(selector, scope) {
    return Array.prototype.slice.call(
      (scope || document).querySelectorAll(selector)
    );
  }

  return {
    read: read,
    write: write,
    prefersReducedMotion: prefersReducedMotion,
    on: on,
    $: $,
    $$: $$
  };
})();
