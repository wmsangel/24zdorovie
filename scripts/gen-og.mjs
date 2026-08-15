/**
 * Генератор статичных OG-картинок для статического экспорта.
 *
 * На Vercel/Node их рисует /api/og на лету, но в режиме output: "export"
 * серверных роутов нет, поэтому набор картинок собирается заранее:
 * по одной на каждую рубрику в каждой локали плюс два дефолта.
 *
 * Запуск: node scripts/gen-og.mjs (вызывается из npm run build)
 *
 * ВАЖНО: BRAND и TAGLINES продублированы из src/config/site.ts —
 * при переименовании бренда поправить и здесь.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const BRAND = "24zdorovie";

const TAGLINES = {
  ru: "Здоровье без мифов",
  en: "Health without the myths",
};

const ACCENTS = {
  leaf: "#1fa268",
  citrus: "#b8790a",
  berry: "#b8447a",
  ocean: "#1f7fa2",
  clay: "#b35a3c",
  lavender: "#6f5bc4",
  amber: "#a97318",
  moss: "#55771f",
};

const CATEGORIES = [
  { slug: "nutrition", accent: "leaf", ru: "Питание", en: "Nutrition" },
  { slug: "recipes", accent: "citrus", ru: "Рецепты", en: "Recipes" },
  { slug: "fitness", accent: "ocean", ru: "Фитнес и движение", en: "Fitness & Movement" },
  { slug: "sleep", accent: "lavender", ru: "Сон и восстановление", en: "Sleep & Recovery" },
  { slug: "mental-health", accent: "berry", ru: "Ментальное здоровье", en: "Mental Health" },
  { slug: "supplements", accent: "amber", ru: "Витамины и БАДы", en: "Supplements" },
  { slug: "weight", accent: "clay", ru: "Вес и метаболизм", en: "Weight & Metabolism" },
  { slug: "longevity", accent: "moss", ru: "Долголетие", en: "Longevity" },
  { slug: "heart", accent: "berry", ru: "Здоровье сердца", en: "Heart Health" },
  { slug: "gut", accent: "moss", ru: "Здоровье кишечника", en: "Gut Health" },
  { slug: "womens-health", accent: "lavender", ru: "Женское здоровье", en: "Women's Health" },
  { slug: "immunity", accent: "amber", ru: "Иммунитет", en: "Immunity" },
];

/**
 * Защита от рассинхрона: список выше продублирован из categories.ts, потому что
 * .mjs-скрипт не умеет импортировать TypeScript. Забытая здесь рубрика молча
 * приводит к 404 на og:image у всех её статей, поэтому сверяемся с источником
 * и роняем сборку, а не публикуем битые карточки.
 */
async function assertCategoriesInSync() {
  const src = await readFile(path.join(process.cwd(), "src", "config", "categories.ts"), "utf8");
  const declared = [...src.matchAll(/^\s{4}slug:\s*"([a-z-]+)"/gm)].map((m) => m[1]);
  const known = new Set(CATEGORIES.map((c) => c.slug));
  const missing = declared.filter((slug) => !known.has(slug));

  if (declared.length === 0) {
    throw new Error("[og] не удалось прочитать рубрики из src/config/categories.ts — проверьте формат файла");
  }
  if (missing.length > 0) {
    throw new Error(
      `[og] рубрики есть в categories.ts, но не в scripts/gen-og.mjs: ${missing.join(", ")}. ` +
        "Добавьте их в CATEGORIES, иначе og:image этих статей вернёт 404.",
    );
  }
}

const W = 1200;
const H = 630;
const FONT = "Helvetica Neue, Helvetica, Arial, sans-serif";

const esc = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Заголовок переносим вручную: librsvg не умеет автоперенос,
 * а <tspan> с посчитанными строками даёт предсказуемый результат.
 */
function wrap(text, maxChars) {
  const words = text.split(" ");
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
  return lines.slice(0, 3);
}

