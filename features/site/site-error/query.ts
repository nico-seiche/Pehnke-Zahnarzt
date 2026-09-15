import { defineQuery } from "next-sanity";
import { RichTextFragment } from "~/features/rich-text/fragment";
import { LinkFragment } from "~/features/sanity/link/fragment";
import { SANITY_SINGLETON_SITE_ID } from "~/sanity/constants";

export const SiteErrorQ = defineQuery(`*[_type == "${SANITY_SINGLETON_SITE_ID}"][0]{
  notFound{
    "text": appRichText[]{${RichTextFragment}},
    "link": appLink{${LinkFragment}},
    "showHeader": coalesce(showHeader, true),
    "showFooter": coalesce(showFooter, true)
  }
}`);
