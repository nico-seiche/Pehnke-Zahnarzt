import dynamic from "next/dynamic";
import { defineQuery } from "next-sanity";
import { sanityFetch } from "~/features/sanity/client";
import type { PageSectionsQResult } from "~/sanity/types";

const PageSectionsQ = defineQuery(`*[_id == $docId][0].pageBuilder.sectionsArray[]{
  _key,
  _type
}`);

const _sections = {
  mediaSectionField: dynamic(() => import("~/features/page-builder/sections/media-section").then((mod) => mod.MediaSection)),
  ctaSectionField: dynamic(() => import("~/features/page-builder/sections/cta-section").then((mod) => mod.CtaSection)),
  textSectionField: dynamic(() => import("~/features/page-builder/sections/text-section").then((mod) => mod.TextSection)),
  contactFormSectionField: dynamic(() =>
    import("~/features/page-builder/sections/contact-form-section").then((mod) => mod.ContactFormSection)
  ),
  heroSectionField: dynamic(() => import("~/features/page-builder/sections/hero-section").then((mod) => mod.HeroSection)),
  servicesSectionField: dynamic(() =>
    import("~/features/page-builder/sections/services-section").then((mod) => mod.ServicesSection)
  ),
  servicesListSectionField: dynamic(() =>
    import("~/features/page-builder/sections/services-list-section").then((mod) => mod.ServicesListSection)
  ),
  facilitySectionField: dynamic(() =>
    import("~/features/page-builder/sections/facility-section").then((mod) => mod.FacilitySection)
  ),
  teamSectionField: dynamic(() => import("~/features/page-builder/sections/team-section").then((mod) => mod.TeamSection)),
  testimonialHoursSectionField: dynamic(() =>
    import("~/features/page-builder/sections/testimonial-hours-section").then((mod) => mod.TestimonialHoursSection)
  ),
  ctaBandSectionField: dynamic(() =>
    import("~/features/page-builder/sections/cta-band-section").then((mod) => mod.CtaBandSection)
  ),
  // PLOP: Add Import
} as const;

function isValidSectionType(type: string): type is keyof typeof _sections {
  return type in _sections;
}

export async function PageSections({ docId }: { docId: string }) {
  const sections = await sanityFetch<PageSectionsQResult>({
    query: PageSectionsQ,
    params: {
      docId,
    },
    options: {
      next: {
        tags: [`doc:${docId}`],
      },
    },
  });

  if (!sections) {
    return null;
  }

  return (
    <div className="flex w-full flex-col">
      {sections.map((section) => {
        if (!isValidSectionType(section._type)) {
          return null;
        }

        const Component = _sections[section._type];

        if (!Component) {
          console.error(`Component not found for block type: ${section._type}`);
          return null;
        }

        return <Component key={section._key} sectionKey={section._key} docId={docId} />;
      })}
    </div>
  );
}
