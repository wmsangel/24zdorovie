import type { Metadata } from "next";
import { StaticPageView, staticPageMetadata, staticPageParams } from "@/components/StaticPageView";

const SLUG = "contacts";

export const dynamicParams = false;
export const generateStaticParams = staticPageParams;

export function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  return staticPageMetadata(params, SLUG);
}

export default function Page({ params }: { params: Promise<{ locale: string }> }) {
  return <StaticPageView params={params} slug={SLUG} />;
}
