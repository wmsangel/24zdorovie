# Соцсети 24zdorovie — дневная рассылка готовых постов

Каждый день владельцу в Telegram-бота приходит **готовый пост для Instagram**:
само медиа (картинка / карусель / сторис) + отдельным сообщением полная подпись
с хэштегами на **RU и EN** (под два аккаунта: `@zdorovie24ru` и `@zdorovie24en`).
Задача владельца — скачать медиа и выложить. Тон честный, без «чудо-результатов»
(тема здоровья). Реклама не маркируется — это органика.

## Структура

```
social/
├── posts.js                  контент-план как ДАННЫЕ (ru+en) — единый источник
├── scripts/
│   ├── social-slides.mjs     генератор слайдов (satori + resvg) → out/*.png + manifest.json
│   └── telegram-daily.mjs    дневная отправка в Telegram
├── fonts/                    IBM Plex Sans (встраивается в satori)
├── assets/                   лого-сердце 24zdorovie
├── out/                      сгенерированные PNG (в .gitignore)
├── .telegram.json            конфиг бота (в .gitignore; см. .telegram.json.example)
└── package.json              satori + @resvg/resvg-js
```

`posts.js` — единственный источник: генератор рисует `slides[]` в PNG и он же
хранит `caption`/`hashtags` для подписи. Второй копии текста нет.

## Настройка бота (один раз)

1. В Telegram открыть **@BotFather** → `/newbot` → получить **токен**.
2. Написать своему боту **`/start`** (или добавить его в нужный чат).
3. Вписать в `social/.telegram.json`:
   ```json
   { "bot_token": "123456:ABC-...", "chat_id": "123456789", "lang": "both" }
   ```
   `chat_id` можно вытянуть после `/start`:
   ```bash
   node -e "fetch('https://api.telegram.org/bot<ТОКЕН>/getUpdates').then(r=>r.json()).then(d=>console.log(JSON.stringify(d.result?.map(x=>x.message?.chat),null,2)))"
   ```
   Бот скорее всего **один на всю сеть** — в заголовке каждого сообщения стоит имя
   проекта (`🟢 24zdorovie · …`), чтобы не перепутать посты между сайтами.

## Генерация слайдов

```bash
cd social && npm install          # один раз (satori + resvg)
node scripts/social-slides.mjs            # все посты, ru+en → out/
node scripts/social-slides.mjs protein    # один пост по id
node scripts/social-slides.mjs --lang ru  # только одна локаль
node scripts/social-slides.mjs --captions # подписи+хэштеги для вставки
```

## Отправка

```bash
node scripts/telegram-daily.mjs            # пост на сегодня (по дню недели)
node scripts/telegram-daily.mjs protein    # конкретный пост сейчас (тест)
```

## Автозапуск раз в день (launchd, ~08:05)

Шаблон — `com.24zdorovie.social-daily.plist.example`. Подставить абсолютный путь к
`node` (у нас nvm: `~/.nvm/versions/node/v20.18.0/bin/node`) и к папке `social`,
затем:

```bash
cp social/com.24zdorovie.social-daily.plist.example ~/Library/LaunchAgents/com.24zdorovie.social-daily.plist
launchctl load ~/Library/LaunchAgents/com.24zdorovie.social-daily.plist
```

⚠️ **Мак должен быть включён** около 08:05. launchd не будит из сна гарантированно;
если в момент запуска мак спал/выключен — задача выполнится при ближайшем пробуждении.

## Контент-план (неделя 1)

| День | Пост | Формат | Ведёт на |
|---|---|---|---|
| Пн | Сколько белка в день | разбор (карусель) | /tools/protein-calculator |
| Вт | Сколько воды в день? | сторис (квиз) | /tools/water-intake-calculator |
| Ср | Гигиена сна | чек-лист (карусель) | /tools/sleep-calculator |
| Чт | «Жиросжигающая зона» | миф/факт (пост) | /tools/heart-rate-zones-calculator |
| Пт | Биологический возраст | промо (пост) | /tools/biological-age-calculator |
| Сб | Витамин D: нужен ли | разбор (карусель) | /tools/vitamin-d-calculator |
| Вс | Кофе обезвоживает? | миф/факт (пост) | /tools/caffeine-calculator |

Расширить план — дописать посты в `posts.js` (поле `day` = день недели, `week` для
ротации) и пересобрать слайды. Поле `sticker` у сторис — какой нативный стикер
(опрос/квиз) добавить уже в Instagram (satori-слайд рисует чистый фон под него).
Для видео — поле `video` (путь к mp4 относительно `social/`).
