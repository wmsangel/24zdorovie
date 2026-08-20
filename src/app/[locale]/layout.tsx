import type { Metadata, Viewport } from "next";
import { Manrope, Playfair_Display } from "next/font/google";
import { notFound } from "next/navigation";
import { Analytics } from "@/components/Analytics";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { JsonLd } from "@/components/JsonLd";
import { themeScript } from "@/components/ThemeToggle";
import { ADS } from "@/config/ads";
import { LOCALES, SITE, SITE_META, type Locale } from "@/config/site";
import { isLocale } from "@/lib/i18n";
import { absolute, organizationLd, websiteLd } from "@/lib/seo";
import "../globals.css";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-manrope",
  display: "swap",
});

/**
 * Акцидентный шрифт заголовков. Кириллица обязательна: основная локаль —
 * русская, и без неё заголовки молча уезжают на системный serif.
 */
const playfair = Playfair_Display({
  subsets: ["latin", "cyrillic"],
  variable: "--font-playfair",
  display: "swap",
});

export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfaf6" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1512" },
  ],
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const l: Locale = isLocale(locale) ? locale : "ru";
  const meta = SITE_META[l];

  return {
    metadataBase: new URL(SITE.url),
    title: {
      default: `${meta.title} — ${meta.tagline}`,
      template: `%s — ${meta.title}`,
    },
    description: meta.description,
    applicationName: meta.title,
    authors: [{ name: meta.title, url: SITE.url }],
    creator: meta.title,
    publisher: meta.title,
    formatDetection: { telephone: false },
    // Явный список: SVG (чёткая иконка для современных браузеров, из src/app/icon.svg)
    // плюс растровая favicon.ico — её ждёт фавикон-робот Яндекса, по одному SVG он
    // сообщал «файл favicon не найден». Задавать оба нужно здесь: как только
    // появляется icons в метадате, авто-ссылка на icon.svg из файла пропадает.
    icons: {
      icon: [
        { url: "/icon.svg", type: "image/svg+xml" },
        { url: "/favicon.ico", sizes: "16x16 32x32 48x48", type: "image/x-icon" },
      ],
    },
    alternates: {
      canonical: absolute(`/${l}`),
      languages: {
        ru: absolute("/ru"),
        en: absolute("/en"),
        "x-default": absolute("/ru"),
      },
      types: {
        "application/rss+xml": [
          { url: absolute(`/rss/${l}.xml`), title: `${meta.title} RSS` },
        ],
      },
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
    },
    // Google подтверждён файлом в /public, Яндексу нужен мета-тег
    verification: {
      yandex: "fe376f3b8b568699",
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <html lang={locale} suppressHydrationWarning className={`${manrope.variable} ${playfair.variable}`}>
      <head>
        {/*
          Загрузчик AdSense обязан стоять именно в <head> на каждой странице:
          так его требует инструкция Google, по нему же сайт проверяют при
          подключении и по нему работают автоматические объявления.
          Через next/script в <body> он бы уехал за пределы head.
        */}
        {ADS.adsense.enabled && ADS.adsense.client && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADS.adsense.client}`}
            crossOrigin="anonymous"
          />
        )}
        {/* Awin MasterTag — трекинг переходов и конверсий партнёрской сети */}
        {ADS.awin.enabled && ADS.awin.masterTagId && (
          <script defer src={`https://www.dwin1.com/${ADS.awin.masterTagId}.js`} type="text/javascript" />
        )}
      </head>
      <body className="min-h-screen antialiased">
        {/*
          Скрипт темы стоит первым в <body>, а не в <head>, намеренно.
          Загрузчик AdSense асинхронно дописывает в <head> собственные теги
          ещё до гидратации, порядок детей head смещается, и React начинает
          сопоставлять наш инлайн-скрипт с чужим узлом — это давало ошибку
          гидратации на каждой странице. Здесь позиционных соседей у него нет,
          а в <head> не осталось ни одного позиционного узла: <script async src>
          React сверяет по src, а не по месту в дереве.

          На вспышку темы перенос не влияет: скрипт синхронный и выполняется
          до того, как в DOM появится хоть что-то отрисовываемое.
        */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-[var(--brand)] focus:px-4 focus:py-2 focus:text-white"
        >
          {locale === "ru" ? "К содержимому" : "Skip to content"}
        </a>
        <Header locale={locale} />
        <main id="main">{children}</main>
        <Footer locale={locale} />
        <JsonLd data={[organizationLd(locale), websiteLd(locale)]} />
        <Analytics />
      </body>
    </html>
  );
}
