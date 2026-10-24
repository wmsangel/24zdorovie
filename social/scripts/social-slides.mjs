/**
 * Рендер постов из `social/posts.js` в слайды-PNG.
 *
 * Движок — satori (раскладывает текст и обводит глифы в path) + resvg (растр),
 * тот же способ, что OG-картинки сайта. Шрифты встраиваются в satori, поэтому
 * кириллица рисуется без системных шрифтов. Бренд — 24zdorovie (IBM Plex Sans,
 * зелёный акцент, лого-сердце с ЭКГ): именно его видят подписчики.
 *
 *   node scripts/social-slides.mjs                все посты, обе локали
 *   node scripts/social-slides.mjs protein        по id
 *   node scripts/social-slides.mjs --lang ru       только одна локаль
 *   node scripts/social-slides.mjs --captions      подписи+хэштеги для вставки
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { POSTS } from "../posts.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const p = (...a) => join(ROOT, ...a);

// ── бренд-токены 24zdorovie ──
const INK = "#1b1e26", MUTED = "#5d6470", FAINT = "#9aa0ad";
const BRAND = "#1fa268", ACCENT = "#2f8f5f", GOOD = "#2f9e7d", BAD = "#c0455a";
const SURF = "#ffffff";
const GREEN_BG = "linear-gradient(160deg, #22a96c 0%, #1fa268 48%, #178a57 100%)";
const TINT_BG = "radial-gradient(120% 90% at 80% 0%, #e7f6ee 0%, #f2faf5 55%, #e9f7ef 100%)";

// ── шрифты (IBM Plex Sans, полное покрытие latin+cyrillic) ──
const FONT = (f) => readFileSync(p("fonts", f));
const fonts = [
  { name: "Plex", data: FONT("IBMPlexSans-Bold.ttf"), weight: 700, style: "normal" },
  { name: "Plex", data: FONT("IBMPlexSans-SemiBold.ttf"), weight: 600, style: "normal" },
];

// ── ассеты: лого-сердце + вектор ✓/✗ → PNG (в SVG текста нет, resvg без шрифтов) ──
function rasterize(svg, width) {
  if (!/xmlns=/.test(svg)) svg = svg.replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ');
  const png = new Resvg(svg, { fitTo: { mode: "width", value: width }, font: { loadSystemFonts: false } }).render().asPng();
  return "data:image/png;base64," + png.toString("base64");
}
const LOGO = rasterize(readFileSync(p("assets/logo.svg"), "utf8"), 240);
const CHECK = rasterize('<svg viewBox="0 0 64 64"><rect width="64" height="64" rx="18" fill="#2f9e7d"/><path d="M17 33 l9 10 l21 -23" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>', 64);
const CROSS = rasterize('<svg viewBox="0 0 64 64"><rect width="64" height="64" rx="18" fill="#c0455a"/><path d="M22 22 L42 42 M42 22 L22 42" stroke="#fff" stroke-width="7" stroke-linecap="round"/></svg>', 64);

// ── хелперы satori ──
const el = (type, style, children) => ({ type, props: { style, children } });
const img = (src, w, h) => ({ type: "img", props: { src, width: w, height: h, style: { width: w, height: h } } });
const col = (style, children) => el("div", { display: "flex", flexDirection: "column", ...style }, children);
const row = (style, children) => el("div", { display: "flex", ...style }, children);
const txt = (style, s) => el("div", { display: "flex", ...style }, s);

/** Заголовок уменьшается ступенями по длине, чтобы не переполнять. */
const headSize = (sizes, s) => (s.length <= 30 ? sizes[0] : s.length <= 52 ? sizes[1] : sizes[2]);

/** Вордмарк 24zdorovie: «24» зелёное + «zdorovie». */
const wordmark = (size, onDark) =>
  row({ fontFamily: "Plex", fontWeight: 700, fontSize: size, letterSpacing: "-0.01em", alignItems: "center" }, [
    txt({ color: onDark ? "#ffffff" : BRAND }, "24"),
    txt({ color: onDark ? "rgba(255,255,255,0.92)" : INK }, "zdorovie"),
  ]);

const FORMATS = {
  square: { w: 1080, h: 1080, pad: 84 },
  story: { w: 1080, h: 1920, pad: 96 },
};

