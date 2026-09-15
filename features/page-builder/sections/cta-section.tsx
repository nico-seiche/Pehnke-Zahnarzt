import { defineQuery, stegaClean } from "next-sanity";
import { Button } from "~/components/button";
import { AnimatedSanityRichText } from "~/features/rich-text";
import { RichTextFragment } from "~/features/rich-text/fragment";
import { sanityFetch } from "~/features/sanity/client";
import { SanityLink, SanityLinkIcon } from "~/features/sanity/link";
import { LinkFragment } from "~/features/sanity/link/fragment";
import type { CtaSectionQResult } from "~/sanity/types";

const CtaSectionQ =
  defineQuery(`*[_id == $docId][0].pageBuilder.sectionsArray[_type == "ctaSectionField" && _key == $sectionKey][0]{
    "content": sectionContent{
      headline,
      "cta": appLink{${LinkFragment}},
      "text": appRichText[]{${RichTextFragment}}
    },
    "settings": sectionSettings {
      "hash": coalesce(sectionHash.current, _key),
    }
}`);

export async function CtaSection({ docId, sectionKey }: { docId: string; sectionKey: string }) {
  const section = await sanityFetch<CtaSectionQResult>({
    query: CtaSectionQ,
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

  const { headline, cta, text } = section.content;

  return (
    <div
      id={stegaClean(section.settings?.hash)}
      data-page-builder-section="ctaSection"
      className="container-page my-32 flex flex-col items-start gap-24 rounded-panel border border-border-subtle bg-surface-alt p-24 lg:my-48 lg:p-40"
    >
      {headline && <h2 className="whitespace-pre-line text-balance font-display text-h2 text-text-heading">{headline}</h2>}
      <AnimatedSanityRichText value={text} className="text-body" />
      {cta && (
        <Button asChild rightIcon={<SanityLinkIcon link={cta} />}>
          <SanityLink link={cta}>{cta.text}</SanityLink>
        </Button>
      )}
    </div>
  );
}
