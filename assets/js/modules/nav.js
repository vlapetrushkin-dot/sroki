/* ==========================================================================
   NAV — плотность шапки при скролле, мобильное меню, активная секция.
   ========================================================================== */

window.App = window.App || {};

window.App.nav = (function () {
  "use strict";

  var u = window.App.utils;
  var header, toggle, menu;
  var SCROLL_THRESHOLD = 24;

  /* --- Шапка ------------------------------------------------------------- */

  function onScroll() {
    header.classList.toggle("is-scrolled", window.scrollY > SCROLL_THRESHOLD);
  }

  /* --- Мобильное меню ---------------------------------------------------- */

  function setMenu(open) {
    if (!menu || !toggle) return;
    menu.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute(
      "aria-label",
      window.App.i18n.t(open ? "menu.close" : "menu.open")
    );
    document.body.classList.toggle("is-menu-open", open);
  }

  function isMenuOpen() {
    return menu ? menu.classList.contains("is-open") : false;
  }

  /* --- Активная ссылка --------------------------------------------------- */

  function watchSections() {
    var links = u.$$("[data-nav-link]");
    if (!links.length || !("IntersectionObserver" in window)) return;

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var id = entry.target.getAttribute("id");
          links.forEach(function (link) {
            link.classList.toggle(
              "is-active",
              link.getAttribute("href") === "#" + id
            );
          });
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );

    u.$$("section[id]").forEach(function (section) {
      observer.observe(section);
    });
  }

  /* --- Инициализация ----------------------------------------------------- */

  function init() {
    header = u.$("[data-header]");
    toggle = u.$("[data-nav-toggle]");
    menu = u.$("[data-mobile-menu]");

    if (header) {
      onScroll();
      u.on(window, "scroll", onScroll, { passive: true });
    }

    u.on(toggle, "click", function () {
      setMenu(!isMenuOpen());
    });

    /* Закрываем меню после перехода по ссылке и по Esc. */
    u.$$("[data-menu-link]").forEach(function (link) {
      u.on(link, "click", function () {
        setMenu(false);
      });
    });

    u.on(document, "keydown", function (e) {
      if (e.key === "Escape" && isMenuOpen()) {
        setMenu(false);
        if (toggle) toggle.focus();
      }
    });

    /* На десктопе мобильное меню скрыто — снимаем блокировку скролла. */
    u.on(window.matchMedia("(min-width: 62rem)"), "change", function (e) {
      if (e.matches && isMenuOpen()) setMenu(false);
    });

    watchSections();
  }

  return {
    init: init,
    closeMenu: function () {
      setMenu(false);
    }
  };
})();
