/* ==========================================================================
   WORKS — сборка портфолио из projects.js и groups.js.

   Структура: группа → подгруппа → карточки. У каждой группы свой класс
   оформления (work-group--<id>), но палитра, сетка и толщина линий общие —
   то же правило, что у мотивов дисциплин.

   Карточки строятся из данных, а не лежат в разметке: пятнадцать работ с
   галереями раздули бы index.html, а список нужно править часто. Плата за
   это — без JS секция работ пуста; остальные секции остаются читаемыми.
   ========================================================================== */

window.App = window.App || {};

window.App.works = (function () {
  "use strict";

  var u = window.App.utils;
  var DATA = window.APP_PROJECTS || [];
  var GROUPS = window.APP_GROUPS || [];
  var PATH = "assets/media/works/";

  var host, empty, resultEl;
  var activeCat = "all";

  function loc(field) {
    if (!field) return "";
    return field[window.App.i18n.current] || field.en || field.ru || "";
  }

  function esc(str) {
    return String(str)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function t(key) {
    return window.App.i18n.t(key);
  }

  /* --- Значки подгрупп ---------------------------------------------------
     Те же примитивы, что в мотивах дисциплин, только мельче. */

  var SUB_ICONS = {
    building:  '<path d="M3 20h18M7 20v-6h5v6M12 14V8h5v12"/>',
    modelling: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9zM12 3v9l8 4.5M12 12l-8 4.5"/>',
    vfx:       '<path d="M12 21v-4M12 13V9M8 17l-1-2M16 17l1-2M9 7L8 5M15 7l1-2M12 5V3"/>',
    gui:       '<path d="M3 5h18v14H3zM3 9h18M6 12h5M6 15h5M14 12h4"/>',
    scripting: '<path d="M4 6h9M7 10h11M7 14h7M4 18h8M18 16v4"/>',
    music:     '<path d="M9 18V6l10-2v12M9 18a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0zM19 16a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"/>',
    sfx:       '<path d="M4 9h3l4-4v14l-4-4H4zM15 9a4 4 0 0 1 0 6M18 6a8 8 0 0 1 0 12"/>'
  };

  function subIcon(name) {
    var path = SUB_ICONS[name] || SUB_ICONS.building;
    return '<svg class="work-sub__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      path + "</svg>";
  }

  /* --- Осциллограмма для аудио-работ -------------------------------------
     Высоты столбиков выводятся из id: у каждой работы своя картинка,
     но одна и та же при каждой загрузке. */

  function hash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function waveform(id) {
    var seed = hash(id);
    var bars = [];
    var count = 44;
    for (var i = 0; i < count; i++) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      var height = 14 + (seed % 72);
      var accent = i > count / 2 - 5 && i < count / 2 + 5;
      bars.push(
        '<span class="waveform__bar' + (accent ? " waveform__bar--accent" : "") +
        '" style="height:' + height + '%"></span>'
      );
    }
    return '<span class="waveform" aria-hidden="true">' + bars.join("") + "</span>";
  }

  /* --- Куски разметки ---------------------------------------------------- */

  var ICON_PLAY = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 1.5v9l7-4.5z"/></svg>';
  var ICON_PAUSE = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 2h2v8H3zM7 2h2v8H7z"/></svg>';
  /* Значки заливные: в .project-card__flag стоит fill, а не stroke,
     поэтому контурные пути превратились бы в сплошные пятна. */
  var ICON_IMAGE = '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill-rule="evenodd" d="M1.5 3.5h13v9h-13v-9zm1.5 1.5v6h10V5H3z"/></svg>';
  var ICON_SOUND = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 6h2.5L9 3v10L5.5 10H3z"/></svg>';

  function coverHtml(p) {
    var first = p.media[0];

    if (first.type === "audio") {
      return waveform(p.id) +
        '<span class="project-card__flag project-card__flag--type">' + ICON_SOUND +
        p.media.length + "</span>";
    }

    var src = first.type === "video" ? first.poster : first.thumb;
    var out = '<img class="project-card__img" src="' + PATH + esc(src) +
      '" alt="" loading="lazy" decoding="async">';

    if (first.type === "video") {
      out += '<span class="project-card__play" aria-hidden="true">' + ICON_PLAY + "</span>";
    }
    if (p.media.length > 1) {
      out += '<span class="project-card__flag project-card__flag--count">' +
        ICON_IMAGE + p.media.length + "</span>";
    }
    return out;
  }

  function tracksHtml(p) {
    return p.media.map(function (m) {
      return (
        '<div class="player">' +
          '<button class="player__btn" type="button" aria-label="' + esc(t("player.play")) + '">' +
            '<span class="player__icon--play">' + ICON_PLAY + "</span>" +
            '<span class="player__icon--pause">' + ICON_PAUSE + "</span>" +
          "</button>" +
          '<span class="player__body">' +
            '<span class="player__name">' + esc(loc(m.title)) + "</span>" +
            '<span class="player__track"><span class="player__fill"></span></span>' +
          "</span>" +
          '<span class="player__time">0:00 / 0:00</span>' +
          '<audio preload="none" src="' + PATH + esc(m.src) + '"></audio>' +
        "</div>"
      );
    }).join("");
  }

  function cardHtml(p) {
    var isAudio = p.media[0].type === "audio";
    var tags = (p.tags || []).map(function (tag) {
      return '<li class="badge">' + esc(tag) + "</li>";
    }).join("");

    var openLabel = t(isAudio ? "works.listen" : "works.open");

    var mediaEl = isAudio
      ? '<div class="project-card__media">' + coverHtml(p) + "</div>"
      : '<button class="project-card__media" type="button" data-open="' + esc(p.id) +
        '" aria-label="' + esc(openLabel + ": " + loc(p.title)) + '">' + coverHtml(p) + "</button>";

    var listen = isAudio
      ? '<button class="project-card__listen" type="button" data-listen="' + esc(p.id) + '" aria-expanded="false">' +
          "<span>" + esc(openLabel) + " · " + p.media.length + "</span>" +
          '<svg class="project-card__listen-chevron" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M4 6l4 4 4-4"/></svg>' +
        "</button>" +
        '<div class="project-card__tracks" data-tracks="' + esc(p.id) + '">' +
          '<div class="project-card__tracks-inner">' + tracksHtml(p) + "</div>" +
        "</div>"
      : "";

    var link = p.link
      ? '<a class="u-link project-card__link" href="' + esc(p.link.url) +
        '" target="_blank" rel="noopener">' + esc(p.link.label) + "</a>"
      : "";

    var year = p.year ? '<span class="project-card__year u-label">' + esc(p.year) + "</span>" : "";

    return (
      '<article class="project-card" data-cat="' + esc(p.cat) + '" data-card="' + esc(p.id) + '">' +
        mediaEl +
        '<div class="project-card__body">' +
          '<div class="project-card__top">' +
            '<h4 class="project-card__title">' + esc(loc(p.title)) + "</h4>" +
            year +
          "</div>" +
          '<p class="project-card__role">' + esc(loc(p.role)) + "</p>" +
          (p.desc ? '<p class="project-card__desc">' + esc(loc(p.desc)) + "</p>" : "") +
          link +
          '<ul class="badge-list project-card__tags">' + tags + "</ul>" +
          listen +
        "</div>" +
      "</article>"
    );
  }

  function subHtml(sub, items) {
    return (
      '<div class="work-sub" data-sub="' + esc(sub.cat) + '">' +
        '<div class="work-sub__head">' +
          subIcon(sub.icon) +
          '<h4 class="work-sub__title">' + esc(t("sub." + sub.cat)) + "</h4>" +
          '<span class="work-sub__count u-label">' + items.length + "</span>" +
          '<span class="work-sub__rule" aria-hidden="true"></span>' +
        "</div>" +
        '<div class="works__grid">' + items.map(cardHtml).join("") + "</div>" +
      "</div>"
    );
  }

  /* Шапка группы: персонаж и выезжающая из-под него плашка.
     Без персонажа остаётся обычный заголовок — сцена не обязательна. */
  function headHtml(group) {
    var ch = group.character;

    var panel =
      '<div class="scene__panel">' +
        '<div class="scene__top">' +
          '<span class="u-label">' + esc(group.num) + "</span>" +
          '<span class="scene__rule" aria-hidden="true"></span>' +
        "</div>" +
        '<h3 class="scene__title">' + esc(loc(group.title)) + "</h3>" +
        '<p class="scene__lead">' + esc(loc(group.lead)) + "</p>" +
      "</div>";

    if (!ch) {
      return '<div class="work-group__head">' + panel + "</div>";
    }

    /* Посадка персонажа задаётся данными: у разных артов край занят
       по-разному, и единого нахлёста на всех не существует. */
    var tune = [];
    if (ch.overlap != null) tune.push("--overlap:" + ch.overlap + "px");
    if (ch.offsetY) tune.push("--char-shift:" + ch.offsetY + "px");
    var style = tune.length ? ' style="' + tune.join(";") + '"' : "";

    return (
      '<div class="scene scene--' + esc(ch.side) + (ch.backlit ? " scene--backlit" : "") +
        '" data-scene' + style + ">" +
        '<div class="scene__inner">' +
          '<figure class="scene__char">' +
            '<img src="assets/img/characters/' + esc(ch.file) +
              '" alt="" loading="lazy" decoding="async"' +
              (ch.w ? ' width="' + ch.w + '" height="' + ch.h + '"' : "") + ">" +
          "</figure>" +
          panel +
        "</div>" +
      "</div>"
    );
  }

  function groupHtml(group) {
    var subs = group.subs.map(function (sub) {
      var items = DATA.filter(function (p) { return p.cat === sub.cat; });
      return items.length ? subHtml(sub, items) : "";
    }).join("");

    if (!subs) return "";

    return (
      '<section class="work-group work-group--' + esc(group.id) + '" data-group="' + esc(group.id) + '">' +
        '<div class="work-group__bg" aria-hidden="true"></div>' +
        headHtml(group) +
        subs +
      "</section>"
    );
  }

  /* --- Фильтрация --------------------------------------------------------- */

  function applyFilter() {
    var shown = 0;

    u.$$(".project-card", host).forEach(function (card) {
      var match = activeCat === "all" || card.dataset.cat === activeCat;
      card.hidden = !match;
      if (match) shown++;
    });

    /* Пустые подгруппы и группы убираем целиком, иначе от фильтра
       остались бы висеть заголовки без содержимого. */
    u.$$(".work-sub", host).forEach(function (sub) {
      sub.hidden = !u.$$(".project-card:not([hidden])", sub).length;
    });

    u.$$(".work-group", host).forEach(function (group) {
      group.hidden = !u.$$(".work-sub:not([hidden])", group).length;
    });

    empty.hidden = shown > 0;

    if (resultEl) {
      resultEl.textContent = t("works.shown")
        .replace("{n}", shown)
        .replace("{total}", DATA.length);
    }
  }

  function filter(cat) {
    activeCat = cat;
    window.App.audioPlayer.stopAll();
    applyFilter();
  }

  /* --- Отрисовка ---------------------------------------------------------- */

  function bind() {
    u.$$("[data-open]", host).forEach(function (btn) {
      u.on(btn, "click", function () {
        window.App.lightbox.open(btn.getAttribute("data-open"));
      });
    });

    u.$$("[data-listen]", host).forEach(function (btn) {
      u.on(btn, "click", function () {
        var panel = u.$('[data-tracks="' + btn.getAttribute("data-listen") + '"]', host);
        var open = panel.classList.toggle("is-open");
        btn.setAttribute("aria-expanded", open ? "true" : "false");
      });
    });

    window.App.audioPlayer.initAll(host);
  }

  function render() {
    host.innerHTML = GROUPS.map(groupHtml).join("");
    bind();
    applyFilter();

    /* Сцены пересозданы — модуль прокрутки должен взять новые узлы. */
    if (window.App.scene) window.App.scene.refresh();
  }

  function init() {
    host = u.$("[data-works-groups]");
    empty = u.$("[data-works-empty]");
    resultEl = u.$("[data-works-result]");
    if (!host) return;

    render();

    /* Язык сменился — карточки собраны из данных, перерисовываем. */
    window.App.i18n.onChange(function () {
      render();
    });
  }

  return {
    init: init,
    filter: filter,
    render: render,
    get data() { return DATA; },
    get groups() { return GROUPS; },
    get activeCat() { return activeCat; }
  };
})();
