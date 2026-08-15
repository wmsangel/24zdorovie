/**
 * Ежедневная публикация статей в Telegram-каналы.
 *
 * По одному посту в день на локаль, в порядке от самой старой статьи к новой.
 * Что уже опубликовано, помнит .tg-state.json в корне проекта: состояние
 * хранится списком слагов, а не счётчиком, поэтому пропущенный день просто
 * сдвигает график и ничего не теряет.
 *
 * Запуск:
 *   node scripts/tg-daily.mjs --dry-run     — показать, что ушло бы, ничего не отправляя
 *   node scripts/tg-daily.mjs --status      — сколько опубликовано и что дальше в очереди
 *   node scripts/tg-daily.mjs               — отправить по одному посту в каждый канал
 *   node scripts/tg-daily.mjs --locale=ru   — только русский канал
 *   node scripts/tg-daily.mjs --count=3     — догнать отставание: три поста подряд
 *
 * Переменные окружения (можно положить в scripts/.tg.env):
 *   TG_BOT_TOKEN     — токен бота от @BotFather, общий для обоих каналов
 *   TG_BOT_TOKEN_RU  — необязательно: отдельный бот для русского канала
 *   TG_BOT_TOKEN_EN  — необязательно: отдельный бот для английского
 *   TG_CHANNEL_RU    — @username канала или числовой chat_id
 *   TG_CHANNEL_EN    — то же для английского канала
 */
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const ROOT = process.cwd();
const CONTENT_DIR = path.join(ROOT, "content");
const STATE_FILE = path.join(ROOT, ".tg-state.json");
const ENV_FILE = path.join(ROOT, "scripts", ".tg.env");
const SITE_URL = "https://24zdorovie.com";
const LOCALES = ["ru", "en"];
const MAX_HASHTAGS = 3;

// ---------------------------------------------------------------- аргументы

const args = process.argv.slice(2);
const hasFlag = (name) => args.includes(`--${name}`);
const getOpt = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};

const DRY_RUN = hasFlag("dry-run");
const STATUS_ONLY = hasFlag("status");
const ONLY_LOCALE = getOpt("locale", null);
const COUNT = Math.max(1, Number(getOpt("count", "1")) || 1);

// ---------------------------------------------------------------- окружение

/** Простой .env: KEY=VALUE построчно, # — комментарий. Реальные переменные окружения приоритетнее. */
function loadEnvFile() {
  if (!fs.existsSync(ENV_FILE)) return;
  for (const line of fs.readFileSync(ENV_FILE, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!(key in process.env)) process.env[key] = value;
  }
}

// ---------------------------------------------------------------- рубрики

/**
 * Эмодзи и названия рубрик лежат в categories.ts, а этот скрипт — обычный .mjs
 * и импортировать TypeScript не умеет. Поэтому разбираем файл регуляркой и
 * падаем, если формат изменился: молча потерять рубрику хуже, чем упасть.
 */
function readCategories() {
  const src = fs.readFileSync(path.join(ROOT, "src", "config", "categories.ts"), "utf8");
  const re = /\{\s*slug:\s*"([a-z-]+)",[\s\S]*?emoji:\s*"([^"]+)",\s*name:\s*\{\s*ru:\s*"([^"]+)",\s*en:\s*"([^"]+)"\s*\}/g;

  const map = new Map();
  for (const [, slug, emoji, ru, en] of src.matchAll(re)) {
    map.set(slug, { emoji, ru, en });
  }
  if (map.size === 0) {
    throw new Error("[tg] не удалось разобрать src/config/categories.ts — проверьте формат файла");
  }
  return map;
}

// ---------------------------------------------------------------- контент

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return entry.name.endsWith(".mdx") ? [full] : [];
  });
}

/** Очередь на публикацию: черновики отброшены, порядок — от самой старой статьи к новой. */
function readQueue(locale) {
  return walk(path.join(CONTENT_DIR, locale))
    .map((file) => {
      const { data } = matter(fs.readFileSync(file, "utf8"));
      if (data.draft) return null;
      const slug = path.basename(file, ".mdx");
      const category = path.basename(path.dirname(file));
      return {
        slug,
        category,
        locale,
        title: data.title ?? slug,
        description: data.description ?? "",
        tags: Array.isArray(data.tags) ? data.tags : [],
        date: data.date ?? "1970-01-01",
        url: `${SITE_URL}/${locale}/${category}/${slug}/`,
      };
    })
    .filter(Boolean)
    .sort((a, b) => new Date(a.date) - new Date(b.date) || a.slug.localeCompare(b.slug));
}

// ---------------------------------------------------------------- состояние

function readState() {
  if (!fs.existsSync(STATE_FILE)) return { posted: { ru: [], en: [] } };
  try {
    const parsed = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
    return { posted: { ru: parsed.posted?.ru ?? [], en: parsed.posted?.en ?? [] } };
  } catch {
    throw new Error(`[tg] .tg-state.json повреждён — почините или удалите файл: ${STATE_FILE}`);
  }
}