// ── шаблоны слайдов ── (каждый возвращает корневой node satori)
function tplCover(s, f, L) {
  const dark = s.theme === "green";
  return col(
    { width: f.w, height: f.h, padding: f.pad, background: dark ? GREEN_BG : TINT_BG, justifyContent: "space-between" },
    [
      col({}, [
        txt({ fontFamily: "Plex", fontWeight: 700, fontSize: 32, letterSpacing: "0.16em", color: dark ? "#d8f3e4" : ACCENT }, s.kicker[L].toUpperCase()),
        txt({ fontFamily: "Plex", fontWeight: 700, fontSize: headSize([90, 74, 58], s.title[L]), lineHeight: 1.12, marginTop: 34, color: dark ? "#ffffff" : INK, maxWidth: f.w - f.pad * 2 }, s.title[L]),
        s.sub ? txt({ fontFamily: "Plex", fontWeight: 600, fontSize: 40, marginTop: 28, color: dark ? "rgba(255,255,255,0.9)" : MUTED }, s.sub[L]) : null,
      ].filter(Boolean)),
      row({ justifyContent: "space-between", alignItems: "center" }, [
        txt({ fontFamily: "Plex", fontWeight: 700, fontSize: 38, color: dark ? "#ffffff" : INK }, "24zdorovie.com"),
        img(LOGO, 132, 132),
      ]),
    ]
  );
}

function tplText(s, f, L) {
  return col({ width: f.w, height: f.h, padding: f.pad, background: SURF, justifyContent: "space-between" }, [
    wordmark(34, false),
    col({ flex: 1, justifyContent: "center" }, [
      row({ alignItems: "center" }, [
        el("div", { display: "flex", width: 104, height: 104, borderRadius: 28, background: BRAND, alignItems: "center", justifyContent: "center", fontFamily: "Plex", fontWeight: 700, fontSize: 54, color: "#ffffff" }, String(s.n)),
        txt({ fontFamily: "Plex", fontWeight: 700, fontSize: headSize([56, 48, 40], s.title[L]), lineHeight: 1.15, marginLeft: 34, color: INK, flex: 1 }, s.title[L]),
      ]),
      txt({ fontFamily: "Plex", fontWeight: 600, fontSize: 44, lineHeight: 1.45, marginTop: 44, color: MUTED }, s.body[L]),
    ]),
    txt({ fontFamily: "Plex", fontWeight: 700, fontSize: 30, color: ACCENT }, "24zdorovie.com"),
  ]);
}

function tplList(s, f, L) {
  return col({ width: f.w, height: f.h, padding: f.pad, background: SURF, justifyContent: "space-between" }, [
    col({}, [
      wordmark(34, false),
      txt({ fontFamily: "Plex", fontWeight: 700, fontSize: 54, lineHeight: 1.15, marginTop: 24, color: INK }, s.title[L]),
    ]),
    col({ flex: 1, justifyContent: "center", gap: 28 }, s.items.map((it) =>
      row({ alignItems: "center", gap: 28 }, [
        img(it.ok ? CHECK : CROSS, 60, 60),
        txt({ fontFamily: "Plex", fontWeight: 600, fontSize: 40, color: INK, flex: 1, lineHeight: 1.25 }, it.text[L]),
      ])
    )),
    txt({ fontFamily: "Plex", fontWeight: 700, fontSize: 30, color: ACCENT }, "24zdorovie.com"),
  ]);
}

function tplCta(s, f, L) {
  return col({ width: f.w, height: f.h, padding: f.pad, background: GREEN_BG, justifyContent: "space-between" }, [
    img(LOGO, 120, 120),
    col({ flex: 1, justifyContent: "center" }, [
      txt({ fontFamily: "Plex", fontWeight: 700, fontSize: headSize([82, 66, 54], s.title[L]), lineHeight: 1.12, color: "#ffffff" }, s.title[L]),
      txt({ fontFamily: "Plex", fontWeight: 600, fontSize: 42, lineHeight: 1.4, marginTop: 30, color: "rgba(255,255,255,0.92)" }, s.sub[L]),
    ]),
    row({}, [
      el("div", { display: "flex", background: "#ffffff", borderRadius: 999, padding: "26px 56px", fontFamily: "Plex", fontWeight: 700, fontSize: 44, color: BRAND }, s.pill[L]),
    ]),
  ]);
}

function tplMyth(s, f, L) {
  const isFact = /факт|fact/i.test(s.tag[L]);
  return col({ width: f.w, height: f.h, padding: f.pad, background: SURF, justifyContent: "space-between" }, [
    row({}, [
      el("div", { display: "flex", background: isFact ? GOOD : BAD, borderRadius: 999, padding: "16px 40px", fontFamily: "Plex", fontWeight: 700, fontSize: 38, letterSpacing: "0.08em", color: "#ffffff" }, s.tag[L].toUpperCase()),
    ]),
    col({ flex: 1, justifyContent: "center" }, [
      txt({ fontFamily: "Plex", fontWeight: 700, fontSize: headSize([64, 54, 46], s.statement[L]), lineHeight: 1.18, color: INK }, s.statement[L]),
      txt({ fontFamily: "Plex", fontWeight: 600, fontSize: 42, lineHeight: 1.45, marginTop: 40, color: MUTED }, s.answer[L]),
    ]),
    row({ justifyContent: "space-between", alignItems: "center" }, [
      wordmark(38, false),
      txt({ fontFamily: "Plex", fontWeight: 700, fontSize: 30, color: ACCENT }, "24zdorovie.com"),
    ]),
  ]);
}

