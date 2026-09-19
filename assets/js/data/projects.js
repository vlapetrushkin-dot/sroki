/* ==========================================================================
   РАБОТЫ — единственное место, где живёт портфолио.

   Добавить работу: дописать объект в массив. Разметка соберётся сама,
   фильтры пересчитаются, порядок на странице = порядок в массиве.

   Поля:
     id     — латиницей, должен быть уникальным
     cat    — подгруппа: building | modelling | vfx | gui | scripting | music | sfx
              (подпись — ключ sub.<cat> в словаре; в какую группу попадёт
              подгруппа, задаётся в data/groups.js)
     title  — { ru, en }
     role   — { ru, en } что именно сделано вашими руками
     desc   — { ru, en } одна-две фразы, необязательно
     tags   — массив строк, не переводятся
     year   — необязательно, показывается рядом с заголовком
     link   — необязательно, { url, label } — ссылка на игру или репозиторий
     media  — массив:
              { type:'image', src, thumb }
              { type:'video', src, poster }
              { type:'audio', src, title:{ru,en} }
              Первый элемент становится обложкой карточки.

   Файлы лежат в assets/media/works. Готовятся скриптом tools/build-media.ps1
   — он жмёт исходники и режет интерфейс Studio из записей экрана.
   ========================================================================== */

