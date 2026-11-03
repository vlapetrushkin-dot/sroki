/* ==========================================================================
   RIFT — энергетические вспышки: мягкое ядро, расходящиеся лучи, искры.

   Как устроено:
     - лучи — гладкие кривые (сплайн Катмулла-Рома), сужаются к кончику
       и растворяются по мере удаления от центра;
     - по каждому лучу от центра к краю бегут импульсы света со своим
       ритмом, ответвления подхватывают импульс, когда он доходит до развилки;
     - вместо осколков — светящиеся искры: вылетают из ядра вдоль лучей,
       плавно гаснут; плюс редкая пыль на фоне для глубины.

   Форма генерируется из сида: одна и та же при каждой загрузке, но
   четырнадцать вспышек не похожи друг на друга.

   Цена:
     - статичный слой (лучи со свечением) рисуется один раз на вспышку,
       в кадре он только накладывается;
     - кадры считаются лишь у вспышек в зоне видимости;
     - при отключённых анимациях вспышки не создаются вовсе.
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

  /* --- Ручки ---------------------------------------------------------------
     LINE_ALPHA   — видимость лучей в покое (0–1). Меньше — прозрачнее.
     PULSE_ALPHA  — яркость бегущего импульса.
     PULSE_SPEED  — скорость импульса, единиц сцены в секунду (сцена 200×200).
     CORE_ALPHA   — яркость ядра.
     MOTES        — искр на вспышку размером 200px (меньше вспышка — меньше искр). */
  var LINE_ALPHA = 0.24;
  var PULSE_ALPHA = 0.95;
  var PULSE_SPEED = 46;
  var CORE_ALPHA = 0.55;
  var MOTES = 9;

  var VB = 200;            /* сторона сцены в условных единицах */
  var C = VB / 2;          /* центр */
  var TAU = Math.PI * 2;
  var DPR_MAX = 2;

  var accent = [198, 255, 63];
  var hot = [209, 255, 128];     /* сердцевина луча: акцент, разбавленный белым */
  var white = [240, 255, 214];   /* центр ядра */
  var sprite = null;

  var rifts = [];
  var raf = null;
  var lastTime = 0;

  /* --- Утилиты -------------------------------------------------------------- */

  /* Свой генератор, а не Math.random: нужен повторяемый результат от сида. */
  function rng(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  function rgba(c, a) {
    return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a.toFixed(3) + ")";
  }

  function mix(a, b, k) {
    return [
      Math.round(a[0] + (b[0] - a[0]) * k),
      Math.round(a[1] + (b[1] - a[1]) * k),
      Math.round(a[2] + (b[2] - a[2]) * k)
    ];
  }

  function readAccent() {
    var raw = getComputedStyle(document.documentElement)
      .getPropertyValue("--c-accent").trim().replace("#", "");
    if (raw.length === 3) {
      raw = raw[0] + raw[0] + raw[1] + raw[1] + raw[2] + raw[2];
    }
    if (!/^[0-9a-f]{6}$/i.test(raw)) return;
    accent = [
      parseInt(raw.slice(0, 2), 16),
      parseInt(raw.slice(2, 4), 16),
      parseInt(raw.slice(4, 6), 16)
    ];
    hot = mix(accent, [255, 255, 255], 0.35);
    white = mix(accent, [255, 255, 255], 0.82);
  }

  function makeCanvas(size) {
    var c = document.createElement("canvas");
    c.width = c.height = size;
    return c;
  }

  /* --- Геометрия ------------------------------------------------------------ */

  /** Сглаживание ломаной сплайном Катмулла-Рома: изломы уходят, остаются дуги. */
  function smooth(pts, perSeg) {
    var out = [];
    var n = pts.length;

    function at(i) {
      if (i < 0) return [2 * pts[0][0] - pts[1][0], 2 * pts[0][1] - pts[1][1]];
      if (i >= n) return [2 * pts[n - 1][0] - pts[n - 2][0], 2 * pts[n - 1][1] - pts[n - 2][1]];
      return pts[i];
    }

    for (var i = 0; i < n - 1; i++) {
      var p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
      for (var s = 0; s < perSeg; s++) {
        var t = s / perSeg, t2 = t * t, t3 = t2 * t;
        out.push([
          0.5 * (2 * p1[0] + (p2[0] - p0[0]) * t +
            (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
            (3 * p1[0] - p0[0] - 3 * p2[0] + p3[0]) * t3),
          0.5 * (2 * p1[1] + (p2[1] - p0[1]) * t +
            (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
            (3 * p1[1] - p0[1] - 3 * p2[1] + p3[1]) * t3)
        ]);
      }
    }
    out.push(pts[n - 1]);
    return out;
  }

  /** Луч: плавная кривая, которая слегка «гуляет» к концу. */
  function makeBranch(rand, x, y, angle, length, width, segs, wander) {
    var pts = [[x, y]];
    var a = angle;
    var step = length / segs;

    for (var i = 0; i < segs; i++) {
      a += (rand() - 0.5) * wander * (0.5 + i / segs);
      x += Math.cos(a) * step;
      y += Math.sin(a) * step;
      pts.push([x, y]);
    }

    var line = smooth(pts, 10);
    var dist = [0];
    for (var k = 1; k < line.length; k++) {
      var dx = line[k][0] - line[k - 1][0];
      var dy = line[k][1] - line[k - 1][1];
      dist.push(dist[k - 1] + Math.sqrt(dx * dx + dy * dy));
    }

    var b = {
      line: line,
      dist: dist,
      len: dist[dist.length - 1],
      width: width,
      angle: angle,
      x0: line[0][0],
      y0: line[0][1],
      x1: line[line.length - 1][0],
      y1: line[line.length - 1][1]
    };
    b.ribbon = ribbon(b);
    b.center = centerline(b);
    return b;
  }

  /** Толщина луча на доле длины t: сужается в иглу к кончику. */
  function widthAt(b, t) {
    return b.width * Math.pow(1 - t, 0.85);
  }

  /** Контур сужающейся ленты вокруг осевой линии. */
  function ribbon(b) {
    var L = b.line;
    var n = L.length;
    var left = [];
    var right = [];

    for (var i = 0; i < n; i++) {
      var a = L[Math.max(0, i - 1)];
      var c = L[Math.min(n - 1, i + 1)];
      var tx = c[0] - a[0];
      var ty = c[1] - a[1];
      var tl = Math.sqrt(tx * tx + ty * ty) || 1;
      var nx = -ty / tl;
      var ny = tx / tl;
      var w = widthAt(b, b.dist[i] / b.len) * 0.5;
      left.push([L[i][0] + nx * w, L[i][1] + ny * w]);
      right.push([L[i][0] - nx * w, L[i][1] - ny * w]);
    }

    var p = new Path2D();
    p.moveTo(left[0][0], left[0][1]);
    for (var j = 1; j < n; j++) p.lineTo(left[j][0], left[j][1]);
    for (var r = n - 1; r >= 0; r--) p.lineTo(right[r][0], right[r][1]);
    p.closePath();
    return p;
  }

  function centerline(b) {
    var p = new Path2D();
    p.moveTo(b.line[0][0], b.line[0][1]);
    for (var i = 1; i < b.line.length; i++) p.lineTo(b.line[i][0], b.line[i][1]);
    return p;
  }

  /** Точка и направление на дуговом расстоянии d от начала луча. */
  function pointAt(b, d) {
    for (var i = 1; i < b.dist.length; i++) {
      if (b.dist[i] >= d) {
        var p = b.line[i - 1];
        var q = b.line[i];
        return {
          x: p[0], y: p[1],
          a: Math.atan2(q[1] - p[1], q[0] - p[0])
        };
      }
    }
    return { x: b.x1, y: b.y1, a: 0 };
  }

  function buildScene(seed) {
    var rand = rng(seed);
    var mains = [];
    var subs = [];
    var count = 5 + Math.floor(rand() * 3);         /* 5–7 главных лучей */
    var start = rand() * TAU;

    for (var i = 0; i < count; i++) {
      /* Углы разведены равномерно с разбросом: лучи не сходятся в пучок. */
      var angle = start + (i / count) * TAU + (rand() - 0.5) * 0.6;
      var len = 44 + rand() * 36;
      var main = makeBranch(rand,
        C + Math.cos(angle) * 3, C + Math.sin(angle) * 3,
        angle, len, 2 + rand() * 0.9, 4, 0.3);

      /* Ритм импульса у каждого луча свой — вспышка дышит неровно, живо. */
      main.period = 3.6 + rand() * 3.2;
      main.phase = rand() * main.period;
      main.subs = [];
      mains.push(main);

      /* Ответвление — от середины, чуть в сторону. */
      if (rand() > 0.35) {
        var forkD = main.len * (0.3 + rand() * 0.25);
        var f = pointAt(main, forkD);
        var side = rand() > 0.5 ? 1 : -1;
        var sub = makeBranch(rand, f.x, f.y,
          f.a + side * (0.45 + rand() * 0.35),
          main.len * (0.3 + rand() * 0.2),
          widthAt(main, forkD / main.len) * 0.9, 3, 0.4);
        sub.parent = main;
        sub.forkD = forkD;
        main.subs.push(sub);
        subs.push(sub);
      }
    }

    return { mains: mains, all: mains.concat(subs) };
  }

  /* --- Статичный слой: лучи со свечением, рисуется один раз ----------------- */

  function renderLayer(r) {
    var S = r.px;
    var k = S / VB;

    /* Резкие ленты. Прозрачность задаёт радиальный градиент: у самого
       центра луч прячется в ядре, дальше набирает силу и к краю тает. */
    var sharp = makeCanvas(S);
    var a = sharp.getContext("2d");
    a.setTransform(k, 0, 0, k, 0, 0);
    var g = a.createRadialGradient(C, C, 0, C, C, 90);
    g.addColorStop(0, rgba(hot, 0));
    g.addColorStop(0.06, rgba(hot, 0.15));
    g.addColorStop(0.2, rgba(hot, 1));
    g.addColorStop(0.42, rgba(hot, 0.72));
    g.addColorStop(0.68, rgba(hot, 0.32));
    g.addColorStop(0.9, rgba(hot, 0.06));
    g.addColorStop(1, rgba(hot, 0));
    a.fillStyle = g;
    r.scene.all.forEach(function (b) {
      a.fill(b.ribbon);
    });

    /* Свечение — тенью от тех же лент: широкое мягкое и узкое плотное. */
    var layer = r.layer || makeCanvas(S);
    layer.width = layer.height = S;
    var l = layer.getContext("2d");
    l.clearRect(0, 0, S, S);
    l.shadowColor = rgba(accent, 0.9);
    l.shadowBlur = 7 * k;
    l.drawImage(sharp, 0, 0);
    l.shadowColor = rgba(accent, 1);
    l.shadowBlur = 2 * k;
    l.drawImage(sharp, 0, 0);
    l.shadowBlur = 0;
    l.shadowColor = "transparent";

    r.layer = layer;
  }

  /* --- Кадр ----------------------------------------------------------------- */

  /** Ядро: мягкое гауссово пятно без резкой границы. Цвет насыщенный, без
      ухода в белый: полупрозрачный белый на тёмном фоне читается серым. */
  function drawCore(r, ctx, k, breathe) {
    var R = (46 + breathe * 6) * k;
    var amp = CORE_ALPHA * (0.72 + 0.28 * breathe);
    var g = ctx.createRadialGradient(C * k, C * k, 0, C * k, C * k, R);
    for (var i = 0; i <= 12; i++) {
      var x = i / 12;
      var alpha = (0.78 * Math.exp(-x * x * 34) + 0.22 * Math.exp(-x * x * 5)) * amp;
      if (i === 12) alpha = 0;
      g.addColorStop(x, rgba(x < 0.25 ? mix(hot, accent, x / 0.25) : accent, alpha));
    }
    ctx.fillStyle = g;
    ctx.fillRect(C * k - R, C * k - R, R * 2, R * 2);
  }

  /** Расстояние, которое импульс прошёл по главному лучу к моменту t. */
  function travel(main, t) {
    var tau = (t + main.phase) % main.period;
    /* Импульс замедляется к краю — энергия «рассеивается». */
    var span = main.len + 30;
    var dur = span / PULSE_SPEED * 1.5;
    if (tau > dur) return -1e3;
    return span * Math.sin((tau / dur) * Math.PI / 2) - 12;
  }

  /** Значение кусочно-линейной функции в точке x (для обрезки градиента). */
  function sample(pts, x) {
    if (x <= pts[0][0]) return pts[0][1];
    for (var i = 1; i < pts.length; i++) {
      if (x <= pts[i][0]) {
        var a = pts[i - 1];
        var b = pts[i];
        return a[1] + (b[1] - a[1]) * (x - a[0]) / ((b[0] - a[0]) || 1);
      }
    }
    return pts[pts.length - 1][1];
  }

  /** Маска импульса вдоль луча: мягкий хвост к центру, короткий фронт. */
  function strokePulse(m, b, d) {
    var tail = 34;
    var head = 6;
    if (d < -head || d > b.len + tail) return;

    var L = b.len;
    var pts = [
      [(d - tail) / L, 0],
      [(d - tail * 0.45) / L, 0.35],
      [d / L, 1],
      [(d + head) / L, 0]
    ];
    var g = m.createLinearGradient(b.x0, b.y0, b.x1, b.y1);
    g.addColorStop(0, "rgba(255,255,255," + sample(pts, 0).toFixed(3) + ")");
    pts.forEach(function (p) {
      if (p[0] > 0 && p[0] < 1) g.addColorStop(p[0], "rgba(255,255,255," + p[1] + ")");
    });
    g.addColorStop(1, "rgba(255,255,255," + sample(pts, 1).toFixed(3) + ")");

    m.strokeStyle = g;
    m.stroke(b.center);
  }

  function drawPulses(r, t) {
    var S = r.px;
    var k = S / VB;
    var m = r.mctx;

    m.setTransform(1, 0, 0, 1, 0, 0);
    m.globalCompositeOperation = "source-over";
    m.clearRect(0, 0, S, S);
    m.setTransform(k, 0, 0, k, 0, 0);
    m.lineWidth = 12;
    m.lineCap = "round";
    m.lineJoin = "round";

    r.scene.mains.forEach(function (main) {
      var d = travel(main, t);
      strokePulse(m, main, d);
      /* Ответвление подхватывает импульс, когда тот доходит до развилки. */
      main.subs.forEach(function (sub) {
        strokePulse(m, sub, d - sub.forkD);
      });
    });

    /* Оставляем от слоя лучей только то, что под маской импульсов. */
    m.setTransform(1, 0, 0, 1, 0, 0);
    m.globalCompositeOperation = "source-in";
    m.drawImage(r.layer, 0, 0);
    m.globalCompositeOperation = "source-over";
  }

  /* --- Искры ---------------------------------------------------------------- */

  function makeSprite() {
    var s = makeCanvas(64);
    var c = s.getContext("2d");
    var g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, rgba(white, 1));
    g.addColorStop(0.1, rgba(hot, 1));
    g.addColorStop(0.32, rgba(accent, 0.38));
    g.addColorStop(0.6, rgba(accent, 0.08));
    g.addColorStop(1, rgba(accent, 0));
    c.fillStyle = g;
    c.fillRect(0, 0, 64, 64);
    return s;
  }

  /** Новая искра. Большинство — вдоль лучей из ядра, часть — пыль на фоне. */
  function spawn(r, p, anyAge) {
    var rand = Math.random;
    var spark = rand() < 0.72;
    var main = r.scene.mains[Math.floor(rand() * r.scene.mains.length)];
    var ang = spark ? main.angle + (rand() - 0.5) * 0.55 : rand() * TAU;
    var r0 = spark ? 6 + rand() * 14 : 18 + rand() * 46;
    var speed = spark ? 9 + rand() * 12 : 1.5 + rand() * 3;

    p.x = C + Math.cos(ang) * r0;
    p.y = C + Math.sin(ang) * r0;
    p.vx = Math.cos(ang) * speed;
    p.vy = Math.sin(ang) * speed;
    p.life = spark ? 2.4 + rand() * 2.6 : 5 + rand() * 4;
    p.age = anyAge ? rand() * p.life : 0;
    p.size = spark ? 2.6 + rand() * 2.4 : 5 + rand() * 6;
    p.peak = spark ? 0.5 + rand() * 0.45 : 0.1 + rand() * 0.14;
    p.swayPhase = rand() * TAU;
    p.swayAmp = 0.6 + rand() * 1.6;
    p.swayFreq = 0.3 + rand() * 0.5;
  }

  function drawMotes(r, ctx, k, dt) {
    r.motes.forEach(function (p) {
      p.age += dt;
      if (p.age >= p.life) spawn(r, p, false);

      var q = p.age / p.life;
      /* Выезд с замедлением, лёгкое покачивание поперёк движения. */
      var travelK = p.life * (1 - (1 - q) * (1 - q)) * 0.6;
      var sway = Math.sin(p.age * p.swayFreq * TAU + p.swayPhase) * p.swayAmp;
      var sp = Math.sqrt(p.vx * p.vx + p.vy * p.vy) || 1;
      var x = p.x + p.vx * travelK - (p.vy / sp) * sway;
      var y = p.y + p.vy * travelK + (p.vx / sp) * sway;

      /* sin² — появление и угасание без рывков, с нулевой скоростью на краях. */
      var env = Math.sin(Math.PI * q);
      var alpha = p.peak * env * env;
      if (alpha < 0.01) return;

      var s = p.size * (1 - 0.35 * q) * k;
      ctx.globalAlpha = alpha;
      ctx.drawImage(sprite, x * k - s, y * k - s, s * 2, s * 2);
    });
  }

  function draw(r, t, dt) {
    var ctx = r.ctx;
    var S = r.px;
    var k = S / VB;
    var breathe = 0.5 + 0.5 * Math.sin((t / r.breathPeriod) * TAU + r.breathPhase);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, S, S);

    /* Свет складывается, а не перекрывает: пересечения ярче, как у огня. */
    ctx.globalCompositeOperation = "lighter";

    drawCore(r, ctx, k, breathe);

    ctx.globalAlpha = LINE_ALPHA * (0.8 + 0.2 * breathe);
    ctx.drawImage(r.layer, 0, 0);

    drawPulses(r, t);
    ctx.globalAlpha = PULSE_ALPHA;
    ctx.drawImage(r.mask, 0, 0);

    drawMotes(r, ctx, k, dt);

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  function frame(now) {
    var t = now / 1000;
    var dt = lastTime ? Math.min(0.05, t - lastTime) : 1 / 60;
    lastTime = t;

    var any = false;
    rifts.forEach(function (r) {
      if (!r.visible) return;
      any = true;
      draw(r, t, dt);
    });

    if (any) {
      raf = requestAnimationFrame(frame);
    } else {
      raf = null;
      lastTime = 0;
    }
  }

  function wake() {
    if (raf === null) raf = requestAnimationFrame(frame);
  }

  /* --- Размещение ----------------------------------------------------------- */

  function fit(r) {
    var css = r.el.clientWidth || r.size;
    var dpr = Math.min(window.devicePixelRatio || 1, DPR_MAX);
    var px = Math.max(16, Math.round(css * dpr));
    if (px === r.px) return;

    r.px = px;
    r.canvas.width = r.canvas.height = px;
    r.mask.width = r.mask.height = px;
    renderLayer(r);
  }

  function place(cfg, index) {
    var host = u.$(cfg.sel);
    if (!host) return;

    var el = document.createElement("div");
    el.className = "rift";
    el.setAttribute("aria-hidden", "true");

    var css = ["--size:" + cfg.size + "px"];
    ["top", "bottom", "left", "right"].forEach(function (side) {
      if (cfg[side]) css.push(side + ":" + cfg[side]);
    });
    el.setAttribute("style", css.join(";"));

    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d");
    if (!ctx) return;
    el.appendChild(canvas);
    host.appendChild(el);

    var mask = makeCanvas(1);
    var r = {
      el: el,
      size: cfg.size,
      canvas: canvas,
      ctx: ctx,
      mask: mask,
      mctx: mask.getContext("2d"),
      scene: buildScene(cfg.seed),
      px: 0,
      layer: null,
      visible: !("IntersectionObserver" in window),
      breathPeriod: 6.5 + (index % 4) * 0.7,
      breathPhase: index * 1.3,
      motes: []
    };

    var n = Math.max(5, Math.round(MOTES * cfg.size / 200));
    for (var i = 0; i < n; i++) {
      var p = {};
      spawn(r, p, true);
      r.motes.push(p);
    }

    fit(r);
    rifts.push(r);
  }

  /* Кадры считаются только у вспышек на экране: из четырнадцати видно
     две-три, остальные не тратят ни такта. */
  function watch() {
    if (!("IntersectionObserver" in window)) {
      wake();
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        rifts.forEach(function (r) {
          if (r.el === entry.target) r.visible = entry.isIntersecting;
        });
      });
      wake();
    }, { rootMargin: "20% 0px" });

    rifts.forEach(function (r) {
      observer.observe(r.el);
    });
  }

  function init() {
    /* Декор: при отключённых анимациях он не нужен вовсе. */
    if (u.prefersReducedMotion()) return;
    if (!window.Path2D) return;

    readAccent();
    sprite = makeSprite();

    PLACEMENTS.forEach(place);
    watch();

    var timer;
    u.on(window, "resize", function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        rifts.forEach(fit);
      }, 200);
    });
  }

  return { init: init };
})();
