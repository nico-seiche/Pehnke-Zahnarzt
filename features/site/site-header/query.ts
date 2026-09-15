import { defineQuery } from "next-sanity";
import { LinkFragment } from "~/features/sanity/link/fragment";
import { SANITY_SINGLETON_SITE_ID } from "~/sanity/constants";

export const SiteHeaderQ = defineQuery(`*[_type == "${SANITY_SINGLETON_SITE_ID}"][0]{
  name,
  phone,
  header{
    links[]{"key": _key, ${LinkFragment}},
    "cta": cta{${LinkFragment}},
  }
}`);
