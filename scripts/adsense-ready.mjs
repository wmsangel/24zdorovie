#!/usr/bin/env node
/**
 * AdSense-readiness: раз в неделю оценивает, дорос ли сайт до (пере)подачи в AdSense.
 *
 * ВАЖНО про сигнал. AdSense смотрит на РЕАЛЬНУЮ аудиторию (живые люди, органика),
 * а не на сырой трафик. У нас есть только Cloudflare-аналитика на edge, которая
 * считает ВСЁ, включая ботов и краулеров: на молодом сайте это завышает «уники»
 * на порядок-другой (пример: Cloudflare ~3.8к/нед против ~78/мес живых в GA4).
 * Поэтому Cloudflare-число тут — лишь «сырой пульс», НЕ основание подавать.
 *
 * Честный порог готовности — недельные КЛИКИ ИЗ ПОИСКА (GSC). Их даёт GSC Search
 * Analytics API, который пока не подключён. Пока его нет, вердикт «пора» ставится
 * только если недельные клики переданы вручную (GSC_WEEKLY_CLICKS=NN) — их видно
 * в Search Console за минуту. Как подключим GSC API, скрипт возьмёт клики сам.
 *
 * Запуск:  npm run adsense-ready
 *          GSC_WEEKLY_CLICKS=60 npm run adsense-ready
 * Пороги (эвристика, не официальные): ADSENSE_READY_CLICKS (умолч. 50 кликов/нед).
 * Код выхода: 0 = пора, 10 = почти, 20 = рано, 30 = нет честного сигнала (нужен GSC).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

for (const line of (() => {
  try {
    return fs.readFileSync(path.join(ROOT, "scripts", ".deploy.env"), "utf8").split("\n");
  } catch {
    return [];
  }
})()) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("=");
  if (i === -1) continue;
  const k = t.slice(0, i).trim();
  if (!(k in process.env)) process.env[k] = t.slice(i + 1).trim().replace(/^["']|["']$/g, "");
}

const ZONE = process.env.CF_ZONE_ID;
const TOKEN = process.env.CF_ANALYTICS_TOKEN || process.env.CF_API_TOKEN;
const READY_CLICKS = Number(process.env.ADSENSE_READY_CLICKS) || 50; // клики из поиска/нед
const gscClicks =
  process.env.GSC_WEEKLY_CLICKS != null && process.env.GSC_WEEKLY_CLICKS !== ""
    ? Number(process.env.GSC_WEEKLY_CLICKS)
    : null;

const num = (n) => n.toLocaleString("ru-RU");
const iso = (shift) => new Date(Date.now() - shift * 86_400_000).toISOString().slice(0, 10);

// --- Cloudflare: сырой недельный трафик (контекст, с ботами) ---
let cf = null;
if (ZONE && TOKEN) {
  try {
    const res = await fetch("https://api.cloudflare.com/client/v4/graphql", {
      method: "POST",
      headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `{ viewer { zones(filter:{zoneTag:"${ZONE}"}) {
          httpRequests1dGroups(limit:14, filter:{date_geq:"${iso(14)}", date_leq:"${iso(0)}"}, orderBy:[date_DESC]) {
            dimensions{date} sum{pageViews} uniq{uniques} } } } }`,
      }),
    });
    const j = await res.json();
    if (!j.errors) {
      const rows = (j.data.viewer.zones[0]?.httpRequests1dGroups ?? []).sort((a, b) =>
        b.dimensions.date.localeCompare(a.dimensions.date),
      );
      const s = (a, f) => a.reduce((x, r) => x + f(r), 0);
      cf = {
        u7: s(rows.slice(0, 7), (r) => r.uniq.uniques),
        p7: s(rows.slice(0, 7), (r) => r.sum.pageViews),
        uPrev: s(rows.slice(7, 14), (r) => r.uniq.uniques),
      };
    }
  } catch {
    /* best-effort */
  }
}

console.log("AdSense-readiness · 24zdorovie.com");
console.log("─".repeat(56));
if (cf) {
  const g = cf.uPrev ? `  (${cf.u7 >= cf.uPrev ? "+" : ""}${Math.round(((cf.u7 - cf.uPrev) / cf.uPrev) * 100)}% н/н)` : "";
  console.log(`Cloudflare (сырое, ВКЛ. БОТОВ): ${num(cf.u7)} уник · ${num(cf.p7)} просмотров/нед${g}`);
  console.log("  ⚠ это не живые читатели — на молодом сайте тут в основном боты/краулеры.");
}

let verdict, code;
if (gscClicks == null) {
  console.log("Клики из поиска (GSC):          не подключены");
  console.log("─".repeat(56));
  verdict =
    "❓ НЕТ ЧЕСТНОГО СИГНАЛА. Cloudflare завышен ботами, GSC не подключён.\n" +
    "   → Быстро: посмотри в Search Console клики за 7 дней и запусти\n" +
    `     GSC_WEEKLY_CLICKS=NN npm run adsense-ready\n` +
    "   → Надёжно: подключить GSC Search Analytics API (тогда возьмём сами).";
  code = 30;
} else {
  console.log(`Клики из поиска (GSC, 7 дн):     ${num(gscClicks)}`);
  console.log(`Порог подачи:                   ${num(READY_CLICKS)} кликов/нед`);
  console.log("─".repeat(56));
  if (gscClicks >= READY_CLICKS) {
    verdict = "✅ ПОРА ПОДАВАТЬ — поиск реально приводит людей.\n   → Пройди docs/ADSENSE-CHECKLIST.md и подавай.";
    code = 0;
  } else if (gscClicks >= READY_CLICKS * 0.5) {
    verdict = `🟡 ПОЧТИ — не хватает ${num(READY_CLICKS - gscClicks)} кликов/нед. Растёт, ждём.`;
    code = 10;
  } else {
    verdict = `⏳ РАНО — ${num(gscClicks)} из ${num(READY_CLICKS)} кликов/нед. Растим органику.`;
    code = 20;
  }
}
console.log(verdict);
process.exit(code);
