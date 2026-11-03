/* ==========================================================================
   MOTIFS — живые иллюстрации в карточках дисциплин.

   Каждый мотив — маленькая сцена на SVG, которую считает скрипт:
     building   — изометрические блоки, верхний поднимается и встаёт на место
     modelling  — каркас тора вращается в 3D, выделена одна петля рёбер
     scripting  — редактор: код набирается, прогоняется и очищается
     animation  — прыгающий мяч: сжатие-растяжение, «луковые» кадры, ключи
     rig        — рука-манипулятор из костей, ведомая IK-целью
     vfx        — эмиттер частиц: мягкие огоньки поднимаются с завихрением
     sfx-music  — волна звука и плейхед, сыгранная часть подсвечена
     gui        — курсор щёлкает тумблер, тянет слайдер, жмёт кнопку
     cutscene   — кадр камеры: параллакс, на наведении въезжают шторки

   Плавность. У каждой карточки два числа: собственное время t и
   «энергия» e (0…1). Наведение тянет e к единице, уход — к нулю, причём
   плавно, по экспоненте. Время течёт со скоростью e: на входе сцена
   разгоняется, на выходе замедляется и останавливается — никаких
   рывков в нулевой кадр, как бывает с CSS-анимацией по :hover.
   Где уместно, e ещё и смешивает позу с исходной (рука, блок).

   Считаются только карточки, которые сейчас оживают или затухают.
   На сенсорных экранах наведения нет — мотив оживает, пока карточка
   на экране. При отключённых анимациях рисуется только исходный кадр.
   ========================================================================== */

window.App = window.App || {};

