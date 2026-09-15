import { defineQuery, stegaClean } from "next-sanity";
import { InnerParallax } from "~/components/inner-parallax";
import { sanityFetch } from "~/features/sanity/client";
import { SanityMedia } from "~/features/sanity/media";
import { MediaFragment } from "~/features/sanity/media/fragment";
import type { MediaSectionQResult } from "~/sanity/types";

const MediaSectionQ =
  defineQuery(`*[_id == $docId][0].pageBuilder.sectionsArray[_type == "mediaSectionField" && _key == $sectionKey][0]{
    "content": sectionContent{
      caption,
      useParallax,
      "media": appMedia{${MediaFragment}}
    },
    "settings": sectionSettings {
      "hash": coalesce(sectionHash.current, _key),
    }
}`);

export async function MediaSection({ docId, sectionKey }: { docId: string; sectionKey: string }) {
  const section = await sanityFetch<MediaSectionQResult>({
    query: MediaSectionQ,
    params: {
      docId,
      sectionKey,
    },
    options: {
      next: {
        tags: [`doc:${docId}`],
      },
    },
  });

  if (!section?.content) {
    return null;
  }

  const { media, caption, useParallax } = section.content;

  return (
    <figure
      id={stegaClean(section.settings?.hash)}
      data-page-builder-section="mediaSection"
      className="container-page py-32 lg:py-48"
    >
      {useParallax ? (
        <InnerParallax overflow="60 lg:120" style={{ aspectRatio: media?.aspectRatio ?? undefined }}>
          <SanityMedia media={media} className="size-full object-cover" />
        </InnerParallax>
      ) : (
        <SanityMedia media={media} className="w-full rounded-media" />
      )}
      {caption && <figcaption className="mt-12 font-sans text-caption text-text-muted">{caption}</figcaption>}
    </figure>
  );
}
