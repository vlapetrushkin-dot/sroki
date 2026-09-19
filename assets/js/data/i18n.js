/* ==========================================================================
   СЛОВАРЬ RU / EN — единственное место, где живут тексты интерфейса.
   Ключ вида "hero.title" ставится в разметку через data-i18n.
   Значения с тегами подключаются через data-i18n-html.
   ========================================================================== */

window.APP_I18N = {
  ru: {
    /* --- Служебное --- */
    "meta.title": "Krich_fran — фуллстак-разработчик Roblox Studio",
    "meta.desc":
      "Разработка Roblox-проектов полного цикла: скриптинг, билдинг, моделинг, анимация, риг, VFX, SFX, музыка, GUI, катсцены. Опыт 3+ года.",
    "skip": "Перейти к содержимому",
    "lang.label": "Язык интерфейса",
    "theme.label": "Переключить тему",
    "menu.open": "Открыть меню",
    "menu.close": "Закрыть меню",

    /* --- Навигация --- */
    "nav.disciplines": "Дисциплины",
    "nav.works": "Работы",
    "nav.process": "Процесс",
    "nav.about": "Обо мне",
    "nav.contact": "Контакты",

    /* --- Hero --- */
    "hero.status": "Открыт к заказам",
    "hero.role": "Fullstack Roblox Developer",
    "hero.title": 'Собираю Roblox-проекты <span class="u-accent">целиком</span>',
    "hero.sub":
      "Скриптинг, билдинг, моделинг, анимация, риг, VFX, SFX, музыка, GUI и катсцены — от идеи до готового билда. Один человек вместо команды из девяти.",
    "hero.cta1": "Смотреть работы",
    "hero.cta2": "Написать в Telegram",
    "hero.stat1v": "3+",
    "hero.stat1l": "года в Roblox Studio",
    "hero.stat2v": "9",
    "hero.stat2l": "дисциплин в одном человеке",
    "hero.stat3v": "∞",
    "hero.stat3l": "стилей и жанров",
    "hero.also": "Также:",
    "hero.alsoText": "сайты, ПО, боты, парсеры, автоматизация",

    /* --- Плашка работника --- */
    "plate.role": "Fullstack Roblox Developer · опыт 3+ года",
    "plate.cta": "Связаться",

    /* --- Дисциплины --- */
    "disc.title": "Дисциплины",
    "disc.lead":
      "Девять направлений внутри Roblox Studio. Обычно под каждое нанимают отдельного человека.",
    "disc.note":
      "Любой стиль и жанр: от лоуполи-стилизации до реализма, от хоррора до симулятора. Стиль подбирается под проект, а не под мои привычки.",

    "disc.building.t": "Билдинг",
    "disc.building.d":
      "Карты, интерьеры, окружение. Собираю сцену так, чтобы она держала фпс и читалась с любой точки.",
    "disc.modelling.t": "Моделинг",
    "disc.modelling.d":
      "Пропы, оружие, техника, персонажи. Лоуполи и хайполи, чистая геометрия, аккуратные UV.",
    "disc.scripting.t": "Скриптинг",
    "disc.scripting.d":
      "Механики, серверная логика, сохранения, защита от эксплойтов.",
    "disc.animation.t": "Анимация",
    "disc.animation.d":
      "Ходьба, бой, эмоции, идлы. Циклы, которые не дёргаются на стыках.",
    "disc.rig.t": "Риг",
    "disc.rig.d":
      "Риги персонажей, техники и пропов. Кости, констрейнты и веса, собранные под анимацию.",
    "disc.vfx.t": "VFX",
    "disc.vfx.d":
      "Магия, взрывы, погода, шлейфы. Эффекты, которые не съедают производительность.",
    "disc.sfx.t": "Музыка и звук",
    "disc.sfx.d":
      "Треки, эмбиент, интерфейсные звуки, звук боя. Саундтрек под настроение проекта.",
    "disc.gui.t": "GUI",
    "disc.gui.d":
      "Меню, HUD, инвентари, магазины. Адаптив под телефон, планшет и консоль.",
    "disc.cutscene.t": "Катсцены",
    "disc.cutscene.d":
      "Кат-сцены, пролёты камеры, скриптовые сцены и интро.",

    /* --- Работы --- */
    "works.title": "Работы",
    "works.lead":
      "Пятнадцать работ в четырёх группах. Под каждой — что именно делал я.",
    "works.note":
      "Часть записей сделана прямо в Roblox Studio: это рабочий материал, а не смонтированный ролик. Так честнее — видно, как всё собрано.",
    "works.all": "Все",
    "works.open": "Открыть",

    /* Подписи подгрупп: они же подписи чипов фильтра */
    "sub.building": "Билдинг",
    "sub.modelling": "Моделинг",
    "sub.vfx": "VFX",
    "sub.gui": "GUI",
    "sub.scripting": "Скриптинг",
    "sub.music": "Музыка",
    "sub.sfx": "Звуки",

    "works.listen": "Слушать",
    "works.shown": "Показано {n} из {total}",
    "works.empty": "В этой категории пока пусто",
    "player.play": "Воспроизвести",
    "player.pause": "Пауза",
    "lightbox.close": "Закрыть",
    "lightbox.prev": "Предыдущее",
    "lightbox.next": "Следующее",

    /* --- Процесс --- */
    "process.title": "Процесс",
    "process.lead":
      "Пять шагов от первого сообщения до сдачи. Без сюрпризов в середине.",
    "process.s1.t": "Бриф",
    "process.s1.d":
      "Жанр, объём, сроки, референсы. Нет ТЗ — напишите как есть, помогу сформулировать.",
    "process.s2.t": "Оценка",
    "process.s2.d":
      "Разбиваю на этапы, называю срок и стоимость по каждому — а не вилку «от и до бесконечности».",
    "process.s3.t": "Прототип",
    "process.s3.d":
      "Черновая сборка ключевой части: проверяем направление до того, как вложены часы.",
    "process.s4.t": "Правки",
    "process.s4.d":
      "Показываю по этапам и правлю по ходу, чтобы к концу не скопился ком.",
    "process.s5.t": "Сдача",
    "process.s5.d":
      "Отдаю исходники: файл проекта, модели, звуки, файлы анимаций. Всё ваше.",
    "process.note":
      "После сдачи исходники остаются у вас, так что вы не привязаны ко мне — другой разработчик сможет продолжить проект.",

    /* --- Обо мне --- */
    "about.title": "Обо мне",
    "about.p1":
      "Три года с лишним я собираю Roblox-проекты целиком. Начинал со скриптинга и постепенно закрыл остальное: билдинг, модели, анимацию, риг, эффекты, интерфейсы, звук.",
    "about.p2":
      "Это не «умею всё понемногу». Это про то, что проект не разваливается на стыках: модель встаёт в сцену, эффект попадает в анимацию, интерфейс не спорит с артом. Одна голова держит картину целиком.",
    "about.p3":
      "Стиль подбираю под проект. В портфолио рядом лежат милитари-реализм и стилизованные существа — это не два разных человека, это одна задача: попасть в то, что нужно игре.",
    "about.p4":
      "В основном работаю один: согласований меньше, а за результат отвечает один человек. Под крупные задачи есть команда из шести человек, каждый по своей дисциплине — но режим по умолчанию именно одиночный.",
    "about.f1": "Опыт",
    "about.f1v": "3+ года",
    "about.f2": "Дисциплины",
    "about.f2v": "9 в Roblox Studio",
    "about.f3": "Языки",
    "about.f4": "Стили",
    "about.f4v": "Любые, под проект",
    "about.f5": "Команда",
    "about.f5v": "До 6 человек, по необходимости",

    /* --- Команда --- */
    "team.title": "Есть команда",
    "team.count": "6 человек",
    "team.text":
      "Подключаю её, когда объём или сроки не тянутся в одиночку — каждый закрывает свою дисциплину.",
    "team.mode": "По умолчанию проект веду сам.",

    /* --- Контакты --- */
    "contact.title": "Контакты",
    "contact.lead":
      "Быстрее всего — в Telegram. Опишите задачу: жанр, объём, сроки — и ответ будет по делу.",
    "contact.direct": "Напрямую",
    "contact.copy": "Скопировать ник",
    "contact.copied": "Скопировано",
    "contact.l1": "Нет ТЗ — напишите как есть, помогу сформулировать.",
    "contact.l2": "Беру и разовые задачи, и проекты целиком.",
    "contact.l3": "Любой стиль и жанр — стиль подбирается под проект.",

    /* --- Форма --- */
    "form.name": "Как вас зовут",
    "form.namePh": "Имя или ник",
    "form.topic": "Что нужно",
    "form.t0": "Проект целиком",
    "form.t1": "Музыка и звук",
    "form.t2": "Другое",
    "form.budget": "Бюджет и сроки",
    "form.budgetPh": "Необязательно — но ускорит ответ",
    "form.message": "Задача",
    "form.messagePh": "Жанр, объём, референсы — всё, что поможет ответить по делу",
    "form.submit": "Отправить в Telegram",
    "form.hint":
      "Кнопка откроет Telegram с уже подставленным текстом — останется нажать «Отправить». Сайт статический, отправлять письма ему неоткуда, поэтому заявка уходит через чат.",
    "form.errRequired": "Заполните это поле",
    "form.errShort": "Слишком коротко — опишите подробнее",
    "form.ok": "Telegram открыт, текст подставлен. Если поле пустое — он в буфере, вставьте.",
    "form.okNoCopy": "Telegram открыт с текстом заявки. Осталось нажать «Отправить».",

    /* --- Подвал --- */
    "footer.top": "Наверх"
  },

  en: {
    /* --- Service --- */
    "meta.title": "Krich_fran — Fullstack Roblox Studio Developer",
    "meta.desc":
      "Full-cycle Roblox development: scripting, building, modelling, animation, rigging, VFX, SFX, music, GUI, cutscenes. 3+ years of experience.",
    "skip": "Skip to content",
    "lang.label": "Interface language",
    "theme.label": "Toggle theme",
    "menu.open": "Open menu",
    "menu.close": "Close menu",

    /* --- Navigation --- */
    "nav.disciplines": "Disciplines",
    "nav.works": "Work",
    "nav.process": "Process",
    "nav.about": "About",
    "nav.contact": "Contact",

    /* --- Hero --- */
    "hero.status": "Available for work",
    "hero.role": "Fullstack Roblox Developer",
    "hero.title": 'I build Roblox games <span class="u-accent">end to end</span>',
    "hero.sub":
      "Scripting, building, modelling, animation, rigging, VFX, SFX, music, GUI and cutscenes — from concept to shipped build. One person instead of a team of nine.",
    "hero.cta1": "View work",
    "hero.cta2": "Message on Telegram",
    "hero.stat1v": "3+",
    "hero.stat1l": "years in Roblox Studio",
    "hero.stat2v": "9",
    "hero.stat2l": "disciplines, one person",
    "hero.stat3v": "∞",
    "hero.stat3l": "styles and genres",
    "hero.also": "Also:",
    "hero.alsoText": "websites, software, bots, parsers, automation",

    /* --- Hire plate --- */
    "plate.role": "Fullstack Roblox Developer · 3+ years",
    "plate.cta": "Get in touch",

    /* --- Disciplines --- */
    "disc.title": "Disciplines",
    "disc.lead":
      "Nine disciplines inside Roblox Studio. Usually each one of them is a separate hire.",
    "disc.note":
      "Any style, any genre: from low-poly stylisation to realism, from horror to simulator. The style follows the project, not my habits.",

    "disc.building.t": "Building",
    "disc.building.d":
      "Maps, interiors, environments. Scenes built to hold their framerate and read clearly from any angle.",
    "disc.modelling.t": "Modelling",
    "disc.modelling.d":
      "Props, weapons, vehicles, characters. Low-poly and high-poly, clean topology, tidy UVs.",
    "disc.scripting.t": "Scripting",
    "disc.scripting.d":
      "Mechanics, server logic, saves, protection against exploits.",
    "disc.animation.t": "Animation",
    "disc.animation.d":
      "Walks, combat, emotes, idles. Loops that don't snap at the seams.",
    "disc.rig.t": "Rigging",
    "disc.rig.d":
      "Character, vehicle and prop rigs. Bones, constraints and weights built for animation.",
    "disc.vfx.t": "VFX",
    "disc.vfx.d":
      "Magic, explosions, weather, trails. Effects that don't eat performance.",
    "disc.sfx.t": "Music & Sound",
    "disc.sfx.d":
      "Tracks, ambience, UI sounds, combat audio. A soundtrack that matches the mood of the project.",
    "disc.gui.t": "GUI",
    "disc.gui.d":
      "Menus, HUDs, inventories, shops. Adaptive for phone, tablet and console.",
    "disc.cutscene.t": "Cutscenes",
    "disc.cutscene.d":
      "Cutscenes, camera flights, scripted scenes and intros.",

    /* --- Work --- */
    "works.title": "Work",
    "works.lead":
      "Fifteen pieces in four groups. Each one says what part was mine.",
    "works.note":
      "Some clips are recorded straight in Roblox Studio — working material, not an edited reel. That is the honest version: you can see how it is put together.",
    "works.all": "All",
    "works.open": "Open",

    /* Subgroup labels, also used for the filter chips */
    "sub.building": "Building",
    "sub.modelling": "Modelling",
    "sub.vfx": "VFX",
    "sub.gui": "GUI",
    "sub.scripting": "Scripting",
    "sub.music": "Music",
    "sub.sfx": "Sound",

    "works.listen": "Listen",
    "works.shown": "Showing {n} of {total}",
    "works.empty": "Nothing in this category yet",
    "player.play": "Play",
    "player.pause": "Pause",
    "lightbox.close": "Close",
    "lightbox.prev": "Previous",
    "lightbox.next": "Next",

    /* --- Process --- */
    "process.title": "Process",
    "process.lead":
      "Five steps from the first message to handover. No surprises in the middle.",
    "process.s1.t": "Brief",
    "process.s1.d":
      "Genre, scope, deadline, references. No spec yet? Write as it is — I will help shape it.",
    "process.s2.t": "Estimate",
    "process.s2.d":
      "Broken into stages with time and cost for each — not an open-ended range.",
    "process.s3.t": "Prototype",
    "process.s3.d":
      "A rough build of the key part, so we check the direction before the hours go in.",
    "process.s4.t": "Iterations",
    "process.s4.d":
      "I show work stage by stage and fix as we go, so nothing piles up at the end.",
    "process.s5.t": "Handover",
    "process.s5.d":
      "Source files included: project file, models, sounds, animation files. Everything is yours.",
    "process.note":
      "After handover the sources stay with you, so you are not tied to me — another developer can pick the project up.",

    /* --- About --- */
    "about.title": "About",
    "about.p1":
      "For three years and counting I have been building Roblox projects end to end. I started with scripting and gradually closed the rest: building, models, animation, rigging, effects, interfaces, sound.",
    "about.p2":
      "This is not \"a bit of everything\". It is about a project not falling apart at the seams: the model fits the scene, the effect lands on the animation, the interface does not argue with the art. One head holds the whole picture.",
    "about.p3":
      "Style follows the project. Military realism and stylised creatures sit side by side in my portfolio — that is not two different people, it is one job: hitting what the game needs.",
    "about.p4":
      "Most of the time I work alone: less to coordinate, and one person answers for the result. For bigger jobs there is a team of six — each covering their own discipline — but the default mode is one pair of hands.",
    "about.f1": "Experience",
    "about.f1v": "3+ years",
    "about.f2": "Disciplines",
    "about.f2v": "9 in Roblox Studio",
    "about.f3": "Languages",
    "about.f4": "Styles",
    "about.f4v": "Any, to fit the project",
    "about.f5": "Team",
    "about.f5v": "Up to 6, on demand",

    /* --- Team --- */
    "team.title": "There is a team",
    "team.count": "6 people",
    "team.text":
      "I bring them in when the scope or the deadline outgrows one person — each covers their own discipline.",
    "team.mode": "By default I run the project myself.",

    /* --- Contact --- */
    "contact.title": "Contact",
    "contact.lead":
      "Telegram is fastest. Describe the task — genre, scope, deadline — and the answer will be to the point.",
    "contact.direct": "Direct",
    "contact.copy": "Copy handle",
    "contact.copied": "Copied",
    "contact.l1": "No spec yet? Write as it is — I will help shape it.",
    "contact.l2": "I take both one-off tasks and whole projects.",
    "contact.l3": "Any style and genre — the style follows the project.",

    /* --- Form --- */
    "form.name": "Your name",
    "form.namePh": "Name or handle",
    "form.topic": "What is needed",
    "form.t0": "Whole project",
    "form.t1": "Music and sound",
    "form.t2": "Something else",
    "form.budget": "Budget and deadline",
    "form.budgetPh": "Optional — but it speeds up the answer",
    "form.message": "The task",
    "form.messagePh": "Genre, scope, references — anything that helps me answer properly",
    "form.submit": "Send via Telegram",
    "form.hint":
      "The button opens Telegram with the message already filled in — you just press send. The site is static, so it has nowhere to send mail from; the enquiry goes through the chat.",
    "form.errRequired": "Please fill this in",
    "form.errShort": "Too short — a little more detail helps",
    "form.ok": "Telegram opened with your text. If the field is empty, it is on your clipboard — paste it.",
    "form.okNoCopy": "Telegram opened with your enquiry. Just press send.",

    /* --- Footer --- */
    "footer.top": "Back to top"
  }
};
