/**
 * Публикация на Cloudflare Pages (прямой аплоад собранного out/).
 *
 * В отличие от cPanel-деплоя (scripts/deploy.mjs) здесь не нужен ни ручной
 * сброс кэша Cloudflare (Pages версионирует и инвалидирует сам), ни разбиение
 * на архивы. Функции edge берутся из ./functions автоматически.
 *
 * После деплоя автоматически пингует IndexNow (Bing + Yandex) только о НОВЫХ
 * страницах — разницу считаем по sha1 против .indexnow-pages-state.json, как в
 * cPanel-деплое. Первый запуск лишь сохраняет базовое состояние (без пинга,
 * чтобы не слать весь sitemap). Отключить: --no-indexnow.
 *
 * Требуется авторизация wrangler: `npx wrangler login` (один раз) либо
 * переменная CLOUDFLARE_API_TOKEN с правами Pages:Edit.
 *
 * Запуск:
 *   node scripts/deploy-pages.mjs            # сборка + деплой в прод + IndexNow
 *   node scripts/deploy-pages.mjs --preview  # деплой в превью-ветку
 *   node scripts/deploy-pages.mjs --skip-build
 *   node scripts/deploy-pages.mjs --no-indexnow
 */
import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { submitToIndexNow } from "./indexnow.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "out");
const STATE_FILE = path.join(ROOT, ".indexnow-pages-state.json");
const ORIGIN = "https://24zdorovie.com";

const args = process.argv.slice(2);
const PROJECT = process.env.CF_PAGES_PROJECT || "24zdorovie";
const PROD_BRANCH = "main";
const branch = args.includes("--preview") ? "preview" : PROD_BRANCH;

const run = (cmd) => execSync(cmd, { stdio: "inherit" });

/** Рекурсивно собрать относительные пути всех .../index.html в out/ */
function walkHtml(dir, base = dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return walkHtml(full, base);
    return e.name === "index.html" ? [path.relative(base, full).split(path.sep).join("/")] : [];
  });
}

const sha1 = (buf) => createHash("sha1").update(buf).digest("hex");

/**
 * IndexNow: пингуем только новые страницы (rel, которых не было в прошлом
 * состоянии). Теги ниже порога noindex — исключаем. Best-effort: сбой не валит
 * деплой. Правки существующих страниц при желании — npm run indexnow -- <url>.
 */
async function pingIndexNow() {
  if (!fs.existsSync(OUT_DIR)) return;

  let previous = {};
  try {
    previous = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
  } catch {
    previous = {};
  }

  const current = {};
  const added = [];
  for (const rel of walkHtml(OUT_DIR)) {
    current[rel] = sha1(fs.readFileSync(path.join(OUT_DIR, rel)));
    if (!(rel in previous)) added.push(rel);
  }
  fs.writeFileSync(STATE_FILE, `${JSON.stringify(current, null, 0)}\n`);

  if (Object.keys(previous).length === 0) {
    console.log("  IndexNow: базовое состояние сохранено, пинг пропущен (первый запуск).");
    return;
  }

  const urls = added
    .filter((rel) => rel.endsWith("index.html") && !rel.includes("/tag/"))
    .map((rel) => encodeURI(`${ORIGIN}/${rel.slice(0, -"index.html".length)}`));

  if (urls.length === 0) {
    console.log("  IndexNow: новых страниц нет — пинг пропущен.");
    return;
  }

  try {
    const r = await submitToIndexNow(urls, { root: ROOT });
    if (r.skipped) console.log(`  IndexNow пропущен: ${r.skipped}`);
    else if (r.ok) console.log(`  IndexNow: уведомлены Bing и Yandex о ${r.count} нов. стр. (HTTP ${r.status})`);
    else console.warn(`  ⚠ IndexNow ответил HTTP ${r.status}${r.body ? `: ${r.body.slice(0, 200)}` : ""}`);
  } catch (e) {
    console.warn(`  ⚠ IndexNow не отправлен: ${e.message}`);
  }
}

// ---------------------------------------------------------------- сценарий

if (!args.includes("--skip-build")) {
  console.log("[pages] сборка (gen-og + next build)…");
  run("npm run build");
}

console.log(`[pages] деплой out/ → проект «${PROJECT}», ветка «${branch}»…`);
run(
  `npx wrangler pages deploy out --project-name=${PROJECT} --branch=${branch} --commit-dirty=true`,
);

if (!args.includes("--no-indexnow")) {
  await pingIndexNow();
}

console.log("\n[pages] Готово.");
console.log("  • Превью-URL печатает wrangler выше (*.pages.dev).");
console.log("  • Прод-домен и DNS — в дашборде Cloudflare (один раз).");
