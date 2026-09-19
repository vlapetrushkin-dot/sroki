/* ==========================================================================
   AUDIO-PLAYER — управление плеерами, собранными в works.js.

   Одновременно звучит только один трек: запуск нового останавливает
   предыдущий, иначе музыка и звуки босса играли бы друг поверх друга.
   ========================================================================== */

window.App = window.App || {};

window.App.audioPlayer = (function () {
  "use strict";

  var u = window.App.utils;
  var currentAudio = null;

  function fmt(seconds) {
    if (!isFinite(seconds)) return "0:00";
    var m = Math.floor(seconds / 60);
    var s = Math.floor(seconds % 60);
    return m + ":" + (s < 10 ? "0" : "") + s;
  }

  function stopOthers(audio) {
    if (currentAudio && currentAudio !== audio) {
      currentAudio.pause();
    }
    currentAudio = audio;
  }

  function setup(root) {
    var audio = u.$("audio", root);
    var btn = u.$(".player__btn", root);
    var track = u.$(".player__track", root);
    var fill = u.$(".player__fill", root);
    var time = u.$(".player__time", root);

    if (!audio || !btn) return;

    function paint() {
      var ratio = audio.duration ? audio.currentTime / audio.duration : 0;
      fill.style.width = ratio * 100 + "%";
      time.textContent = fmt(audio.currentTime) + " / " + fmt(audio.duration);
    }

    u.on(btn, "click", function () {
      if (audio.paused) {
        stopOthers(audio);
        /* play() возвращает промис и отклоняет его, если браузер счёл,
           что жеста пользователя не было. Без catch это всплыло бы
           необработанной ошибкой в консоль. */
        var started = audio.play();
        if (started && started.catch) {
          started.catch(function () {
            root.classList.remove("is-playing");
          });
        }
      } else {
        audio.pause();
      }
    });

    u.on(audio, "play", function () {
      root.classList.add("is-playing");
      btn.setAttribute("aria-label", window.App.i18n.t("player.pause"));
      stopOthers(audio);
    });

    u.on(audio, "pause", function () {
      root.classList.remove("is-playing");
      btn.setAttribute("aria-label", window.App.i18n.t("player.play"));
    });

    u.on(audio, "timeupdate", paint);
    u.on(audio, "loadedmetadata", paint);
    u.on(audio, "ended", function () {
      audio.currentTime = 0;
      paint();
    });

    /* Перемотка кликом по дорожке. */
    u.on(track, "click", function (e) {
      if (!audio.duration) return;
      var rect = track.getBoundingClientRect();
      var ratio = (e.clientX - rect.left) / rect.width;
      audio.currentTime = Math.max(0, Math.min(1, ratio)) * audio.duration;
      paint();
    });

    paint();
  }

  /** Вызывается после отрисовки карточек. */
  function initAll(scope) {
    u.$$(".player", scope || document).forEach(function (el) {
      if (el.dataset.ready === "1") return;
      el.dataset.ready = "1";
      setup(el);
    });
  }

  function stopAll() {
    if (currentAudio) currentAudio.pause();
  }

  return {
    initAll: initAll,
    stopAll: stopAll,
    format: fmt
  };
})();
