/**
 * Заливка собранного сайта на shared-хостинг через cPanel API.
 *
 * Зачем: в out/ около 9900 файлов и 240 МБ, и обычной публикации статьи
 * из них касаются десятки. FTP-клиент об этом не знает и гоняет всё подряд,
 * поэтому скрипт помнит, что уже лежит на сервере (.deploy-state.json:
 * путь → sha1), и отправляет только разницу — обычно пара мегабайт.
 *
 * Как это устроено:
 *   1. сборка (npm run build), если не передан --no-build;
 *   2. сравнение хешей out/ с состоянием прошлого деплоя;
 *   3. изменённые файлы пакуются в tar.gz частями по ~40 МБ;
 *   4. каждая часть заливается через UAPI Fileman::upload_files
 *      и распаковывается на месте через API 2 Fileman::fileop (op=extract);
 *   5. файлы, исчезнувшие из сборки, удаляются тем же fileop (op=unlink);
 *   6. состояние сохраняется — но только для того, что реально доехало.
 *
 * tar.gz, а не zip: в путях есть кириллица (страницы тегов), и tar хранит
 * имена байтами, без кодировочных таблиц, которые zip переживает по-разному.
 *
 * Запуск:
 *   npm run deploy                 — собрать и залить разницу
 *   npm run deploy -- --dry-run    — показать план, ничего не отправляя
 *   npm run deploy -- --no-build   — залить уже собранное out/
 *   npm run deploy -- --full       — забыть состояние и залить всё заново
 *   npm run deploy -- --no-delete  — не удалять на сервере ничего
 *   npm run deploy -- --no-purge   — не сбрасывать кэш Cloudflare
 *   npm run deploy -- --no-indexnow — не пинговать IndexNow об изменённых страницах
 *
 * Доступ (scripts/.deploy.env, файл в .gitignore):
 *   CPANEL_HOST   — хост cPanel, БЕЗ Cloudflare: обычно вида
 *                   xxx.prod.iad2.secureserver.net или IP сервера
 *   CPANEL_PORT   — 2083 по умолчанию
 *   CPANEL_USER   — пользователь cPanel
 *   CPANEL_TOKEN  — API-токен (cPanel → Security → Manage API Tokens)
 *   CPANEL_PASS   — пароль, если токены на хостинге отключены
 *   CPANEL_DIR    — каталог сайта, по умолчанию public_html
 *   CF_ZONE_ID    — зона Cloudflare, чтобы сбросить кэш после заливки
 *   CF_API_TOKEN  — токен с правом Zone → Cache Purge; без него шаг пропускается
 */
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { submitToIndexNow } from "./indexnow.mjs";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "out");
const STATE_FILE = path.join(ROOT, ".deploy-state.json");
const ENV_FILE = path.join(ROOT, "scripts", ".deploy.env");

/**
 * Предел одной части архива, задаётся ниже из DEPLOY_PART_MB: больше — риск
 * упереться в лимиты загрузки cPanel, меньше — больше запросов.
 */
let MAX_PART_BYTES = 40 * 1024 * 1024;
/** Столько путей отправляем в один вызов unlink */
const UNLINK_BATCH = 40;
/**
 * Столько удалений скрипт делает без вопросов. Больше — почти всегда признак
 * потерянного состояния, а не реального удаления статей.
 */
const DELETE_SANITY_LIMIT = 300;

// ---------------------------------------------------------------- аргументы

const args = process.argv.slice(2);
const hasFlag = (name) => args.includes(`--${name}`);

const DRY_RUN = hasFlag("dry-run");
const NO_BUILD = hasFlag("no-build");
const FULL = hasFlag("full");
const NO_DELETE = hasFlag("no-delete");
const FORCE_DELETE = hasFlag("force-delete");
const NO_INDEXNOW = hasFlag("no-indexnow");

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

loadEnvFile();

const HOST = process.env.CPANEL_HOST;
const PORT = process.env.CPANEL_PORT || "2083";
const USER = process.env.CPANEL_USER;
const TOKEN = process.env.CPANEL_TOKEN;
const PASS = process.env.CPANEL_PASS;
const REMOTE_DIR = (process.env.CPANEL_DIR || "public_html").replace(/\/+$/, "");

if (Number(process.env.DEPLOY_PART_MB) > 0) {
  MAX_PART_BYTES = Number(process.env.DEPLOY_PART_MB) * 1024 * 1024;
}