window.APP_PROJECTS = [
  {
    id: "voidfall",
    cat: "scripting",
    title: { ru: "Voidfall — процедурные этажи", en: "Voidfall — procedural floors" },
    role: { ru: "Скриптинг, интерфейс, архитектура проекта", en: "Scripting, UI, project architecture" },
    desc: {
      ru: "Генерация этажа по сиду, миникарта, инвентарь. Проект собран на Rojo: внешний редактор, файловая структура, git.",
      en: "Seed-based floor generation, minimap, inventory. Built with Rojo: external editor, file structure, git."
    },
    tags: ["Luau", "Rojo", "Procgen", "Inventory"],
    media: [
      { type: "video", src: "code-voidfall.mp4", poster: "code-voidfall-poster.jpg" },
      { type: "image", src: "code-rojo.jpg", thumb: "code-rojo-thumb.jpg" }
    ]
  },

  {
    id: "gui-shooter",
    cat: "gui",
    title: { ru: "Лобби шутера", en: "Shooter lobby" },
    role: { ru: "Дизайн и сборка интерфейса", en: "Interface design and build" },
    desc: {
      ru: "Главное меню, экипировка, миссии, магазин, отряд, полоса опыта и валюты. Тёмная милитари-эстетика.",
      en: "Main menu, loadout, missions, store, squad, XP and currency bars. Dark military aesthetic."
    },
    tags: ["ScreenGui", "HUD", "Loadout", "Scaling"],
    media: [{ type: "image", src: "gui-shooter.jpg", thumb: "gui-shooter-thumb.jpg" }]
  },

  {
    id: "gui-stylized",
    cat: "gui",
    title: { ru: "Стилизованный HUD", en: "Stylized HUD" },
    role: { ru: "Интерфейс и набор ассетов", en: "Interface and asset set" },
    desc: {
      ru: "Деревянная рамка, полоса здоровья, слоты валют — и подобранный под них набор объектов окружения.",
      en: "Wooden frame, health bar, currency slots — and a matching set of environment assets."
    },
    tags: ["Stylized", "HUD", "Icons"],
    media: [{ type: "image", src: "gui-stylized.jpg", thumb: "gui-stylized-thumb.jpg" }]
  },

  {
    id: "building-construction",
    cat: "building",
    title: { ru: "Стройплощадка", en: "Construction site" },
    role: { ru: "Билдинг, компоновка, свет", en: "Building, layout, lighting" },
    desc: {
      ru: "Городской квартал со стройкой в центре: кран, каркас здания, перекрытия, ограждения, простреливаемые дворы.",
      en: "A city block around an active construction site: crane, building frame, floors, railings, open courtyards."
    },
    tags: ["Environment", "Modular", "Lighting"],
    media: [{ type: "image", src: "building-construction.jpg", thumb: "building-construction-thumb.jpg" }]
  },

  {
    id: "building-forest",
    cat: "building",
    title: { ru: "Постапокалиптический лес", en: "Post-apocalyptic forest" },
    role: { ru: "Террейн, растительность, расстановка", en: "Terrain, foliage, set dressing" },
    desc: {
      ru: "Хвойный массив с брошенной техникой и ЛЭП до горизонта. Сцена под стелс и дальние дистанции.",
      en: "Pine woodland with abandoned vehicles and power lines to the horizon. Built for stealth and long sightlines."
    },
    tags: ["Terrain", "Foliage", "Props"],
    media: [
      { type: "image", src: "building-forest-1.jpg", thumb: "building-forest-1-thumb.jpg" },
      { type: "image", src: "building-forest-2.jpg", thumb: "building-forest-2-thumb.jpg" }
    ]
  },

  {
    id: "vfx-fireslash",
    cat: "vfx",
    title: { ru: "Огненный слэш", en: "Fire slash" },
    role: { ru: "VFX: партиклы, шлейфы, искры", en: "VFX: particles, trails, embers" },
    desc: {
      ru: "Дуга удара мечом: пламя по траектории, дым, разлетающиеся угли и подсветка сцены.",
      en: "A sword arc: flame along the path, smoke, scattering embers and scene light."
    },
    tags: ["ParticleEmitter", "Trails", "Embers"],
    media: [
      { type: "video", src: "vfx-fireslash.mp4", poster: "vfx-fireslash-poster.jpg" },
      { type: "image", src: "vfx-fireslash.jpg", thumb: "vfx-fireslash-thumb.jpg" }
    ]
  },

  {
    id: "vfx-magic",
    cat: "vfx",
    title: { ru: "Магические снаряды", en: "Magic projectiles" },
    role: { ru: "VFX и поведение снарядов", en: "VFX and projectile behaviour" },
    desc: {
      ru: "Набор заклинаний: полёт снаряда, след, вспышка попадания. Прогон эффектов подряд в тестовой сцене.",
      en: "A spell set: projectile flight, trail, impact flash. Effects run back to back in a test scene."
    },
    tags: ["Beams", "Attachments", "Impact"],
    media: [{ type: "video", src: "vfx-magic.mp4", poster: "vfx-magic-poster.jpg" }]
  },

  {
    id: "vfx-beam",
    cat: "vfx",
    title: { ru: "Энергетический удар", en: "Energy strike" },
    role: { ru: "VFX и покадровая анимация эффекта", en: "VFX and keyframed effect animation" },
    desc: {
      ru: "Луч из посоха и вспышка попадания. В кадре открыт таймлайн — видно, как эффект собран по ключам.",
      en: "A staff beam and impact burst. The timeline is open in frame — the effect's keyframes are visible."
    },
    tags: ["Moon Animator", "Beams", "Keyframes"],
    media: [{ type: "video", src: "vfx-beam.mp4", poster: "vfx-beam-poster.jpg" }]
  },

  {
    id: "vfx-blood",
    cat: "vfx",
    title: { ru: "Попадания и кровь", en: "Hits and blood" },
    role: { ru: "VFX попаданий", en: "Hit VFX" },
    desc: {
      ru: "Брызги и облако от попадания: разлёт капель, оседающая взвесь, следы на поверхностях.",
      en: "Spray and mist on impact: droplet scatter, settling haze, surface decals."
    },
    tags: ["ParticleEmitter", "Decals"],
    media: [
      { type: "image", src: "vfx-blood-1.jpg", thumb: "vfx-blood-1-thumb.jpg" },
      { type: "image", src: "vfx-blood-2.jpg", thumb: "vfx-blood-2-thumb.jpg" }
    ]
  },

  {
    id: "model-weapons",
    cat: "modelling",
    title: { ru: "Снаряжение: шлем и граната", en: "Gear: helmet and grenade" },
    role: { ru: "Моделинг, развёртка, текстуры", en: "Modelling, UV, texturing" },
    desc: {
      ru: "Тактический шлем с рельсами и ремнями и осколочная граната. Реалистичный милитари-стиль.",
      en: "A tactical helmet with rails and straps, and a fragmentation grenade. Realistic military style."
    },
    tags: ["Hard surface", "PBR", "Game-ready"],
    media: [
      { type: "image", src: "model-helmet.jpg", thumb: "model-helmet-thumb.jpg" },
      { type: "image", src: "model-grenade.jpg", thumb: "model-grenade-thumb.jpg" }
    ]
  },

  {
    id: "model-props",
    cat: "modelling",
    title: { ru: "Пропсы окружения", en: "Environment props" },
    role: { ru: "Моделинг и текстуры набора", en: "Modelling and texturing the set" },
    desc: {
      ru: "Ящик с маркировкой, доски разной длины, барная стойка, картотечный шкаф. Набор под один сеттинг.",
      en: "A stencilled crate, planks of varying length, a bar counter, a filing locker. One coherent setting."
    },
    tags: ["Props", "Wood", "Trim sheet"],
    media: [
      { type: "image", src: "model-crate.jpg", thumb: "model-crate-thumb.jpg" },
      { type: "image", src: "model-planks.jpg", thumb: "model-planks-thumb.jpg" },
      { type: "image", src: "model-bar.jpg", thumb: "model-bar-thumb.jpg" },
      { type: "image", src: "model-locker.jpg", thumb: "model-locker-thumb.jpg" }
    ]
  },

  {
    id: "model-bottle",
    cat: "modelling",
    title: { ru: "Разрушаемая бутылка", en: "Breakable bottle" },
    role: { ru: "Моделинг, стекло, разрушение", en: "Modelling, glass, destruction" },
    desc: {
      ru: "Целая бутылка и стадии разбития: горлышко, осколки, отдельные фрагменты под физику.",
      en: "An intact bottle and its break states: neck, shards, separate fragments ready for physics."
    },
    tags: ["Glass", "Fracture", "Physics"],
    media: [{ type: "image", src: "model-bottle.jpg", thumb: "model-bottle-thumb.jpg" }]
  },

  {
    id: "model-creatures",
    cat: "modelling",
    title: { ru: "Существа", en: "Creatures" },
    role: { ru: "Моделинг и стилизация", en: "Modelling and stylisation" },
    desc: {
      ru: "Единорог с раскалёнными трещинами по корпусу и страж с светящимся ореолом. Два разных стиля в одном наборе.",
      en: "A unicorn with molten cracks across its body and a guardian with a glowing halo. Two distinct styles in one set."
    },
    tags: ["Stylized", "Character", "Emission"],
    media: [
      { type: "image", src: "model-unicorn.jpg", thumb: "model-unicorn-thumb.jpg" },
      { type: "image", src: "model-guardian.jpg", thumb: "model-guardian-thumb.jpg" }
    ]
  },

  {
    id: "music-still-waters",
    cat: "music",
    title: { ru: "Still Waters", en: "Still Waters" },
    role: { ru: "Композиция, аранжировка, сведение", en: "Composition, arrangement, mixing" },
    desc: {
      ru: "Эмбиент-трек на шесть минут — фоновая тема для спокойных сцен. Две версии разной длины.",
      en: "A six-minute ambient track — background theme for calm scenes. Two versions of different length."
    },
    tags: ["Ambient", "Soundtrack", "Loopable"],
    media: [
      { type: "audio", src: "music-still-waters.mp3", title: { ru: "Still Waters", en: "Still Waters" } },
      { type: "audio", src: "music-still-waters-alt.mp3", title: { ru: "Still Waters — вторая версия", en: "Still Waters — second version" } }
    ]
  },

  {
    id: "sfx-boss",
    cat: "sfx",
    title: { ru: "Звуки боя с боссом", en: "Boss fight sounds" },
    role: { ru: "Саунд-дизайн", en: "Sound design" },
    desc: {
      ru: "Атака кольями, серия быстрых ударов и басовый удар под появление. Звуки под конкретные фазы боя.",
      en: "A spike attack, a fast strike combo and a bass hit for the entrance. Sounds tied to specific fight phases."
    },
    tags: ["SFX", "Combat", "Layering"],
    media: [
      { type: "audio", src: "sfx-boss-spikes.mp3", title: { ru: "Атака кольями", en: "Spike attack" } },
      { type: "audio", src: "sfx-boss-combo.mp3", title: { ru: "Серия быстрых атак", en: "Fast attack combo" } },
      { type: "audio", src: "sfx-bass.mp3", title: { ru: "Басовый удар", en: "Bass hit" } }
    ]
  }
];
