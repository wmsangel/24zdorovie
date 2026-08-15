<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# 24zdorovie — руководство по проекту

Двуязычный (RU/EN) контентный сайт о здоровье, питании и ЗОЖ.
Next.js 16 (App Router) + Tailwind 4 + MDX-файлы в репозитории.

## Как добавить статью

Создать файл `content/{locale}/{category}/{slug}.mdx`.
Больше ничего делать не нужно: маршрут, sitemap, RSS, OG-картинка,
хлебные крошки и schema.org собираются автоматически.

- `locale` — `ru` или `en`
- `category` — слаг из `src/config/categories.ts`
  (`nutrition`, `recipes`, `fitness`, `sleep`, `mental-health`, `supplements`, `weight`, `longevity`)
- `slug` — латиница, дефисы, без дат. Это URL, менять его после публикации нельзя

URL получается `/{locale}/{category}/{slug}`.

### Frontmatter

```yaml
---
title: "Заголовок до 60 символов — с ключевым запросом в начале"
description: "Мета-описание 140–160 символов: что человек узнает и зачем это ему."
date: "2026-07-21"           # ISO, дата публикации
updated: "2026-07-21"        # необязательно, дата правки
category: "nutrition"        # должен совпадать с папкой
tags: ["белок", "мышцы"]     # 3–6 тегов, нижний регистр
cover: "/covers/protein.jpg" # необязательно; без него рисуется фирменная заливка
coverAlt: "Тарелка с творогом и ягодами"
coverCredit:                 # обязательно, если задан cover — атрибуция под фото
  author: "Jane Doe"
  url: "https://unsplash.com/photos/xxxx"
  source: "Unsplash"
  license: "Unsplash License"
author: "Редакция 24zdorovie"     # в EN-статьях: "24zdorovie Editorial"
reviewer: "Анна Петрова, врач-диетолог"  # необязательно, усиливает E-E-A-T
featured: true               # необязательно, поднимает на главную
draft: false                 # true — не публикуется
translationKey: "protein-daily-intake"   # общий ключ для RU- и EN-версии → hreflang
faq:                         # необязательно, но очень желательно: даёт FAQ-сниппет
  - q: "Сколько белка нужно в день?"
    a: "1,2–1,6 г на кг массы тела для большинства взрослых."
sources:                     # обязательно для медицинских тем
  - title: "WHO/FAO. Protein and amino acid requirements, 2007"
    url: "https://www.who.int/..."
recipe:                      # только для category: recipes
  time: 25
  prepTime: 10
  cookTime: 15
  servings: 2
  kcal: 420
  protein: 32
  fat: 18
  carbs: 34
  cuisine: "Средиземноморская"
  ingredients: ["…"]
  steps: ["…"]
---
```

`translationKey` обязателен, если у статьи есть версия на втором языке —
по нему строится `hreflang` и переключатель языка.

### Структура текста

- Первый абзац — суть ответа в 2–3 предложениях (для featured snippet)
- Дальше `##` (h2) и `###` (h3); `#` не используется — h1 берётся из `title`
- 1500–2500 слов для разборов, 700–1200 для рецептов
- Минимум 2–3 внутренние ссылки на другие материалы через `<ReadAlso />`
- Внешние ссылки — только на исследования и официальные источники
- Каждое утверждение о здоровье подкрепляется источником в `sources`

### Компоненты внутри MDX

```mdx
<KeyPoints title="Коротко" items={["Первый тезис", "Второй тезис"]} />

<Callout type="warning" title="Кому не подходит">
  Текст. Типы: tip, info, warning, danger, science
</Callout>

<DataTable
  head={["Продукт", "Белок на 100 г"]}
  rows={[["Куриная грудка", "31 г"], ["Творог 5%", "17 г"]]}
  caption="По данным USDA"
/>

<RecipeFacts time={25} servings={2} kcal={420} protein={32} fat={18} carbs={34} />

<ProductCard
  title="Сывороточный протеин"
  description="Без сахара, 24 г белка на порцию"
  href="https://partner.example/?utm_source=izn"
  price="от 2 490 ₽"
  cta="Смотреть"
/>

<Figure src="/covers/plate.jpg" alt="Тарелка здорового питания" caption="Метод тарелки" />

<ReadAlso href="/ru/nutrition/fiber" title="Клетчатка: сколько нужно и откуда брать" />
```

Калькуляторы и тесты врезаются в статью теми же тегами. Локаль передаётся
пропом явно — MDX не знает, из какой папки его прочитали:

