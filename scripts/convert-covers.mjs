/**
 * Разовая конвертация обложек JPG → WebP.
 *
 * Обложка статьи — это её LCP-изображение, а исходники весят до ~900 КБ.
 * WebP при q80 и ширине ≤1600px даёт ту же картинку в 3–5 раз легче, что прямо
 * улучшает LCP на статических страницах (next/image здесь unoptimized, то есть
 * отдаёт файл как есть — формат решаем мы).
 *
 * Запуск: node scripts/convert-covers.mjs
 * После — переписать ссылки cover: в контенте и удалить исходные .jpg.
 */
import { readdir, readFile, writeFile, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const DIR = path.join(process.cwd(), "public", "covers");
const MAX_WIDTH = 1600;
const QUALITY = 80;

const files = (await readdir(DIR)).filter((f) => f.endsWith(".jpg"));
let before = 0;
let after = 0;

for (const file of files) {
  const src = path.join(DIR, file);
  const dst = path.join(DIR, file.replace(/\.jpg$/, ".webp"));
  const input = await readFile(src);
  const img = sharp(input);
  const meta = await img.metadata();
  const resized =
    meta.width && meta.width > MAX_WIDTH ? img.resize(MAX_WIDTH, null, { kernel: "lanczos3" }) : img;
  await resized.webp({ quality: QUALITY }).toFile(dst);
  before += (await stat(src)).size;
  after += (await stat(dst)).size;
}

const mb = (n) => `${(n / 1_048_576).toFixed(1)} МБ`;
console.log(`[covers] ${files.length} шт: ${mb(before)} JPG → ${mb(after)} WebP (−${Math.round((1 - after / before) * 100)}%)`);