function requireConfig() {
  const missing = [];
  if (!HOST) missing.push("CPANEL_HOST");
  if (!USER) missing.push("CPANEL_USER");
  if (!TOKEN && !PASS) missing.push("CPANEL_TOKEN (или CPANEL_PASS)");
  if (missing.length === 0) return;

  console.error(`Не заданы: ${missing.join(", ")}`);
  console.error(`Пропишите их в ${path.relative(ROOT, ENV_FILE)} — образец в docs/DEPLOY.md.`);
  process.exit(1);
}

// ---------------------------------------------------------------- утилиты

const fmtBytes = (n) =>
  n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} МБ` : `${Math.max(1, Math.round(n / 1024))} КБ`;

const sha1 = (buf) => createHash("sha1").update(buf).digest("hex");

/** Все файлы out/ относительными путями, включая точечные (.htaccess) */
function walk(dir, base = dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full, base);
    if (!entry.isFile()) return [];
    return [path.relative(base, full)];
  });
}

function readState() {
  if (FULL || !fs.existsSync(STATE_FILE)) return {};
  try {
    const parsed = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
    return parsed.files ?? {};
  } catch {
    console.warn("⚠ .deploy-state.json не читается, считаем деплой первым");
    return {};
  }
}

function writeState(files) {
  if (DRY_RUN) return;
  fs.writeFileSync(
    STATE_FILE,
    `${JSON.stringify({ updatedAt: new Date().toISOString(), files }, null, 0)}\n`,
  );
}

// ---------------------------------------------------------------- cPanel API

const authHeader = () =>
  TOKEN
    ? `cpanel ${USER}:${TOKEN}`
    : `Basic ${Buffer.from(`${USER}:${PASS}`).toString("base64")}`;

const apiBase = `https://${HOST}:${PORT}`;

/** Ответ логин-страницей вместо JSON — самый частый симптом неверных доступов */
function parseJson(text, where) {
  try {
    return JSON.parse(text);
  } catch {
    const hint = /access denied/i.test(text)
      ? "cPanel отклонил доступ: проверьте CPANEL_USER и CPANEL_TOKEN (токен создаётся в Security → Manage API Tokens)."
      : /login|password/i.test(text)
        ? "cPanel вернул страницу входа: проверьте CPANEL_HOST — нужен прямой хост сервера, а не домен за Cloudflare."
        : "Ответ не похож на JSON.";
    throw new Error(`${where}: ${hint}\n${text.slice(0, 300)}`);
  }
}

/** UAPI: POST /execute/Module/func, тело — multipart */
async function uapiUpload(remoteDir, fileName, buffer) {
  const form = new FormData();
  form.set("dir", remoteDir);
  form.set("file-1", new Blob([buffer]), fileName);

  const res = await fetch(`${apiBase}/execute/Fileman/upload_files`, {
    method: "POST",
    headers: { Authorization: authHeader() },
    body: form,
  });
  const data = parseJson(await res.text(), "upload_files");

  if (data.status !== 1 || Number(data.data?.failed ?? 0) > 0) {
    const why = data.errors?.join("; ") || JSON.stringify(data.data?.uploads ?? data);
    throw new Error(`Загрузка ${fileName} не удалась: ${why}`);
  }
  return data;
}

/**
 * fileop возвращает result=1 даже когда распаковщик отказал: настоящая
 * причина приезжает текстом в output. Без этой проверки неудачный деплой
 * выглядит успешным, а сайт остаётся старым.
 */
const OUTPUT_FAILURE = /permission denied|cannot (create|open|mkdir)|error:|no such file/i;

/**
 * API 2 Fileman::fileop — распаковка и удаление.
 * UAPI-эквивалента для extract у cPanel нет, поэтому здесь старый интерфейс.
 */
async function fileop(params) {
  const query = new URLSearchParams({
    "cpanel_jsonapi_user": USER,
    "cpanel_jsonapi_apiversion": "2",
    "cpanel_jsonapi_module": "Fileman",
    "cpanel_jsonapi_func": "fileop",
    doubledecode: "0",
    ...params,
  });

  const res = await fetch(`${apiBase}/json-api/cpanel?${query}`, {
    headers: { Authorization: authHeader() },
  });
  const data = parseJson(await res.text(), `fileop ${params.op}`);

  const result = data.cpanelresult ?? {};
  if (result.error) throw new Error(`fileop ${params.op}: ${result.error}`);

  // Ошибки отдельных файлов приезжают внутри data[], а не в error
  const failures = (result.data ?? []).filter((d) => d.result === 0 || d.err);
  if (failures.length) {
    throw new Error(
      `fileop ${params.op}: ${failures.map((f) => f.err || f.output || "отказ").join("; ")}`,
    );
  }

  for (const entry of result.data ?? []) {
    if (entry.output && OUTPUT_FAILURE.test(entry.output)) {
      const lines = entry.output.trim().split("\n").slice(0, 3).join(" | ");
      throw new Error(`fileop ${params.op}: распаковщик отказал — ${lines}`);
    }
  }
  return result;
}

