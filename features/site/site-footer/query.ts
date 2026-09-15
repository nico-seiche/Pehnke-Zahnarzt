import { defineQuery } from "next-sanity";
import { LinkFragment } from "~/features/sanity/link/fragment";
import { SANITY_SINGLETON_SITE_ID } from "~/sanity/constants";

export const SiteFooterQ = defineQuery(`*[_type == "${SANITY_SINGLETON_SITE_ID}"][0]{
  name,
  phone,
  email,
  addressLines,
  footer{
    links[]{"key": _key, ${LinkFragment}},
    legalLinks[]{"key": _key, ${LinkFragment}}
  }
}`);
