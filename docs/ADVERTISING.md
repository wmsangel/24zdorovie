# Реклама и партнёрки — полный инвентарь

Живой справочник по всему рекламному: партнёрские офферы (где размещены, статусы,
маркировка), внутренняя сеть проектов, do-follow/nofollow, AdSense/РСЯ.
Снимок на **9 октября 2026**. Стратегия и ставки — в [MONETIZATION.md](./MONETIZATION.md).

## Сводка по каналам (монетизация)

Статусы: `активна` · `ждёт` (заявка на рассмотрении) · `рано` (не дотягиваем до порога) · `нет` (не подходит/отклонено).

| Канал | Статус | Доход/мес | Условия / ссылка |
|---|---|---|---|
| Партнёрки Admitad (10 RU/EN офферов) | активна | $0 | клики есть, конверсий 0 — молодой трафик; см. §1 |
| Crocs (gettracker, EN) | активна | $0 | баннер в `plantar-fasciitis`; см. §2 |
| **Amazon Associates** (EN) | активна | $0 | рельс ПОДТВЕРЖДЁН 14.10 (Payoneer USD → Citibank); **22 товарных карточки live** в EN-статьях. ⚠️ 180 дней / 3 продажи — следим; см. §2 |
| Крипто-донат (`/support`) | активна | — | TRON/Solana/ETH |
| AdSense | рано | — | NEEDS_ATTENTION, порог трафика не достигнут |
| РСЯ (Яндекс) | нет | — | не подключена |

Детали по офферам, размещениям и маркировке — ниже.

## Принципы

- **Приём денег** — только через ИП Кыргызстана → для RU обязателен **erid** (ОРД),
  для веба крипто-донат (`/support`); подписки/Stripe недоступны.
- **RU-реклама** всегда с маркировкой: «Реклама. <юрлицо, ИНН>. erid: … Партнёрская
  ссылка…». EN — без erid.
- **Рост — органика.** AdSense включаем повторно только при росте трафика.

---

## 1. Партнёрские офферы — Admitad (подключено, активно)

Website ID в Admitad: **2988053**. Все RU-офферы с erid и юрлицом в маркировке.

