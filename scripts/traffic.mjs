/**
 * Разбор трафика по данным Cloudflare.
 *
 * Отвечает на вопрос, который возникает каждый раз при взгляде на две
 * панели сразу: почему Cloudflare показывает сотни посетителей, а GA
 * и Метрика — единицы. Cloudflare считает всё, что постучалось в домен,
 * включая краулеров и сканеры; счётчики на JS видят только людей
 * с работающим браузером. Скрипт показывает это в цифрах: класс клиента,
 * браузер, типы отдаваемого контента и коды ответов.
 *
 * Запуск:
 *   node scripts/traffic.mjs           — последние 7 дней
 *   node scripts/traffic.mjs --days=30 — другой период
 *
 * Нужен CF_ZONE_ID и токен с правом Zone → Analytics → Read:
 * CF_ANALYTICS_TOKEN, иначе берётся CF_API_TOKEN.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const ENV_FILE = path.join(ROOT, "scripts", ".deploy.env");

for (const line of fs.existsSync(ENV_FILE) ? fs.readFileSync(ENV_FILE, "utf8").split("\n") : []) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eq = trimmed.indexOf("=");
  if (eq === -1) continue;
  const key = trimmed.slice(0, eq).trim();
  if (!(key in process.env)) process.env[key] = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
}

const ZONE = process.env.CF_ZONE_ID;
const TOKEN = process.env.CF_ANALYTICS_TOKEN || process.env.CF_API_TOKEN;
if (!ZONE || !TOKEN) {
  console.error("Нужны CF_ZONE_ID и CF_ANALYTICS_TOKEN в scripts/.deploy.env");
  process.exit(1);
}

const days = Number(process.argv.find((a) => a.startsWith("--days="))?.slice(7)) || 7;
const iso = (shift) => new Date(Date.now() - shift * 86_400_000).toISOString().slice(0, 10);

async function graphql(query) {
  const res = await fetch("https://api.cloudflare.com/client/v4/graphql", {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const data = await res.json();
  if (data.errors?.length) throw new Error(data.errors.map((e) => e.message).join("; "));
  return data.data;
}

const num = (n) => n.toLocaleString("ru-RU");
const pct = (part, total) => (total ? `${((part / total) * 100).toFixed(1)}%` : "—");

/** Cloudflare отдаёт разбивки массивами {key/clientCountryName/..., requests} */
function top(map, keyName, limit = 8) {
  return [...(map ?? [])]
    .map((e) => ({ key: e[keyName] ?? e.key ?? "—", requests: e.requests ?? 0 }))
    .sort((a, b) => b.requests - a.requests)
    .slice(0, limit);
}

const data = await graphql(`{
  viewer {
    zones(filter: {zoneTag: "${ZONE}"}) {
      httpRequests1dGroups(
        limit: ${Math.min(days, 30)},
        filter: {date_geq: "${iso(days)}", date_leq: "${iso(0)}"},
        orderBy: [date_DESC]
      ) {
        dimensions { date }
        sum {
          requests
          cachedRequests
          pageViews
          bytes
          threats
          ipClassMap { key: ipType requests }
          browserMap { key: uaBrowserFamily pageViews }
          contentTypeMap { key: edgeResponseContentTypeName requests }
          responseStatusMap { key: edgeResponseStatus requests }
        }
        uniq { uniques }
      }
    }
  }
}`);

const rows = data.viewer.zones[0]?.httpRequests1dGroups ?? [];
if (rows.length === 0) {
  console.log("Данных за период нет");
  process.exit(0);
}

console.log(`\nCloudflare, ${rows.length} дн. (${rows.at(-1).dimensions.date} — ${rows[0].dimensions.date})\n`);
console.log("дата         запросов   из кэша   просмотров   уникальных    трафик");
for (const r of rows) {
  console.log(
    `${r.dimensions.date}   ${String(num(r.sum.requests)).padStart(8)}  ${String(num(r.sum.cachedRequests)).padStart(8)}   ${String(num(r.sum.pageViews)).padStart(10)}   ${String(num(r.uniq.uniques)).padStart(10)}   ${(r.sum.bytes / 1048576).toFixed(1)} МБ`,
  );
}

const totals = rows.reduce(
  (acc, r) => ({
    requests: acc.requests + r.sum.requests,
    pageViews: acc.pageViews + r.sum.pageViews,
    uniques: acc.uniques + r.uniq.uniques,
    bytes: acc.bytes + r.sum.bytes,
    threats: acc.threats + r.sum.threats,
  }),
  { requests: 0, pageViews: 0, uniques: 0, bytes: 0, threats: 0 },
);

console.log(
  `\nИтого: ${num(totals.requests)} запросов, ${num(totals.pageViews)} просмотров страниц, ` +
    `${num(totals.uniques)} уникальных (сумма по дням), ${(totals.bytes / 1048576).toFixed(1)} МБ` +
    (totals.threats ? `, угроз заблокировано: ${num(totals.threats)}` : ""),
);
console.log(`Запросов на уникального: ${(totals.requests / Math.max(1, totals.uniques)).toFixed(1)}`);

/** Складываем разбивки за все дни в одну */
function merge(field, keyField = "key", valueField = "requests") {
  const acc = new Map();
  for (const r of rows) {
    for (const entry of r.sum[field] ?? []) {
      const key = String(entry[keyField]);
      acc.set(key, (acc.get(key) ?? 0) + (entry[valueField] ?? 0));
    }
  }
  return [...acc].map(([key, requests]) => ({ key, requests })).sort((a, b) => b.requests - a.requests);
}

const IP_CLASS_RU = {
  noRecord: "обычные адреса (люди и неопознанные боты)",
  searchEngine: "поисковые краулеры",
  monitoringService: "мониторинги",
  securityScanner: "сканеры уязвимостей",
  badHost: "адреса с плохой репутацией",
  greylist: "серый список",
  whitelist: "белый список Cloudflare",
  scan: "сканирование",
  tor: "Tor",
};

console.log("\nКто стучится (класс адреса):");
for (const e of merge("ipClassMap")) {
  console.log(`  ${(IP_CLASS_RU[e.key] ?? e.key).padEnd(46)} ${String(num(e.requests)).padStart(7)}  ${pct(e.requests, totals.requests)}`);
}

console.log("\nБраузеры (по просмотрам страниц):");
const browsers = merge("browserMap", "key", "pageViews");
if (browsers.length === 0) console.log("  нет данных");
for (const e of browsers.slice(0, 8)) {
  console.log(`  ${e.key.padEnd(46)} ${String(num(e.requests)).padStart(7)}  ${pct(e.requests, totals.pageViews)}`);
}

console.log("\nЧто отдаётся (тип контента):");
for (const e of merge("contentTypeMap").slice(0, 8)) {
  console.log(`  ${e.key.padEnd(46)} ${String(num(e.requests)).padStart(7)}  ${pct(e.requests, totals.requests)}`);
}

console.log("\nКоды ответов:");
for (const e of merge("responseStatusMap").slice(0, 8)) {
  console.log(`  ${e.key.padEnd(46)} ${String(num(e.requests)).padStart(7)}  ${pct(e.requests, totals.requests)}`);
}
console.log();
