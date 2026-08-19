#!/usr/bin/env node
/**
 * Пинг IndexNow — мгновенное уведомление Bing и Yandex об изменённых URL.
 * У обоих поисковиков общий протокол, поэтому один запрос покрывает оба.
 *
 * Ключ лежит в public/<key>.txt (создан один раз, менять не нужно).
 * Скрипт находит его сам, поэтому хранить ключ где-то ещё не требуется.
 *
 * Использование:
 *   npm run indexnow                       # отправить все URL из out/sitemap.xml
 *   npm run indexnow -- https://24zdorovie.com/ru/tools/protein-calculator
 *   npm run indexnow -- --dry              # показать, что ушло бы, без отправки
 *
 * Помимо CLI отсюда экспортируется submitToIndexNow() — её вызывает
 * scripts/deploy.mjs, чтобы после заливки пинговать только изменившиеся
 * страницы. При импорте CLI не запускается (см. защиту в конце файла).
 *
 * Домен продублирован здесь намеренно: .mjs не импортирует TypeScript-конфиг
 * (как и scripts/gen-og.mjs). Менять — в обоих местах.
 */
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const HOST = "24zdorovie.com";
const ORIGIN = `https://${HOST}`;
const ENDPOINT = "https://api.indexnow.org/indexnow";
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = join(SCRIPT_DIR, "..");

/** Ключ IndexNow — единственный .txt в public/, чьё имя = его содержимому (hex) */
export function findKey(root = DEFAULT_ROOT) {
  const dir = join(root, "public");
  for (const f of readdirSync(dir)) {
    const m = f.match(/^([0-9a-f]{8,128})\.txt$/i);
    if (!m) continue;
    const body = readFileSync(join(dir, f), "utf8").trim();
    if (body === m[1]) return { key: m[1], file: f };
  }
  return null;
}

/** URL из собранного sitemap (только <loc>, без alternate-ссылок) */
export function urlsFromSitemap(root = DEFAULT_ROOT) {
  const xml = readFileSync(join(root, "out", "sitemap.xml"), "utf8");
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((m) => m[1].trim())
    .filter((u) => u.startsWith(ORIGIN));
}

/**
 * Отправить список URL в IndexNow (Bing + Yandex). Не бросает исключений —
 * возвращает результат, чтобы вызывающий (в т.ч. деплой) решил, критичен ли сбой.
 * IndexNow принимает до 10 000 URL за запрос.
 */
export async function submitToIndexNow(urls, { root = DEFAULT_ROOT, dry = false } = {}) {
  const list = [...new Set(urls)].filter((u) => u.startsWith(ORIGIN));
  if (list.length === 0) return { skipped: "нет URL" };

  const found = findKey(root);
  if (!found) return { skipped: "ключ не найден в public/" };
  if (dry) return { dry: true, count: list.length, key: found.file };

  const payload = {
    host: HOST,
    key: found.key,
    keyLocation: `${ORIGIN}/${found.file}`,
    urlList: list.slice(0, 10000),
  };
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(payload),
  });
  const body = await res.text().catch(() => "");
  return { ok: res.ok, status: res.status, count: list.length, key: found.file, body };
}

async function main() {
  const args = process.argv.slice(2);
  const dry = args.includes("--dry");
  const explicit = args.filter((a) => a.startsWith("http"));

  const found = findKey();
  if (!found) {
    console.error("✗ Ключ IndexNow не найден в public/. Создайте public/<key>.txt.");
    process.exit(1);
  }

  let urls = explicit.length ? explicit : urlsFromSitemap();
  urls = [...new Set(urls)];
  if (urls.length === 0) {
    console.error("✗ Нет URL для отправки (пустой sitemap? запустите npm run build).");
    process.exit(1);
  }

  console.log(`IndexNow: ${urls.length} URL, ключ ${found.file}`);
  if (dry) {
    console.log(urls.slice(0, 20).join("\n") + (urls.length > 20 ? `\n… +${urls.length - 20}` : ""));
    console.log("(--dry: ничего не отправлено)");
    return;
  }

  const r = await submitToIndexNow(urls);
  if (r.ok) {
    console.log(`✓ Отправлено: HTTP ${r.status}. Bing и Yandex уведомлены.`);
  } else if (r.skipped) {
    console.error(`✗ Пропущено: ${r.skipped}`);
    process.exit(1);
  } else {
    console.error(`✗ IndexNow ответил HTTP ${r.status}. ${r.body ?? ""}`.trim());
    process.exit(1);
  }
}

// CLI-режим только при прямом запуске (node indexnow.mjs), не при импорте.
// process.argv[1] пуст при запуске через node -e / REPL — тогда это не CLI.
const invokedAs = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";
if (import.meta.url === invokedAs) {
  main().catch((e) => {
    console.error("✗ Ошибка:", e.message);
    process.exit(1);
  });
}
