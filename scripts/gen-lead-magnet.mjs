/**
 * Генератор PDF-лид-магнита «Чек-лист: что реально снижает биологический возраст».
 *
 * Делаем как OG-картинки: каждую A4-страницу рисуем брендовым SVG, рендерим в PNG
 * через sharp (кириллица — из системного шрифта, как в gen-og.mjs), а страницы
 * собираем в один PDF через pdf-lib. Готовые файлы кладём в public/downloads/.
 *
 * Содержание и цифры («до N лет») взяты 1-в-1 из src/lib/biological-age.ts, чтобы
 * PDF совпадал с калькулятором и был проверяем по тем же публикациям.
 *
 * Запуск: node scripts/gen-lead-magnet.mjs   (вызывается из npm run build)
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { PDFDocument } from "pdf-lib";

const BRAND = "24zdorovie";
const SITE = "24zdorovie.com";
const FONT = "Helvetica Neue, Helvetica, Arial, sans-serif";

// A4 портрет при 150 DPI
const W = 1240;
const H = 1754;
const PAGE_PT = { w: 595.28, h: 841.89 }; // A4 в пунктах для pdf-lib

const PAPER = "#fbfaf6";
const INK = "#14201a";
const MUTED = "#4d5c54";
const FAINT = "#8a9790";
const BRANDC = "#1fa268";
const STRONG = "#17784d";
const MOSS = "#55771f"; // акцент рубрики «Долголетие»
const CHIP_BG = "#eaf1e0";
const CHIP_INK = "#3f5a12";

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Грубый перенос по числу символов (как в gen-og) */
function wrap(text, maxChars, maxLines = 4) {
  const words = String(text).split(" ");
  const lines = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, maxLines);
}

function tspans(lines, x, y, lh) {
  return lines
    .map((l, i) => `<tspan x="${x}" y="${y + i * lh}">${esc(l)}</tspan>`)
    .join("");
}

function brandMark(x, y) {
  // Скруглённый квадрат + точка + слово (как на OG)
  return `
  <rect x="${x}" y="${y}" width="56" height="56" rx="16" fill="${BRANDC}"/>
  <circle cx="${x + 28}" cy="${y + 28}" r="13" fill="${PAPER}"/>
  <text x="${x + 76}" y="${y + 38}" font-family="${FONT}" font-size="30" font-weight="700" fill="${INK}">${BRAND}</text>`;
}

