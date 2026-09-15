import type { Metadata } from "next";
import "~/features/style/tailwind.css";
import { draftMode } from "next/headers";
import { SharedWebLayout } from "~/app/shared-web-layout";
import { seo } from "~/features/site/seo/utils";
import { SiteError } from "~/features/site/site-error";

export async function generateMetadata(): Promise<Metadata> {
  return await seo({ title: "Not Found", robots: "noindex, nofollow" });
}

export default async function GlobalNotFound() {
  const { isEnabled: isDraft } = await draftMode();

  return (
    <SharedWebLayout isDraft={isDraft}>
      <SiteError />
    </SharedWebLayout>
  );
}
