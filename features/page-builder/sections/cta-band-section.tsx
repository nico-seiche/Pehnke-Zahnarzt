import { defineQuery, stegaClean } from "next-sanity";
import { Button } from "~/components/button";
import { sanityFetch } from "~/features/sanity/client";
import { SanityLink } from "~/features/sanity/link";
import { LinkFragment } from "~/features/sanity/link/fragment";
import type { CtaBandSectionQResult } from "~/sanity/types";

const CtaBandSectionQ =
  defineQuery(`*[_id == $docId][0].pageBuilder.sectionsArray[_type == "ctaBandSectionField" && _key == $sectionKey][0]{
    "content": sectionContent{
      title,
      text,
      "primaryCta": primaryCta{${LinkFragment}},
      "secondaryCta": secondaryCta{${LinkFragment}},
    },
    "settings": sectionSettings {
      "hash": coalesce(sectionHash.current, _key),
    }
}`);

export async function CtaBandSection({ docId, sectionKey }: { docId: string; sectionKey: string }) {
  const section = await sanityFetch<CtaBandSectionQResult>({
    query: CtaBandSectionQ,
    params: { docId, sectionKey },
    options: { next: { tags: [`doc:${docId}`] } },
  });

  if (!section?.content) {
    return null;
  }

  const { title, text, primaryCta, secondaryCta } = section.content;

  return (
    <div
      id={stegaClean(section.settings?.hash)}
      data-page-builder-section="ctaBandSection"
      className="container-page py-32 lg:py-48"
    >
      <div className="reveal flex flex-col items-center gap-24 rounded-panel bg-gradient-brand px-24 py-48 text-center lg:px-32">
        <h2 className="max-w-[620px] text-balance font-display text-h2 text-white">{title}</h2>
        {text && <p className="max-w-[560px] font-sans text-lead text-white/85">{text}</p>}
        <div className="flex flex-wrap justify-center gap-12">
          {primaryCta?.href && (
            <Button asChild size="lg" variant="onDark">
              <SanityLink link={primaryCta}>{primaryCta.text}</SanityLink>
            </Button>
          )}
          {secondaryCta?.href && (
            <Button asChild size="lg" variant="ghost" className="text-white hover:bg-white/15">
              <SanityLink link={secondaryCta}>{secondaryCta.text}</SanityLink>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