const T = {
  ru: {
    eyebrow: "ДОКАЗАТЕЛЬНЫЙ ЧЕК-ЛИСТ · ДОЛГОЛЕТИЕ",
    title: "Что реально снижает биологический возраст",
    sub: "8 привычек с доказанным влиянием на срок и качество жизни — и на сколько лет каждая из них сдвигает стрелку.",
    coverFoot: "8 привычек · с источниками · бесплатно",
    listTitle: "8 привычек, снижающих биовозраст",
    listNote: "Цифры «до N лет» — потенциальный разрыв между худшим и лучшим вариантом по данным крупных исследований. Это те же веса, что в нашем калькуляторе биовозраста.",
    habits: [
      { t: "Не курите — а если курите, бросьте", a: "Отказ возвращает почти всё, особенно до 40 лет.", y: "до 7 лет", s: "Jha, NEJM 2013" },
      { t: "Двигайтесь: 150 минут в неделю", a: "≈22,5 МЕТ-часа — быстрая ходьба, вело, плавание.", y: "до 4,5 года", s: "Moore, PLoS Med 2012" },
      { t: "Держите вес в здоровом диапазоне", a: "ИМТ 18,5–25; талия < 94 см (муж.) / 80 см (жен.).", y: "до 8 лет", s: "PSC, Lancet 2009" },
      { t: "Сведите алкоголь к минимуму", a: "Чем меньше, тем лучше; ориентир < 100 г спирта в неделю.", y: "до 4,5 года", s: "Wood, Lancet 2018" },
      { t: "Ешьте цельную еду, меньше ультраобработки", a: "Овощи, бобовые, цельные злаки, орехи, рыба.", y: "до 3 лет", s: "Fadnes, 2022" },
      { t: "Спите 7–8 часов", a: "И слишком короткий, и слишком длинный сон укорачивают жизнь.", y: "до 1,5 года", s: "Cappuccio, Sleep 2010" },
      { t: "Держите давление ≤ 120/80", a: "Проверяйте регулярно; каждые +20 мм удваивают риск.", y: "до 4 лет", s: "PSC, Lancet 2002" },
      { t: "Поддерживайте крепкие социальные связи", a: "Живое общение — не роскошь, а фактор выживания.", y: "до 3,5 года", s: "Holt-Lunstad, 2010" },
    ],
    startTitle: "С чего начать на этой неделе",
    steps: [
      { t: "Выберите одну привычку", a: "Ту, где у вас самый большой запас. Начать со всего сразу — верный способ бросить." },
      { t: "Впишите 3 прогулки по 30 минут", a: "Конкретные дни недели. Движение — самый быстрый рычаг после отказа от курения." },
      { t: "Ложитесь спать на 30 минут раньше", a: "Три дня подряд. Сон чинит аппетит, давление и настроение разом." },
    ],
    ctaTitle: "Узнайте свой биологический возраст за 2 минуты",
    ctaUrl: `${SITE}/ru/tools/biological-age-calculator/`,
    srcTitle: "Источники",
    sources: [
      "Jha P. et al. 21st-century hazards of smoking. NEJM 2013.",
      "Moore S.C. et al. Leisure-time physical activity and mortality. PLoS Med 2012.",
      "Prospective Studies Collaboration. Body-mass index and mortality. Lancet 2009.",
      "Wood A.M. et al. Alcohol consumption and mortality. Lancet 2018.",
      "Fadnes L.T. et al. Food choices and life expectancy. 2022.",
      "Cappuccio F.P. et al. Sleep duration and mortality. Sleep 2010.",
      "Prospective Studies Collaboration. Blood pressure and mortality. Lancet 2002.",
      "Holt-Lunstad J. et al. Social relationships and mortality. PLoS Med 2010.",
    ],
    disclaimer: "Образовательный материал, не заменяет консультацию врача. Решения о здоровье принимайте вместе со специалистом.",
    foot: `© ${BRAND} · ${SITE} · Здоровье без мифов`,
  },
  en: {
    eyebrow: "EVIDENCE-BASED CHECKLIST · LONGEVITY",
    title: "What actually lowers your biological age",
    sub: "8 habits with proven effects on lifespan and healthspan — and how many years each one moves the needle.",
    coverFoot: "8 habits · with sources · free",
    listTitle: "8 habits that lower biological age",
    listNote: "The “up to N years” figures are the potential gap between the worst and best option in large cohort studies. They are the same weights used in our biological age calculator.",
    habits: [
      { t: "Don’t smoke — and if you do, quit", a: "Quitting gives back almost everything, especially before 40.", y: "up to 7 yrs", s: "Jha, NEJM 2013" },
      { t: "Move: 150 minutes a week", a: "≈22.5 MET-hours — brisk walking, cycling, swimming.", y: "up to 4.5 yrs", s: "Moore, PLoS Med 2012" },
      { t: "Keep weight in a healthy range", a: "BMI 18.5–25; waist < 94 cm (men) / 80 cm (women).", y: "up to 8 yrs", s: "PSC, Lancet 2009" },
      { t: "Keep alcohol to a minimum", a: "Less is better; aim for < 100 g pure alcohol per week.", y: "up to 4.5 yrs", s: "Wood, Lancet 2018" },
      { t: "Eat whole food, less ultra-processed", a: "Vegetables, legumes, whole grains, nuts, fish.", y: "up to 3 yrs", s: "Fadnes, 2022" },
      { t: "Sleep 7–8 hours", a: "Both too little and too much sleep shorten life.", y: "up to 1.5 yrs", s: "Cappuccio, Sleep 2010" },
      { t: "Keep blood pressure ≤ 120/80", a: "Check regularly; every +20 mmHg doubles the risk.", y: "up to 4 yrs", s: "PSC, Lancet 2002" },
      { t: "Keep strong social connections", a: "Real-life connection is a survival factor, not a luxury.", y: "up to 3.5 yrs", s: "Holt-Lunstad, 2010" },
    ],
    startTitle: "Where to start this week",
    steps: [
      { t: "Pick one habit", a: "The one with the biggest gap for you. Changing everything at once is the surest way to quit." },
      { t: "Schedule 3 walks of 30 minutes", a: "On specific days. Movement is the fastest lever after quitting smoking." },
      { t: "Go to bed 30 minutes earlier", a: "Three nights in a row. Sleep repairs appetite, blood pressure and mood at once." },
    ],
    ctaTitle: "Find out your biological age in 2 minutes",
    ctaUrl: `${SITE}/en/tools/biological-age-calculator/`,
    srcTitle: "Sources",
    sources: [
      "Jha P. et al. 21st-century hazards of smoking. NEJM 2013.",
      "Moore S.C. et al. Leisure-time physical activity and mortality. PLoS Med 2012.",
      "Prospective Studies Collaboration. Body-mass index and mortality. Lancet 2009.",
      "Wood A.M. et al. Alcohol consumption and mortality. Lancet 2018.",
      "Fadnes L.T. et al. Food choices and life expectancy. 2022.",
      "Cappuccio F.P. et al. Sleep duration and mortality. Sleep 2010.",
      "Prospective Studies Collaboration. Blood pressure and mortality. Lancet 2002.",
      "Holt-Lunstad J. et al. Social relationships and mortality. PLoS Med 2010.",
    ],
    disclaimer: "Educational material, not a substitute for medical advice. Make health decisions together with a professional.",
    foot: `© ${BRAND} · ${SITE} · Health without the myths`,
  },
};

