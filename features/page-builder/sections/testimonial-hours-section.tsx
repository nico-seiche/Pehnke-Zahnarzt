import { defineQuery, stegaClean } from "next-sanity";
import { Card } from "~/components/card";
import { sanityFetch } from "~/features/sanity/client";
import { SiteOpeningHoursQ } from "~/features/site/opening-hours-query";
import { OpeningHoursTable } from "~/features/site/opening-hours-table";
import type { SiteOpeningHoursQResult, TestimonialHoursSectionQResult } from "~/sanity/types";

const TestimonialHoursSectionQ =
  defineQuery(`*[_id == $docId][0].pageBuilder.sectionsArray[_type == "testimonialHoursSectionField" && _key == $sectionKey][0]{
    "content": sectionContent{
      testimonial,
      hoursTitle,
    },
    "settings": sectionSettings {
      "hash": coalesce(sectionHash.current, _key),
    }
}`);

export async function TestimonialHoursSection({ docId, sectionKey }: { docId: string; sectionKey: string }) {
  const [section, site] = await Promise.all([
    sanityFetch<TestimonialHoursSectionQResult>({
      query: TestimonialHoursSectionQ,
      params: { docId, sectionKey },
      options: { next: { tags: [`doc:${docId}`] } },
    }),
    sanityFetch<SiteOpeningHoursQResult>({
      query: SiteOpeningHoursQ,
      options: { next: { tags: ["site"] } },
    }),
  ]);

  if (!section?.content) {
    return null;
  }

  const { testimonial, hoursTitle } = section.content;

  return (
    <section
      id={stegaClean(section.settings?.hash)}
      data-page-builder-section="testimonialHoursSection"
      className="bg-surface-page py-64 lg:py-96"
    >
      <div className="container-page grid items-start gap-32 lg:grid-cols-[1.1fr_0.9fr]">
        {testimonial && (
          <blockquote className="reveal m-0 flex flex-col gap-16 rounded-panel bg-sand-100 p-32">
            <p className="text-balance font-display font-light text-blue-900 text-h2 leading-[1.45] tracking-snug">
              „{testimonial.quote}“
            </p>
            <footer className="font-sans text-sand-600 text-small">
              <strong className="font-semibold text-blue-800">{testimonial.author}</strong>
              {testimonial.detail && ` · ${testimonial.detail}`}
            </footer>
          </blockquote>
        )}

        {site?.openingHours && site.openingHours.length > 0 && (
          <div className="reveal [animation-delay:120ms]">
            <Card variant="tint" className="flex flex-col gap-16 p-32">
              <h3 className="font-display text-h3 text-text-heading">{hoursTitle || "Öffnungszeiten"}</h3>
              <OpeningHoursTable rows={site.openingHours} note={site.openingHoursNote} />
            </Card>
          </div>
        )}
      </div>
    </section>
  );
}
