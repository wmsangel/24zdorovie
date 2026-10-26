/**
 * Отправка готового комплекта оформления Instagram владельцу в Telegram-бот.
 * Для каждого аккаунта (ru/en) шлёт отдельными сообщениями: текстовый комплект
 * (имя, @username, bio, ссылка с UTM, категория/тип, контакты, закрепы, чек-лист),
 * аватар (документом без сжатия + фото-превью) и 6 обложек «Актуального»
 * (превью-альбомом + альбомом-документами с названиями).
 *
 * Ассеты и тексты — social/profile/ (генерит scripts/profile-assets.mjs).
 * Конфиг бота — social/.telegram.json (как у telegram-daily.mjs).
 *
 *   node scripts/telegram-profile.mjs          # оба аккаунта
 *   node scripts/telegram-profile.mjs ru        # только RU
 *   node scripts/telegram-profile.mjs en        # только EN
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIR = join(ROOT, "profile");
const PROJECT = "24zdorovie";

const HIGHLIGHTS = [
  { slug: "tools", ru: "Калькуляторы", en: "Calculators" },
  { slug: "nutrition", ru: "Питание", en: "Nutrition" },
  { slug: "sleep", ru: "Сон", en: "Sleep" },
  { slug: "fitness", ru: "Фитнес", en: "Fitness" },
  { slug: "supplements", ru: "Добавки", en: "Supplements" },
  { slug: "myths", ru: "Мифы", en: "Myths" },
];
const HANDLE = { ru: "@zdorovie24ru", en: "@zdorovie24en" };

function config() {
  let c = {};
  try { c = JSON.parse(readFileSync(join(ROOT, ".telegram.json"), "utf8")); } catch {}
  const bot = process.env.TG_BOT_TOKEN || c.bot_token;
  const chat = process.env.TG_CHAT_ID || c.chat_id;
  if (!bot || !chat) {
    console.error("Нет bot_token/chat_id. Заполни social/.telegram.json или TG_BOT_TOKEN/TG_CHAT_ID.");
    process.exit(1);
  }
  return { bot, chat };
}

async function tg(bot, method, form) {
  const res = await fetch(`https://api.telegram.org/bot${bot}/${method}`, { method: "POST", body: form });
  const data = await res.json();
  if (!data.ok) throw new Error(`${method}: ${data.description}`);
  return data;
}
const blob = (path) => new Blob([readFileSync(path)]);

async function sendText(bot, chat, text) {
  const form = new FormData();
  form.append("chat_id", chat);
  form.append("text", text);
  form.append("disable_web_page_preview", "true");
  await tg(bot, "sendMessage", form);
}
async function sendPhoto(bot, chat, path, caption) {
  const form = new FormData();
  form.append("chat_id", chat);
  form.append("photo", blob(path), basename(path));
  if (caption) form.append("caption", caption);
  await tg(bot, "sendPhoto", form);
}
async function sendDocument(bot, chat, path, caption) {
  const form = new FormData();
  form.append("chat_id", chat);
  form.append("document", blob(path), basename(path));
  if (caption) form.append("caption", caption);
  await tg(bot, "sendDocument", form);
}
// Альбом из photo ИЛИ document (до 10). items: [{path, caption}]
async function sendAlbum(bot, chat, kind, items, firstCaption) {
  const form = new FormData();
  form.append("chat_id", chat);
  const media = items.slice(0, 10).map((it, i) => ({
    type: kind, media: `attach://m${i}`,
    ...(kind === "document" && it.caption ? { caption: it.caption } : {}),
    ...(i === 0 && firstCaption ? { caption: firstCaption } : {}),
  }));
  form.append("media", JSON.stringify(media));
  items.slice(0, 10).forEach((it, i) => form.append(`m${i}`, blob(it.path), basename(it.path)));
  await tg(bot, "sendMediaGroup", form);
}

async function sendAccount(bot, chat, lang) {
  const kit = join(DIR, `profile-${lang}.md`);
  const avatar = join(DIR, `avatar-${lang}.png`);
  if (!existsSync(kit) || !existsSync(avatar)) {
    console.error(`Нет ассетов для ${lang} (запусти node scripts/profile-assets.mjs).`);
    return;
  }
  // 1) текстовый комплект
  await sendText(bot, chat, `🟢 ${PROJECT} · Оформление Instagram · ${HANDLE[lang]} (${lang.toUpperCase()})`);
  await sendText(bot, chat, readFileSync(kit, "utf8"));
  // 2) аватар: документ (без сжатия) + фото-превью
  await sendDocument(bot, chat, avatar, `Аватар ${HANDLE[lang]} — PNG 1080×1080, без сжатия (ставь в профиль)`);
  await sendPhoto(bot, chat, avatar, "Аватар — превью");
  // 3) обложки: превью-альбом + альбом-документами с названиями
  const covers = HIGHLIGHTS.map((h) => ({ path: join(DIR, `highlight-${h.slug}.png`), caption: `«${h[lang]}»` }));
  await sendAlbum(bot, chat, "photo", covers, "Обложки «Актуального» — превью (названия в тексте выше)");
  await sendAlbum(bot, chat, "document", covers, "Обложки для загрузки (без сжатия) — подпись = название актуального");
  console.log(`Отправлено: ${PROJECT} · Instagram ${HANDLE[lang]}`);
}

const { bot, chat } = config();
const arg = (process.argv[2] || "").toLowerCase();
const langs = arg === "ru" || arg === "en" ? [arg] : ["ru", "en"];
for (const l of langs) await sendAccount(bot, chat, l);
