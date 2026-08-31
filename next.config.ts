import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,

  /**
   * Статический экспорт: на выходе папка out/ с готовым HTML,
   * которая целиком кладётся в public_html на shared-хостинге.
   *
   * Из-за отсутствия сервера здесь НЕ работают headers(), redirects()
   * и proxy.ts — всё это перенесено в public/.htaccess (Apache).
   * При переезде на Vercel вернуть output: "standalone" и правила сюда.
   */
  output: "export",

  /** Каждая страница становится папкой с index.html — так Apache отдаёт её без правил перезаписи */
  trailingSlash: true,

  images: {
    /** Оптимизатор Next требует сервер; на статике картинки отдаются как есть */
    unoptimized: true,
    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 480, 640, 828, 1080, 1200, 1600, 1920],
    imageSizes: [96, 128, 176, 256, 384],
    remotePatterns: [],
  },

  /**
   * Стабильность сборки. Дефолт (до 11 воркеров × 8 страниц одновременно) на
   * ~1200 статических страницах упирался в память: воркер падал и рушил весь
   * build (флак деплоя). Снижаем параллелизм и добавляем ретрай на разовые
   * сбои — сборка чуть дольше, но не падает.
   */
  experimental: {
    cpus: 4, // максимум воркеров (дефолт ≈ ядра − 1)
    staticGenerationMaxConcurrency: 4, // страниц параллельно на воркер (дефолт 8)
    staticGenerationRetryCount: 2, // повтор при разовом сбое рендера страницы
  },
};

export default nextConfig;
