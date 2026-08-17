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
 * Домен продублирован здесь намеренно: .mjs не импортирует TypeScript-конфиг
 * (как и scripts/gen-og.mjs). Менять — в обоих местах.
 */
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HOST = "24zdorovie.com";
const ORIGIN = `https://${HOST}`;
const ENDPOINT = "https://api.indexnow.org/indexnow";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Ключ IndexNow — единственный .txt в public/, чьё имя = его содержимому (hex) */
function findKey() {
  const dir = join(ROOT, "public");
  for (const f of readdirSync(dir)) {
    const m = f.match(/^([0-9a-f]{8,128})\.txt$/i);
    if (!m) continue;
    const body = readFileSync(join(dir, f), "utf8").trim();
    if (body === m[1]) return { key: m[1], file: f };
  }
  return null;
}

/** URL из собранного sitemap (только <loc>, без alternate-ссылок) */
function urlsFromSitemap() {
  const xml = readFileSync(join(ROOT, "out", "sitemap.xml"), "utf8");
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((m) => m[1].trim())
    .filter((u) => u.startsWith(ORIGIN));
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

  // IndexNow принимает до 10 000 URL за запрос — одного пакета достаточно
  const payload = {
    host: HOST,
    key: found.key,
    keyLocation: `${ORIGIN}/${found.file}`,
    urlList: urls,
  };

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(payload),
  });

  // 200 и 202 — принято; 422 — часть URL не с этого хоста; 403 — ключ не найден
  const body = await res.text().catch(() => "");
  if (res.ok) {
    console.log(`✓ Отправлено: HTTP ${res.status}. Bing и Yandex уведомлены.`);
  } else {
    console.error(`✗ IndexNow ответил HTTP ${res.status}. ${body}`.trim());
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("✗ Ошибка:", e.message);
  process.exit(1);
});
