# Хостинг на Cloudflare Pages

Альтернатива cPanel-хостингу (docs/DEPLOY.md). Та же статика из `out/`, но
отдаётся с edge Cloudflare. Пока основной хостинг — GoDaddy; эта ветка/доки
готовят переезд и тестирование на `*.pages.dev` до переключения DNS.

## Что заменяет `.htaccess`

| Логика Apache | На Pages |
| --- | --- |
| Security-заголовки, Cache-Control | `public/_headers` → `out/_headers` |
| Фид `rss`/`feed` → `/rss/ru.xml` | `public/_redirects` |
| Сжатие, HTTPS, HTTP/3 | делает Cloudflare сам |
| Выбор локали на `/`, пути без префикса, нормализация тег-слагов | `functions/_middleware.js` (edge) |
| www→apex | Redirect Rule в настройках зоны |
| 404 | Pages сам отдаёт `out/404.html` |

## Деплой

```bash
npx wrangler login          # один раз (OAuth в браузере)
npm run deploy:pages        # сборка + аплоад out/ в прод
npm run deploy:pages -- --preview   # деплой в превью (*.pages.dev)
```

`deploy:pages` = `next build` + `wrangler pages deploy out`. Функции edge
берутся из `./functions` автоматически. Ручной сброс кэша Cloudflare не нужен —
Pages версионирует каждый деплой и инвалидирует сам. IndexNow при желании:
`npm run indexnow`.

Имя проекта по умолчанию `24zdorovie` (переопределяется `CF_PAGES_PROJECT`).

## Первичная настройка (один раз, в дашборде Cloudflare)

1. **Создать проект** — либо первый `npm run deploy:pages` создаст его сам,
   либо Workers & Pages → Create → Pages → Direct upload, имя `24zdorovie`.
2. **Проверить на `*.pages.dev`**: локаль на `/`, редиректы (rss, теги без
   локали), заголовки (`curl -I`), 404, hreflang, trailing slash.
3. **Custom domain**: Pages → проект → Custom domains → добавить
   `24zdorovie.com` и `www.24zdorovie.com`. Cloudflare сам создаст маршрут
   (DNS уже в его зоне).
4. **Настройки зоны**: SSL/TLS → Edge Certificates → Always Use HTTPS = On;
   Rules → Redirect Rules → `www.24zdorovie.com/*` → `https://24zdorovie.com/$1`
   (301).
5. **Откат**: вернуть DNS-записи apex/www на IP GoDaddy (сохранить заранее).

## Лимиты Pages (проходим с запасом)

Файлов < 20 000 (у нас ~8 600), файл < 25 МБ (макс ~250 КБ), деплой атомарный.
