/**
 * Контент-план соцсетей 24zdorovie — как данные.
 *
 * Один источник и для слайдов, и для подписи: генератор (scripts/social-slides.mjs)
 * рисует slides[] в PNG и печатает caption для вставки — второй копии текста нет.
 * Двуязычно: у каждого текста есть ru и en (два аккаунта IG: RU и EN).
 *
 * `page` — страница назначения (путь после локали, обычно калькулятор). Ссылка в
 * профиле ведёт на сайт; page нужен, чтобы знать, куда вести трафик.
 *
 * Форматы: carousel (разбор/чек-лист), post (миф-факт/промо, 1 слайд),
 * story (чистый фон под нативный стикер-квиз/опрос в IG).
 *
 * Тон — честный, доказательный, без обещаний «чудо-результата» (тема здоровья).
 * Реклама не маркируется (органика). Типы слайдов: cover, text, list, cta, myth, story.
 */
export const POSTS = [
  // ── Пн · РАЗБОР (карусель) ──
  {
    id: "protein", week: 1, day: "Пн", format: "carousel", rubric: "Разбор",
    page: "/tools/protein-calculator",
    slides: [
      { type: "cover", theme: "light",
        kicker: { ru: "Разбор · питание", en: "Explainer · nutrition" },
        title: { ru: "Сколько белка нужно в день", en: "How much protein you need a day" },
        sub: { ru: "простой ориентир без фанатизма", en: "a simple target, no fanaticism" } },
      { type: "text", n: 1,
        title: { ru: "Ориентир — по весу", en: "Start from body weight" },
        body: { ru: "Большинству взрослых хватает 1,2–1,6 г белка на кг массы тела в день. Это не «чем больше, тем лучше».", en: "For most adults 1.2–1.6 g of protein per kg of body weight a day is enough. More is not automatically better." } },
      { type: "text", n: 2,
        title: { ru: "Важнее — распределение", en: "Spread it through the day" },
        body: { ru: "Тело усваивает белок порциями. 25–35 г в каждый приём работает лучше, чем всё за ужином.", en: "The body uses protein in portions. 25–35 g per meal works better than loading it all at dinner." } },
      { type: "text", n: 3,
        title: { ru: "Еда, а не порошок", en: "Food first, powder second" },
        body: { ru: "Яйца, творог, рыба, бобовые, мясо. Протеин в порошке — удобство, когда норму трудно добрать едой, а не волшебство.", en: "Eggs, dairy, fish, legumes, meat. Powder is convenience when food falls short — not a shortcut." } },
      { type: "cta",
        title: { ru: "Посчитайте свою норму", en: "Calculate your target" },
        sub: { ru: "Калькулятор белка по весу и цели — бесплатно, ссылка в профиле", en: "Protein calculator by weight and goal — free, link in profile" },
        pill: { ru: "24zdorovie.com", en: "24zdorovie.com" } },
    ],
    caption: {
      ru: "«Сколько белка в день?» — без фанатизма 💪\n\nБольшинству взрослых хватает 1,2–1,6 г на кг веса. Важнее не разовая доза, а распределение по приёмам (25–35 г за раз) и еда, а не порошок.\n\nПосчитать свою норму по весу и цели — калькулятор на сайте, ссылка в профиле.",
      en: "\"How much protein a day?\" — without the fanaticism 💪\n\nMost adults need 1.2–1.6 g per kg of body weight. What matters is spreading it across meals (25–35 g each) and real food over powder.\n\nWork out your own target by weight and goal — calculator on the site, link in bio.",
    },
    hashtags: {
      ru: "#24zdorovie #белок #питание #зож #нутрициология #здоровье #фитнес",
      en: "#24zdorovie #protein #nutrition #healthyeating #fitness #wellness #healthtips",
    },
  },

  // ── Вт · СТОРИС (квиз) ──
  {
    id: "voda-kviz", week: 1, day: "Вт", format: "story", rubric: "Сторис",
    page: "/tools/water-intake-calculator",
    slides: [
      { type: "story", theme: "green",
        kicker: { ru: "Вопрос за 10 секунд", en: "10-second question" },
        question: { ru: "Сколько воды пить в день?", en: "How much water a day?" } },
    ],
    sticker: {
      ru: "Поставь нативный стикер «Квиз»: 1,5 л · «8 стаканов всем» · «зависит от веса и жары» · 3 л. Правильный — «зависит». «8 стаканов всем» — миф. Ответ и калькулятор-ссылку дай на следующей сторис.",
      en: "Add the native «Quiz» sticker: 1.5 L · «8 glasses for everyone» · «depends on weight and heat» · 3 L. Correct — «depends». «8 glasses» is a myth. Put the answer and the calculator link-sticker on the next story.",
    },
    caption: {
      ru: "«8 стаканов воды всем» — миф. Норма зависит от веса, активности и жары. Калькулятор прикинет вашу — ссылка в профиле.",
      en: "«8 glasses for everyone» is a myth — it depends on your weight, activity and the heat. The calculator estimates yours — link in bio.",
    },
    hashtags: { ru: "", en: "" },
  },

  // ── Ср · ЧЕК-ЛИСТ (карусель) ──
  {
    id: "son-gigiena", week: 1, day: "Ср", format: "carousel", rubric: "Чек-лист",
    page: "/tools/sleep-calculator",
    slides: [
      { type: "cover", theme: "green",
        kicker: { ru: "Чек-лист · сон", en: "Checklist · sleep" },
        title: { ru: "Гигиена сна: что реально работает", en: "Sleep hygiene: what actually works" },
        sub: { ru: "5 пунктов с доказанным эффектом", en: "5 points with real evidence" } },
      { type: "list",
        title: { ru: "Проверьте себя", en: "Check yourself" },
        items: [
          { ok: true, text: { ru: "Один и тот же подъём — даже в выходные", en: "The same wake-up time — weekends included" } },
          { ok: true, text: { ru: "Спальня тёмная, тихая и прохладная", en: "A dark, quiet, cool bedroom" } },
          { ok: true, text: { ru: "Кофеин — не позже, чем за 8 часов до сна", en: "No caffeine within 8 hours of bed" } },
          { ok: false, text: { ru: "Телефон в кровати до засыпания", en: "The phone in bed until you fall asleep" } },
          { ok: false, text: { ru: "«Досыпать» по выходным до обеда", en: "Sleeping in until noon on weekends" } },
        ] },
      { type: "cta",
        title: { ru: "Во сколько ложиться?", en: "When should you go to bed?" },
        sub: { ru: "Калькулятор сна по циклам — с честным окном погрешности. Ссылка в профиле", en: "A sleep calculator by cycles — with an honest margin of error. Link in bio" },
        pill: { ru: "24zdorovie.com", en: "24zdorovie.com" } },
    ],
    caption: {
      ru: "Гигиена сна без мистики 😴\n\nБольше всего решает не «ритуал», а постоянный подъём — даже в выходные. Плюс тёмная прохладная спальня и кофеин не на ночь. А вот телефон в кровати и «досыпы» до обеда — против вас.\n\nВо сколько ложиться под ваш подъём — калькулятор сна на сайте, ссылка в профиле.",
      en: "Sleep hygiene without the mysticism 😴\n\nWhat matters most isn't a «ritual» but a consistent wake-up time — weekends included. Add a dark, cool bedroom and no late caffeine. The phone in bed and weekend lie-ins work against you.\n\nWhat bedtime fits your wake-up — sleep calculator on the site, link in bio.",
    },
    hashtags: {
      ru: "#24zdorovie #сон #гигиенасна #здоровыйсон #зож #здоровье #бессонница",
      en: "#24zdorovie #sleep #sleephygiene #bettersleep #wellness #healthtips #insomnia",
    },
  },

  // ── Чт · МИФ/ФАКТ (пост) ──
  {
    id: "puls-zona", week: 1, day: "Чт", format: "post", rubric: "Миф/факт",
    page: "/tools/heart-rate-zones-calculator",
    slides: [
      { type: "myth",
        tag: { ru: "Миф", en: "Myth" },
        statement: { ru: "На низком пульсе «горит жир»", en: "A low heart rate «burns fat»" },
        answer: { ru: "На низком пульсе доля жира в топливе выше, но калорий сжигается меньше. Для похудения важнее общий расход, а не «жиросжигающая зона». Интенсивнее — сожжёте больше.", en: "At a low heart rate the share of fat burned is higher, but you burn fewer calories overall. For weight loss total expenditure matters, not a «fat-burning zone». Harder effort burns more." } },
    ],
    caption: {
      ru: "«Жиросжигающая зона» — красивый миф 🔥\n\nДа, на низком пульсе доля жира в топливе выше. Но калорий при этом сжигается меньше, а для веса важен именно общий расход. Тренируйтесь в удобной интенсивности, а не ради «той самой зоны».\n\nСвои пульсовые зоны можно посчитать — калькулятор на сайте, ссылка в профиле.",
      en: "The «fat-burning zone» is a pretty myth 🔥\n\nYes, at a low heart rate a bigger share of fuel is fat. But you burn fewer calories, and for weight it's total expenditure that counts. Train at an intensity you can sustain, not for «the magic zone».\n\nWork out your own heart-rate zones — calculator on the site, link in bio.",
    },
    hashtags: {
      ru: "#24zdorovie #фитнес #кардио #пульс #тренировки #похудение #зож",
      en: "#24zdorovie #fitness #cardio #heartrate #training #fatloss #wellness",
    },
  },

  // ── Пт · ПРОМО (CTA-пост) ──
  {
    id: "biovozrast", week: 1, day: "Пт", format: "post", rubric: "Промо",
    page: "/tools/biological-age-calculator",
    slides: [
      { type: "cta",
        title: { ru: "Узнайте свой биологический возраст", en: "Find your biological age" },
        sub: { ru: "По 9 показателям обычного анализа крови — формула Левайна (Yale), без покупки отдельного теста", en: "From 9 markers on a routine blood test — the Levine (Yale) formula, no special kit needed" },
        pill: { ru: "Посчитать →", en: "Calculate →" } },
    ],
    caption: {
      ru: "Биологический возраст — это не гадание, а расчёт 🧬\n\nФормула PhenoAge (Левайн, Йель) берёт 9 показателей обычного анализа крови и выдаёт возраст, которому соответствует ваш риск. Никаких дорогих «тестов старения» — нужны цифры, которые у многих уже есть.\n\nПосчитать бесплатно — калькулятор на сайте, ссылка в профиле.",
      en: "Biological age isn't fortune-telling — it's a calculation 🧬\n\nThe PhenoAge formula (Levine, Yale) takes 9 markers from a routine blood test and returns the age your risk matches. No expensive «ageing kit» — just numbers many people already have.\n\nCalculate it free — on the site, link in bio.",
    },
    hashtags: {
      ru: "#24zdorovie #биологическийвозраст #долголетие #анализы #здоровье #phenoage #зож",
      en: "#24zdorovie #biologicalage #longevity #bloodtest #healthspan #phenoage #wellness",
    },
  },

  // ── Сб · РАЗБОР (карусель) ──
  {
    id: "vitamin-d", week: 1, day: "Сб", format: "carousel", rubric: "Разбор",
    page: "/tools/vitamin-d-calculator",
    slides: [
      { type: "cover", theme: "light",
        kicker: { ru: "Разбор · добавки", en: "Explainer · supplements" },
        title: { ru: "Витамин D: нужен ли и сколько", en: "Vitamin D: do you need it, and how much" },
        sub: { ru: "коротко и по делу", en: "short and to the point" } },
      { type: "text", n: 1,
        title: { ru: "Севернее — почти всем", en: "Up north — almost everyone" },
        body: { ru: "С осени по весну солнца не хватает для выработки витамина D в коже, а еда даёт мало. Профилактическая добавка оправдана.", en: "From autumn to spring there's too little sun to make vitamin D in the skin, and food gives little. A preventive supplement is justified." } },
      { type: "text", n: 2,
        title: { ru: "Доза без фанатизма", en: "A dose without excess" },
        body: { ru: "Для профилактики взрослому обычно хватает 800–2000 МЕ в день. Это безопасно и не требует анализа.", en: "For prevention an adult usually needs 800–2000 IU a day. That's safe and needs no blood test." } },
      { type: "text", n: 3,
        title: { ru: "Форма — D3, с едой", en: "Form — D3, with food" },
        body: { ru: "D3 поднимает уровень лучше D2. Принимать с едой, где есть жир. Высокие дозы «на всякий случай» — только риск.", en: "D3 raises levels better than D2. Take it with a meal that has fat. High doses «just in case» add only risk." } },
      { type: "cta",
        title: { ru: "Прикиньте свою дозу", en: "Estimate your dose" },
        sub: { ru: "Калькулятор витамина D по весу и уровню в крови. Ссылка в профиле", en: "A vitamin D calculator by weight and blood level. Link in bio" },
        pill: { ru: "24zdorovie.com", en: "24zdorovie.com" } },
    ],
    caption: {
      ru: "Витамин D: нужен ли? Севернее 40-й параллели — почти всем ☀️\n\nС осени по весну кожа его почти не вырабатывает, а еда даёт мало. Для профилактики взрослому обычно хватает 800–2000 МЕ в день (D3, с едой). Выше «на всякий случай» — только риск.\n\nПрикинуть свою дозу — калькулятор на сайте, ссылка в профиле. Детям дозу подбирает педиатр.",
      en: "Vitamin D: do you need it? North of the 40th parallel — almost everyone ☀️\n\nFrom autumn to spring the skin barely makes it, and food gives little. For prevention an adult usually needs 800–2000 IU a day (D3, with food). More «just in case» adds only risk.\n\nEstimate your dose — calculator on the site, link in bio. For children, a pediatrician sets the dose.",
    },
    hashtags: {
      ru: "#24zdorovie #витаминd #добавки #иммунитет #здоровье #зож #дефицитвитаминов",
      en: "#24zdorovie #vitamind #supplements #immunity #wellness #healthtips #deficiency",
    },
  },

  // ── Вс · МИФ/ФАКТ (пост) ──
  {
    id: "kofe-voda", week: 1, day: "Вс", format: "post", rubric: "Миф/факт",
    page: "/tools/caffeine-calculator",
    slides: [
      { type: "myth",
        tag: { ru: "Миф", en: "Myth" },
        statement: { ru: "Кофе обезвоживает", en: "Coffee dehydrates you" },
        answer: { ru: "В обычных количествах — нет. Мочегонный эффект кофеина слабый, и жидкость из самой чашки его перекрывает. Умеренный кофе считается в дневную норму воды.", en: "In normal amounts — no. Caffeine's diuretic effect is mild, and the fluid in the cup more than offsets it. Moderate coffee counts toward your daily fluids." } },
    ],
    caption: {
      ru: "«После кофе надо выпить стакан воды, иначе обезвожишься» — миф ☕\n\nМочегонный эффект кофеина слабый, а жидкость из самой чашки его перекрывает. В умеренных количествах кофе спокойно считается в дневную норму воды.\n\nСколько кофеина лично вам безопасно — калькулятор на сайте, ссылка в профиле.",
      en: "«Drink a glass of water after coffee or you'll dehydrate» — a myth ☕\n\nCaffeine's diuretic effect is mild, and the fluid in the cup more than makes up for it. In moderation, coffee counts toward your daily fluids just fine.\n\nHow much caffeine is safe for you — calculator on the site, link in bio.",
    },
    hashtags: {
      ru: "#24zdorovie #кофе #кофеин #вода #мифыоздоровье #зож #здоровье",
      en: "#24zdorovie #coffee #caffeine #hydration #healthmyths #wellness #healthtips",
    },
  },
];
