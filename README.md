# 24zdorovie

Двуязычный (RU/EN) контентный сайт о здоровье, питании и ЗОЖ.
Боевой домен — [24zdorovie.com](https://24zdorovie.com).

**Стек:** Next.js 16 (App Router, статический экспорт) · Tailwind CSS 4 · MDX · TypeScript

**Документация:** [AGENTS.md](./AGENTS.md) — как писать статьи ·
[docs/DEPLOY.md](./docs/DEPLOY.md) — сборка и публикация ·
[docs/TELEGRAM.md](./docs/TELEGRAM.md) — автопостинг в каналы

## Запуск

```bash
npm install
npm run dev     # http://localhost:3000 → редирект на /ru
npm run build   # прод-сборка: собирает все статьи в статику
```

## Как устроен контент

Статьи — обычные файлы в репозитории, никакой CMS и базы данных:

```
content/
  ru/nutrition/skolko-belka-v-den.mdx
  en/nutrition/how-much-protein-per-day.mdx
  pages/ru/about.mdx          # служебные страницы
```

Положил файл → появились страница, запись в sitemap, RSS, OG-картинка,
хлебные крошки и schema.org. Формат frontmatter и список MDX-компонентов —
в [AGENTS.md](./AGENTS.md).

## Что уже настроено под SEO

| Что | Где |
| --- | --- |
| Canonical + hreflang RU/EN | `src/lib/seo.ts` |
| schema.org: MedicalWebPage, Recipe, FAQPage, BreadcrumbList, Organization, WebSite | `src/lib/seo.ts` |
| OG-картинки 1200×630 по рубрикам | `scripts/gen-og.mjs` (серверных маршрутов на статике нет) |
| sitemap.xml с языковыми альтернативами | `src/app/sitemap.ts` |
| robots.txt | `src/app/robots.ts` |
| RSS для каждой локали | `src/app/rss/[feed]/route.ts` |
| Порог индексации тег-страниц | `TAG_INDEX_MIN` в `src/lib/content.ts` |

## Реклама

Один файл — `src/config/ads.ts`:

- **AdSense / РСЯ** — вписать `client`, проставить slot-id, `enabled: true`
- **Прямые баннеры** — добавить объект в `DIRECT_BANNERS` (имеют приоритет над сетью)
- **Партнёрские интеграции** — компонент `<ProductCard />` внутри статьи

Плейсменты: `header`, `in-feed`, `in-article`, `article-end`, `sidebar`.
Блок `in-article` вставляется в середину статьи автоматически.
Пока реклама выключена, в dev-режиме на её месте видны серые плейсхолдеры.

## Деплой

Сайт собирается в статику и лежит на shared-хостинге с Apache за Cloudflare:
содержимое `out/` кладётся в `public_html`. Серверного рантайма нет —
редиректы и заголовки описаны в `public/.htaccess`.

```bash
npm run build     # → out/
```

Подробно, включая обязательный сброс кэша Cloudflare и проверки после
заливки — в [docs/DEPLOY.md](./docs/DEPLOY.md).

## Автопостинг в Telegram

По одной статье в день в русский и английский каналы, в порядке от самой
старой к новой. Планировщик — launchd на рабочей машине.

```bash
npm run tg:status   # что в очереди
npm run tg:dry      # показать посты, ничего не отправляя
```

Настройка и разбор ошибок — в [docs/TELEGRAM.md](./docs/TELEGRAM.md).

## Осталось сделать

1. Заменить плейсхолдеры оператора в `content/pages/*/privacy.mdx` и `terms.mdx`,
   показать документы юристу
2. Подключить рассылку: вписать URL внешнего сервиса в `SITE.newsletterEndpoint`
   (`src/config/site.ts`); пока строка пустая — форма скрыта
3. Разобрать в Search Console отчёт по непроиндексированным страницам

Уже сделано: Яндекс.Метрика подключена, сайт добавлен в Search Console
и Вебмастер, sitemap отправлен.
