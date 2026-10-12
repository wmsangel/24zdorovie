#!/usr/bin/env node
/**
 * Сверка статусов партнёрских офферов (Admitad) с тем, что размещено на сайте.
 * Read-only: только печатает отчёт, ничего не меняет.
 *
 * Запуск: npm run offers:check
 * Ключи: ~/.config/seo-stats/admitad-client-{id,secret}.txt (не печатаются).
 * website_id находится по домену через /websites/ (см. промт offers-check.md).
 *
 * Логика матчинга — по ИНН: он есть и в API (advertiser_legal_info), и в нашей
 * RU-маркировке «Реклама. <юрлицо, ИНН>…». EN/без-ИНН офферы (WAU и т.п.) ИНН не
 * имеют — их проверяем глазами по имени/домену (API не отдаёт erid/домен в списке).
 */
import fs from "node:fs";
import { execSync } from "node:child_process";

const DOMAIN = "24zdorovie.com";
const CREDS = `${process.env.HOME}/.config/seo-stats`;

function creds() {
  return {
    id: fs.readFileSync(`${CREDS}/admitad-client-id.txt`, "utf8").trim(),
    secret: fs.readFileSync(`${CREDS}/admitad-client-secret.txt`, "utf8").trim(),
  };
}

async function token(scope) {
  const { id, secret } = creds();
  const basic = Buffer.from(`${id}:${secret}`).toString("base64");
  const r = await fetch("https://api.admitad.com/token/", {
    method: "POST",
    headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=client_credentials&client_id=${id}&scope=${encodeURIComponent(scope)}`,
  });
  const d = await r.json();
  if (!d.access_token) throw new Error("token: " + JSON.stringify(d).slice(0, 200));
  return d.access_token;
}

const api = async (tok, path) =>
  (await fetch(`https://api.admitad.com${path}`, { headers: { Authorization: `Bearer ${tok}` } })).json();

const innOf = (s) => (s && s.match(/\d{10,12}/) ? s.match(/\d{10,12}/)[0] : null);

/** ИНН из RU-маркировки на сайте */
function placedInns() {
  const inns = new Map(); // inn -> [files]
  const out = execSync(
    `grep -rhoE "ИНН[: ]*[0-9]{10,12}" content src/config/offers.ts 2>/dev/null || true`,
    { encoding: "utf8" },
  );
  for (const m of out.matchAll(/(\d{10,12})/g)) inns.set(m[1], true);
  return new Set(inns.keys());
}

async function main() {
  const tok = await token("websites advcampaigns_for_website");
  const sites = (await api(tok, "/websites/?limit=100")).results || [];
  const self = sites.find((w) => (w.site_url || w.name || "").includes(DOMAIN));
  if (!self) throw new Error(`website_id для ${DOMAIN} не найден в /websites/`);
  const camps = (await api(tok, `/advcampaigns/website/${self.id}/?limit=200`)).results || [];

  const active = camps.filter((c) => c.connection_status === "active");
  const declined = camps.filter((c) => c.connection_status === "declined");
  const activeInns = new Set(active.map((c) => innOf(c.advertiser_legal_info)).filter(Boolean));
  const site = placedInns();

  const suspendedPlaced = [...site].filter((inn) => !activeInns.has(inn));
  const activeUnplaced = active.filter((c) => {
    const inn = innOf(c.advertiser_legal_info);
    return inn && !site.has(inn);
  });

  console.log(
    `Admitad · ${DOMAIN} (website ${self.id}) · активных ${active.length}, declined ${declined.length} · на сайте ${site.size} ИНН\n`,
  );
  console.log("⚠️  Приостановлено/снято, но размещено (ИНН на сайте без активной программы):");
  console.log(suspendedPlaced.length ? suspendedPlaced.map((i) => `   ИНН ${i} — убрать с сайта`).join("\n") : "   — нет, чисто");
  console.log("\n💡 Активно, но не размещено (можно поставить):");
  console.log(activeUnplaced.length ? activeUnplaced.map((c) => `   ${c.name} — ${c.advertiser_legal_info}`).join("\n") : "   — нет");
  console.log(`\nℹ️  EN/без-ИНН офферы (WAU и т.п.) — проверить глазами: активны ${active.filter((c) => !innOf(c.advertiser_legal_info)).map((c) => c.name).join(", ") || "—"}`);
  if (declined.length) console.log(`\nОтклонённые (не использовать): ${declined.map((c) => c.name).join(", ")}`);
}

main().catch((e) => {
  console.error("offers:check failed:", e.message);
  process.exit(1);
});