| Оффер | Гео | Юрлицо / ИНН | erid | Где размещён | Формат |
|---|---|---|---|---|---|
| **СберЗдоровье** | RU | ООО «ДокДок», 9710011437 | …S8BgEh | мед-калькуляторы: biological-age, cvd-risk, cold-flu-covid, blood-test-converter, blood-pressure | OfferBlock (авто) + **баннеры** (house-ad, direct) |
| **iHerb** (Iherb.group) | RU | ООО «Форест», 7814817732 | …YmiQPz | калькуляторы vitamin-d/protein/fiber + **8 статей-добавок** (ashvaganda, kurkumin, b12, магний, креатин, витамин D, омега-3, пробиотики) | OfferBlock + ProductCard |
| **Польза** | RU | ООО «ГПК», 7813650417 | …znKd8xa | калькуляторы calorie-macro, bmi, ideal-weight | OfferBlock (авто) |
| **Smartlife** (липосомальные) | RU | ООО «СМАРТЛАЙФ», 7714977147 | …piUd2z31s | `supplements/zhelezo-i-ferritin`, `supplements/multivitaminy-nuzhny-li` | ProductCard |
| **DoctorSlon** (полость рта) | RU | ООО «ДОКТОРСЛОН.РУ», 7813215573 | …z6VfpGb | `heart/zdorove-polosti-rta` | ProductCard |
| **happylook** (оптика) | RU | ООО «ВЕРИТАС ВЬЮ», 7810396402 | …zfKGah6 | `longevity/zdorove-glaz-zrenie` | ProductCard |
| **Beautiful People** (эстет. медицина) | RU | ООО «АНАТОМИЯ СПБ», 7840070905 | …YmgUF4 | `longevity/kak-zamedlit-starenie-kozhi`, `longevity/apparatnaya-kosmetologiya` | ProductCard |
| **BABOR** (косметика) | RU | ООО «ДОКТОР БАБОР», 7714927883 | …VKzXQeQ | `longevity/dokazatelnyy-uhod-za-kozhey` | ProductCard |
| **Velodrive** (спорттовары) | RU | ИП Остапенко, 781418814247 | …(MvGz…) | `fitness/zona-2-trenirovki`, `fitness/pulsovye-zony-kardio` | ProductCard |
| **WAU Global** (бьюти-девайсы) | WW/**EN** | — | — (EN, без erid) | `en/longevity/at-home-beauty-devices` | ProductCard (EN-only) |

> Полные ссылки и erid — в коде (`src/config/offers.ts` для OfferBlock-офферов,
> `<ProductCard>` в самих .mdx). Актуальные статусы/юрлица тянутся через Admitad API —
> см. §8.

## 2. Партнёрки вне Admitad

| Оффер | Гео | Трекер | Где | Примечание |
|---|---|---|---|---|
| **Crocs** | EN | gettracker.net/6aba953412a92 | `en/fitness/plantar-fasciitis` (баннер 300×250) | Свои креативы запрещены — используем их баннер |
| **Amazon Associates** | EN | tag в ссылке `?tag=<store-id>` | через `<ProductCard href="amazon.com/dp/ASIN?tag=…" />` | Выплата: Payoneer USD (Citibank), подтверждена 14.10. ProductCard уже даёт `rel=sponsored` + `affiliate_click`, erid НЕ нужен. ⚠️ **180 дней / 3 продажи** иначе аккаунт закроют. Только девайсы/книги/оборудование, НЕ добавки (iHerb сильнее). Нужен store-id (tag) |

**Размещено Amazon (EN) — 22 карточки в 22 статьях** (ASIN `tag=24zdorovie-20`, без цены, авто-дисклеймер; коммит `a1f5398`). Высокорелевантные девайсы/книги, где карточка реально помогает читателю:

| Статья | Товар | ASIN |
|---|---|---|
| heart/blood-pressure-explained | тонометр A&D Medical UA-767F (валидир.) | `B00ZTTAV5Q` |
| fitness/heart-rate-training-zones | Polar H10 пульсометр | `B07PM54P4N` |
| weight/bmi-and-body-composition | RENPHO Elis 1 весы | `B01N1UX8RW` |
| fitness/strength-training-for-beginners | WHATAFIT эспандеры | `B07DWSPQQY` |
| fitness/muscle-soreness-doms | Amazon Basics ролик | `B00XM2MRGI` |
| sleep/sleep-hygiene-basics | Philips SmartSleep будильник | `B0093162RM` |
| sleep/blue-light-and-sleep | Sleep ZM очки (amber) | `B086WQ1CL8` |
| sleep/jet-lag | LitBear маска для сна | `B09H7FZ5JM` |
| sleep/insomnia-what-to-do | YnM утяжелённое одеяло | `B073429DV2` |
| fitness/stretching-and-mobility | Amazon Basics коврик | `B01LP0U5X0` |
| nutrition/how-much-protein-per-day | Etekcity кухонные весы | `B0113UZJE2` |
| longevity/vo2max-and-lifespan | Garmin Forerunner 165 | `B0CT3SGHXL` |
| nutrition/how-much-water-per-day | Enerbone бутылка воды | `B097SDP3R4` |
| longevity/blue-zones-truth | книга «The Blue Zones Secrets» | `1426223471` |
| longevity/how-to-lower-biological-age | книга «Outlive» (Attia) | `0593236599` |
| nutrition/mediterranean-diet | книга «The Mediterranean Dish» | `0593234278` |
| weight/visceral-fat | GDMINLO сантиметр | `B07MT89MCW` |
| sleep/chronotypes | Circadian Optics лампа 10000 lux | `B01IU9MMPI` |
| sleep/how-much-sleep-do-you-need | книга «Why We Sleep» (Walker) | `1501144324` |
| mental-health/how-to-lower-cortisol | книга «Why Zebras Don't Get Ulcers» | `0805073698` |
| fitness/progressive-overload | PowerBlock разборные гантели | `B00A21NRNO` |
| mental-health/understanding-anxiety | книга «The Anxiety and Phobia Workbook» | `164848557X` |

## 3. Подключено, но ОТКЛОНЕНО (нельзя использовать)

iHerb WW, iHerb MENA, **Wilson**, **Diagnostyka PL**, **Gold Apple KZ** — `connection_status=declined`.
Не размещать.

## 4. Приостановлено / убрано (не возвращать без проверки)

- **Планета Спорт** (grfpr.com), **СпросиВрача** (rkdro.com), **Doctronic** (tsygg.com,
  убран 12.10) — «Program is suspended», удалены из кода. Единичные повторные клики
  (grfpr/tsygg) — внешний кэш старых страниц, безвредны ($0).

## 5. Куда подать ещё (аудит каталога Admitad, 775 кампаний)

**Сильных неподключённых health-программ нет** — хорошие RU-рекламодатели (аптеки,
БАДы, косметика, телемед) уже подключены. Слабые фиты из каталога (Glasseslit — очки WW,
Sitpack, Forest Essentials — косметика, Banggood) не берём без повода. Подаваться на
новую программу можно через API (scope `manage_advcampaigns`) — делаем только точечно.

---

## 6. Внутренняя сеть проектов (house-ads, кросс-промо)

Рекламируем свои проекты через `<AdSlot>` (плейсменты header/in-feed/in-article/
article-end/sidebar). Конфиг — `src/config/ads.ts` (`HOUSE_ADS_INVENTORY`).

**Сайты сети в ротации house-ads:**
calclumen, thecryptotools, iznkit, izntools, izngames, testsweep, costtrek, pawdget,
foldout (foldoutkit.com), foundaday, ocrsnip, **bilimjol**, **prodom-expert**,
**dasha-motion** (сайт жены).

**Direct-баннеры** (приоритет выше сети): Сбер (4 размера, с erid) — это партнёрка,
не наш проект.

---

## 7. Do-follow / nofollow — сводка (главное)

| Тип ссылки | rel | Передаёт вес? | Где |
|---|---|---|---|
| **Партнёрские** (ProductCard, OfferBlock) | `sponsored noopener noreferrer` | ❌ нет | офферы §1–2 |
| **House-ads** — вся сеть + direct-баннеры (AdSlot) | `sponsored noopener` | ❌ нет | §6 |
| **Контекстные ссылки на сеть в теле статьи** (обычный markdown-линк) | `noopener noreferrer` | ✅ **да (do-follow)** | см. ниже |
| **Внешние источники в теле** (markdown-линк) | `noopener noreferrer` | ✅ да (do-follow) | исследования в тексте |
| **Список «Источники»** (frontmatter `sources`) | `noopener noreferrer nofollow` | ❌ нет | конец статьи/инструмента |
| **Внутренние ссылки** (ReadAlso, next/link) | — | ✅ да | весь сайт |

**Механика:** MDX-компонент `<a>` ([src/components/mdx/Mdx.tsx](../src/components/mdx/Mdx.tsx))
для внешних ссылок ставит только `noopener noreferrer` → **do-follow**. Партнёрские
компоненты и house-ads явно добавляют `sponsored` → вес не передаётся. Поэтому
**единственный способ передать вес сети — контекстная markdown-ссылка в теле статьи.**

### Контекстные do-follow на сеть (внедрено)

| Донор (наша статья) | → Цель (сеть) | Анкор |
|---|---|---|
| `ru/sleep/gigiena-sna` (п. «Свет») | prodom-expert.ru (карниз/шторы) | «как подобрать карниз под плотные шторы» |
| `ru/sleep/gigiena-sna` (п. «Шум») | prodom-expert.ru (акустические панели) | «акустические панели на стену» |

- **calclumen** — контекстно НЕ линкуем (их health-калькуляторы дублируют наши →
  конкурент); только house-ad.
- **bilimjol** — ждёт детской темы (появится донор → поставим do-follow).
- Остальная сеть — только house-ads (sponsored), без контекстного do-follow, чтобы
  не строить «сетку все-ко-всем» (link scheme).

---

## 8. AdSense / РСЯ

- **AdSense:** `enabled: true`, client `ca-pub-5535516142831006` (`src/config/ads.ts`).
  Статус в кабинете — **NEEDS_ATTENTION**, выдача фактически выключена ($0 за 30д).
  Повторно раскручиваем только с ростом органики. `public/ads.txt` на месте.
- **РСЯ (Яндекс):** `enabled: false` — не подключена.

---

## 9. Юридическая рамка (ОРД / маркировка)

- Каждая RU-партнёрка: «**Реклама**. <юрлицо, ИНН>. **erid**: … Партнёрская ссылка:
  цена не меняется, мы получаем комиссию.» + для медуслуг «Имеются противопоказания,
  необходима консультация специалиста».
- **erid и юрлицо** берём из Admitad: deeplink с erid через API; юрлицо — поле
  `advertiser_legal_info`. Сверка 07.10 вскрыла ошибку ИНН у BABOR (исправлено).
- EN-офферы маркировки erid не требуют.

## 10. Как обновлять этот документ (источники данных)

- **Admitad API** (статусы, deeplink+erid, юрлица) — см. память `admitad-api` и
  [stats-data-access]. Website 2988053, ключи в `~/.config/seo-stats/`.
- Размещения — грепом по erid/доменам в `content/` и `src/config/offers.ts`.
- House-ads — `src/config/ads.ts`. rel — компоненты `OfferBlock.tsx`, `AdSlot.tsx`,
  `mdx/blocks.tsx` (ProductCard), `mdx/Mdx.tsx` (внешние `<a>`).
