/* ==========================================================================
   LIGHTBOX — просмотр работы: картинки и видео, стрелки, клавиатура.

   Разметка оболочки лежит в index.html, содержимое подставляется отсюда.
   ========================================================================== */

window.App = window.App || {};

window.App.lightbox = (function () {
  "use strict";

  var u = window.App.utils;
  var PATH = "assets/media/works/";

  var box, stage, titleEl, roleEl, descEl, counterEl, prevBtn, nextBtn, closeBtn;
  var project = null;
  var index = 0;
  var lastFocused = null;

  function loc(field) {
    if (!field) return "";
    return field[window.App.i18n.current] || field.en || field.ru || "";
  }

  function find(id) {
    var list = window.App.works.data;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return null;
  }

  /* --- Показ кадра -------------------------------------------------------- */

  var SHIFT = 40;   /* на сколько пикселей кадр въезжает и уезжает */

  function mediaEl(item) {
    var el;
    if (item.type === "video") {
      el = document.createElement("video");
      el.src = PATH + item.src;
      el.poster = PATH + item.poster;
      el.controls = true;
      el.loop = true;
      el.playsInline = true;
      el.autoplay = true;
      el.muted = true;      /* без mute браузер не даст автозапуск */
    } else {
      el = document.createElement("img");
      el.src = PATH + item.src;
      el.alt = loc(project.title);
    }
    el.className = "lightbox__media";
    return el;
  }

  /**
   * @param {number} direction  0 — открытие без движения, ±1 — перелистывание
   */
  function show(direction) {
    var item = project.media[index];

    var slide = document.createElement("div");
    slide.className = "lightbox__slide";
    slide.appendChild(mediaEl(item));

    var old = u.$(".lightbox__slide", stage);

    if (direction && old) {
      /* Новый кадр приезжает с той стороны, куда листаем. */
      slide.style.setProperty("--shift", direction * SHIFT + "px");
      slide.classList.add("lightbox__slide--enter");
      stage.appendChild(slide);

      /* Полный кадр на применение стартового состояния — иначе браузер
         схлопнет его с конечным и перехода не будет видно. */
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          slide.classList.remove("lightbox__slide--enter");
        });
      });

      old.style.setProperty("--shift", -direction * SHIFT + "px");
      old.classList.add("lightbox__slide--leave");

      var done = false;
      var drop = function () {
        if (done) return;
        done = true;
        old.remove();
      };
      u.on(old, "transitionend", drop);
      /* Подстраховка: в фоновой вкладке переходы не идут и события
         transitionend не будет — старый кадр иначе остался бы висеть. */
      setTimeout(drop, 600);
    } else {
      if (old) old.remove();
      stage.appendChild(slide);
    }

    var many = project.media.length > 1;
    prevBtn.hidden = !many;
    nextBtn.hidden = !many;
    counterEl.textContent = many ? index + 1 + " / " + project.media.length : "";
  }

  function step(delta) {
    if (!project) return;
    var total = project.media.length;
    index = (index + delta + total) % total;

    /* Остановим видео уходящего кадра, чтобы звук не тянулся за ним. */
    stage.querySelectorAll("video").forEach(function (v) {
      v.pause();
    });

    show(delta > 0 ? 1 : -1);
  }

  /* --- Открытие и закрытие ------------------------------------------------ */

  function open(id, startIndex) {
    project = find(id);
    if (!project) return;

    window.App.audioPlayer.stopAll();

    index = startIndex || 0;
    lastFocused = document.activeElement;

    titleEl.textContent = loc(project.title);
    roleEl.textContent = loc(project.role);
    descEl.textContent = loc(project.desc);

    show(0);
    box.classList.add("is-open");
    box.setAttribute("aria-hidden", "false");
    document.body.classList.add("is-lightbox-open");

    /* Фокус — через полный кадр. На нулевом моменте перехода шторка ещё
       visibility:hidden, а focus() на невидимой кнопке молча уходит в body:
       клавиатурный пользователь остался бы вне диалога. */
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        closeBtn.focus();
      });
    });
  }

  function close() {
    box.classList.remove("is-open");
    box.setAttribute("aria-hidden", "true");
    document.body.classList.remove("is-lightbox-open");

    /* Видео продолжило бы играть за закрытой шторкой. */
    stage.querySelectorAll("video").forEach(function (v) {
      v.pause();
    });

    project = null;
    if (lastFocused) lastFocused.focus();
  }

  function isOpen() {
    return box.classList.contains("is-open");
  }

  /* --- Клавиатура --------------------------------------------------------- */

  function onKey(e) {
    if (!isOpen()) return;

    if (e.key === "Escape") {
      close();
      return;
    }
    if (e.key === "ArrowLeft") {
      step(-1);
      return;
    }
    if (e.key === "ArrowRight") {
      step(1);
      return;
    }

    /* Фокус не должен уходить за шторку. */
    if (e.key === "Tab") {
      var items = u.$$("button:not([hidden]), video, a[href]", box);
      if (!items.length) return;

      var first = items[0];
      var last = items[items.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  function init() {
    box = u.$("[data-lightbox]");
    if (!box) return;

    stage = u.$("[data-lightbox-stage]", box);
    titleEl = u.$("[data-lightbox-title]", box);
    roleEl = u.$("[data-lightbox-role]", box);
    descEl = u.$("[data-lightbox-desc]", box);
    counterEl = u.$("[data-lightbox-counter]", box);
    prevBtn = u.$("[data-lightbox-prev]", box);
    nextBtn = u.$("[data-lightbox-next]", box);
    closeBtn = u.$("[data-lightbox-close]", box);

    u.on(closeBtn, "click", close);
    u.on(prevBtn, "click", function () { step(-1); });
    u.on(nextBtn, "click", function () { step(1); });
    u.on(document, "keydown", onKey);

    /* Клик по фону закрывает, клик по самому кадру — нет. Слой кадра
       растянут на всю сцену, поэтому он тоже считается фоном. */
    u.on(stage, "click", function (e) {
      if (e.target === stage || e.target.classList.contains("lightbox__slide")) {
        close();
      }
    });
  }

  return {
    init: init,
    open: open,
    close: close
  };
})();
