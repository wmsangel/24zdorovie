/**
 * Генератор ассетов оформления Instagram для 24zdorovie.
 *
 * Делает фирменную графику в том же стиле, что слайды постов (satori + resvg,
 * IBM Plex, зелёный акцент, лого-сердце). Всё кладётся в social/profile/.
 *
 *   node scripts/profile-assets.mjs
 *
 * Что генерит:
 *   avatar-ru.png / avatar-en.png   1080×1080  — аватар (знак в центре, чип RU/EN)
 *   highlight-<slug>.png ×6         1080×1920  — обложки «Актуального» (иконка в круге)
 *
 * Обложки языконезависимы (без текста) — названия к ним в profile-{ru,en}.md.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const p = (...a) => join(ROOT, ...a);

// ── бренд-токены 24zdorovie (как в social-slides.mjs) ──
const INK = "#1b1e26", BRAND = "#1fa268", ACCENT = "#2f8f5f";
const GREEN_BG = "linear-gradient(160deg, #22a96c 0%, #1fa268 48%, #178a57 100%)";
const TINT_BG = "radial-gradient(120% 90% at 80% 0%, #e7f6ee 0%, #f2faf5 55%, #e9f7ef 100%)";

const FONT = (f) => readFileSync(p("fonts", f));
const fonts = [
  { name: "Plex", data: FONT("IBMPlexSans-Bold.ttf"), weight: 700, style: "normal" },
  { name: "Plex", data: FONT("IBMPlexSans-SemiBold.ttf"), weight: 600, style: "normal" },
];

function rasterize(svg, width) {
  if (!/xmlns=/.test(svg)) svg = svg.replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ');
  const png = new Resvg(svg, { fitTo: { mode: "width", value: width }, font: { loadSystemFonts: false } }).render().asPng();
  return "data:image/png;base64," + png.toString("base64");
}

// Белый знак (сердце + ЭКГ) без зелёной плитки — для наложения на зелёный фон.
const WHITE_MARK = rasterize(
  `<svg viewBox="0 0 64 64">
    <path d="M32 51s-4.3-3-8.8-7.8C18.3 38 14.5 33.3 14.5 27.5A10.5 10.5 0 0 1 32 20.2a10.5 10.5 0 0 1 17.5 7.3c0 5.8-3.8 10.5-8.7 15.7C36.3 48 32 51 32 51Z" fill="none" stroke="#fff" stroke-width="3.4" stroke-linejoin="round"/>
    <path d="M20 32h6.5l3-5.5L34 38l3-6h8" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`, 720);

// ── иконки обложек (зелёный штрих, без текста) ──
const ic = (body) => rasterize(
  `<svg viewBox="0 0 64 64"><g fill="none" stroke="${BRAND}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round">${body}</g></svg>`, 512);

const ICONS = {
  // Калькуляторы: корпус + экран + сетка кнопок
  tools: ic(`<rect x="18" y="9" width="28" height="46" rx="5"/><rect x="23" y="15" width="18" height="9" rx="2"/>
    <circle cx="26" cy="33" r="1.6"/><circle cx="32" cy="33" r="1.6"/><circle cx="38" cy="33" r="1.6"/>
    <circle cx="26" cy="40" r="1.6"/><circle cx="32" cy="40" r="1.6"/><circle cx="38" cy="40" r="1.6"/>
    <circle cx="26" cy="47" r="1.6"/><circle cx="32" cy="47" r="1.6"/><circle cx="38" cy="47" r="1.6"/>`),
  // Питание: лист с прожилкой
  nutrition: ic(`<path d="M32 14C21 20 19 37 32 50C45 37 43 20 32 14Z"/><path d="M32 19V46"/><path d="M32 30L25 25"/><path d="M32 36L39 31"/>`),
  // Сон: месяц
  sleep: ic(`<path d="M44 14a19 19 0 1 0 9 35A15 15 0 0 1 44 14Z"/>`),
  // Фитнес: гантель
  fitness: ic(`<path d="M22 32h20"/><rect x="13" y="24" width="7" height="16" rx="2.5"/><rect x="44" y="24" width="7" height="16" rx="2.5"/><path d="M11 28v8M53 28v8"/>`),
  // Добавки: капсула
  supplements: ic(`<rect x="16" y="22" width="40" height="20" rx="10" transform="rotate(32 36 32)"/><path d="M27 42L41 23"/>`),
  // Мифы: лампочка-идея
  myths: ic(`<path d="M32 12a14 14 0 0 1 8 25c-1.5 1.2-2 2-2 4H26c0-2-.5-2.8-2-4a14 14 0 0 1 8-25Z"/><path d="M27 47h10M29 52h6"/>`),
};

// ── satori-хелперы ──
const col = (style, children) => ({ type: "div", props: { style: { display: "flex", flexDirection: "column", ...style }, children } });
const txt = (style, s) => ({ type: "div", props: { style: { display: "flex", ...style }, children: s } });
const img = (src, w, h) => ({ type: "img", props: { src, width: w, height: h, style: { width: w, height: h } } });

async function render(node, w, h, outName) {
  const svg = await satori(node, { width: w, height: h, fonts });
  const png = new Resvg(svg, { fitTo: { mode: "width", value: w }, font: { loadSystemFonts: false } }).render().asPng();
  writeFileSync(p("profile", outName), png);
  console.log(`  ${outName.padEnd(26)} ${w}×${h}`);
}

// ── аватар 1080×1080: знак по центру (circle-safe), чип локали под ним ──
function avatarNode(lang) {
  return col({ width: 1080, height: 1080, background: GREEN_BG, alignItems: "center", justifyContent: "center" }, [
    img(WHITE_MARK, 620, 620),
    txt({
      marginTop: 18, fontFamily: "Plex", fontWeight: 700, fontSize: 52, letterSpacing: "0.18em",
      color: "#ffffff", border: "4px solid rgba(255,255,255,0.92)", borderRadius: 999, padding: "12px 42px",
    }, lang.toUpperCase()),
  ]);
}

// ── обложка «Актуального» 1080×1920: иконка в белом круге по центру ──
function coverNode(iconSrc) {
  return col({ width: 1080, height: 1920, background: TINT_BG, alignItems: "center", justifyContent: "center" }, [
    col({
      width: 680, height: 680, borderRadius: 999, background: "#ffffff",
      alignItems: "center", justifyContent: "center", border: `6px solid ${ACCENT}`,
    }, [img(iconSrc, 400, 400)]),
  ]);
}

mkdirSync(p("profile"), { recursive: true });
console.log("Генерация ассетов профиля Instagram → social/profile/");
for (const lang of ["ru", "en"]) await render(avatarNode(lang), 1080, 1080, `avatar-${lang}.png`);
for (const [slug, src] of Object.entries(ICONS)) await render(coverNode(src), 1080, 1920, `highlight-${slug}.png`);
console.log("Готово.");