/**
 * Абсолютный путь каталога сайта.
 *
 * Обязателен для extract: с относительным destfiles cPanel считает путь
 * от каталога архива и создаёт внутри сайта вложенный public_html/, а без
 * destfiles вовсе распаковывает в домашний каталог, где нет прав на запись.
 */
async function listRemote(dir = REMOTE_DIR) {
  const query = new URLSearchParams({ dir, types: "dir|file" });
  const res = await fetch(`${apiBase}/execute/Fileman/list_files?${query}`, {
    headers: { Authorization: authHeader() },
  });
  const data = parseJson(await res.text(), "list_files");
  if (data.status !== 1) {
    throw new Error(`Каталог ${dir} не читается: ${data.errors?.join("; ") ?? "нет данных"}`);
  }
  return data.data ?? [];
}

let remoteAbs = null;
async function remoteAbsDir() {
  if (remoteAbs) return remoteAbs;
  if (REMOTE_DIR.startsWith("/")) return (remoteAbs = REMOTE_DIR);

  const entry = (await listRemote())[0];
  const abs = entry?.absdir ?? (entry?.fullpath ? path.posix.dirname(entry.fullpath) : null);
  if (!abs) {
    throw new Error(
      `Не удалось определить полный путь ${REMOTE_DIR} — укажите CPANEL_DIR абсолютным путём`,
    );
  }
  return (remoteAbs = abs);
}

// ---------------------------------------------------------------- план

function buildSite() {
  if (NO_BUILD) return;
  console.log("→ Сборка");
  execFileSync("npm", ["run", "build"], { stdio: "inherit" });
}

function plan() {
  if (!fs.existsSync(OUT_DIR)) {
    console.error("Нет папки out/. Запустите без --no-build или соберите сайт вручную.");
    process.exit(1);
  }

  const previous = readState();
  const current = {};
  const changed = [];

  for (const rel of walk(OUT_DIR)) {
    const hash = sha1(fs.readFileSync(path.join(OUT_DIR, rel)));
    current[rel] = hash;
    if (previous[rel] !== hash) changed.push(rel);
  }

  const deleted = Object.keys(previous).filter((rel) => !(rel in current));
  return { previous, current, changed, deleted, first: Object.keys(previous).length === 0 };
}

/** Части по MAX_PART_BYTES: крупный файл всегда едет в своей части */
function splitParts(files) {
  const parts = [];
  let part = [];
  let size = 0;

  for (const rel of files) {
    const bytes = fs.statSync(path.join(OUT_DIR, rel)).size;
    if (part.length && size + bytes > MAX_PART_BYTES) {
      parts.push(part);
      part = [];
      size = 0;
    }
    part.push(rel);
    size += bytes;
  }
  if (part.length) parts.push(part);
  return parts;
}

/** tar с путями относительно out/ — при распаковке в public_html они лягут как надо */
function packPart(files, index) {
  const listFile = path.join(os.tmpdir(), `deploy-list-${process.pid}-${index}.txt`);
  const archive = path.join(os.tmpdir(), `deploy-${Date.now()}-${index}.tar.gz`);
  fs.writeFileSync(listFile, `${files.join("\n")}\n`);

  execFileSync("tar", ["-czf", archive, "-C", OUT_DIR, "-T", listFile]);
  fs.unlinkSync(listFile);
  return archive;
}

// ---------------------------------------------------------------- деплой

async function uploadParts(parts) {
  for (const [i, files] of parts.entries()) {
    const archive = packPart(files, i);
    const name = path.basename(archive);
    const size = fs.statSync(archive).size;

    console.log(
      `→ Часть ${i + 1}/${parts.length}: ${files.length} файлов, ${fmtBytes(size)} — загрузка`,
    );
    await uapiUpload(REMOTE_DIR, name, fs.readFileSync(archive));

    const remote = `${REMOTE_DIR}/${name}`;
    try {
      console.log(`  распаковка ${remote}`);
      await fileop({ op: "extract", sourcefiles: remote, destfiles: await remoteAbsDir() });
    } finally {
      // Архив не должен пережить деплой даже при неудачной распаковке
      await fileop({ op: "unlink", sourcefiles: remote }).catch((e) =>
        console.warn(`  ⚠ не удалось удалить ${remote}: ${e.message}`),
      );
      fs.unlinkSync(archive);
    }
  }
}