function tplStory(s, f, L) {
  const dark = s.theme === "green";
  return col({ width: f.w, height: f.h, padding: f.pad, background: dark ? GREEN_BG : TINT_BG, alignItems: "center" }, [
    el("div", { display: "flex", marginTop: 40 }, [wordmark(44, dark)]),
    col({ alignItems: "center", marginTop: 130 }, [
      txt({ fontFamily: "Plex", fontWeight: 700, fontSize: 34, letterSpacing: "0.14em", color: dark ? "#d8f3e4" : ACCENT }, s.kicker[L].toUpperCase()),
      txt({ fontFamily: "Plex", fontWeight: 700, fontSize: headSize([104, 82, 62], s.question[L]), lineHeight: 1.12, marginTop: 44, color: dark ? "#ffffff" : INK, textAlign: "center", maxWidth: f.w - f.pad * 2 }, s.question[L]),
    ]),
    el("div", { display: "flex", flex: 1 }, []),
    img(LOGO, 140, 140),
    txt({ fontFamily: "Plex", fontWeight: 600, fontSize: 30, marginTop: 20, color: dark ? "rgba(255,255,255,0.8)" : FAINT }, L === "ru" ? "↓ стикер добавь в Instagram" : "↓ add the sticker in Instagram"),
  ]);
}

const TPL = { cover: tplCover, text: tplText, list: tplList, cta: tplCta, myth: tplMyth, story: tplStory };

async function renderSlide(slide, fmtName, L) {
  const f = FORMATS[fmtName];
  const node = TPL[slide.type](slide, f, L);
  const svg = await satori(node, { width: f.w, height: f.h, fonts });
  return new Resvg(svg, { fitTo: { mode: "width", value: f.w }, font: { loadSystemFonts: false } }).render().asPng();
}

// формат файла по типу поста: сторис → story, остальное → square
const fmtOf = (post) => (post.format === "story" ? "story" : "square");

// ── CLI ──
const args = process.argv.slice(2);
const langArg = args.includes("--lang") ? args[args.indexOf("--lang") + 1] : null;
const LANGS = langArg ? [langArg] : ["ru", "en"];

if (args.includes("--captions")) {
  for (const post of POSTS) {
    for (const L of LANGS) {
      console.log(`\n── ${post.day} · ${post.id} · ${L.toUpperCase()} · 24zdorovie.com/${L}${post.page}`);
      console.log(post.caption[L] + (post.hashtags[L] ? "\n\n" + post.hashtags[L] : ""));
      if (post.sticker) console.log("СТИКЕР: " + (post.sticker[L] || post.sticker.ru));
    }
  }
  process.exit(0);
}

const only = args.filter((a) => !a.startsWith("--") && a !== langArg);
const chosen = only.length ? POSTS.filter((x) => only.includes(x.id)) : POSTS;
if (!chosen.length) {
  console.error(`Нет поста. id: ${POSTS.map((x) => x.id).join(", ")}`);
  process.exit(1);
}

mkdirSync(p("out"), { recursive: true });
const manifest = [];
let total = 0;
for (const post of chosen) {
  const fmtName = fmtOf(post);
  const entry = { id: post.id, week: post.week, day: post.day, format: post.format, rubric: post.rubric, page: post.page, caption: post.caption, hashtags: post.hashtags, sticker: post.sticker ?? null, slides: {} };
  for (const L of LANGS) {
    const files = [];
    for (let i = 0; i < post.slides.length; i++) {
      const png = await renderSlide(post.slides[i], fmtName, L);
      const name = `${post.id}-${L}-${String(i + 1).padStart(2, "0")}-${fmtName}.png`;
      writeFileSync(p("out", name), png);
      files.push(name);
      total++;
    }
    entry.slides[L] = files;
  }
  manifest.push(entry);
  console.log(`  ${post.day}  ${post.id.padEnd(18)} ${post.format.padEnd(9)} ${post.slides.length}×${LANGS.length}`);
}
writeFileSync(p("out", "manifest.json"), JSON.stringify(manifest, null, 2));
console.log(`\n${total} слайдов → social/out/  ·  manifest.json обновлён`);