function svg({ heading, accent, locale }) {
  const lines = wrap(heading, 22);
  const fontSize = lines.length > 2 ? 60 : 72;
  const lineHeight = fontSize * 1.16;
  // Блок заголовка прижат к низу над подвалом
  const blockTop = 420 - (lines.length - 1) * lineHeight;

  const tspans = lines
    .map((l, i) => `<tspan x="72" y="${blockTop + i * lineHeight}">${esc(l)}</tspan>`)
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#fbfaf6"/>
  <circle cx="1060" cy="100" r="260" fill="${accent}" opacity="0.16"/>

  <rect x="72" y="72" width="56" height="56" rx="16" fill="${accent}"/>
  <circle cx="100" cy="100" r="13" fill="#fbfaf6"/>
  <text x="148" y="110" font-family="${FONT}" font-size="30" font-weight="700" fill="#14201a">${esc(BRAND)}</text>

  <text font-family="${FONT}" font-size="${fontSize}" font-weight="700" fill="#14201a">${tspans}</text>

  <text x="72" y="536" font-family="${FONT}" font-size="24" fill="#4d5c54">${esc(TAGLINES[locale])}</text>
  <rect x="908" y="520" width="220" height="8" rx="4" fill="${accent}"/>
</svg>`;
}

await assertCategoriesInSync();

const outDir = path.join(process.cwd(), "public", "og");
await mkdir(outDir, { recursive: true });

const jobs = [];

for (const locale of ["ru", "en"]) {
  jobs.push({
    file: `default-${locale}.png`,
    heading: locale === "ru" ? "Здоровье без мифов" : "Health without the myths",
    accent: ACCENTS.leaf,
    locale,
  });

  for (const category of CATEGORIES) {
    jobs.push({
      file: `${category.slug}-${locale}.png`,
      heading: category[locale],
      accent: ACCENTS[category.accent],
      locale,
    });
  }
}

for (const job of jobs) {
  const buffer = Buffer.from(svg(job));
  await sharp(buffer).png({ compressionLevel: 9 }).toFile(path.join(outDir, job.file));
}

console.log(`[og] сгенерировано картинок: ${jobs.length} → public/og/`);

// ---------------------------------------------------------------- favicon.ico

/**
 * Контейнер .ico вокруг готовых PNG.
 *
 * Формат простой: заголовок ICONDIR (6 байт), затем по ICONDIRENTRY (16 байт)
 * на каждый размер, затем сами картинки подряд. Внутри entry лежит PNG как
 * есть — так умеют все браузеры начиная с IE11, и файл выходит втрое легче
 * несжатого BMP, который требовала оригинальная спецификация.
 */
function buildIco(images, sizes) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // 1 = иконка (2 было бы курсором)
  header.writeUInt16LE(images.length, 4);

  const entries = [];
  let offset = 6 + images.length * 16;

  for (const [i, image] of images.entries()) {
    const entry = Buffer.alloc(16);
    // 256 пишется нулём: под размер отведён один байт
    entry.writeUInt8(sizes[i] >= 256 ? 0 : sizes[i], 0);
    entry.writeUInt8(sizes[i] >= 256 ? 0 : sizes[i], 1);
    entry.writeUInt8(0, 2); // палитры нет
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // бит на пиксель
    entry.writeUInt32LE(image.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += image.length;
    entries.push(entry);
  }

  return Buffer.concat([header, ...entries, ...images]);
}

/**
 * favicon.ico собирается из того же src/app/icon.svg, что и остальные иконки:
 * держать вторую нарисованную руками копию логотипа — верный способ забыть
 * обновить одну из них. Сам .ico нужен потому, что браузеры и часть краулеров
 * дёргают /favicon.ico по соглашению, не читая <link rel="icon">.
 */
const ICON_SIZES = [16, 32, 48];

const iconSource = await readFile(path.join(process.cwd(), "src", "app", "icon.svg"));
// Рисуем один раз крупно и уменьшаем: так штрихи логотипа сглаживаются, а не осыпаются
const master = await sharp(iconSource, { density: 512 }).resize(256, 256).png().toBuffer();

const iconPngs = await Promise.all(
  ICON_SIZES.map((size) =>
    sharp(master).resize(size, size, { kernel: "lanczos3" }).png({ compressionLevel: 9 }).toBuffer(),
  ),
);

await writeFile(path.join(process.cwd(), "public", "favicon.ico"), buildIco(iconPngs, ICON_SIZES));

console.log(`[og] favicon.ico собран из icon.svg: ${ICON_SIZES.join("/")} px`);
