import { defineQuery, stegaClean } from "next-sanity";
import { SectionHeading } from "~/components/section-heading";
import { sanityFetch } from "~/features/sanity/client";
import { MediaFragment } from "~/features/sanity/media/fragment";
import { SanityImage } from "~/features/sanity/media/image";
import type { TeamSectionQResult } from "~/sanity/types";

const TeamSectionQ =
  defineQuery(`*[_id == $docId][0].pageBuilder.sectionsArray[_type == "teamSectionField" && _key == $sectionKey][0]{
    "content": sectionContent{
      eyebrow,
      title,
      lead,
      members[]{"key": _key, name, role, focus, "photo": photo{${MediaFragment}}},
    },
    "settings": sectionSettings {
      "hash": coalesce(sectionHash.current, _key),
    }
}`);

export async function TeamSection({ docId, sectionKey }: { docId: string; sectionKey: string }) {
  const section = await sanityFetch<TeamSectionQResult>({
    query: TeamSectionQ,
    params: { docId, sectionKey },
    options: { next: { tags: [`doc:${docId}`] } },
  });

  if (!section?.content) {
    return null;
  }

  const { eyebrow, title, lead, members } = section.content;

  return (
    <section
      id={stegaClean(section.settings?.hash)}
      data-page-builder-section="teamSection"
      className="bg-surface-alt py-64 lg:py-96"
    >
      <div className="container-page flex flex-col gap-48">
        <SectionHeading eyebrow={eyebrow ?? undefined} title={title ?? ""} lead={lead ?? undefined} />

        {members && members.length > 0 && (
          <div className="reveal-group grid gap-24 sm:grid-cols-2 lg:grid-cols-4">
            {members.map((member) => (
              <figure key={member.key} className="m-0 flex flex-col gap-16">
                <div className="flex aspect-[4/5] items-center justify-center rounded-media bg-surface-tint">
                  {member.photo?.image ? (
                    <SanityImage
                      image={member.photo.image}
                      aspectRatio="4/5"
                      sizes="(min-width: 64rem) 25vw, 50vw"
                      className="block size-full rounded-media object-cover"
                    />
                  ) : (
                    <span className="px-16 text-center font-sans text-caption text-text-subtle">Porträt folgt</span>
                  )}
                </div>
                <figcaption className="flex flex-col gap-4">
                  <span className="font-display font-medium text-body text-text-heading">{member.name}</span>
                  <span className="font-sans text-brand-strong text-small">{member.role}</span>
                  {member.focus && <span className="font-sans text-caption text-text-muted">{member.focus}</span>}
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
