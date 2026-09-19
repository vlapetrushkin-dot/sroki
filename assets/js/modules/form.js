/* ==========================================================================
   FORM — валидация и перенос заявки в Telegram.

   Сайт статический: отправлять письма неоткуда, а класть токен бота в
   исходники страницы нельзя — его увидит любой. Поэтому заявка уходит
   ссылкой: t.me/<ник>?text=<заявка> открывает чат с уже подставленным
   текстом, человеку остаётся нажать «Отправить».

   Не все клиенты Telegram подхватывают ?text (веб-версии бывают
   капризны), поэтому текст параллельно кладётся в буфер обмена — тогда
   его можно просто вставить. Статус под кнопкой говорит, что произошло.

   Появится бот или бэкенд — менять нужно только submit().
   ========================================================================== */

window.App = window.App || {};

window.App.form = (function () {
  "use strict";

  var u = window.App.utils;
  var HANDLE = "Krich_fran";
  var TELEGRAM = "https://t.me/" + HANDLE;
  var MIN_MESSAGE = 12;

  /* Запас по длине адреса: часть клиентов режет длинные ссылки. */
  var MAX_TEXT = 1800;

  var form, statusEl;

  function t(key) {
    return window.App.i18n.t(key);
  }

  function setError(field, message) {
    var box = field.closest("[data-field]");
    var out = u.$("[data-error]", box);
    box.classList.toggle("is-invalid", !!message);
    field.setAttribute("aria-invalid", message ? "true" : "false");
    if (out) out.textContent = message || "";
  }

  function validate() {
    var ok = true;

    var name = u.$("#f-name", form);
    if (!name.value.trim()) {
      setError(name, t("form.errRequired"));
      ok = false;
    } else {
      setError(name, "");
    }

    var message = u.$("#f-message", form);
    var text = message.value.trim();
    if (!text) {
      setError(message, t("form.errRequired"));
      ok = false;
    } else if (text.length < MIN_MESSAGE) {
      setError(message, t("form.errShort"));
      ok = false;
    } else {
      setError(message, "");
    }

    return ok;
  }

  /** Собирает письмо в том виде, в каком его удобно читать в чате. */
  function compose() {
    var name = u.$("#f-name", form).value.trim();
    var topicEl = u.$("#f-topic", form);
    var topic = topicEl.options[topicEl.selectedIndex].textContent.trim();
    var budget = u.$("#f-budget", form).value.trim();
    var message = u.$("#f-message", form).value.trim();

    var lines = [
      t("form.name") + ": " + name,
      t("form.topic") + ": " + topic
    ];
    if (budget) lines.push(t("form.budget") + ": " + budget);
    lines.push("");
    lines.push(message);

    return lines.join("\n");
  }

  function copy(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return Promise.reject();
  }

  function setStatus(message, ok) {
    statusEl.textContent = message;
    statusEl.classList.toggle("form__status--ok", !!ok);
  }

  /** Ссылка на чат с уже подставленным текстом заявки. */
  function telegramLink(text) {
    var payload = text.length > MAX_TEXT
      ? text.slice(0, MAX_TEXT - 1) + "…"
      : text;
    return TELEGRAM + "?text=" + encodeURIComponent(payload);
  }

  function submit(e) {
    e.preventDefault();
    if (!validate()) {
      setStatus("", false);
      return;
    }

    var text = compose();

    /* Буфер — запасной путь на случай клиента, который проглотит ?text.
       Копируем до открытия окна: после переключения вкладки документ
       теряет фокус, и clipboard-запись браузер уже не разрешит. */
    copy(text).then(
      function () {
        setStatus(t("form.ok"), true);
      },
      function () {
        setStatus(t("form.okNoCopy"), true);
      }
    );

    window.open(telegramLink(text), "_blank", "noopener");
  }

  /* --- Кнопки «скопировать» вне формы ------------------------------------- */

  function initCopyButtons() {
    u.$$("[data-copy]").forEach(function (btn) {
      u.on(btn, "click", function () {
        var state = u.$("[data-copy-state]", btn.parentNode);
        copy(btn.getAttribute("data-copy")).then(function () {
          if (!state) return;
          state.hidden = false;
          setTimeout(function () {
            state.hidden = true;
          }, 2000);
        }, function () {
          /* буфер недоступен — ник и так виден рядом, ничего не делаем */
        });
      });
    });
  }

  function init() {
    form = u.$("[data-form]");
    initCopyButtons();
    if (!form) return;

    statusEl = u.$("[data-form-status]");
    u.on(form, "submit", submit);

    /* Ошибку убираем, как только человек начал исправлять. */
    u.$$(".field__control", form).forEach(function (field) {
      u.on(field, "input", function () {
        if (field.closest("[data-field]").classList.contains("is-invalid")) {
          setError(field, "");
        }
      });
    });
  }

  return {
    init: init,
    compose: compose
  };
})();
