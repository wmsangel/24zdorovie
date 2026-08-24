# Что осталось сделать

Снимок на **17 августа 2026**. Заменяет прежний (7 августа) — почти всё оттуда
закрыто (первый коммит, GitHub, слаги тегов). Ниже — актуальные хвосты.

Легенда владельца: 🔵 владелец · 🟢 агент (можно делать в коде) · ⏳ ждём внешнего.

## Сделано в этой серии сессий

- Первый коммит и репозиторий на GitHub (`wmsangel/24zdorovie`), секреты в `.gitignore`.
- **4 калькулятора**: белок (nutrition), клетчатка (gut), риск ССЗ/SCORE2 (heart),
  простуда-грипп-COVID (immunity) — формулы в `src/lib/`, RU/EN MDX, в sitemap.
- **Кросс-промо** 6 проектов через `HOUSE_ADS` в `src/config/ads.ts`; на время
  ревью AdSense плотность снижена (`HOUSE_ADS.placements = ["sidebar","in-feed"]`).
- **IndexNow**: ключ `public/79bbb…e4.txt`, `scripts/indexnow.mjs`, `npm run indexnow`
  (Bing+Yandex), пинг прошёл.
- **Privacy** (RU/EN): добавлены стандартные AdSense-формулировки про сторонние
  cookies и опт-аут.
- **Vercel**: ветка `vercel-migration` (`vercel.json` + `docs/VERCEL.md`) — статическая
  миграция без смены рендеринга, ждёт импорта.
- **Монетизация**: карта поверхностей и шаблоны офферов в `docs/MONETIZATION.md`.
- **Статьи**: готовы 12 из 48 — рубрики heart, gut, immunity (по 2 темы × RU/EN),
  собраны и закоммичены **локально, но НЕ запушены и НЕ задеплоены**.

## 1. Статьи — ГОТОВО ✅ (48/48)

Все 12 рубрик закрыты по 2 темы × RU/EN. Написаны, собраны, закоммичены,
запушены и задеплоены. Стиль как в проекте: первый абзац = ответ,
`KeyPoints`/`Callout`/`DataTable`, `ReadAlso`, `sources`, `faq`, `translationKey`.

Пакет тем (слаги RU / EN, общий `translationKey`):

| Рубрика | Тема 1 | Тема 2 |
| --- | --- | --- |
| womens-health | Контрацепция: методы и выбор (`kontratseptsiya-metody` / `contraception-options`) | Эндометриоз (`endometrioz` / `endometriosis`) |
| mental-health | КПТ: основы и что лечит (`kpt-osnovy` / `cbt-basics`) | Панические атаки (`panicheskie-ataki` / `panic-attacks`) |
| longevity | Аутофагия и голодание (`autofagiya-golodanie` / `autophagy-fasting`) | NMN/NAD+ добавки (`nmn-nad-dobavki` / `nmn-nad-supplements`) |
| weight | Безопасный темп похудения (`bezopasnyy-temp-pohudeniya` / `safe-weight-loss-rate`) | Читмилы и рефиды (`chitmily-i-refidy` / `cheat-meals-refeeds`) |
| fitness | Прогрессия нагрузки (`progressiya-nagruzki` / `progressive-overload`) | ВИИТ/HIIT (`viit-trenirovki` / `hiit-training`) |
| sleep | Синий свет и сон (`siniy-svet-i-son` / `blue-light-sleep`) | Джетлаг (`dzhetlag` / `jet-lag`) |
| supplements | Ашваганда (`ashvaganda` / `ashwagandha`) | Куркумин/куркума (`kurkumin` / `curcumin-turmeric`) |
| nutrition | Яйца: сколько можно (`skolko-yaits-v-den` / `eggs-per-day`) | Растительный vs животный белок (`rastitelnyy-i-zhivotnyy-belok` / `plant-vs-animal-protein`) |
| recipes | Тофу с овощами (`tofu-s-ovoshchami` / `tofu-veggie-stir-fry`) | Протеиновые панкейки (`proteinovye-pankeyki` / `protein-pancakes`) |

