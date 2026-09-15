import { defineQuery } from "next-sanity";
import { SANITY_SINGLETON_SITE_ID } from "~/sanity/constants";

/** Global opening hours + phone, shared by any section that shows "today's hours" (hero card, testimonial/hours section). */
export const SiteOpeningHoursQ = defineQuery(`*[_type == "${SANITY_SINGLETON_SITE_ID}"][0]{
  phone,
  openingHours[]{day, hours},
  openingHoursNote,
}`);