```mdx
<CaffeineCalculator locale="ru" />
<BiologicalAgeCalculator locale="ru" />
<BurnoutSelfCheck locale="ru" />
```

## Калькуляторы и тесты

Живут на `/{locale}/tools/{slug}`. Чтобы добавить инструмент, нужны три вещи:

1. запись в `src/config/tools.ts` — слаг, эмодзи, рубрика (даёт акцентный цвет
   и OG-картинку), названия и статьи-компаньоны для перелинковки;
2. клиентский компонент в `src/components/tools/` + строка в `registry.tsx`;
   там же его подключают к MDX через `src/components/mdx/Mdx.tsx`;
3. по MDX-странице на локаль в `content/tools/{locale}/{slug}.mdx` с
   фронтматтером `title`, `description`, `updated`, `lede`, `faq`, `sources`.
   `lede` — короткий ответ над калькулятором, цель featured snippet.
   Заголовки в теле задаёт сам MDX.

Маршрут, sitemap, hreflang, схема `WebApplication` и `FAQPage` подхватятся сами.

Расчётные формулы выносим из компонентов в `src/lib/` (пример —
`biological-age.ts`) и снабжаем ссылкой на публикацию: числа в медицинских
калькуляторах должны быть проверяемы без чтения разметки.

## Служебные страницы

`content/pages/{locale}/{slug}.mdx` — about, authors, contacts, advertising,
privacy, terms, disclaimer. Frontmatter: `title`, `description`, `updated`.

## Реклама

Всё управляется из `src/config/ads.ts`:

- **AdSense/РСЯ** — вписать `client` и slot-id, поставить `enabled: true`
- **Прямые баннеры** — добавить объект в `DIRECT_BANNERS` (приоритет выше сети)
- **Партнёрки** — компонент `<ProductCard />` внутри статьи

Плейсменты: `header`, `in-feed`, `in-article`, `article-end`, `sidebar`.
Блок `in-article` вставляется автоматически в середину статьи (по ближайшему
к середине `##`), отдельно размечать не нужно.

## Команды

```bash
npm run dev        # localhost:3000
npm run build      # прод-сборка в out/, проверяет все статьи
npm run lint

npm run deploy     # собрать и залить на хостинг только изменившееся
npm run deploy:dry # показать, что уехало бы, ничего не отправляя
npm run traffic    # разбор трафика Cloudflare: боты, браузеры, коды ответов

npm run tg:status  # очередь автопостинга в Telegram
npm run tg:dry     # показать посты, ничего не отправляя
```

## Отдельные инструкции

- [docs/TODO.md](./docs/TODO.md) — незакрытые хвосты и состояние проекта;
  заглянуть сюда стоит первым делом
- [docs/DEPLOY.md](./docs/DEPLOY.md) — сборка, заливка на хостинг,
  обязательный сброс кэша Cloudflare, проверки после публикации
- [docs/TELEGRAM.md](./docs/TELEGRAM.md) — ежедневный автопостинг в каналы
- [docs/MONETIZATION.md](./docs/MONETIZATION.md) — партнёрские программы под рубрики,
  ставки, требования сетей и юридическая рамка (маркировка, реклама БАДов)

## Что не трогать без причины

- `src/lib/seo.ts` — вся schema.org и метадата
- `public/.htaccess` — редиректы, выбор локали и заголовки кэша;
  на статике это замена серверной части (`proxy.ts` и `headers()` не работают)
- слаги рубрик в `src/config/categories.ts` — они уже в URL
- `TAG_INDEX_MIN` в `src/lib/content.ts` — порог, ниже которого тег-страница
  считается thin content и уходит из индекса и sitemap
- `public/og/*.png` и `public/favicon.ico` — их на каждой сборке перезаписывает
  `scripts/gen-og.mjs`; иконка рисуется из `src/app/icon.svg`, править надо его
- файлы подтверждения прав в `public/` (`google*.html`, `yandex_*.html`,
  `ads.txt`) — они лежат в репозитории именно затем, чтобы переживать заливку

## При добавлении новой рубрики

Мало дописать её в `src/config/categories.ts`: список рубрик продублирован
в `scripts/gen-og.mjs`, потому что `.mjs` не умеет импортировать TypeScript.
Забытая там рубрика даёт 404 на `og:image` у всех своих статей, поэтому
сборка на этом падает намеренно — допишите рубрику в `CATEGORIES` внутри
скрипта и пересоберите.
