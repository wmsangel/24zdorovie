// Проверка: алгоритм подписи в src/lib/gotoken.ts и functions/_middleware.js совпадает.
// Запуск: node scripts/test-gotoken.mjs
import { readFileSync } from "node:fs";
const ts = readFileSync(new URL("../src/lib/gotoken.ts", import.meta.url), "utf8");
const mw = readFileSync(new URL("../functions/_middleware.js", import.meta.url), "utf8");
const grab = (src, re) => (src.match(re) || [])[1];
const saltTs = grab(ts, /const SALT = "([^"]+)"/);
const saltMw = grab(mw, /const GO_SALT = "([^"]+)"/);
if (!saltTs || saltTs !== saltMw) { console.error("SALT differs", saltTs, saltMw); process.exit(1); }
const sig = (salt) => (id, slug, q, t) => {
  const f = (str, seed) => { let h = seed >>> 0; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h >>> 0; };
  const s = `${salt}|${id}|${slug}|${q}|${t}`; const r = s.split("").reverse().join("");
  return f(s, 0x811c9dc5).toString(36) + f(r, 0x9747b28c).toString(36);
};
// Тело функций сверяем текстом: одинаковые константы и одинаковый порядок полей.
for (const needle of ["0x811c9dc5", "0x9747b28c", "0x01000193", "${id}|${slug}|${q}|${t}"]) {
  if (!ts.includes(needle) || !mw.includes(needle)) { console.error("missing in one of files:", needle); process.exit(1); }
}
console.log("OK salt+constants match; sample sig:", sig(saltTs)("amazon-search", "en_x", "kettlebell", "abc"));