/** Пишем через временный файл: обрыв на середине не должен оставить битое состояние. */
function writeState(state) {
  const tmp = `${STATE_FILE}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify({ ...state, updated: new Date().toISOString() }, null, 2)}\n`);
  fs.renameSync(tmp, STATE_FILE);
}

// ---------------------------------------------------------------- сообщение

const escapeHtml = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Хештег не может содержать пробелы и дефисы — приводим тег к безопасному виду. */
const toHashtag = (tag) =>
  `#${String(tag).toLowerCase().replace(/[\s-]+/g, "_").replace(/[^\p{L}\p{N}_]/gu, "")}`;

function buildMessage(article, categories) {
  const category = categories.get(article.category);
  const heading = category
    ? `${category.emoji} ${category[article.locale]}`
    : article.category;

  const hashtags = article.tags
    .slice(0, MAX_HASHTAGS)
    .map(toHashtag)
    .filter((t) => t.length > 2)
    .join(" ");

  return [
    escapeHtml(heading),
    "",
    `<b>${escapeHtml(article.title)}</b>`,
    "",
    escapeHtml(article.description),
    hashtags ? `\n${hashtags}` : "",
    "",
    article.url,
  ]
    .filter((line, i, all) => !(line === "" && all[i - 1] === ""))
    .join("\n");
}

// ---------------------------------------------------------------- отправка

/**
 * Токен для локали: сначала персональный, потом общий.
 *
 * Одного бота хватает на оба канала — в канал он публикует от имени канала,
 * его собственное имя нигде не видно. Но если боты всё-таки заведены разные,
 * пусть работают: TG_BOT_TOKEN_RU / TG_BOT_TOKEN_EN перекрывают TG_BOT_TOKEN.
 */
function tokenFor(locale) {
  return process.env[`TG_BOT_TOKEN_${locale.toUpperCase()}`] || process.env.TG_BOT_TOKEN;
}

async function callTelegram(method, payload, token) {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await res.json();

  // Telegram просит подождать — единожды уступаем и повторяем
  if (!body.ok && body.error_code === 429) {
    const wait = (body.parameters?.retry_after ?? 5) + 1;
    console.log(`[tg] лимит частоты, пауза ${wait} с`);
    await new Promise((r) => setTimeout(r, wait * 1000));
    return callTelegram(method, payload, token);
  }
  if (!body.ok) {
    throw new Error(`[tg] ${method} → ${body.error_code}: ${body.description}`);
  }
  return body.result;
}

async function post(article, categories, channel, token) {
  const text = buildMessage(article, categories);

  if (DRY_RUN) {
    console.log(`\n--- ${article.locale.toUpperCase()} → ${channel} (черновой прогон) ---`);
    console.log(text);
    return;
  }

  const result = await callTelegram(
    "sendMessage",
    {
      chat_id: channel,
      text,
      parse_mode: "HTML",
      link_preview_options: {
        url: article.url,
        prefer_large_media: true,
        show_above_text: true,
      },
    },
    token,
  );
  console.log(`[tg] ${article.locale}: опубликовано «${article.title}» (message_id ${result.message_id})`);
}

// ---------------------------------------------------------------- сценарий

async function main() {
  loadEnvFile();

  const categories = readCategories();
  const state = readState();
  const locales = ONLY_LOCALE ? [ONLY_LOCALE] : LOCALES;

  for (const locale of locales) {
    if (!LOCALES.includes(locale)) throw new Error(`[tg] неизвестная локаль: ${locale}`);

    const queue = readQueue(locale);
    const posted = new Set(state.posted[locale]);
    const pending = queue.filter((a) => !posted.has(a.slug));

    if (STATUS_ONLY) {
      console.log(`\n${locale.toUpperCase()}: опубликовано ${posted.size} из ${queue.length}, в очереди ${pending.length}`);
      pending.slice(0, 3).forEach((a, i) => console.log(`  ${i + 1}. ${a.date}  ${a.title}`));
      if (pending.length === 0) console.log("  очередь пуста — новых статей нет");
      continue;
    }

    const channel = process.env[`TG_CHANNEL_${locale.toUpperCase()}`];
    if (!channel) {
      console.log(`[tg] ${locale}: канал не задан (TG_CHANNEL_${locale.toUpperCase()}), пропускаю`);
      continue;
    }
    const token = tokenFor(locale);
    if (!DRY_RUN && !token) {
      throw new Error(
        `[tg] не задан токен: нужен TG_BOT_TOKEN_${locale.toUpperCase()} либо общий TG_BOT_TOKEN`,
      );
    }
    if (pending.length === 0) {
      console.log(`[tg] ${locale}: очередь пуста, все ${queue.length} статей опубликованы`);
      continue;
    }

    for (const article of pending.slice(0, COUNT)) {
      await post(article, categories, channel, token);
      if (!DRY_RUN) {
        // Пишем состояние после каждого поста: падение на втором не отменит первый
        state.posted[locale].push(article.slug);
        writeState(state);
      }
    }
  }
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
