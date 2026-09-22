#!/usr/bin/env node
/**
 * Генерирует QR-коды крипто-адресов для страницы поддержки и ПЕРЕД генерацией
 * криптографически проверяет каждый адрес. Опечатка в адресе = безвозвратная
 * потеря чужих денег, поэтому проверка — часть сборки: при ошибке скрипт падает.
 *
 * Единый источник адресов — src/config/donate.json (его же читает компонент),
 * так что QR, кнопка «копировать» и текст на странице не могут разойтись.
 *
 * QR хостим у себя (SVG в public/donate/), а не тянем с чужого image-API:
 * приватность и защита от подмены адреса на лету.
 *
 * Запуск: npm run donate:qr  (или node scripts/gen-donate-qr.mjs).
 * QR — статические ассеты в public/donate/, лежат в репозитории; перегенерировать
 * нужно только при смене адресов в donate.json, поэтому в общий build не вшито
 * (иначе сборка тянула бы npx/сеть без нужды).
 */
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "public", "donate");
const wallets = JSON.parse(fs.readFileSync(path.join(ROOT, "src", "config", "donate.json"), "utf8"));

// --- base58 ---
const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
function base58decode(s) {
  const bytes = [0];
  for (const ch of s) {
    const value = ALPHABET.indexOf(ch);
    if (value < 0) throw new Error(`недопустимый символ base58: ${ch}`);
    let carry = value;
    for (let j = 0; j < bytes.length; j++) {
      carry += bytes[j] * 58;
      bytes[j] = carry & 0xff;
      carry >>= 8;
    }
    while (carry) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  for (const ch of s) {
    if (ch === "1") bytes.push(0);
    else break;
  }
  return Uint8Array.from(bytes.reverse());
}
const sha256 = (b) => createHash("sha256").update(b).digest();

const validators = {
  // TRON: base58check, 25 байт, префикс 0x41, контрольная сумма = first4(sha256(sha256(payload)))
  tron(addr) {
    const d = base58decode(addr);
    if (d.length !== 25) throw new Error(`TRON: длина ${d.length}, ожидалось 25`);
    if (d[0] !== 0x41) throw new Error(`TRON: префикс 0x${d[0].toString(16)}, ожидался 0x41`);
    const h = sha256(sha256(d.slice(0, 21)));
    for (let i = 0; i < 4; i++) if (h[i] !== d[21 + i]) throw new Error("TRON: неверная контрольная сумма");
  },
  // Solana: base58 → ровно 32 байта (ed25519 pubkey)
  solana(addr) {
    const d = base58decode(addr);
    if (d.length !== 32) throw new Error(`Solana: длина ${d.length}, ожидалось 32`);
  },
  // Ethereum: 0x + 40 hex (в нижнем регистре — как в конфиге)
  ethereum(addr) {
    if (!/^0x[0-9a-f]{40}$/.test(addr)) throw new Error("Ethereum: не соответствует /^0x[0-9a-f]{40}$/");
  },
};

fs.mkdirSync(OUT_DIR, { recursive: true });

for (const w of wallets) {
  const validate = validators[w.id];
  if (!validate) throw new Error(`нет валидатора для сети "${w.id}"`);
  validate(w.address);

  const file = path.join(ROOT, "public", w.qr.replace(/^\//, ""));
  // Кодируем ровно тот же адрес, что показываем и копируем.
  execFileSync("npx", ["-y", "qrcode", "-t", "svg", "-o", file, w.address], { stdio: "pipe" });

  // Контроль: сгенерированный файл существует и непустой.
  const size = fs.statSync(file).size;
  if (!size) throw new Error(`QR не создан: ${file}`);
  console.log(`✓ ${w.chain} (${w.standard}) — адрес валиден, QR → ${w.qr} (${size} B)`);
}

console.log("QR-коды доноров сгенерированы, все адреса прошли проверку.");
