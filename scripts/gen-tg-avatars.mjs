/**
 * Аватарки для Telegram-каналов из того же знака, что и favicon.
 * Telegram обрезает картинку в круг, поэтому фон делается во всю площадь,
 * без скруглённого прямоугольника из icon.svg — иначе по краям круга
 * вылезали бы прозрачные серпы.
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SIZE = 512;
const FONT = "Helvetica Neue, Helvetica, Arial, sans-serif";

/** Знак из src/app/icon.svg: система координат 64×64, центр знака — (32, 35.6) */
const MARK = `
  <path d="M32 51s-4.3-3-8.8-7.8C18.3 38 14.5 33.3 14.5 27.5A10.5 10.5 0 0 1 32 20.2a10.5 10.5 0 0 1 17.5 7.3c0 5.8-3.8 10.5-8.7 15.7C36.3 48 32 51 32 51Z"
        fill="none" stroke="#fff" stroke-width="3.4" stroke-linejoin="round"/>
  <path d="M20 32h6.5l3-5.5L34 38l3-6h8"
        fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>`;

function avatar({ label = null } = {}) {
  const scale = label ? 6.8 : 7.8;
  const cx = 32 * scale;
  const cy = 35.6 * scale;
  const tx = SIZE / 2 - cx;
  const ty = (label ? 222 : SIZE / 2) - cy;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <defs>
    <radialGradient id="bg" cx="38%" cy="30%" r="85%">
      <stop offset="0%" stop-color="#28b57a"/>
      <stop offset="100%" stop-color="#178355"/>
    </radialGradient>
  </defs>
  <rect width="${SIZE}" height="${SIZE}" fill="url(#bg)"/>
  <g transform="translate(${tx.toFixed(1)} ${ty.toFixed(1)}) scale(${scale})">${MARK}</g>
  ${
    label
      ? `<text x="${SIZE / 2}" y="424" text-anchor="middle" font-family="${FONT}" font-size="86" font-weight="700" letter-spacing="4" fill="#fff" fill-opacity="0.92">${label}</text>`
      : ""
  }
</svg>`;
}

const outDir = path.join(process.cwd(), "assets", "telegram");
await mkdir(outDir, { recursive: true });

const jobs = [
  { file: "avatar-plain.png", svg: avatar() },
  { file: "avatar-ru.png", svg: avatar({ label: "RU" }) },
  { file: "avatar-en.png", svg: avatar({ label: "EN" }) },
];

for (const job of jobs) {
  await sharp(Buffer.from(job.svg))
    .png({ compressionLevel: 9 })
    .toFile(path.join(outDir, job.file));
}

console.log(`[tg] аватарки: ${jobs.map((j) => j.file).join(", ")} → assets/telegram/`);
