/**
 * Дневная рассылка контента в Telegram: присылает владельцу ГОТОВЫЙ пост на
 * сегодня — само медиа (картинка / карусель / видео) + отдельным сообщением
 * полную подпись с хэштегами (RU и EN — под два аккаунта IG), чтобы просто
 * скопировать и выложить. Реклама не маркируется (органика).
 *
 * Источник плана — posts.js (по дню недели). Картинки берутся из out/ (сгенерить:
 * node scripts/social-slides.mjs). Видео — опциональное поле `video` у поста
 * (путь относительно social/).
 *
 * Конфиг — social/.telegram.json (НЕ коммитить; см. .telegram.json.example):
 *   { "bot_token": "...", "chat_id": "123...", "lang": "both" }
 * или env TG_BOT_TOKEN / TG_CHAT_ID / TG_LANG.
 *   lang: "both" (по умолч.) | "ru" | "en" — какие СЛАЙДЫ слать; текст подписи
 *   в обоих языках идёт всегда (под оба аккаунта IG: RU и EN).
 *
 * Бот скорее всего ОДИН на всю сеть — поэтому в заголовке каждого сообщения
 * обязательно имя проекта (24zdorovie), чтобы не перепутать посты между сайтами.
 *
 * Запуск:  node scripts/telegram-daily.mjs            # пост на сегодня
 *          node scripts/telegram-daily.mjs protein    # конкретный пост по id (тест)
 * Автозапуск раз в день — launchd (см. social/README.md).
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { POSTS } from "../posts.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "out");
const PROJECT = "24zdorovie";
const DOMAIN = "24zdorovie.com";
const HUB_URL = "https://claude.ai/artifact/VgtF7HpHicysC6caz38m39";
const DOW = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

function config() {
  let c = {};
  try { c = JSON.parse(readFileSync(join(ROOT, ".telegram.json"), "utf8")); } catch {}
  const bot = process.env.TG_BOT_TOKEN || c.bot_token;
  const chat = process.env.TG_CHAT_ID || c.chat_id;
  const lang = (process.env.TG_LANG || c.lang || "both").toLowerCase();
  if (!bot || !chat) {
    console.error("Нет bot_token/chat_id. Заполни social/.telegram.json (см. .telegram.json.example) или TG_BOT_TOKEN/TG_CHAT_ID.");
    process.exit(1);
  }
  return { bot, chat, lang };
}

// Слайды поста для языка: out/<id>-<lang>-NN-(square|story).png, по порядку.
function slidesFor(id, lang) {
  if (!existsSync(OUT)) return [];
  const re = new RegExp(`^${id}-${lang}-\\d+-(square|story)\\.png$`);
  return readdirSync(OUT).filter((f) => re.test(f)).sort().map((f) => join(OUT, f));
}

const fmtName = (f) => (f === "carousel" ? "карусель" : f === "story" ? "сторис" : "пост");

function captionBlock(post) {
  const line = (l) => [post.caption?.[l] ?? "", post.hashtags?.[l] ?? ""].filter(Boolean).join("\n\n");
  const parts = [];
  parts.push(`🟢 ${PROJECT} · ${post.day} · ${post.rubric} · ${fmtName(post.format)}`);
  parts.push(`🔗 Ведёт на: ${DOMAIN}/ru${post.page}  ·  ${DOMAIN}/en${post.page}`);
  if (post.sticker?.ru) parts.push(`🎯 Стикер (добавить в IG): ${post.sticker.ru}`);
  parts.push("— — — ПОДПИСЬ RU (скопировать для @zdorovie24ru) — — —");
  parts.push(line("ru"));
  const en = line("en");
  if (en) {
    parts.push("— — — CAPTION EN (copy for @zdorovie24en) — — —");
    parts.push(en);
  }
  parts.push(`Хаб со всеми слайдами: ${HUB_URL}`);
  return parts.filter(Boolean).join("\n\n");
}

async function tg(bot, method, form) {
  const res = await fetch(`https://api.telegram.org/bot${bot}/${method}`, { method: "POST", body: form });
  const data = await res.json();
  if (!data.ok) throw new Error(`${method}: ${data.description}`);
  return data;
}

const fileBlob = (path) => new Blob([readFileSync(path)]);

async function sendPhoto(bot, chat, path, caption) {
  const form = new FormData();
  form.append("chat_id", chat);
  form.append("photo", fileBlob(path), basename(path));
  if (caption) form.append("caption", caption);
  await tg(bot, "sendPhoto", form);
}

async function sendVideo(bot, chat, path, caption) {
  const form = new FormData();
  form.append("chat_id", chat);
  form.append("video", fileBlob(path), basename(path));
  if (caption) form.append("caption", caption);
  await tg(bot, "sendVideo", form);
}

// Карусель → один альбом (до 10 фото). Подпись к альбому короткая (лимит 1024) —
// полный текст уходит отдельным сообщением.
async function sendAlbum(bot, chat, paths, caption) {
  const chunk = paths.slice(0, 10);
  const form = new FormData();
  form.append("chat_id", chat);
  const media = chunk.map((pth, i) => ({ type: "photo", media: `attach://p${i}`, ...(i === 0 && caption ? { caption } : {}) }));
  form.append("media", JSON.stringify(media));
  chunk.forEach((pth, i) => form.append(`p${i}`, fileBlob(pth), basename(pth)));
  await tg(bot, "sendMediaGroup", form);
}

async function sendText(bot, chat, text) {
  const form = new FormData();
  form.append("chat_id", chat);
  form.append("text", text);
  form.append("disable_web_page_preview", "true");
  await tg(bot, "sendMessage", form);
}

// ─── main ───
const { bot, chat, lang } = config();
const arg = process.argv[2];
const today = DOW[new Date().getDay()];
const post = arg ? POSTS.find((p) => p.id === arg) : POSTS.find((p) => p.day === today);

if (!post) {
  console.log(arg ? `Пост «${arg}» не найден.` : `На ${today} поста в плане нет — выходной.`);
  process.exit(0);
}

const mediaLangs = lang === "both" ? ["ru", "en"] : [lang === "en" ? "en" : "ru"];
const header = `🟢 ${PROJECT} · ${post.day} · ${post.rubric} · ${fmtName(post.format)}`;
const video = post.video ? join(ROOT, post.video) : null;

try {
  // 1) Медиа (короткая подпись-заголовок с именем проекта).
  if (video && existsSync(video)) {
    await sendVideo(bot, chat, video, header);
  }
  for (const l of mediaLangs) {
    const slides = slidesFor(post.id, l);
    if (!slides.length) continue;
    const head = mediaLangs.length > 1 ? `${header} · ${l.toUpperCase()}` : header;
    if (slides.length > 1) await sendAlbum(bot, chat, slides, head);
    else await sendPhoto(bot, chat, slides[0], head);
  }
  // 2) Полный текст подписи с тегами (RU + EN) — отдельным сообщением (копипаст).
  await sendText(bot, chat, captionBlock(post));
  console.log(`Отправлено в Telegram: ${PROJECT} · ${today} · ${post.rubric} (${post.id})`);
} catch (e) {
  console.error("Telegram ошибка:", e.message);
  process.exit(1);
}
