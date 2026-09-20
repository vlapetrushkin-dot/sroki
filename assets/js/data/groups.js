/* ==========================================================================
   ГРУППЫ РАБОТ.

   Портфолио делится на четыре группы, внутри каждой — подгруппы по
   дисциплинам. Подгруппа работы берётся из её поля cat в projects.js,
   группа выводится отсюда — в самих работах её дублировать не нужно.

   У каждой группы свой класс оформления (work-group--<id>), см.
   css/components/work-group.css. Правило то же, что у мотивов дисциплин:
   различается рисунок, а палитра, сетка и толщина линий — общие.

   icon — какой мотив рисуется в шапке подгруппы, см. SUB_ICONS в works.js.

   character — персонаж в шапке группы:
     file    — файл в assets/img/characters
     side    — с какой стороны стоит: left | right (чередуются по списку)
     backlit — true для монохромных артов: на графите их тёмные части
               пропадают, и под них подкладывается мягкое свечение
   ========================================================================== */

window.APP_GROUPS = [
  {
    id: "world",
    num: "01",
    title: { ru: "Мир и объекты", en: "World and assets" },
    lead: {
      ru: "То, из чего состоит сцена: пространство, в котором игрок ходит, и предметы, которые он берёт в руки.",
      en: "What a scene is made of: the space the player walks through and the objects they pick up."
    },
    character: { file: "world.webp", side: "left", w: 502, h: 497 },
    subs: [
      { cat: "building",  icon: "building" },
      { cat: "modelling", icon: "modelling" }
    ]
  },

  {
    id: "motion",
    num: "02",
    title: { ru: "Движение и эффекты", en: "Motion and effects" },
    lead: {
      ru: "Всё, что происходит во времени: удар, вспышка, полёт снаряда. Эффект должен читаться за доли секунды и не ронять фпс.",
      en: "Everything that happens over time: a strike, a flash, a projectile. An effect has to read in a split second and not cost framerate."
    },
    character: { file: "motion.webp", side: "right", w: 375, h: 666 },
    subs: [
      { cat: "vfx", icon: "vfx" }
    ]
  },

  {
    id: "interface",
    num: "03",
    title: { ru: "Интерфейс и код", en: "Interface and code" },
    lead: {
      ru: "Слой, через который игрок разговаривает с игрой, и логика, которая за ним стоит.",
      en: "The layer the player talks to the game through, and the logic standing behind it."
    },
    character: { file: "interface.webp", side: "left", w: 421, h: 593 },
    subs: [
      { cat: "gui",       icon: "gui" },
      { cat: "scripting", icon: "scripting" }
    ]
  },

  {
    id: "audio",
    num: "04",
    title: { ru: "Звук", en: "Audio" },
    lead: {
      ru: "Музыка задаёт настроение сцены, звук — вес удара. Делаю и то, и другое под конкретный проект.",
      en: "Music sets the mood of a scene, sound gives a hit its weight. I do both, tailored to the project."
    },
    character: { file: "audio.webp", side: "right", backlit: true, w: 334, h: 747 },
    subs: [
      { cat: "music", icon: "music" },
      { cat: "sfx",   icon: "sfx" }
    ]
  }
];