const M = 96; // поля

function pageFrame(inner) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${PAPER}"/>
  ${inner}
</svg>`;
}

function coverSvg(t) {
  const titleLines = wrap(t.title, 24, 3);
  const titleFs = 84;
  const titleLh = titleFs * 1.1;
  const titleTop = 560;
  const subLines = wrap(t.sub, 52, 4);
  return pageFrame(`
  <circle cx="${W - 60}" cy="120" r="300" fill="${MOSS}" opacity="0.14"/>
  <circle cx="90" cy="${H - 40}" r="200" fill="${BRANDC}" opacity="0.08"/>
  ${brandMark(M, M)}
  <text x="${M}" y="420" font-family="${FONT}" font-size="26" font-weight="700" letter-spacing="2" fill="${MOSS}">${esc(t.eyebrow)}</text>
  <text font-family="${FONT}" font-size="${titleFs}" font-weight="800" fill="${INK}">${tspans(titleLines, M, titleTop, titleLh)}</text>
  <text font-family="${FONT}" font-size="34" fill="${MUTED}">${tspans(subLines, M, titleTop + titleLines.length * titleLh + 48, 48)}</text>
  <rect x="${M}" y="${H - 190}" width="240" height="8" rx="4" fill="${MOSS}"/>
  <text x="${M}" y="${H - 120}" font-family="${FONT}" font-size="28" font-weight="700" fill="${STRONG}">${esc(SITE)}</text>
  <text x="${W - M}" y="${H - 120}" text-anchor="end" font-family="${FONT}" font-size="26" fill="${FAINT}">${esc(t.coverFoot)}</text>`);
}

function listSvg(t) {
  const top = 212;
  let y = top;
  let parts = `${brandMark(M, 70)}
  <text x="${M}" y="${top}" font-family="${FONT}" font-size="48" font-weight="800" fill="${INK}">${esc(t.listTitle)}</text>`;
  const noteLines = wrap(t.listNote, 86, 3);
  parts += `<text font-family="${FONT}" font-size="23" fill="${MUTED}">${tspans(noteLines, M, top + 56, 32)}</text>`;
  y = top + 56 + noteLines.length * 32 + 44;

  const rowH = (H - y - 90) / t.habits.length;
  const chipW = 150;
  const textRight = W - M - chipW - 36;
  const textW = textRight - (M + 66);
  t.habits.forEach((hh, i) => {
    const ry = y + i * rowH;
    const cbY = ry + 2;
    // чекбокс
    parts += `<rect x="${M}" y="${cbY}" width="42" height="42" rx="11" fill="none" stroke="${BRANDC}" stroke-width="3"/>`;
    // заголовок
    const tLines = wrap(hh.t, Math.floor(textW / 15.5), 2);
    parts += `<text font-family="${FONT}" font-size="31" font-weight="700" fill="${INK}">${tspans(tLines, M + 66, ry + 34, 38)}</text>`;
    const aY = ry + 34 + tLines.length * 38 + 2;
    const aLines = wrap(hh.a, Math.floor(textW / 11), 2);
    parts += `<text font-family="${FONT}" font-size="23" fill="${MUTED}">${tspans(aLines, M + 66, aY, 30)}</text>`;
    parts += `<text x="${M + 66}" y="${aY + aLines.length * 30 + 4}" font-family="${FONT}" font-size="19" fill="${FAINT}">${esc(hh.s)}</text>`;
    // чип справа «до N лет»
    const chipX = W - M - chipW;
    const chipY = ry + 6;
    parts += `<rect x="${chipX}" y="${chipY}" width="${chipW}" height="48" rx="24" fill="${CHIP_BG}"/>
    <text x="${chipX + chipW / 2}" y="${chipY + 32}" text-anchor="middle" font-family="${FONT}" font-size="24" font-weight="700" fill="${CHIP_INK}">${esc(hh.y)}</text>`;
    // разделитель
    if (i < t.habits.length - 1) {
      parts += `<line x1="${M}" y1="${ry + rowH - 10}" x2="${W - M}" y2="${ry + rowH - 10}" stroke="#e7e2d6" stroke-width="1.5"/>`;
    }
  });
  parts += `<text x="${M}" y="${H - 44}" font-family="${FONT}" font-size="20" fill="${FAINT}">${esc(t.foot)}</text>`;
  return pageFrame(parts);
}

function startSvg(t) {
  const top = 212;
  let parts = `${brandMark(M, 70)}
  <text x="${M}" y="${top}" font-family="${FONT}" font-size="48" font-weight="800" fill="${INK}">${esc(t.startTitle)}</text>`;
  let y = top + 70;
  const stepH = 150;
  t.steps.forEach((s, i) => {
    const sy = y + i * stepH;
    parts += `<circle cx="${M + 26}" cy="${sy + 20}" r="30" fill="${MOSS}"/>
    <text x="${M + 26}" y="${sy + 31}" text-anchor="middle" font-family="${FONT}" font-size="32" font-weight="800" fill="${PAPER}">${i + 1}</text>`;
    parts += `<text x="${M + 84}" y="${sy + 18}" font-family="${FONT}" font-size="32" font-weight="700" fill="${INK}">${esc(s.t)}</text>`;
    const aLines = wrap(s.a, 72, 2);
    parts += `<text font-family="${FONT}" font-size="24" fill="${MUTED}">${tspans(aLines, M + 84, sy + 54, 32)}</text>`;
  });
  y = y + t.steps.length * stepH + 20;

  // CTA-блок (высота подстраивается под число строк заголовка)
  const ctaLines = wrap(t.ctaTitle, 40, 2);
  const ctaH = 52 + ctaLines.length * 42 + 56;
  parts += `<rect x="${M}" y="${y}" width="${W - 2 * M}" height="${ctaH}" rx="24" fill="${STRONG}"/>`;
  parts += `<text font-family="${FONT}" font-size="32" font-weight="800" fill="#ffffff">${tspans(ctaLines, M + 44, y + 58, 42)}</text>`;
  parts += `<text x="${M + 44}" y="${y + 58 + (ctaLines.length - 1) * 42 + 44}" font-family="${FONT}" font-size="25" font-weight="700" fill="#bfe8d4">${esc(t.ctaUrl)}</text>`;
  y += ctaH + 54;

  // Источники
  parts += `<text x="${M}" y="${y}" font-family="${FONT}" font-size="26" font-weight="700" fill="${INK}">${esc(t.srcTitle)}</text>`;
  y += 34;
  t.sources.forEach((src) => {
    const lines = wrap(src, 96, 2);
    parts += `<text font-family="${FONT}" font-size="19" fill="${MUTED}">${tspans(lines, M, y, 26)}</text>`;
    y += lines.length * 26 + 8;
  });

  // Дисклеймер + подвал
  const disLines = wrap(t.disclaimer, 96, 3);
  parts += `<text font-family="${FONT}" font-size="19" fill="${FAINT}">${tspans(disLines, M, H - 150, 26)}</text>`;
  parts += `<line x1="${M}" y1="${H - 78}" x2="${W - M}" y2="${H - 78}" stroke="#e7e2d6" stroke-width="1.5"/>`;
  parts += `<text x="${M}" y="${H - 44}" font-family="${FONT}" font-size="20" fill="${FAINT}">${esc(t.foot)}</text>`;
  return pageFrame(parts);
}

async function buildPdf(locale) {
  const t = T[locale];
  const svgs = [coverSvg(t), listSvg(t), startSvg(t)];
  const pdf = await PDFDocument.create();
  let pageNo = 0;
  for (const s of svgs) {
    const png = await sharp(Buffer.from(s)).png().toBuffer();
    if (process.env.PREVIEW) {
      await writeFile(path.join(process.env.PREVIEW, `${locale}-p${++pageNo}.png`), png);
    }
    const img = await pdf.embedPng(png);
    const page = pdf.addPage([PAGE_PT.w, PAGE_PT.h]);
    page.drawImage(img, { x: 0, y: 0, width: PAGE_PT.w, height: PAGE_PT.h });
  }
  pdf.setTitle(t.title);
  pdf.setAuthor(BRAND);
  pdf.setSubject(locale === "ru" ? "Чек-лист биологического возраста" : "Biological age checklist");
  pdf.setProducer(`${BRAND} gen-lead-magnet`);
  return await pdf.save();
}

async function main() {
  const outDir = path.join(process.cwd(), "public", "downloads");
  await mkdir(outDir, { recursive: true });
  for (const locale of ["ru", "en"]) {
    const bytes = await buildPdf(locale);
    const file = path.join(outDir, `biological-age-checklist-${locale}.pdf`);
    await writeFile(file, bytes);
    console.log(`  lead-magnet: ${path.relative(process.cwd(), file)} (${(bytes.length / 1024).toFixed(0)} KB)`);
  }
}

main().catch((e) => {
  console.error("gen-lead-magnet failed:", e);
  process.exit(1);
});
