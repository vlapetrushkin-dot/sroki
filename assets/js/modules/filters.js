/* ==========================================================================
   FILTERS — чипы фильтра над сеткой работ.

   Список категорий выводится из данных: пустых фильтров не бывает,
   а добавленная в projects.js дисциплина появляется здесь сама.
   ========================================================================== */

window.App = window.App || {};

window.App.filters = (function () {
  "use strict";

  var u = window.App.utils;
  var host;

  function counts() {
    var map = {};
    window.App.works.data.forEach(function (p) {
      map[p.cat] = (map[p.cat] || 0) + 1;
    });
    return map;
  }

  /* Порядок берётся из групп, а не задаётся отдельно: чипы идут в том же
     порядке, что и разделы на странице. */
  function order() {
    var out = [];
    window.App.works.groups.forEach(function (group) {
      group.subs.forEach(function (sub) {
        out.push(sub.cat);
      });
    });
    return out;
  }

  function chip(cat, label, count, pressed) {
    return (
      '<button class="filters__chip" type="button" data-filter="' + cat +
      '" aria-pressed="' + (pressed ? "true" : "false") + '">' +
      "<span>" + label + "</span>" +
      '<span class="filters__count">' + count + "</span>" +
      "</button>"
    );
  }

  function render() {
    var map = counts();
    var total = window.App.works.data.length;
    var active = window.App.works.activeCat;

    var html = chip("all", window.App.i18n.t("works.all"), total, active === "all");

    order().forEach(function (cat) {
      if (!map[cat]) return;
      html += chip(cat, window.App.i18n.t("sub." + cat), map[cat], active === cat);
    });

    host.innerHTML = html;

    u.$$("[data-filter]", host).forEach(function (btn) {
      u.on(btn, "click", function () {
        var cat = btn.getAttribute("data-filter");
        window.App.works.filter(cat);

        u.$$("[data-filter]", host).forEach(function (other) {
          other.setAttribute("aria-pressed", other === btn ? "true" : "false");
        });
      });
    });
  }

  function init() {
    host = u.$("[data-filters]");
    if (!host) return;

    render();
    window.App.i18n.onChange(render);
  }

  return { init: init };
})();
