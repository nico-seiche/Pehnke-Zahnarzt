import { defineQuery, stegaClean } from "next-sanity";
import type { IconName } from "~/components/icon";
import { Icon } from "~/components/icon";
import { SectionHeading } from "~/components/section-heading";
import { sanityFetch } from "~/features/sanity/client";
import { MediaFragment } from "~/features/sanity/media/fragment";
import { SanityImage } from "~/features/sanity/media/image";
import { cx } from "~/features/style/utils";
import type { FacilitySectionQResult } from "~/sanity/types";

const FacilitySectionQ =
  defineQuery(`*[_id == $docId][0].pageBuilder.sectionsArray[_type == "facilitySectionField" && _key == $sectionKey][0]{
    "content": sectionContent{
      eyebrow,
      title,
      lead,
      "image": image{${MediaFragment}},
      imagePosition,
      features[]{"key": _key, appIcon, text},
    },
    "settings": sectionSettings {
      "hash": coalesce(sectionHash.current, _key),
    }
}`);

export async function FacilitySection({ docId, sectionKey }: { docId: string; sectionKey: string }) {
  const section = await sanityFetch<FacilitySectionQResult>({
    query: FacilitySectionQ,
    params: { docId, sectionKey },
    options: { next: { tags: [`doc:${docId}`] } },
  });

  if (!section?.content) {
    return null;
  }

  const { eyebrow, title, lead, image, imagePosition, features } = section.content;
  const imageRight = imagePosition === "right";

  return (
    <section
      id={stegaClean(section.settings?.hash)}
      data-page-builder-section="facilitySection"
      className="bg-surface-page py-64 lg:py-96"
    >
      <div className="container-page grid items-center gap-48 lg:grid-cols-2">
        <div className={cx("reveal", imageRight && "lg:order-2")}>
          <SanityImage
            image={image?.image}
            aspectRatio="4/5"
            sizes="(min-width: 64rem) 50vw, 100vw"
            className="block w-full rounded-media object-cover"
          />
        </div>
        <div className="flex flex-col gap-24">
          <SectionHeading eyebrow={eyebrow ?? undefined} title={title ?? ""} lead={lead ?? undefined} />
          {features && features.length > 0 && (
            <div className="reveal-group flex flex-col gap-16">
              {features.map((feature) => (
                <div key={feature.key} className="flex items-center gap-12 font-sans text-small text-text-body">
                  <span className="flex size-36 shrink-0 items-center justify-center rounded-full bg-paper-300 text-brand-strong">
                    {feature.appIcon && <Icon name={feature.appIcon as IconName} className="text-[17px]" />}
                  </span>
                  {feature.text}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