async function removeStale(deleted) {
  const risky = deleted.filter((rel) => rel.includes(","));
  if (risky.length) {
    console.warn(
      `⚠ ${risky.length} путей с запятой пропущены — fileop разделяет список запятыми, удалите их вручную:`,
    );
    for (const rel of risky.slice(0, 10)) console.warn(`   ${rel}`);
  }

  const safe = deleted.filter((rel) => !rel.includes(","));
  for (let i = 0; i < safe.length; i += UNLINK_BATCH) {
    const batch = safe.slice(i, i + UNLINK_BATCH);
    await fileop({ op: "unlink", sourcefiles: batch.map((rel) => `${REMOTE_DIR}/${rel}`).join(",") });
    console.log(`  удалено ${Math.min(i + batch.length, safe.length)}/${safe.length}`);
  }
}

/**
 * Сброс кэша Cloudflare.
 *
 * Нужен из-за `max-age=31536000, immutable` на статике: имена OG-картинок
 * и иконок между сборками не меняются, поэтому изменившееся содержимое
 * без очистки будет отдаваться из кэша ещё год.
 *
 * Без CF_API_TOKEN шаг пропускается с напоминанием — деплой от этого
 * не считается неудачным.
 */
async function purgeCloudflare() {
  const zone = process.env.CF_ZONE_ID;
  const token = process.env.CF_API_TOKEN;

  if (!zone || !token) {
    console.log(
      "\n  Кэш Cloudflare не тронут: нет CF_ZONE_ID или CF_API_TOKEN." +
        "\n  Очистите вручную — Caching → Configuration → Purge Everything.",
    );
    return;
  }

  const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${zone}/purge_cache`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ purge_everything: true }),
  });
  const data = await res.json().catch(() => ({}));

  if (!data.success) {
    const why = (data.errors ?? []).map((e) => `${e.code}: ${e.message}`).join("; ");
    console.warn(
      `\n  ⚠ Cloudflare не сбросил кэш${why ? `: ${why}` : ""}` +
        "\n  Токену нужно право Zone → Cache Purge для этой зоны. Очистите вручную.",
    );
    return;
  }
  console.log("\n  Кэш Cloudflare сброшен");
}

/**
 * Уведомить IndexNow (Bing + Yandex) о НОВЫХ страницах.
 *
 * Получает уже отфильтрованный список новых относительных путей (те, что
 * появились с прошлого деплоя). Почему только новые, а не все изменённые:
 * между сборками Next меняет разметку каждой страницы, поэтому по хешу
 * «изменёнными» оказываются почти все HTML — пинговать их все на каждый
 * деплой значит спамить IndexNow неизменившимся контентом. Реально новый
 * контент — это добавленные файлы. Правки существующих страниц пингуются
 * вручную: npm run indexnow -- <url>.
 *
 * Из списка берём лишь HTML-страницы (…/index.html) → URL со слэшем; теги
 * исключаем (ниже порога они noindex). Best-effort: сбой не валит деплой.
 */
async function pingIndexNow(newPaths) {
  const ORIGIN = "https://24zdorovie.com";
  const urls = newPaths
    .map((rel) => rel.split(path.sep).join("/"))
    .filter((rel) => rel.endsWith("/index.html") && !rel.includes("/tag/"))
    .map((rel) => encodeURI(`${ORIGIN}/${rel.slice(0, -"index.html".length)}`));

  if (urls.length === 0) {
    console.log("  IndexNow: изменившихся страниц нет — пинг пропущен.");
    return;
  }

  try {
    const r = await submitToIndexNow(urls, { root: ROOT });
    if (r.skipped) console.log(`  IndexNow пропущен: ${r.skipped}`);
    else if (r.ok) console.log(`  IndexNow: уведомлены Bing и Yandex о ${r.count} стр. (HTTP ${r.status})`);
    else console.warn(`  ⚠ IndexNow ответил HTTP ${r.status}${r.body ? `: ${r.body.slice(0, 200)}` : ""}`);
  } catch (e) {
    console.warn(`  ⚠ IndexNow не отправлен: ${e.message}`);
  }
}

/**
 * Проверка связки upload → extract → unlink на одном файле.
 * Нужна перед первым большим деплоем: если cPanel не умеет распаковывать
 * архив по API, лучше узнать это на 200 байтах, а не на 220 мегабайтах.
 * Файл берётся из самой сборки, так что сервер получает ровно то,
 * что и так должно там лежать.
 */
async function selfTest() {
  requireConfig();

  const probe = ["robots.txt", "ads.txt", "404.html"].find((f) =>
    fs.existsSync(path.join(OUT_DIR, f)),
  );
  if (!probe) throw new Error("В out/ не нашлось файла для проверки — соберите сайт");

  console.log(`→ Пробная заливка ${probe} в ${REMOTE_DIR}`);
  const archive = packPart([probe], "test");
  const name = path.basename(archive);

  await uapiUpload(REMOTE_DIR, name, fs.readFileSync(archive));
  console.log("  загрузка: ок");

  const remote = `${REMOTE_DIR}/${name}`;
  try {
    await fileop({ op: "extract", sourcefiles: remote, destfiles: await remoteAbsDir() });
    console.log("  распаковка: ок");
  } finally {
    await fileop({ op: "unlink", sourcefiles: remote });
    console.log("  архив удалён с сервера");
    fs.unlinkSync(archive);
  }

  /**
   * Распаковщик умеет отчитываться об успехе, ничего не записав, — сверяем факт.
   * tar восстанавливает время файла из архива, поэтому совпадение mtime
   * с локальным означает, что на сервере лежит именно наша копия.
   */
  const local = fs.statSync(path.join(OUT_DIR, probe));
  const remoteInfo = (await listRemote()).find((f) => f.file === probe);
  if (!remoteInfo) throw new Error(`${probe} на сервере не появился — распаковка не сработала`);

  const sameSize = Number(remoteInfo.size) === local.size;
  const sameTime = Math.abs(Number(remoteInfo.mtime) - Math.floor(local.mtimeMs / 1000)) <= 1;
  if (!sameSize || !sameTime) {
    throw new Error(
      `${probe} на сервере ${remoteInfo.size} б / mtime ${remoteInfo.mtime}, ` +
        `локально ${local.size} б / mtime ${Math.floor(local.mtimeMs / 1000)} — файл не перезаписался`,
    );
  }
  console.log(`  файл на сервере совпал с локальным (${local.size} б, mtime из архива)`);

  console.log("\n✓ Механизм работает, можно запускать npm run deploy");
}

async function main() {
  if (hasFlag("selftest")) return selfTest();

  buildSite();

  const { previous, current, changed, deleted, first } = plan();
  const totalBytes = changed.reduce((sum, rel) => sum + fs.statSync(path.join(OUT_DIR, rel)).size, 0);

  console.log(
    `\nК заливке: ${changed.length} файлов (${fmtBytes(totalBytes)})` +
      `, к удалению: ${deleted.length}` +
      (first ? " — первый деплой, состояния нет" : ""),
  );

  if (changed.length === 0 && deleted.length === 0) {
    console.log("Сервер уже совпадает с out/ — заливать нечего.");
    return;
  }

  if (changed.includes(".htaccess")) console.log("  .htaccess входит в заливку");

  if (DRY_RUN) {
    for (const rel of changed.slice(0, 40)) console.log(`  + ${rel}`);
    if (changed.length > 40) console.log(`  … ещё ${changed.length - 40}`);
    for (const rel of deleted.slice(0, 20)) console.log(`  − ${rel}`);
    if (deleted.length > 20) console.log(`  … ещё ${deleted.length - 20}`);
    console.log("\n--dry-run: ничего не отправлено.");
    return;
  }

  requireConfig();

  const parts = splitParts(changed);
  await uploadParts(parts);

  // Состояние пишем сразу после успешной заливки: если удаление упадёт,
  // повторный запуск не станет гонять те же файлы заново.
  writeState(current);

  if (deleted.length && !NO_DELETE) {
    if (deleted.length > DELETE_SANITY_LIMIT && !FORCE_DELETE) {
      console.warn(
        `\n⚠ К удалению ${deleted.length} файлов — это подозрительно много.` +
          "\n  Ничего не удалено. Проверьте список через --dry-run и запустите с --force-delete.",
      );
    } else {
      console.log(`→ Удаление ${deleted.length} устаревших файлов`);
      await removeStale(deleted);
    }
  }

  console.log("\n✓ Готово.");
  if (!hasFlag("no-purge")) await purgeCloudflare();
  if (!NO_INDEXNOW) await pingIndexNow(changed.filter((rel) => !(rel in previous)));
  console.log("  Проверки после заливки — в docs/DEPLOY.md.");
}

main().catch((e) => {
  console.error(`\n✗ ${e.message}`);
  process.exit(1);
});