window.App.motifs = (function () {
  "use strict";

  var u = window.App.utils;
  var NS = "http://www.w3.org/2000/svg";
  var TAU = Math.PI * 2;
  var uidCounter = 0;

  /* --- Математика ----------------------------------------------------------- */

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function seg(x, a, b) { return clamp((x - a) / (b - a), 0, 1); }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function smooth(x) { return x * x * (3 - 2 * x); }
  function easeInOut(x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
  function easeOut(x) { return 1 - Math.pow(1 - x, 3); }
  function easeIn(x) { return x * x; }
  function r2(n) { return Math.round(n * 100) / 100; }
  function mod(a, n) { return ((a % n) + n) % n; }

  function rng(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  /* --- SVG ------------------------------------------------------------------ */

  function el(parent, tag, attrs) {
    var n = document.createElementNS(NS, tag);
    if (attrs) set(n, attrs);
    if (parent) parent.appendChild(n);
    return n;
  }

  function set(n, attrs) {
    for (var k in attrs) {
      if (Object.prototype.hasOwnProperty.call(attrs, k)) n.setAttribute(k, attrs[k]);
    }
  }

  function pts(list) {
    var out = [];
    for (var i = 0; i < list.length; i++) out.push(r2(list[i][0]) + "," + r2(list[i][1]));
    return out.join(" ");
  }

  /** Мягкое свечение для акцентных элементов. */
  function glowFilter(defs, id, sd) {
    var f = el(defs, "filter", { id: id, x: "-60%", y: "-60%", width: "220%", height: "220%" });
    el(f, "feGaussianBlur", { stdDeviation: sd, result: "b" });
    var m = el(f, "feMerge");
    el(m, "feMergeNode", { in: "b" });
    el(m, "feMergeNode", { in: "SourceGraphic" });
    return "url(#" + id + ")";
  }

  function radial(defs, id, stops) {
    var g = el(defs, "radialGradient", { id: id });
    stops.forEach(function (s) {
      el(g, "stop", { offset: s[0], "stop-color": s[1], "stop-opacity": s[2] });
    });
    return "url(#" + id + ")";
  }

  function accentColor() {
    var v = getComputedStyle(document.documentElement).getPropertyValue("--c-accent").trim();
    return v || "#b8ff3c";
  }

  /* ==========================================================================
     МОТИВЫ. Каждый строит сцену в svg и возвращает { t0, render(t, e) }.
     t0 — момент времени, кадр которого служит исходным видом карточки.
     ========================================================================== */

  var MOTIFS = {};

  /* --- 01 · BUILDING ---------------------------------------------------------
     Изометрия: основание 3×2, второй ярус ступенькой. Акцентный блок
     поднимается, зависает и падает на место с лёгким отскоком; под ним
     темнеет контактная тень, на посадке расходится контур-«щелчок». */

  MOTIFS.building = function (svg, uid) {
    var S = 11.5;
    var A = S * 0.866;
    var B = S * 0.5;
    var CX = 75;
    var CY = 50;

    function P(x, y, z) { return [CX + (x - y) * A, CY + (x + y) * B - z * S]; }

    function faces(x, y, z) {
      return {
        top: [P(x, y, z + 1), P(x + 1, y, z + 1), P(x + 1, y + 1, z + 1), P(x, y + 1, z + 1)],
        right: [P(x + 1, y, z + 1), P(x + 1, y + 1, z + 1), P(x + 1, y + 1, z), P(x + 1, y, z)],
        left: [P(x, y + 1, z + 1), P(x + 1, y + 1, z + 1), P(x + 1, y + 1, z), P(x, y + 1, z)]
      };
    }

    function silhouette(x, y, z) {
      return [P(x, y, z + 1), P(x + 1, y, z + 1), P(x + 1, y, z),
              P(x + 1, y + 1, z), P(x, y + 1, z), P(x, y + 1, z + 1)];
    }

    var defs = el(svg, "defs");
    var fadeId = uid + "-fade";
    var grad = radial(defs, fadeId + "-g", [[0, "#fff", 1], [0.55, "#fff", 0.6], [1, "#fff", 0]]);
    var mask = el(defs, "mask", { id: fadeId, maskContentUnits: "userSpaceOnUse" });
    var fc = P(1.5, 1, 0);
    el(mask, "ellipse", { cx: r2(fc[0]), cy: r2(fc[1]), rx: 54, ry: 28, fill: grad });
    var glow = glowFilter(defs, uid + "-glow", 1.2);

    /* Пол — изометрическая сетка, растворяется к краям. */
    var floor = el(svg, "g", { class: "mt-dim", mask: "url(#" + fadeId + ")" });
    for (var k = -2; k <= 5; k++) {
      var a1 = P(k, -2, 0), a2 = P(k, 4, 0), b1 = P(-2, k, 0), b2 = P(5, k, 0);
      el(floor, "line", { x1: r2(a1[0]), y1: r2(a1[1]), x2: r2(a2[0]), y2: r2(a2[1]) });
      el(floor, "line", { x1: r2(b1[0]), y1: r2(b1[1]), x2: r2(b2[0]), y2: r2(b2[1]) });
    }

    /* Неподвижные блоки — в порядке художника: дальние первыми. */
    var blocks = [[0, 0, 0], [1, 0, 0], [2, 0, 0], [0, 1, 0], [1, 1, 0], [2, 1, 0],
                  [0, 0, 1], [1, 0, 1], [0, 1, 1]];
    blocks.sort(function (p, q) {
      return (p[0] + p[1] + p[2]) - (q[0] + q[1] + q[2]) || p[2] - q[2];
    });
    blocks.forEach(function (b) {
      var f = faces(b[0], b[1], b[2]);
      var g = el(svg, "g", { class: "mt-solid" });
      el(g, "polygon", { class: "mt-ftop", points: pts(f.top) });
      el(g, "polygon", { class: "mt-fr", points: pts(f.right) });
      el(g, "polygon", { class: "mt-fl", points: pts(f.left) });
    });

    /* Контактная тень на верхней грани блока под гнездом. */
    var shadow = el(svg, "polygon", {
      class: "mt-shade",
      points: pts(faces(1, 1, 0).top)
    });

    /* Призрак гнезда: пунктир на месте, куда встанет блок. */
    var ghost = el(svg, "g", { class: "mt-acc mt-dash", opacity: 0 });
    el(ghost, "polygon", { points: pts(silhouette(1, 1, 1)) });
    var gc = P(2, 2, 2);
    el(ghost, "path", {
      d: "M" + pts([P(2, 1, 2), gc, P(1, 2, 2)]).replace(/ /g, " L") +
         "M" + pts([gc, P(2, 2, 1)]).replace(/ /g, " L")
    });

    /* Подвижный блок. */
    var mover = el(svg, "g", { class: "mt-acc", filter: glow });
    var mTop = el(mover, "polygon", { class: "mt-acc-ftop" });
    var mRight = el(mover, "polygon", { class: "mt-acc-fr" });
    var mLeft = el(mover, "polygon", { class: "mt-acc-fl" });

    /* «Щелчок» посадки: ромб расходится по плоскости верхнего яруса. */
    var snap = el(svg, "polygon", { class: "mt-acc", opacity: 0 });

    var PERIOD = 3.8;
    var PEAK = 1.35;

    function liftAt(q) {
      if (q < 0.12) return 0;
      if (q < 0.42) return PEAK * easeInOut(seg(q, 0.12, 0.42));
      if (q < 0.58) return PEAK + Math.sin(seg(q, 0.42, 0.58) * Math.PI) * 0.1;
      if (q < 0.73) return PEAK * (1 - easeIn(seg(q, 0.58, 0.73)));
      if (q < 0.8) return 0.12 * Math.sin(seg(q, 0.73, 0.8) * Math.PI);
      return 0;
    }

    function render(t, e) {
      var q = mod(t, PERIOD) / PERIOD;
      var lift = liftAt(q) * e;
      var f = faces(1, 1, 1 + lift);

      set(mTop, { points: pts(f.top) });
      set(mRight, { points: pts(f.right) });
      set(mLeft, { points: pts(f.left) });

      set(shadow, { "fill-opacity": r2(0.5 * seg(lift, 0, 0.25) * (1 - lift / (PEAK * 1.3))) });
      set(ghost, { opacity: r2(seg(lift, 0.15, 0.6) * 0.85) });

      var sp = seg(q, 0.73, 0.98);
      var s = 0.5 + 0.55 * easeOut(sp);
      set(snap, {
        points: pts([P(1.5 - s, 1.5 - s, 2), P(1.5 + s, 1.5 - s, 2),
                     P(1.5 + s, 1.5 + s, 2), P(1.5 - s, 1.5 + s, 2)]),
        opacity: r2(sp > 0 && sp < 1 ? Math.pow(1 - sp, 1.6) * 0.9 * e : 0)
      });
    }

    return { t0: 0, render: render };
  };

  /* --- 02 · MODELLING --------------------------------------------------------
     Каркас тора в настоящем 3D: дальние рёбра тусклее ближних, одна петля
     рёбер «выделена», как в редакторе. В углу — гизмо осей. */

  MOTIFS.modelling = function (svg, uid) {
    var R = 21;
    var RM = 8.2;
    var NU = 14;
    var NV = 7;
    var CX = 82;
    var CY = 45;
    var CAM = 150;

    var defs = el(svg, "defs");
    var glow = glowFilter(defs, uid + "-glow", 1.1);

    var verts = [];
    for (var i = 0; i < NU; i++) {
      for (var j = 0; j < NV; j++) {
        var a = (i / NU) * TAU;
        var b = (j / NV) * TAU;
        verts.push([(R + RM * Math.cos(b)) * Math.cos(a), RM * Math.sin(b), (R + RM * Math.cos(b)) * Math.sin(a)]);
      }
    }

    function idx(i, j) { return mod(i, NU) * NV + mod(j, NV); }

    var wire = el(svg, "g", { class: "mt-wire" });
    var loop = el(svg, "g", { class: "mt-acc", filter: glow });
    var edges = [];
    for (var ii = 0; ii < NU; ii++) {
      for (var jj = 0; jj < NV; jj++) {
        edges.push({ a: idx(ii, jj), b: idx(ii + 1, jj), n: el(wire, "line") });
        var accent = ii === 3;
        edges.push({
          a: idx(ii, jj), b: idx(ii, jj + 1), acc: accent,
          n: el(accent ? loop : wire, "line")
        });
      }
    }
    var loopDots = [];
    for (var d = 0; d < NV; d++) {
      loopDots.push({ v: idx(3, d), n: el(loop, "circle", { r: 1.15, class: "mt-acc-fill" }) });
    }

    /* Гизмо осей. */
    var gizmo = el(svg, "g", { class: "mt-dim" });
    var axes = [[1, 0, 0], [0, -1, 0], [0, 0, 1]].map(function (v, n) {
      return {
        v: v,
        line: el(gizmo, "line", { x1: 22, y1: 74 }),
        dot: el(gizmo, "circle", { r: n === 1 ? 1.4 : 1, class: "mt-fill-dim" })
      };
    });

    var proj = [];

    function transform(p, sA, cA, sB, cB, sC, cC) {
      /* Вращение вокруг своей оси, затем наклон, затем покачивание. */
      var x = p[0] * cA - p[2] * sA;
      var z = p[0] * sA + p[2] * cA;
      var y = p[1];
      var y2 = y * cB - z * sB;
      var z2 = y * sB + z * cB;
      var x3 = x * cC + z2 * sC;
      var z3 = -x * sC + z2 * cC;
      return [x3, y2, z3];
    }

    function render(t) {
      var A = 0.4 + t * 0.62;
      var B = 1.02 + Math.sin(t * 0.55) * 0.12;
      var C = 0.28 + Math.sin(t * 0.37) * 0.22;
      var sA = Math.sin(A), cA = Math.cos(A);
      var sB = Math.sin(B), cB = Math.cos(B);
      var sC = Math.sin(C), cC = Math.cos(C);
      var span = R + RM;

      for (var n = 0; n < verts.length; n++) {
        var q = transform(verts[n], sA, cA, sB, cB, sC, cC);
        var k = CAM / (CAM + q[2]);
        proj[n] = [CX + q[0] * k, CY + q[1] * k, (q[2] + span) / (2 * span)];
      }

      for (var m = 0; m < edges.length; m++) {
        var ed = edges[m];
        var p1 = proj[ed.a];
        var p2 = proj[ed.b];
        var depth = (p1[2] + p2[2]) / 2;
        set(ed.n, {
          x1: r2(p1[0]), y1: r2(p1[1]), x2: r2(p2[0]), y2: r2(p2[1]),
          "stroke-opacity": r2(ed.acc ? lerp(1, 0.4, depth) : lerp(0.95, 0.1, Math.pow(depth, 0.8)))
        });
      }

      loopDots.forEach(function (ld) {
        var p = proj[ld.v];
        set(ld.n, { cx: r2(p[0]), cy: r2(p[1]), "fill-opacity": r2(lerp(1, 0.35, p[2])) });
      });

      axes.forEach(function (ax) {
        var q = transform(ax.v, 0, 1, sB, cB, sC, cC);
        var x = 22 + q[0] * 7;
        var y = 74 + q[1] * 7;
        set(ax.line, { x2: r2(x), y2: r2(y) });
        set(ax.dot, { cx: r2(x), cy: r2(y) });
      });
    }

    return { t0: 0, render: render };
  };

  /* --- 03 · SCRIPTING --------------------------------------------------------
     Редактор кода: номера строк, отступы, токены разной яркости. Строки
     набираются по символу, подсветка текущей строки едет за кареткой,
     после набора код «прогоняется» — по строкам проходит светлая полоса,
     затем редактор очищается. Каретка мигает плавно, как в VS Code. */

  MOTIFS.scripting = function (svg, uid) {
    var LINES = [
      { ind: 0,  tk: [[9, "k"], [17, "a"], [5, "p"]] },
      { ind: 7,  tk: [[9, "k"], [12, "i"], [3, "p"], [17, "i"]] },
      { ind: 7,  tk: [[6, "k"], [10, "i"], [3, "p"], [8, "n"]] },
      { ind: 14, tk: [[14, "i"], [3, "p"], [21, "i"]] },
      { ind: 7,  tk: [[9, "k"], [11, "i"]] },
      { ind: 0,  tk: [[7, "k"]] }
    ];
    var X0 = 42;
    var Y0 = 18;
    var STEP = 10;
    var GAP = 2.2;
    var CW = 2.3;          /* ширина «символа» */
    var CHAR_T = 0.045;    /* время на символ */
    var PAUSE = 0.3;       /* пауза на переносе строки */
    var START = 0.35;

    var defs = el(svg, "defs");
    var glow = glowFilter(defs, uid + "-glow", 1);

    el(svg, "line", { class: "mt-dim", x1: 35, y1: 11, x2: 35, y2: 77 });

    var hl = el(svg, "rect", { class: "mt-hl", x: 36.5, y: Y0 - 4.5, width: 100, height: 9, rx: 1.5, opacity: 0 });
    var sweep = el(svg, "rect", { class: "mt-sweep", x: 36.5, y: Y0 - 4.5, width: 100, height: 9, rx: 1.5, opacity: 0 });

    var time = START;
    var lines = LINES.map(function (L, i) {
      var y = Y0 + i * STEP;
      el(svg, "rect", { class: "mt-fill-dim", x: 25, y: y - 1.2, width: i === 3 || i === 0 ? 5 : 3.4, height: 2.4, rx: 1.2 });

      var g = el(svg, "g");
      var off = 0;
      var tokens = L.tk.map(function (tk) {
        var t = { off: off, w: tk[0], n: el(g, "rect", { class: "mt-tk-" + tk[1], y: r2(y - 1.7), height: 3.4 }) };
        off += tk[0] + GAP;
        return t;
      });
      var width = off - GAP;
      var dur = (width / CW) * CHAR_T;
      var line = { x: X0 + L.ind, y: y, g: g, tokens: tokens, width: width, start: time, end: time + dur };
      time += dur + PAUSE;
      return line;
    });

    var TYPED = time - PAUSE;
    var RUN_A = TYPED + 0.55;
    var RUN_B = RUN_A + 1.1;
    var FADE_A = RUN_B + 0.45;
    var FADE_B = FADE_A + 0.5;
    var PERIOD = FADE_B + 0.35;

    var caret = el(svg, "rect", { class: "mt-acc-fill", width: 1.3, height: 7.5, rx: 0.65, filter: glow });

    function lineReveal(line, lt) {
      var chars = Math.floor((lt - line.start) / CHAR_T);
      return clamp(chars * CW, 0, line.width);
    }

    function render(t, e) {
      var lt = mod(t, PERIOD);
      var fade = 1 - smooth(seg(lt, FADE_A, FADE_B));
      if (lt < START) fade = 0;

      /* Где каретка и какая строка активна. */
      var cur = 0;
      for (var i = 0; i < lines.length; i++) if (lt >= lines[i].start) cur = i;
      if (lt >= FADE_B || lt < START) cur = 0;

      var runPos = lerp(-1, lines.length, easeInOut(seg(lt, RUN_A, RUN_B)));

      lines.forEach(function (line, n) {
        var rev = lt >= FADE_B || lt < START ? 0 : lineReveal(line, lt);
        rev = lerp(line.width, rev, e);
        var boost = Math.exp(-Math.pow(n - runPos, 2) / 0.6);
        set(line.g, { opacity: r2(lerp(1, fade * (0.82 + 0.18 * boost), e)) });
        line.tokens.forEach(function (tk) {
          var w = clamp(rev - tk.off, 0, tk.w);
          set(tk.n, { x: r2(line.x + tk.off), width: r2(w), rx: r2(Math.min(1.7, w / 2)) });
        });
      });

      var L = lines[cur];
      var cx = lt >= FADE_B || lt < START ? X0 : L.x + lineReveal(L, lt) + 0.8;
      if (lt >= TYPED && lt < FADE_B) {
        L = lines[lines.length - 1];
        cx = L.x + L.width + 0.8;
      }
      var typing = lt >= START && lt < TYPED && lt <= L.end + 0.02;
      var idle = typing ? 0 : lt;
      var blink = typing ? 1 : smooth(clamp(0.5 + 0.9 * Math.cos(idle * TAU * 0.9), 0, 1));

      set(caret, { x: r2(cx), y: r2(L.y - 3.75), opacity: r2(blink * e) });

      hl.style.transform = "translateY(" + r2((L.y - Y0)) + "px)";
      set(hl, { opacity: r2(e * fade) });

      set(sweep, {
        y: r2(Y0 - 4.5 + runPos * STEP),
        opacity: r2(e * (lt > RUN_A && lt < RUN_B ? Math.sin(seg(lt, RUN_A, RUN_B) * Math.PI) : 0))
      });
    }

    return { t0: TYPED + 0.3, render: render };
  };

  /* --- 04 · ANIMATION --------------------------------------------------------
     Классическое упражнение аниматора — прыгающий мяч. Сжатие на ударе,
     растяжение по скорости, «луковые» кадры позади, пунктир траектории.
     Внизу таймлайн: ключи на моментах ударов загораются, когда их
     проходит плейхед. */

  MOTIFS.animation = function (svg, uid) {
    var G = 64;            /* земля */
    var RB = 4.6;          /* радиус мяча */
    var X_START = 32;
    var VX = 44;
    var H0 = 40;
    var T0 = 0.42;
    var GRAV = 2 * H0 / (T0 * T0);
    var PEAKS = [26, 14, 6.2];
    var INTRO = 0.25;
    var ROLL = 0.5;

    var impacts = [T0];
    PEAKS.forEach(function (h) {
      impacts.push(impacts[impacts.length - 1] + 2 * Math.sqrt(2 * h / GRAV));
    });
    var LAST = impacts[impacts.length - 1];
    var MOTION = LAST + ROLL;
    var PERIOD = INTRO + MOTION + 0.35 + 0.3;

    function state(tl) {
      var h = 0;
      var vy = 0;
      var x;
      if (tl <= 0) {
        h = H0;
        x = X_START;
      } else if (tl < T0) {
        h = H0 - 0.5 * GRAV * tl * tl;
        vy = -GRAV * tl;
        x = X_START + VX * tl;
      } else if (tl < LAST) {
        for (var k = 0; k < PEAKS.length; k++) {
          if (tl < impacts[k + 1]) {
            var tau = tl - impacts[k];
            var v0 = Math.sqrt(2 * GRAV * PEAKS[k]);
            h = v0 * tau - 0.5 * GRAV * tau * tau;
            vy = v0 - GRAV * tau;
            break;
          }
        }
        x = X_START + VX * tl;
      } else {
        var r = Math.min(tl - LAST, ROLL);
        x = X_START + VX * LAST + VX * r * (1 - r / (2 * ROLL));
        vy = 0;
      }
      return { x: x, h: Math.max(0, h), vy: vy };
    }

    var defs = el(svg, "defs");
    var glow = glowFilter(defs, uid + "-glow", 1.2);

    /* Траектория. */
    var trail = [];
    for (var s = 0; s <= MOTION + 0.001; s += 0.02) {
      var st = state(s);
      trail.push([st.x, G - RB - st.h]);
    }
    el(svg, "polyline", { class: "mt-dim mt-dots", points: pts(trail) });
    el(svg, "line", { class: "mt-dim", x1: 24, y1: G, x2: 136, y2: G });

    var shadow = el(svg, "ellipse", { class: "mt-shade", ry: 1.3, cy: G + 0.6 });

    var onion = [];
    for (var o = 1; o <= 4; o++) {
      onion.push(el(svg, "circle", { class: "mt-onion", r: RB }));
    }

    var ball = el(svg, "ellipse", { class: "mt-acc mt-acc-face", filter: glow });

    /* Таймлайн. */
    var TY = 79;
    el(svg, "line", { class: "mt-dim", x1: 28, y1: TY, x2: 132, y2: TY });
    var keys = [0].concat(impacts).map(function (kt) {
      var x = X_START + VX * kt;
      var g = el(svg, "g", { transform: "translate(" + r2(x) + " " + TY + ") rotate(45)" });
      el(g, "rect", { class: "mt-key", x: -2, y: -2, width: 4, height: 4 });
      var fill = el(g, "rect", { class: "mt-fill", x: -2, y: -2, width: 4, height: 4, opacity: 0 });
      return { t: kt, fill: fill, g: g };
    });
    var head = el(svg, "line", { class: "mt-head", y1: TY - 5, y2: TY + 5 });

    function ballAt(tl, e) {
      var st = state(tl);
      var squash = 0;
      var strength = 0;
      for (var k = 0; k < impacts.length; k++) {
        var dd = Math.abs(tl - impacts[k]);
        if (dd < 0.08) {
          squash = Math.pow(1 - dd / 0.08, 2);
          strength = [1, 0.75, 0.5, 0.3][k];
        }
      }
      var sq = squash * strength * e;
      var stretch = 1 + 0.3 * clamp((Math.abs(st.vy) - 40) / 240, 0, 1) * (1 - squash) * e;
      return { st: st, sq: sq, stretch: stretch };
    }

    function render(t, e) {
      var lt = mod(t, PERIOD);
      var tl = lt - INTRO;
      var b = ballAt(tl, e);
      var st = b.st;

      var rx, ry, ang, cy;
      if (b.sq > 0.001) {
        rx = RB * (1 + 0.38 * b.sq);
        ry = RB * (1 - 0.42 * b.sq);
        ang = 0;
        cy = G - ry - st.h;
      } else {
        rx = RB * b.stretch;
        ry = RB / Math.pow(b.stretch, 0.7);
        ang = Math.atan2(-st.vy, VX) * 180 / Math.PI;
        cy = G - RB - st.h;
      }

      /* Появление в начале цикла и угасание в конце. */
      var alpha = smooth(seg(lt, 0, INTRO)) * (1 - smooth(seg(lt, PERIOD - 0.3, PERIOD)));
      alpha = lerp(1, alpha, e);

      set(ball, {
        rx: r2(rx), ry: r2(ry), cx: 0, cy: 0,
        transform: "translate(" + r2(st.x) + " " + r2(cy) + ") rotate(" + r2(ang) + ")",
        opacity: r2(alpha)
      });

      var near = 1 - st.h / H0;
      set(shadow, { cx: r2(st.x), rx: r2(RB * (0.5 + 0.7 * near)), "fill-opacity": r2(0.55 * near * alpha) });

      onion.forEach(function (n, i) {
        var ot = tl - (i + 1) * 0.075;
        if (ot < 0) {
          set(n, { opacity: 0 });
          return;
        }
        var s2 = state(ot);
        set(n, {
          cx: r2(s2.x), cy: r2(G - RB - s2.h),
          opacity: r2((0.55 - i * 0.12) * alpha)
        });
      });

      keys.forEach(function (k) {
        var lit = smooth(seg(tl, k.t - 0.02, k.t + 0.14));
        set(k.fill, { opacity: r2(lerp(0.85, lit, e)) });
      });

      set(head, { x1: r2(st.x), x2: r2(st.x), opacity: r2(alpha) });
    }

    return { t0: INTRO + impacts[1] + 0.33, render: render };
  };

  /* --- 05 · RIG --------------------------------------------------------------
     Манипулятор из трёх костей в стиле Blender (октаэдрические кости,
     суставы-кольца). Его ведёт IK-цель — акцентное перекрестие, плывущее
     по восьмёрке. Плечо и локоть решаются аналитически, локоть смотрит
     на пол-таргет (пунктир вверх). Дуга у локтя показывает угол сгиба. */

  MOTIFS.rig = function (svg, uid) {
    var ROOT = [48, 66];
    var L1 = 35;
    var L2 = 31;
    var L3 = 9;
    var TARGET = [94, 34];
    var POLE = [64, 14];

    var defs = el(svg, "defs");
    var glow = glowFilter(defs, uid + "-glow", 1.2);

    el(svg, "line", { class: "mt-dim", x1: 24, y1: 76, x2: 136, y2: 76 });
    el(svg, "path", { class: "mt-solid mt-ftop", d: "M37 76 L40.5 70.5 H55.5 L59 76 Z" });
    el(svg, "circle", { class: "mt-dim mt-dash", cx: ROOT[0], cy: ROOT[1], r: 9.5 });

    var poleLine = el(svg, "line", { class: "mt-dim mt-dash" });
    el(svg, "rect", {
      class: "mt-dim mt-face", x: -2, y: -2, width: 4, height: 4,
      transform: "translate(" + POLE[0] + " " + POLE[1] + ") rotate(45)"
    });

    var arc = el(svg, "path", { class: "mt-dim" });

    var bones = [0, 1, 2].map(function () {
      var g = el(svg, "g", { class: "mt-solid" });
      return { body: el(g, "path", { class: "mt-ftop" }), rib: el(g, "path") };
    });
    var joints = [3, 2.6, 2.1].map(function (r) {
      return el(svg, "circle", { class: "mt-solid mt-face", r: r });
    });

    var reach = el(svg, "line", { class: "mt-acc mt-dash", opacity: 0 });
    var tgt = el(svg, "g", { class: "mt-acc", filter: glow });
    el(tgt, "circle", { r: 4.2 });
    el(tgt, "path", { d: "M-8.5 0H-6M6 0H8.5M0 -8.5V-6M0 6V8.5" });
    el(tgt, "circle", { r: 0.9, class: "mt-acc-fill" });

    function boneD(h, tl) {
      var dx = tl[0] - h[0];
      var dy = tl[1] - h[1];
      var len = Math.sqrt(dx * dx + dy * dy) || 1;
      var ux = dx / len, uy = dy / len;
      var nx = -uy, ny = ux;
      var w = Math.min(3.6, len * 0.13);
      var m = [h[0] + ux * len * 0.18, h[1] + uy * len * 0.18];
      var p1 = [m[0] + nx * w, m[1] + ny * w];
      var p2 = [m[0] - nx * w, m[1] - ny * w];
      return {
        body: "M" + pts([h, p1, tl, p2]).replace(/ /g, " L") + "Z",
        rib: "M" + pts([p1, p2]).replace(/ /g, " L")
      };
    }

    function render(t, e) {
      var w = TAU / 4.8;
      var T = [
        TARGET[0] + e * (11 * Math.sin(w * t) + 2 * Math.sin(w * t * 0.5)),
        TARGET[1] + e * (8 * Math.sin(2 * w * t + 0.7) + 2.5 * Math.cos(w * t * 0.5))
      ];
      var ha = 0.42 + e * 0.28 * Math.sin(w * t * 2 + 1.2);

      /* Запястье — так, чтобы кончик кисти пришёл в цель. */
      var W = [T[0] - L3 * Math.cos(ha), T[1] - L3 * Math.sin(ha)];
      var dx = W[0] - ROOT[0];
      var dy = W[1] - ROOT[1];
      var d = clamp(Math.sqrt(dx * dx + dy * dy), Math.abs(L1 - L2) + 0.5, L1 + L2 - 0.01);
      var base = Math.atan2(dy, dx);
      var alpha = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
      var a1 = base - alpha;      /* локоть вверх */
      var E = [ROOT[0] + L1 * Math.cos(a1), ROOT[1] + L1 * Math.sin(a1)];
      var a2 = Math.atan2(W[1] - E[1], W[0] - E[0]);
      var Wr = [E[0] + L2 * Math.cos(a2), E[1] + L2 * Math.sin(a2)];
      var Tip = [Wr[0] + L3 * Math.cos(ha), Wr[1] + L3 * Math.sin(ha)];

      [[ROOT, E], [E, Wr], [Wr, Tip]].forEach(function (pair, i) {
        var b = boneD(pair[0], pair[1]);
        set(bones[i].body, { d: b.body });
        set(bones[i].rib, { d: b.rib });
      });
      set(joints[0], { cx: ROOT[0], cy: ROOT[1] });
      set(joints[1], { cx: r2(E[0]), cy: r2(E[1]) });
      set(joints[2], { cx: r2(Wr[0]), cy: r2(Wr[1]) });

      set(poleLine, { x1: r2(E[0]), y1: r2(E[1]), x2: POLE[0], y2: POLE[1] });

      /* Дуга угла сгиба в локте. */
      var from = Math.atan2(ROOT[1] - E[1], ROOT[0] - E[0]);
      var to = a2;
      var diff = mod(to - from + Math.PI, TAU) - Math.PI;
      var rr = 6;
      var s0 = [E[0] + rr * Math.cos(from), E[1] + rr * Math.sin(from)];
      var s1 = [E[0] + rr * Math.cos(from + diff), E[1] + rr * Math.sin(from + diff)];
      set(arc, {
        d: "M" + r2(s0[0]) + " " + r2(s0[1]) + " A" + rr + " " + rr + " 0 0 " +
           (diff > 0 ? 1 : 0) + " " + r2(s1[0]) + " " + r2(s1[1])
      });

      set(tgt, { transform: "translate(" + r2(T[0]) + " " + r2(T[1]) + ")" });
      var gap = Math.sqrt(Math.pow(T[0] - Tip[0], 2) + Math.pow(T[1] - Tip[1], 2));
      set(reach, {
        x1: r2(Tip[0]), y1: r2(Tip[1]), x2: r2(T[0]), y2: r2(T[1]),
        opacity: r2(seg(gap, 0.6, 3) * 0.8)
      });
    }

    return { t0: 0, render: render };
  };

  /* --- 06 · VFX ---------------------------------------------------------------
     Эмиттер: кольцо на «полу», над ним мягкий ореол. Частицы — светлое
     ядро и размытый ореол, поднимаются с завихрением, к концу жизни
     уменьшаются и гаснут. Цикл частиц несинхронный — поток непрерывный. */

  MOTIFS.vfx = function (svg, uid) {
    var EX = 80;
    var EY = 70;
    var N = 22;
    var acc = accentColor();

    var defs = el(svg, "defs");
    var soft = radial(defs, uid + "-soft", [[0, acc, 0.85], [0.35, acc, 0.32], [1, acc, 0]]);
    var halo = radial(defs, uid + "-halo", [[0, acc, 0.22], [0.5, acc, 0.07], [1, acc, 0]]);

    var aura = el(svg, "ellipse", { cx: EX, cy: EY - 12, rx: 34, ry: 26, fill: halo, stroke: "none" });
    el(svg, "ellipse", { class: "mt-dim", cx: EX, cy: EY, rx: 18, ry: 4.6 });
    var ring = el(svg, "ellipse", { class: "mt-acc mt-dash-long", cx: EX, cy: EY, rx: 11, ry: 2.8 });

    var rand = rng(41);
    var parts = [];
    for (var i = 0; i < N; i++) {
      parts.push({
        life: 1.5 + rand() * 0.9,
        phase: rand(),
        x0: (rand() - 0.5) * 22,
        vy: 25 + rand() * 12,
        amp: 3 + rand() * 6,
        freq: 1.6 + rand() * 1.6,
        ph: rand() * TAU,
        size: 1 + rand() * 1.3,
        halo: el(svg, "circle", { fill: soft, stroke: "none" }),
        core: el(svg, "circle", { class: "mt-spark" })
      });
    }

    function render(t, e) {
      set(aura, { opacity: r2(0.45 + 0.55 * e) });
      set(ring, { "stroke-dashoffset": r2(-t * 14) });

      parts.forEach(function (p) {
        var age = mod(t + p.phase * p.life, p.life);
        var q = age / p.life;
        var x = EX + p.x0 * (1 - 0.45 * q) + Math.sin(age * p.freq + p.ph) * p.amp * q;
        var y = EY - 2 - p.vy * age * (1 - 0.2 * q);
        var r = p.size * (1 - 0.65 * q);
        var o = smooth(seg(q, 0, 0.12)) * (1 - smooth(seg(q, 0.5, 1)));
        o *= 0.7 + 0.3 * e;
        set(p.halo, { cx: r2(x), cy: r2(y), r: r2(r * 3.4), opacity: r2(o) });
        set(p.core, { cx: r2(x), cy: r2(y), r: r2(r * 0.75), opacity: r2(o) });
      });
    }

    return { t0: 3.1, render: render };
  };

  /* --- 07 · MUSIC & SOUND -----------------------------------------------------
     Волна звука из тонких столбиков, симметричных относительно оси.
     Форма волны своя у каждого столбика, а при наведении они «играют»
     от суммы нескольких синусов. Плейхед идёт слева направо, сыгранная
     часть ярче. */

  MOTIFS["sfx-music"] = function (svg, uid) {
    var N = 29;
    var X0 = 28;
    var X1 = 132;
    var CY = 41;
    var STEP = (X1 - X0) / (N - 1);
    var LOOP = 5.2;

    var defs = el(svg, "defs");
    var glow = glowFilter(defs, uid + "-glow", 1.1);

    el(svg, "line", { class: "mt-dim", x1: X0 - 4, y1: CY, x2: X1 + 4, y2: CY });

    var rand = rng(12);
    var bars = [];
    for (var i = 0; i < N; i++) {
      var x = X0 + i * STEP;
      var env = 2.5 + 24 * Math.pow(Math.sin(Math.PI * (i + 0.5) / N), 0.9) * (0.4 + 0.6 * rand());
      bars.push({
        x: x, env: env, played: null,
        n: el(svg, "rect", { class: "mt-bar", x: r2(x - 0.85), width: 1.7, rx: 0.85 })
      });
    }

    var TY = 78;
    el(svg, "line", { class: "mt-dim", x1: X0, y1: TY, x2: X1, y2: TY });
    for (var k = 0; k <= 8; k++) {
      var tx = X0 + (k / 8) * (X1 - X0);
      el(svg, "line", { class: "mt-dim", x1: r2(tx), y1: TY - (k % 4 === 0 ? 2.5 : 1.4), x2: r2(tx), y2: TY });
    }

    var head = el(svg, "g", { class: "mt-acc", filter: glow });
    var headLine = el(head, "line", { y1: 12, y2: 72 });
    var headKnob = el(head, "path", { class: "mt-acc-fill" });
    var headDot = el(head, "circle", { r: 1.6, cy: TY, class: "mt-acc-fill" });

    function render(t, e) {
      var xp = X0 + (X1 - X0) * (mod(t, LOOP) / LOOP);

      bars.forEach(function (b, i) {
        var a = 0.5 + 0.5 * (0.55 * Math.sin(t * 4.3 + i * 0.62) +
                             0.3 * Math.sin(t * 7.4 - i * 1.13 + 1) +
                             0.15 * Math.sin(t * 2.1 + i * 0.27));
        var near = Math.exp(-Math.pow((b.x - xp) / 5, 2));
        var h = b.env * lerp(1, 0.35 + 0.75 * a + 0.25 * near, e);
        h = Math.max(1.2, h);
        set(b.n, { y: r2(CY - h), height: r2(h * 2) });

        var played = b.x <= xp;
        if (played !== b.played) {
          b.played = played;
          b.n.setAttribute("class", played ? "mt-bar is-played" : "mt-bar");
        }
      });

      set(headLine, { x1: r2(xp), x2: r2(xp) });
      set(headKnob, { d: "M" + r2(xp - 2.6) + " 9.5 H" + r2(xp + 2.6) + " L" + r2(xp) + " 13.2 Z" });
      set(headDot, { cx: r2(xp) });
    }

    return { t0: LOOP * 0.42, render: render };
  };

  /* --- 08 · GUI --------------------------------------------------------------
     Панель настроек: тумблер, слайдер, две кнопки. Курсор ходит по дугам
     с ускорением и торможением, щёлкает тумблер, тянет ползунок, жмёт
     главную кнопку — по ней расходится волна. В конце цикла панель
     тихо возвращается в исходное состояние. */

  MOTIFS.gui = function (svg, uid) {
    var PERIOD = 6;
    var REST = [134, 84];
    var TOGGLE = [110.5, 33];
    var SL_X0 = 40;
    var SL_X1 = 122;
    var SL_Y = 47;
    var V0 = 0.28;
    var V1 = 0.78;
    var BTN = [103, 62];

    var defs = el(svg, "defs");
    var clipId = uid + "-btn";
    var clip = el(defs, "clipPath", { id: clipId });
    el(clip, "rect", { x: 84, y: 56.5, width: 38, height: 11, rx: 3 });

    el(svg, "rect", { class: "mt-solid mt-face", x: 30, y: 11, width: 100, height: 64, rx: 4 });
    el(svg, "rect", { class: "mt-tk-k", x: 38, y: 16.5, width: 26, height: 3.2, rx: 1.6 });
    el(svg, "circle", { class: "mt-fill-dim", cx: 120, cy: 18.1, r: 1.4 });
    el(svg, "circle", { class: "mt-fill-dim", cx: 115, cy: 18.1, r: 1.4 });
    el(svg, "line", { class: "mt-dim", x1: 30, y1: 24.5, x2: 130, y2: 24.5 });

    /* Тумблер. */
    el(svg, "rect", { class: "mt-tk-i", x: 38, y: 31.4, width: 34, height: 3.2, rx: 1.6 });
    var track = el(svg, "rect", { x: 106, y: 29, width: 17, height: 8, rx: 4 });
    var trackOn = el(svg, "rect", { class: "mt-on", x: 106, y: 29, width: 17, height: 8, rx: 4, stroke: "none" });
    var knob = el(svg, "circle", { class: "mt-knob", cy: 33, r: 2.7 });

    /* Слайдер. */
    el(svg, "line", { class: "mt-dim", x1: SL_X0, y1: SL_Y, x2: SL_X1, y2: SL_Y });
    var fillLine = el(svg, "line", { class: "mt-strong", x1: SL_X0, y1: SL_Y, y2: SL_Y });
    var slKnob = el(svg, "circle", { class: "mt-solid mt-face", cy: SL_Y, r: 3 });

    /* Кнопки. */
    el(svg, "rect", { x: 38, y: 56.5, width: 38, height: 11, rx: 3 });
    el(svg, "rect", { class: "mt-tk-i", x: 48, y: 60.5, width: 18, height: 3, rx: 1.5 });
    var btn = el(svg, "g", { class: "mt-btn" });
    el(btn, "rect", { class: "mt-acc mt-acc-face", x: 84, y: 56.5, width: 38, height: 11, rx: 3 });
    var ripple = el(btn, "circle", { class: "mt-acc-fill", "clip-path": "url(#" + clipId + ")", opacity: 0 });
    el(btn, "rect", { class: "mt-acc-fill", x: 94, y: 60.5, width: 18, height: 3, rx: 1.5, opacity: 0.85 });

    var cursor = el(svg, "path", {
      class: "mt-cursor",
      d: "M0 0V11.2L3 8.4L5.3 13.2L7.2 12.4L4.9 7.7H8.8Z"
    });

    /* Перелёт курсора по дуге: квадратичная кривая с изгибом вбок. */
    function fly(a, b, k) {
      var mx = (a[0] + b[0]) / 2;
      var my = (a[1] + b[1]) / 2;
      var dx = b[0] - a[0];
      var dy = b[1] - a[1];
      var c = [mx - dy * 0.18, my + dx * 0.18];
      var s = easeInOut(k);
      var i = 1 - s;
      return [i * i * a[0] + 2 * i * s * c[0] + s * s * b[0],
              i * i * a[1] + 2 * i * s * c[1] + s * s * b[1]];
    }

    function render(t) {
      var q = mod(t, PERIOD) / PERIOD;
      var sliderAt = function (v) { return [SL_X0 + (SL_X1 - SL_X0) * v, SL_Y]; };

      /* Состояния элементов. */
      var on = easeOut(seg(q, 0.17, 0.25)) * (1 - easeInOut(seg(q, 0.9, 0.98)));
      var v = lerp(V0, V1, easeInOut(seg(q, 0.42, 0.58)));
      v = lerp(v, V0, easeInOut(seg(q, 0.9, 0.99)));
      var press = Math.sin(seg(q, 0.75, 0.8) * Math.PI);
      var rp = seg(q, 0.765, 0.95);

      /* Где курсор. */
      var c;
      if (q < 0.14) c = fly(REST, TOGGLE, seg(q, 0, 0.14));
      else if (q < 0.24) c = TOGGLE;
      else if (q < 0.38) c = fly(TOGGLE, sliderAt(V0), seg(q, 0.24, 0.38));
      else if (q < 0.6) c = sliderAt(v);
      else if (q < 0.73) c = fly(sliderAt(V1), BTN, seg(q, 0.6, 0.73));
      else if (q < 0.82) c = BTN;
      else c = fly(BTN, REST, seg(q, 0.82, 0.97));

      var down = Math.max(Math.sin(seg(q, 0.15, 0.2) * Math.PI), press,
                          seg(q, 0.39, 0.42) * (1 - seg(q, 0.58, 0.61)));
      var cs = 1 - 0.12 * down;

      set(knob, { cx: r2(lerp(110, 119, on)) });
      set(trackOn, { opacity: r2(on) });
      set(track, { opacity: r2(1 - on * 0.5) });

      var kx = SL_X0 + (SL_X1 - SL_X0) * v;
      set(fillLine, { x2: r2(kx) });
      set(slKnob, { cx: r2(kx), r: r2(3 + 0.6 * seg(q, 0.39, 0.42) * (1 - seg(q, 0.58, 0.61))) });

      btn.style.transform = "scale(" + r2(1 - 0.045 * press) + ")";
      set(ripple, {
        cx: BTN[0], cy: BTN[1],
        r: r2(2 + 26 * easeOut(rp)),
        opacity: r2(rp > 0 && rp < 1 ? 0.4 * (1 - rp) : 0)
      });

      set(cursor, {
        transform: "translate(" + r2(c[0] - 1) + " " + r2(c[1] - 1) + ") scale(" + r2(cs) + ")"
      });
    }

    return { t0: PERIOD * 0.7, render: render };
  };

  /* --- 09 · CUTSCENE ---------------------------------------------------------
     Видоискатель камеры. Внутри — пейзаж в три плана: горы, холмы,
     столбы с проводами, каждый план едет со своей скоростью (параллакс).
     На наведении въезжают кинематографические шторки, проступает сетка
     третей, мигает REC. */

  MOTIFS.cutscene = function (svg, uid) {
    var FX = 22;
    var FY = 12;
    var FW = 116;
    var FH = 66;
    var W = FW;            /* период узоров = ширина кадра */

    var defs = el(svg, "defs");
    var clipId = uid + "-frame";
    var clip = el(defs, "clipPath", { id: clipId });
    el(clip, "rect", { x: FX, y: FY, width: FW, height: FH, rx: 3 });
    var glow = glowFilter(defs, uid + "-glow", 1);

    var scene = el(svg, "g", { "clip-path": "url(#" + clipId + ")" });
    el(scene, "rect", { class: "mt-screen", x: FX, y: FY, width: FW, height: FH, stroke: "none" });

    /* Солнце за горами. */
    el(scene, "circle", { class: "mt-dim", cx: 106, cy: 27, r: 6 });

    /* Дальние горы — ломаная с периодом W, повторена трижды. */
    var ridge = [0, -13, -7, -19, -10, -15, -5, -11, 0];
    var far = [];
    for (var rep = 0; rep < 3; rep++) {
      ridge.forEach(function (h, i) {
        if (rep > 0 && i === 0) return;
        far.push([FX + rep * W + (i / 8) * W, 47 + h]);
      });
    }
    far.push([FX + 3 * W, 90], [FX, 90]);
    var farG = el(scene, "polygon", { class: "mt-dim mt-screen", points: pts(far) });

    /* Средние холмы — гладкая периодическая кривая. */
    var mid = [];
    for (var x = 0; x <= 3 * W; x += 3) {
      var p = (x / W) * TAU;
      mid.push([FX + x, 56 - 3.5 * Math.sin(p) - 2 * Math.sin(2 * p + 1)]);
    }
    mid.push([FX + 3 * W, 90], [FX, 90]);
    var midG = el(scene, "polygon", { class: "mt-screen", points: pts(mid) });

    /* Ближний план — ели разной высоты на земле. Узор повторяется
       с периодом W, поэтому прокрутка бесшовная. */
    var near = el(scene, "g");
    el(near, "rect", { class: "mt-screen", x: FX, y: 66, width: 3 * W, height: 12, stroke: "none" });
    var trees = [[10, 1], [27, 0.75], [52, 1.15], [84, 0.85], [99, 1.05]];
    var treePath = "";
    for (var rp = 0; rp < 3; rp++) {
      trees.forEach(function (tr) {
        var tx = FX + rp * W + tr[0];
        var s = tr[1];
        var top = 66 - 17 * s;
        treePath += "M" + r2(tx) + " 66V" + r2(top + 2) +
          "M" + r2(tx - 5.5 * s) + " " + r2(66 - 5 * s) + "L" + r2(tx) + " " + r2(66 - 12 * s) + "L" + r2(tx + 5.5 * s) + " " + r2(66 - 5 * s) +
          "M" + r2(tx - 4 * s) + " " + r2(66 - 10.5 * s) + "L" + r2(tx) + " " + r2(top) + "L" + r2(tx + 4 * s) + " " + r2(66 - 10.5 * s);
      });
    }
    el(near, "path", { class: "mt-strong", d: treePath });
    el(scene, "line", { x1: FX, y1: 66, x2: FX + FW, y2: 66 });
    var gap = W;

    /* Сетка третей. */
    var thirds = el(scene, "g", { class: "mt-dim mt-dash", opacity: 0 });
    [1, 2].forEach(function (n) {
      el(thirds, "line", { x1: FX + (FW * n) / 3, y1: FY, x2: FX + (FW * n) / 3, y2: FY + FH });
      el(thirds, "line", { x1: FX, y1: FY + (FH * n) / 3, x2: FX + FW, y2: FY + (FH * n) / 3 });
    });

    /* Шторки. */
    var barTop = el(scene, "rect", { class: "mt-bar-fill", x: FX, y: FY, width: FW, stroke: "none" });
    var barBot = el(scene, "rect", { class: "mt-bar-fill", x: FX, width: FW, stroke: "none" });

    /* Уголки видоискателя. */
    var c = 6;
    var inset = 5;
    var corners = [
      [FX + inset, FY + inset, 1, 1], [FX + FW - inset, FY + inset, -1, 1],
      [FX + inset, FY + FH - inset, 1, -1], [FX + FW - inset, FY + FH - inset, -1, -1]
    ].map(function (k) {
      return "M" + k[0] + " " + (k[1] + c * k[3]) + "V" + k[1] + "H" + (k[0] + c * k[2]);
    }).join("");
    var cornersG = el(svg, "path", { class: "mt-strong", d: corners });

    var rec = el(svg, "circle", { class: "mt-acc-fill", r: 1.6, filter: glow });
    var recLabel = el(svg, "rect", { class: "mt-tk-i", width: 9, height: 2.4, rx: 1.2 });
    var tc = el(svg, "rect", { class: "mt-tk-p", width: 16, height: 2.4, rx: 1.2 });

    el(svg, "rect", { x: FX, y: FY, width: FW, height: FH, rx: 3 });

    function render(t, e) {
      set(farG, { transform: "translate(" + r2(-mod(t * 3.2, W)) + " 0)" });
      set(midG, { transform: "translate(" + r2(-mod(t * 8, W)) + " 0)" });
      set(near, { transform: "translate(" + r2(-mod(t * 21, gap)) + " 0)" });

      var hb = 2.5 + 6.5 * easeInOut(e);
      set(barTop, { height: r2(hb) });
      set(barBot, { y: r2(FY + FH - hb), height: r2(hb) });
      set(cornersG, { opacity: r2(0.6 + 0.4 * e) });
      set(thirds, { opacity: r2(0.75 * e) });

      var recY = FY + hb / 2;
      var pulse = 0.35 + 0.65 * smooth(0.5 + 0.5 * Math.cos(t * TAU * 0.8));
      set(rec, { cx: FX + 7, cy: r2(recY), opacity: r2(e * pulse) });
      set(recLabel, { x: FX + 10.5, y: r2(recY - 1.2), opacity: r2(e) });
      set(tc, { x: FX + FW - 22, y: r2(recY - 1.2), opacity: r2(e) });
    }

    return { t0: 1.2, render: render };
  };

  /* ==========================================================================
     ДВИЖОК
     ========================================================================== */

  var states = [];
  var raf = null;
  var last = 0;

  function frame(now) {
    var dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    var busy = false;

    states.forEach(function (s) {
      if (s.target === 0 && s.e === 0) return;
      busy = true;

      /* Экспоненциальное сближение: разгон и затухание без ступенек. */
      var rate = s.target ? 3 : 2.4;
      s.e += (s.target - s.e) * (1 - Math.exp(-dt * rate));
      if (s.target === 0 && s.e < 0.004) s.e = 0;
      if (s.target === 1 && s.e > 0.998) s.e = 1;

      var k = smooth(s.e);
      s.t += dt * k;
      s.render(s.t, k);
    });

    if (busy) {
      raf = requestAnimationFrame(frame);
    } else {
      raf = null;
      last = 0;
    }
  }

  function wake() {
    if (raf === null) raf = requestAnimationFrame(frame);
  }

  function activate(s, on) {
    s.target = on ? 1 : 0;
    s.card.classList.toggle("is-active", on);
    wake();
  }

  function setup(card) {
    var slot = u.$("[data-motif]", card);
    if (!slot) return null;
    var make = MOTIFS[slot.getAttribute("data-motif")];
    if (!make) return null;

    slot.textContent = "";
    var svg = el(slot, "svg", { viewBox: "0 0 160 90", class: "mt", focusable: "false" });
    var m = make(svg, "mt" + (++uidCounter));
    var s = { card: card, render: m.render, t: m.t0, e: 0, target: 0 };
    m.render(s.t, 0);
    return s;
  }

  function init() {
    var cards = u.$$(".skill-place");
    if (!cards.length) return;

    var still = u.prefersReducedMotion();
    var touch = window.matchMedia("(hover: none)").matches;

    cards.forEach(function (card) {
      var s = setup(card);
      if (!s || still) return;
      states.push(s);

      /* Подсветка за курсором — координаты в процентах карточки. */
      u.on(card, "pointermove", function (ev) {
        var r = card.getBoundingClientRect();
        card.style.setProperty("--mx", r2(((ev.clientX - r.left) / r.width) * 100) + "%");
        card.style.setProperty("--my", r2(((ev.clientY - r.top) / r.height) * 100) + "%");
      }, { passive: true });

      if (!touch) {
        u.on(card, "pointerenter", function (ev) {
          if (ev.pointerType !== "touch") activate(s, true);
        });
        u.on(card, "pointerleave", function () {
          activate(s, false);
        });
      }
    });

    /* Без наведения мотив живёт, пока карточка хорошо видна. */
    if (touch && !still && "IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          states.forEach(function (s) {
            if (s.card === entry.target) activate(s, entry.intersectionRatio >= 0.6);
          });
        });
      }, { threshold: [0, 0.6, 1] });
      states.forEach(function (s) {
        io.observe(s.card);
      });
    }
  }

  return { init: init };
})();
