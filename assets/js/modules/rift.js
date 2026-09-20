/* ==========================================================================
   RIFT — разломы-вспышки: светящееся ядро, расходящиеся трещины, осколки.

   Формы генерируются процедурно из сида, а не рисуются руками: восемь
   одинаковых вспышек сразу читались бы как повторяющаяся наклейка.
   Сид фиксированный, поэтому при каждой загрузке картинка одна и та же —
   вёрстка не «пляшет» между перезагрузками.

   Разметка создаётся скриптом: восемь вспышек, вбитых в index.html,
   занимали бы двести строк ради чистого декора.
   ========================================================================== */

window.App = window.App || {};

window.App.rift = (function () {
  "use strict";

  var u = window.App.utils;

  /* Где стоят вспышки. size — сторона квадрата в пикселях.
     Координаты в процентах от секции, отрицательные уводят за край. */
  var PLACEMENTS = [
    { sel: ".hero",        seed: 7,   size: 320, top: "14%",    right: "-3%" },
    { sel: ".hero",        seed: 21,  size: 160, top: "66%",    left: "-2%" },
    { sel: "#disciplines", seed: 34,  size: 240, top: "6%",     left: "-4%" },
    { sel: "#disciplines", seed: 52,  size: 140, bottom: "14%", right: "0%" },
    { sel: "#works",       seed: 68,  size: 280, top: "20%",    right: "-4%" },
    { sel: "#works",       seed: 74,  size: 160, top: "38%",    left: "0%" },
    { sel: "#works",       seed: 83,  size: 180, top: "58%",    left: "-3%" },
    { sel: "#works",       seed: 88,  size: 220, top: "76%",    right: "-2%" },
    { sel: "#works",       seed: 90,  size: 150, bottom: "8%",  right: "1%" },
    { sel: "#process",     seed: 95,  size: 210, top: "10%",    right: "-2%" },
    { sel: "#process",     seed: 103, size: 140, bottom: "8%",  left: "-2%" },
    { sel: "#about",       seed: 112, size: 250, bottom: "4%",  left: "-4%" },
    { sel: "#contact",     seed: 129, size: 270, top: "16%",    right: "-3%" },
    { sel: "#contact",     seed: 141, size: 130, bottom: "10%", left: "0%" }
  ];

  var VB = 200;            /* сторона viewBox */
  var C = VB / 2;          /* центр */

  /* --- Генератор -----------------------------------------------------------
     Свой, а не Math.random: нужен повторяемый результат от сида. */

  function rng(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  /** Ломаная от центра наружу: чем дальше, тем сильнее уводит вбок. */
  function crack(rand, angle, length, segments) {
    var x = C + Math.cos(angle) * 8;
    var y = C + Math.sin(angle) * 8;
    var d = "M" + x.toFixed(1) + " " + y.toFixed(1);
    var step = length / segments;
    var a = angle;

    for (var i = 0; i < segments; i++) {
      /* Излом растёт к концу трещины — у основания она почти прямая. */
      a += (rand() - 0.5) * (0.35 + (i / segments) * 0.5);
      x += Math.cos(a) * step;
      y += Math.sin(a) * step;
      d += "L" + x.toFixed(1) + " " + y.toFixed(1);
    }
    return { d: d, x: x, y: y, a: a };
  }

  function burstSvg(seed) {
    var rand = rng(seed);
    var parts = [];
    var main = 4 + Math.floor(rand() * 3);      /* 4–6 главных трещин */
    var start = rand() * Math.PI * 2;

    for (var i = 0; i < main; i++) {
      /* Углы разведены равномерно с разбросом: лучи не сходятся в пучок. */
      var angle = start + (i / main) * Math.PI * 2 + (rand() - 0.5) * 0.7;
      var len = 44 + rand() * 40;
      var c = crack(rand, angle, len, 3 + Math.floor(rand() * 3));

      parts.push('<path class="rift__crack" style="--delay:' +
        (rand() * 2.5).toFixed(2) + 's" d="' + c.d + '"/>');

      /* Ответвление от середины — трещина ветвится, а не идёт одной линией. */
      if (rand() > 0.35) {
        var b = crack(rand, c.a + (rand() > 0.5 ? 0.8 : -0.8), len * 0.45, 2);
        var shift = "M" + ((c.x + C) / 2).toFixed(1) + " " + ((c.y + C) / 2).toFixed(1);
        parts.push('<path class="rift__crack rift__crack--thin" style="--delay:' +
          (rand() * 2.5 + 0.4).toFixed(2) + 's" d="' +
          b.d.replace(/^M[\d.]+ [\d.]+/, shift) + '"/>');
      }
    }

    /* Осколки: чем дальше от центра, тем мельче — разлёт читается. */
    var shards = 7 + Math.floor(rand() * 5);
    for (var j = 0; j < shards; j++) {
      var sa = rand() * Math.PI * 2;
      var dist = 30 + rand() * 62;
      var sx = C + Math.cos(sa) * dist;
      var sy = C + Math.sin(sa) * dist;
      var sz = 5.5 - (dist / 92) * 3 + rand() * 1.5;
      var lit = rand() > 0.72 ? " rift__shard--lit" : "";

      parts.push('<polygon class="rift__shard' + lit +
        '" style="--delay:' + (rand() * 6).toFixed(2) + 's;--drift:' +
        (rand() * 6 + 4).toFixed(1) + 'px" points="' +
        (sx).toFixed(1) + "," + (sy - sz).toFixed(1) + " " +
        (sx + sz).toFixed(1) + "," + (sy + sz * 0.7).toFixed(1) + " " +
        (sx - sz * 0.8).toFixed(1) + "," + (sy + sz).toFixed(1) + '"/>');
    }

    return '<svg viewBox="0 0 ' + VB + " " + VB + '" aria-hidden="true">' +
      parts.join("") + "</svg>";
  }

  function place(cfg, index) {
    var host = u.$(cfg.sel);
    if (!host) return;

    var el = document.createElement("div");
    el.className = "rift";
    el.setAttribute("aria-hidden", "true");

    var css = ["--size:" + cfg.size + "px", "--i:" + index];
    ["top", "bottom", "left", "right"].forEach(function (side) {
      if (cfg[side]) css.push(side + ":" + cfg[side]);
    });
    el.setAttribute("style", css.join(";"));

    el.innerHTML = '<span class="rift__core"></span>' + burstSvg(cfg.seed);
    host.appendChild(el);
  }

  /* Каждая вспышка — это десяток анимированных путей с размытием.
     Четырнадцать штук, считающихся одновременно по всей странице, греют
     видеокарту впустую: видно от силы две-три. Остальные усыпляем.

     Усыпляем, а не будим: если наблюдатель не отработает, вспышки просто
     останутся анимированными. Обратная логика оставила бы их застывшими
     в нулевом кадре, где трещины ещё не прочерчены. */
  function watch() {
    if (!("IntersectionObserver" in window)) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        entry.target.classList.toggle("is-asleep", !entry.isIntersecting);
      });
    }, { rootMargin: "25% 0px" });

    u.$$(".rift").forEach(function (el) {
      observer.observe(el);
    });
  }

  function init() {
    /* Декор: при отключённых анимациях он не нужен вовсе. */
    if (u.prefersReducedMotion()) return;

    PLACEMENTS.forEach(place);
    watch();
  }

  return { init: init };
})();
