/* ==========================================================================
   HERO-REEL — шоурил за первым экраном.

   Почему кадры, а не видео: из четырёх роликов портфолио три сняты с
   экрана вместе с интерфейсом Studio и Bandicam, а четвёртый — удар мечом
   на чёрном, и за заголовком от него остаётся одно пятно. Рендеры работ
   плотнее по картинке и весят вдесятеро меньше.

   Кадры сменяются кроссфейдом и всё это время медленно наезжают. Сам по
   себе наезд почти незаметен — он нужен, чтобы слой не читался как
   обычная картинка на фоне.

   Чего это стоит и как удержано в рамках:
     - слой создаётся только на широком экране: на телефоне маска всё
       равно спрятала бы его под текстом;
     - не создаётся при отключённых анимациях, в экономном режиме данных
       и на медленном соединении;
     - смена останавливается, когда первый экран прокручен или вкладка
       ушла в фон;
     - кадры подставляются после полной загрузки страницы, чтобы не
       соревноваться с картинками работ за канал.

   Если что-то из этого не сложилось — слоя просто нет. Заголовок и
   кнопки от него не зависят.
   ========================================================================== */

window.App = window.App || {};

window.App.heroReel = (function () {
  "use strict";

  var u = window.App.utils;

  /* Отобраны по одному признаку: тёмный кадр с одним источником света.
     Светлые рендеры и всё, где в кадр попал интерфейс, сюда не годятся.
     Отдельный кандидат на вылет — крупный яркий персонаж: красный
     единорог на этом месте спорил с акцентом и читался как маскот. */
  var SHOTS = [
    "assets/media/works/building-halloween.jpg",
    "assets/media/works/vfx-portal.jpg",
    "assets/media/works/model-gate.jpg"
  ];

  var MIN_WIDTH = 992;        /* та же граница, что у 62rem в стилях */
  var HOLD = 6500;            /* сколько миллисекунд держится один кадр */

  var layer = null;
  var shots = [];
  var current = 0;
  var timer = null;
  var visible = true;

  /* Экономный режим и медленный канал: оба поля есть не везде, поэтому
     проверяем через необязательный connection. */
  function connectionIsCheap() {
    var c = navigator.connection;
    if (!c) return false;
    if (c.saveData) return true;
    return /(^|-)2g$/.test(c.effectiveType || "");
  }

  function show(i) {
    shots.forEach(function (el, n) {
      el.classList.toggle("is-live", n === i);
    });
  }

  function advance() {
    if (!visible) return;
    current = (current + 1) % shots.length;
    show(current);
  }

  function start() {
    stop();
    timer = window.setInterval(advance, HOLD);
  }

  function stop() {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
  }

  /* Прокрутили первый экран — слой никто не видит, таймеру работать незачем. */
  function watchVisibility() {
    if (!("IntersectionObserver" in window)) return;

    var hero = u.$(".hero");
    if (!hero) return;

    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) start();
      else stop();
    }, { threshold: 0 }).observe(hero);
  }

  function build() {
    shots = SHOTS.map(function (src, i) {
      var el = document.createElement("img");
      el.className = "hero__shot";
      el.src = src;
      el.alt = "";
      el.decoding = "async";
      /* Первый кадр нужен сразу, остальные — когда до них дойдёт очередь. */
      el.loading = i === 0 ? "eager" : "lazy";
      layer.appendChild(el);
      return el;
    });

    show(0);
    start();
    watchVisibility();

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop();
      else if (visible) start();
    });
  }

  function init() {
    layer = u.$("[data-reel]");
    if (!layer) return;
    if (u.prefersReducedMotion()) return;
    if (window.innerWidth < MIN_WIDTH) return;
    if (connectionIsCheap()) return;

    /* Ждём полной загрузки: шоурил — последнее, за что стоит бороться. */
    if (document.readyState === "complete") {
      build();
    } else {
      window.addEventListener("load", build, { once: true });
    }
  }

  return { init: init };
})();
