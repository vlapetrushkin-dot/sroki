/* ==========================================================================
   SHADER — фоновый слой на WebGL: медленно текущее энергетическое поле.

   Фрагментный шейдер считает fbm-шум с искажением области (domain warping)
   и подсвечивает его «нити» акцентным цветом. Курсор добавляет локальное
   свечение — поле реагирует на присутствие, как и сетка точек.

   Чего это стоит и как удержано в рамках:
     - холст рендерится в половинном разрешении и растягивается стилями:
       поле размытое, разницы на глаз нет, пикселей вчетверо меньше;
     - кадры ограничены 30 в секунду;
     - в скрытой вкладке цикл останавливается;
     - при отключённых анимациях и без WebGL слой не создаётся вовсе.

   Если контекст не выдан — молча выходим: это украшение, а не условие
   работы сайта.
   ========================================================================== */

window.App = window.App || {};

window.App.shader = (function () {
  "use strict";

  var u = window.App.utils;

  var VERT = [
    "attribute vec2 p;",
    "void main(){ gl_Position = vec4(p, 0.0, 1.0); }"
  ].join("\n");

  var FRAG = [
    "precision mediump float;",
    "uniform vec2  u_res;",
    "uniform float u_time;",
    "uniform vec2  u_mouse;",
    "uniform vec3  u_accent;",
    "uniform float u_dark;",
    "uniform float u_strength;",

    /* Хеш и шум-значение: дёшево и достаточно для фона. */
    "float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }",

    "float noise(vec2 p){",
    "  vec2 i = floor(p), f = fract(p);",
    "  vec2 u = f * f * (3.0 - 2.0 * f);",
    "  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),",
    "             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);",
    "}",

    "float fbm(vec2 p){",
    "  float v = 0.0, a = 0.5;",
    "  for (int i = 0; i < 5; i++){ v += a * noise(p); p *= 2.02; a *= 0.5; }",
    "  return v;",
    "}",

    "void main(){",
    "  vec2 uv = gl_FragCoord.xy / u_res;",
    /* Частота высокая: нужны тонкие нити, а не крупные пятна —
       иначе фон перебивает текст. */
    "  vec2 p = uv * vec2(u_res.x / u_res.y, 1.0) * 6.5;",
    "  float t = u_time * 0.11;",

    /* Искажение области: поле течёт, а не мерцает на месте. */
    "  vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, -t)));",
    "  float f = fbm(p + q * 1.6 + vec2(t * 0.5, 0.0));",

    /* Нити: узкая полоса значений вокруг середины шума. */
    "  float filament = smoothstep(0.47, 0.5, f) * (1.0 - smoothstep(0.5, 0.55, f));",

    /* Локальное свечение под курсором. */
    "  vec2 m = u_mouse / u_res;",
    "  m.x *= u_res.x / u_res.y;",
    "  vec2 uvA = vec2(uv.x * u_res.x / u_res.y, uv.y);",
    "  float glow = exp(-distance(uvA, m) * 5.5);",

    /* Середина экрана держится чище краёв: там лежит текст. */
    "  float edge = 1.0 - smoothstep(0.04, 0.40, min(uv.x, 1.0 - uv.x));",

    "  float amount = (filament * 0.09 * (0.30 + 0.70 * edge) + glow * 0.05) * u_strength;",
    /* На светлой теме поле уводится в тень, иначе лайм слепит на белом. */
    "  vec3 col = mix(u_accent * 0.35, u_accent, u_dark);",
    "  gl_FragColor = vec4(col, amount * (0.5 + 0.5 * u_dark));",
    "}"
  ].join("\n");

  /* Две ручки настройки, чтобы не лезть в текст шейдера.
     STRENGTH — сила поля: поднять, и нити станут заметнее.
     SPEED    — скорость течения: 1 — базовая, больше — быстрее. */
  var STRENGTH = 0.85;
  var SPEED = 1;

  var canvas, gl, program, buffer, raf = null;
  var loc = {};
  var mouse = { x: -999, y: -999 };
  var startTime = 0;
  var SCALE = 0.5;
  var FRAME_MS = 1000 / 30;
  var lastFrame = 0;

  function compile(type, src) {
    var sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      gl.deleteShader(sh);
      return null;
    }
    return sh;
  }

  function build() {
    var vs = compile(gl.VERTEX_SHADER, VERT);
    var fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return false;

    program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return false;

    gl.useProgram(program);

    buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

    var p = gl.getAttribLocation(program, "p");
    gl.enableVertexAttribArray(p);
    gl.vertexAttribPointer(p, 2, gl.FLOAT, false, 0, 0);

    loc.res = gl.getUniformLocation(program, "u_res");
    loc.time = gl.getUniformLocation(program, "u_time");
    loc.mouse = gl.getUniformLocation(program, "u_mouse");
    loc.accent = gl.getUniformLocation(program, "u_accent");
    loc.dark = gl.getUniformLocation(program, "u_dark");
    loc.strength = gl.getUniformLocation(program, "u_strength");
    gl.uniform1f(loc.strength, STRENGTH);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    return true;
  }

  /** Акцент берётся из токенов — при смене темы цвет поля меняется тоже. */
  function readAccent() {
    var cs = getComputedStyle(document.documentElement);
    var raw = cs.getPropertyValue("--c-accent").trim().replace("#", "");
    if (raw.length === 3) {
      raw = raw[0] + raw[0] + raw[1] + raw[1] + raw[2] + raw[2];
    }
    var rgb = raw.length >= 6
      ? [parseInt(raw.slice(0, 2), 16) / 255,
         parseInt(raw.slice(2, 4), 16) / 255,
         parseInt(raw.slice(4, 6), 16) / 255]
      : [0.72, 1, 0.24];

    gl.useProgram(program);
    gl.uniform3f(loc.accent, rgb[0], rgb[1], rgb[2]);
    gl.uniform1f(loc.dark,
      document.documentElement.getAttribute("data-theme") === "light" ? 0 : 1);
  }

  function resize() {
    var w = Math.max(1, Math.round(window.innerWidth * SCALE));
    var h = Math.max(1, Math.round(window.innerHeight * SCALE));
    canvas.width = w;
    canvas.height = h;
    gl.viewport(0, 0, w, h);
    gl.useProgram(program);
    gl.uniform2f(loc.res, w, h);
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (now - lastFrame < FRAME_MS) return;
    lastFrame = now;

    gl.useProgram(program);
    gl.uniform1f(loc.time, (now - startTime) / 1000 * SPEED);
    gl.uniform2f(loc.mouse, mouse.x * SCALE, canvas.height - mouse.y * SCALE);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
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

  function init() {
    if (u.prefersReducedMotion()) return;

    canvas = u.$("[data-shader]");
    if (!canvas) return;

    try {
      gl = canvas.getContext("webgl", { alpha: true, antialias: false, depth: false })
        || canvas.getContext("experimental-webgl");
    } catch (e) {
      gl = null;
    }
    if (!gl || !build()) return;

    canvas.hidden = false;
    startTime = performance.now();
    readAccent();
    resize();
    start();

    var timer;
    u.on(window, "resize", function () {
      clearTimeout(timer);
      timer = setTimeout(resize, 200);
    });

    u.on(window, "pointermove", function (e) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    }, { passive: true });

    u.on(document, "visibilitychange", function () {
      if (document.hidden) stop();
      else start();
    });

    u.on(document.documentElement, "themechange", readAccent);
  }

  return { init: init };
})();