Примечания:
- рецепты — короче (700–1200 слов) и с блоком `recipe` во фронтматтере + `<RecipeFacts />`;
- `nutrition/rastitelnyy-i-zhivotnyy-belok` и `en/plant-vs-animal-protein` ждут два
  `ReadAlso` из калькулятора белка — сейчас там временно ссылка на средиземноморскую
  диету, после написания вернуть на профильную статью;
- по готовности всех 48 — один `npm run deploy` + `npm run indexnow`.

## 2. Индексация — ГОТОВО ✅ (подтверждено 19 августа)

- ✅ **Яндекс.Вебмастер** — права подтверждены (было: 0 страниц в Яндексе, главный
  хвост для RU).
- ✅ **Google Search Console** — sitemap сдан, ключевые страницы отправлены на
  индексацию (Request Indexing).
- ✅ **Bing Webmaster** — импорт из GSC.

Эффект отслеживаем по отчёту `izn.project.stats` (GSC/GA4/индексация). Снимок на
16.08: показы за неделю **405 → 1155 (+185%)**, показывались 115 из 454 URL, 339
ещё ждут обхода — для сайта возрастом ~3 недели это норма, маховик крутится.
GSC-данные теперь приходят в отчёт автоматически, отдельная выгрузка CSV не нужна.
Технический флаг отчёта «страница с переадресацией» разобран — ложная тревога
(штатный 301 `trailingSlash`, все внутренние ссылки со слэшем).

## 3. Монетизация 🔵→🟢

**Живые аффилиаты (обновлено 24 августа):**

- ✅ **СберЗдоровье** (Admitad, RU) — первый живой оффер. Подключён: текстовый
  `OfferBlock` под тремя медкалькуляторами (биовозраст, риск ССЗ, чекер симптомов)
  + баннеры 160×600 (sidebar), 300×250 (in-feed) и в теле статьи на мобильном
  (in-article 336×280 + article-end 300×250, флаг `mobileOnly`). Полная маркировка:
  «Реклама» + `erid` + рекламодатель + дисклеймер о противопоказаниях. Только RU.
- ✅ **WAU Global** (Admitad, бьюти-девайсы) — **только EN**: у оффера нет `erid`,
  RU-рекламу без него не ставим (осознанно). Живёт как `<ProductCard>` в
  доказательном разборе `longevity/at-home-beauty-devices` (RU+EN написаны,
  карточка только в EN). См. память `wau-affiliate-en-only`.
- ✅ Образец связки «статья → товар» реализован (WAU в разборе бьюти-девайсов),
  вместо изначально намеченной статьи про давление.

**Дальше:**

- Indoleads: подать на **iHerb** (WW, БАДы, SEO разрешён) и **Pharmacosmetica** (RU).
  Кнопка «Apply» у них ловится только на первой загрузке списка офферов; жать
  владельцу (рейтинг паблишера 2.50 Rookie эти два не блокирует). 🔵
- Уже активные в Indoleads без заявки (RU-аптеки zdravcity/gorzdrav/rigla/366/
  budzdorov/ozerki, ЗОЖ-питание justfood.pro / letbefit.ru) — ставить ссылки по мере
  выхода профильных статей. 🟢
- После каждой новой ссылки (+ `erid` для RU) — оффер в `OFFERS`/`ProductCard`,
  собрать, задеплоить. 🟢
- Приоритеты по сетям и выплаты — в `docs/MONETIZATION.md`.

### Выплаты из Кыргызстана (важно) 🔵

Проверено 17 августа. Amazon Associates зарегистрирован (StoreID `24zdorovie-20`, US),
но выплаты из KG — узкое место:

