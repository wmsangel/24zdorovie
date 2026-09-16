/**
 * Публикация на Cloudflare Pages (прямой аплоад собранного out/).
 *
 * В отличие от cPanel-деплоя (scripts/deploy.mjs) здесь не нужен ни ручной
 * сброс кэша Cloudflare (Pages версионирует и инвалидирует сам), ни разбиение
 * на архивы. Функции edge берутся из ./functions автоматически.
 *
 * Требуется авторизация wrangler: `npx wrangler login` (один раз) либо
 * переменная CLOUDFLARE_API_TOKEN с правами Pages:Edit.
 *
 * Запуск:
 *   node scripts/deploy-pages.mjs            # сборка + деплой в прод
 *   node scripts/deploy-pages.mjs --preview  # деплой в превью-ветку
 *   node scripts/deploy-pages.mjs --skip-build
 */
import { execSync } from "node:child_process";

const args = process.argv.slice(2);
const PROJECT = process.env.CF_PAGES_PROJECT || "24zdorovie";
const PROD_BRANCH = "main";
const branch = args.includes("--preview") ? "preview" : PROD_BRANCH;

const run = (cmd) => execSync(cmd, { stdio: "inherit" });

if (!args.includes("--skip-build")) {
  console.log("[pages] сборка (gen-og + next build)…");
  run("npm run build");
}

console.log(`[pages] деплой out/ → проект «${PROJECT}», ветка «${branch}»…`);
run(
  `npx wrangler pages deploy out --project-name=${PROJECT} --branch=${branch} --commit-dirty=true`,
);

console.log("\n[pages] Готово.");
console.log("  • Превью-URL печатает wrangler выше (*.pages.dev).");
console.log("  • Прод-домен и DNS переключаются в дашборде Cloudflare (один раз).");
console.log("  • IndexNow при желании: npm run indexnow");
