import { defineQuery, stegaClean } from "next-sanity";
import type { IconName } from "~/components/icon";
import { SectionHeading } from "~/components/section-heading";
import { ServiceCard } from "~/components/service-card";
import { sanityFetch } from "~/features/sanity/client";
import { SanityLink, SanityLinkIcon } from "~/features/sanity/link";
import { LinkFragment } from "~/features/sanity/link/fragment";
import { cx } from "~/features/style/utils";
import type { ServicesSectionQResult } from "~/sanity/types";

const ServicesSectionQ =
  defineQuery(`*[_id == $docId][0].pageBuilder.sectionsArray[_type == "servicesSectionField" && _key == $sectionKey][0]{
    "content": sectionContent{
      eyebrow,
      title,
      lead,
      tone,
      items[]{"key": _key, appIcon, title, text, meta},
      "link": link{${LinkFragment}},
    },
    "settings": sectionSettings {
      "hash": coalesce(sectionHash.current, _key),
    }
}`);

export async function ServicesSection({ docId, sectionKey }: { docId: string; sectionKey: string }) {
  const section = await sanityFetch<ServicesSectionQResult>({
    query: ServicesSectionQ,
    params: { docId, sectionKey },
    options: { next: { tags: [`doc:${docId}`] } },
  });

  if (!section?.content) {
    return null;
  }

  const { eyebrow, title, lead, tone, items, link } = section.content;

  return (
    <section
      id={stegaClean(section.settings?.hash)}
      data-page-builder-section="servicesSection"
      className={cx("py-64 lg:py-96", tone === "alt" ? "bg-surface-alt" : "bg-surface-page")}
    >
      <div className="container-page flex flex-col gap-48">
        <SectionHeading eyebrow={eyebrow ?? undefined} title={title ?? ""} lead={lead ?? undefined} />

        {items && items.length > 0 && (
          <div className="reveal-group grid border-border-subtle border-t border-l sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <ServiceCard
                key={item.key}
                icon={item.appIcon as IconName | null}
                title={item.title ?? ""}
                text={item.text}
                meta={item.meta}
              />
            ))}
          </div>
        )}

        {link?.href && (
          <SanityLink
            link={link}
            className="inline-flex items-center gap-6 self-start font-sans text-brand-strong text-button no-underline hover:text-brand-deep hover:no-underline"
          >
            {link.text}
            <SanityLinkIcon link={link} className="text-[16px]" />
          </SanityLink>
        )}
      </div>
    </section>
  );
}