- **Amazon Associates.** Прямого банковского перевода для KG нет: Кыргызстана нет
  среди ~52 стран Direct Deposit, нужен счёт в USD/GBP/EUR. PayPal Amazon не
  поддерживает. Способы получить деньги:
  - **Payoneer** (работает для KG): в Payoneer взять реквизиты счёта в США
    (routing/ABA + account, тип checking) → в Amazon **«+ Add bank account»** →
    страна банка **United States / USD** → вписать эти реквизиты. Имя счёта Payoneer
    должно совпадать с владельцем аккаунта Amazon. Реквизиты вводит владелец сам.
    Payoneer в списке методов Amazon **не отображается** — он добавляется именно
    через «Add bank account».
  - Фолбэк, если форма не даёт выбрать US-банк при KG-адресе: **Amazon Gift Card**
    (магазинный кредит, не деньги) — ценность низкая; Check для KG непрактичен.
- **Вывод для EN-стратегии:** основную ставку на EN лучше делать не через Amazon,
  а через сети, которые платят на **Payoneer/Wise нативно** (кнопкой в кабинете):
  **Impact.com, CJ, Awin, ShareASale**. Там те же health/supplement-офферы
  (iHerb, Ritual, AG1), а вывод в KG проще, чем костыль с Amazon.
- Wise для KG-резидентов открывается хуже (ограничения по СНГ) — начинать с Payoneer.

## 4. AdSense

- Подать через ~2–3 недели (сознательная пауза). Сейчас на нашей стороне всё готово:
  `ads.txt`, загрузчик в `<head>`, robots — краулер не заблокирован. ⏳
- Полный аудит критериев AdSense как чеклист (About/Contact/Privacy/навигация/объём) — 🟢
- **CMP / cookie-consent** для персонализированной рекламы в ЕС/UK — 🟢 (не блокер).
- Когда одобрят: создать 5 `data-ad-slot` (10 цифр, медийные адаптивные), вписать в
  `SLOTS` (`src/config/ads.ts`); поставить `HOUSE_ADS.enabled = false`. 🔵→🟢

## 5. Vercel-переезд 🔵→🟢

- Импортировать ветку `vercel-migration` в Vercel → preview-URL (владелец).
- Агент проверяет preview (редирект локали, ads.txt, sitemap, заголовки).
- Домены + DNS в Cloudflare (записи в `docs/VERCEL.md`), cutover; позже — HSTS.
- Не перенесены сознательно: редирект путей без префикса локали и легаси-редирект
  тегов с пробелом (незначимо; при нужде — через middleware после отказа от export).

## 6. Мелочи и гигиена

- 🟢 Ссылки на Telegram-каналы в **футере** (`src/components/Footer.tsx`, блок «Проект»);
  адреса в `SITE.social`, показывать канал по локали. Сейчас только в `sameAs` schema.
- 🔵 **Отозвать/сменить токены ботов** — светились в переписке. `/revoke` у @BotFather,
  новые в `scripts/.tg.env` (`TG_BOT_TOKEN_RU`, `TG_BOT_TOKEN_EN`). В репозиторий не
  попали (gitignore), но ротация не помешает.
- 🟢 Проверить почту: `ads@` на странице «Реклама», `info@` в контактах/privacy.
- 🟢 Ленивая загрузка рекламных блоков (`IntersectionObserver` в `AdSenseUnit.tsx`) —
  не срочно, пока `SLOTS` пустые, блоки не рендерятся.
- 🔵 Newsletter: `SITE.newsletterEndpoint` пуст, форма скрыта — включить (внешний
  сервис или после Vercel).
- 🟢 Разбор GA-выгрузки (`Сводка_отчетов.csv`): 23 юзера, трафик прямой + Яндекс,
  2 из Google — оформить выводы.

## Технические заметки (не терять)

- **`deploy.mjs`, удаление зависит от состояния.** `plan()` берёт список к удалению из
  `.deploy-state.json`, поэтому `--full` (сбрасывает состояние) + `--force-delete`
  **ничего не удалит**. Если состояние разошлось с сервером — чистить по фактическому
  листингу (`Fileman::list_files` + `fileop op=trash`).
- **Первый деплой с чистым состоянием** заливает весь сайт (~215 МБ, 6 частей) — это
  нормально, дальше только разница.
- OG-картинки и favicon перезаписываются на каждой сборке (`scripts/gen-og.mjs`);
  при добавлении рубрики дублировать её в `CATEGORIES` внутри `.mjs`.
