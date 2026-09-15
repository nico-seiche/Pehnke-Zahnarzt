import type { Metadata } from "next";
import { seo } from "~/features/site/seo/utils";
import { SiteError } from "~/features/site/site-error";

export async function generateMetadata(): Promise<Metadata> {
  return await seo({ title: "Not Found", robots: "noindex, nofollow" });
}

export default function NotFound() {
  return <SiteError />;
}
