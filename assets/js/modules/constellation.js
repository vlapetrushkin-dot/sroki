/* ==========================================================================
   CONSTELLATION — сетка точек, связывающихся линиями возле курсора.

   Точки медленно дрейфуют сами по себе; курсор работает как ещё один узел:
   всё в его радиусе подтягивается к нему и связывается линиями. Чем ближе
   две точки — тем ярче линия между ними.

   Что здесь важно для производительности:
     - плотность считается от площади экрана, а не берётся фиксированной;
     - цикл останавливается, когда вкладка скрыта, — иначе он крутится
       вхолостую и жрёт батарею;
     - на тач-устройствах без мыши и при отключённых анимациях слой вообще
       не создаётся: там он бессмыслен.

   Цвета берутся из токенов, поэтому при смене темы их надо перечитать.
   ========================================================================== */

window.App = window.App || {};

window.App.constellation = (function () {
  "use strict";

  var u = window.App.utils;

  var canvas, ctx;
  var points = [];
  var width = 0, height = 0, dpr = 1;
  var raf = null;

  /* Курсор. active = мышь на странице; без неё рисуется только дрейф. */
  var mouse = { x: -9999, y: -9999, active: false };

  var LINK = 132;        /* дистанция связи между точками */
  var MOUSE_LINK = 190;  /* радиус, в котором точки цепляются к курсору */
  var PULL = 0.00055;    /* сила притяжения к курсору */
  var SPEED = 0.16;

  var colors = { line: "244,245,243", accent: "184,255,60" };

  /* --- Цвета из токенов --------------------------------------------------- */

  function parseRgb(value) {
    var m = value.match(/(\d+),\s*(\d+),\s*(\d+)/);
    if (m) return m[1] + "," + m[2] + "," + m[3];

    var hex = value.trim().replace("#", "");
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    if (hex.length >= 6) {
      return [
        parseInt(hex.slice(0, 2), 16),
        parseInt(hex.slice(2, 4), 16),
        parseInt(hex.slice(4, 6), 16)
      ].join(",");
    }
    return null;
  }

  function readColors() {
    var cs = getComputedStyle(document.documentElement);
    colors.line = parseRgb(cs.getPropertyValue("--c-text")) || colors.line;
    colors.accent = parseRgb(cs.getPropertyValue("--c-accent-text")) || colors.accent;
  }

  /* --- Раскладка ---------------------------------------------------------- */

  function density() {
    var area = width * height;
    return Math.max(26, Math.min(88, Math.round(area / 19000)));
  }

  function seed() {
    var count = density();
    points = [];
    for (var i = 0; i < count; i++) {
      points.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * SPEED,
        vy: (Math.random() - 0.5) * SPEED,
        r: Math.random() * 1.1 + 0.7
      });
    }
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    seed();
  }

  /* --- Кадр --------------------------------------------------------------- */

  /* Фон не обязан идти в 60 fps: дрейф медленный, разницы на глаз нет,
     а работы для процессора вдвое меньше — это заметно на ноутбуке от
     батареи. Пропущенные кадры просто выходят из функции. */
  var FRAME_MS = 1000 / 34;
  var lastFrame = 0;

  function frame(now) {
    raf = requestAnimationFrame(frame);

    if (now - lastFrame < FRAME_MS) return;
    lastFrame = now;

    draw();
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    var i, j, a, b, dx, dy, dist;

    for (i = 0; i < points.length; i++) {
      a = points[i];

      /* Притяжение к курсору — мягкое, иначе точки схлопываются в ком. */
      if (mouse.active) {
        dx = mouse.x - a.x;
        dy = mouse.y - a.y;
        dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MOUSE_LINK * 1.6 && dist > 1) {
          a.vx += dx * PULL;
          a.vy += dy * PULL;
        }
      }

      a.x += a.vx;
      a.y += a.vy;

      /* Трение, чтобы точки не разгонялись от постоянного притяжения. */
      a.vx *= 0.995;
      a.vy *= 0.995;

      /* Уход за край — появление с противоположной стороны. */
      if (a.x < -20) a.x = width + 20;
      if (a.x > width + 20) a.x = -20;
      if (a.y < -20) a.y = height + 20;
      if (a.y > height + 20) a.y = -20;

      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(" + colors.line + ",0.28)";
      ctx.fill();
    }

    /* Связи между точками. */
    ctx.lineWidth = 1;
    for (i = 0; i < points.length; i++) {
      a = points[i];
      for (j = i + 1; j < points.length; j++) {
        b = points[j];
        dx = a.x - b.x;
        dy = a.y - b.y;
        dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > LINK) continue;

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = "rgba(" + colors.line + "," + (1 - dist / LINK) * 0.14 + ")";
        ctx.stroke();
      }
    }

    /* Связи с курсором — акцентом, чтобы курсор читался как центр сетки. */
    if (mouse.active) {
      for (i = 0; i < points.length; i++) {
        a = points[i];
        dx = a.x - mouse.x;
        dy = a.y - mouse.y;
        dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > MOUSE_LINK) continue;

        var alpha = (1 - dist / MOUSE_LINK) * 0.55;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.strokeStyle = "rgba(" + colors.accent + "," + alpha + ")";
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(a.x, a.y, a.r + 0.6, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(" + colors.accent + "," + alpha + ")";
        ctx.fill();
      }
    }
  }

  function start() {
    if (raf === null) raf = requestAnimationFrame(frame);
  }

  function stop() {
    if (raf !== null) {
      cancelAnimationFrame(raf);
      raf = null;
    }
  }

  /* --- Инициализация ------------------------------------------------------ */

  function supported() {
    if (u.prefersReducedMotion()) return false;
    /* Без тонкого указателя сетка не оживает: связывать нечем. */
    if (!window.matchMedia("(pointer: fine)").matches) return false;
    return !!document.createElement("canvas").getContext;
  }

  function init() {
    if (!supported()) return;

    canvas = u.$("[data-constellation]");
    if (!canvas) return;

    ctx = canvas.getContext("2d");
    canvas.hidden = false;

    readColors();
    resize();
    start();

    var resizeTimer;
    u.on(window, "resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 180);
    });

    u.on(window, "pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    }, { passive: true });

    u.on(document, "pointerleave", function () {
      mouse.active = false;
    });

    /* В скрытой вкладке rAF всё равно не вызывается, но лучше не держать
       запланированный кадр висящим. */
    u.on(document, "visibilitychange", function () {
      if (document.hidden) stop();
      else start();
    });

    /* Тема сменилась — токены другие, цвета надо перечитать. */
    u.on(document.documentElement, "themechange", readColors);
  }

  return {
    init: init,
    refresh: readColors
  };
})();
