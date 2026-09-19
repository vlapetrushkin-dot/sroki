/* ==========================================================================
   I18N — переключение RU / EN без перезагрузки.
   Разметка помечается атрибутами:
     data-i18n="key"                     → textContent
     data-i18n-html="key"                → innerHTML (только наш словарь)
     data-i18n-attr="aria-label:key"     → атрибуты, через ; несколько
   ========================================================================== */

window.App = window.App || {};

window.App.i18n = (function () {
  "use strict";

  var u = window.App.utils;
  var DICT = window.APP_I18N || {};
  var FALLBACK = "en";
  var current = FALLBACK;
  var listeners = [];

  /* Разметка из data-i18n обновляется сама, а блоки, собранные из данных
     (работы), должны перерисоваться — для них подписка. */
  function onChange(fn) {
    listeners.push(fn);
  }

  function notify() {
    listeners.forEach(function (fn) {
      try {
        fn(current);
      } catch (e) {
        /* один сломавшийся подписчик не должен ломать переключение языка */
      }
    });
  }

  function detect() {
    var saved = u.read("lang");
    if (saved && DICT[saved]) return saved;

    var browser = (navigator.language || navigator.userLanguage || "").toLowerCase();
    return browser.indexOf("ru") === 0 ? "ru" : "en";
  }

  function t(key) {
    var pack = DICT[current] || DICT[FALLBACK] || {};
    return Object.prototype.hasOwnProperty.call(pack, key) ? pack[key] : key;
  }

  function apply() {
    u.$$("[data-i18n]").forEach(function (el) {
      el.textContent = t(el.getAttribute("data-i18n"));
    });

    u.$$("[data-i18n-html]").forEach(function (el) {
      el.innerHTML = t(el.getAttribute("data-i18n-html"));
    });

    u.$$("[data-i18n-attr]").forEach(function (el) {
      el.getAttribute("data-i18n-attr")
        .split(";")
        .forEach(function (pair) {
          var parts = pair.split(":");
          if (parts.length === 2) {
            el.setAttribute(parts[0].trim(), t(parts[1].trim()));
          }
        });
    });

    document.documentElement.setAttribute("lang", current);
    document.title = t("meta.title");

    var desc = u.$('meta[name="description"]');
    if (desc) desc.setAttribute("content", t("meta.desc"));

    u.$$("[data-lang-btn]").forEach(function (btn) {
      var isCurrent = btn.getAttribute("data-lang-btn") === current;
      btn.setAttribute("aria-pressed", isCurrent ? "true" : "false");
    });
  }

  function set(lang) {
    if (!DICT[lang] || lang === current) return;
    current = lang;
    u.write("lang", lang);
    apply();
    notify();
  }

  function init() {
    current = detect();
    apply();

    u.$$("[data-lang-btn]").forEach(function (btn) {
      u.on(btn, "click", function () {
        set(btn.getAttribute("data-lang-btn"));
      });
    });
  }

  return {
    init: init,
    set: set,
    t: t,
    onChange: onChange,
    get current() {
      return current;
    }
  };
})();
