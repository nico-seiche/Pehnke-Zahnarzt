import { defineQuery, stegaClean } from "next-sanity";
import { Badge } from "~/components/badge";
import { Button } from "~/components/button";
import type { IconName } from "~/components/icon";
import { Icon } from "~/components/icon";
import { sanityFetch } from "~/features/sanity/client";
import { SanityLink, SanityLinkIcon } from "~/features/sanity/link";
import { LinkFragment } from "~/features/sanity/link/fragment";
import { MediaFragment } from "~/features/sanity/media/fragment";
import { SanityImage } from "~/features/sanity/media/image";
import { findTodayIndex } from "~/features/site/opening-hours";
import { SiteOpeningHoursQ } from "~/features/site/opening-hours-query";
import type { HeroSectionQResult, SiteOpeningHoursQResult } from "~/sanity/types";

const HeroSectionQ =
  defineQuery(`*[_id == $docId][0].pageBuilder.sectionsArray[_type == "heroSectionField" && _key == $sectionKey][0]{
    "content": sectionContent{
      eyebrow,
      headline,
      lead,
      "primaryCta": primaryCta{${LinkFragment}},
      "secondaryCta": secondaryCta{${LinkFragment}},
      trustBadges[]{"key": _key, appIcon, text, tone},
      "image": image{${MediaFragment}},
      showTodayCard,
    },
    "settings": sectionSettings {
      "hash": coalesce(sectionHash.current, _key),
    }
}`);

const badgeTone = (tone?: string | null) => (tone === "success" || tone === "mint" ? tone : "brand");

export async function HeroSection({ docId, sectionKey }: { docId: string; sectionKey: string }) {
  const [section, site] = await Promise.all([
    sanityFetch<HeroSectionQResult>({
      query: HeroSectionQ,
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

  const { eyebrow, headline, lead, primaryCta, secondaryCta, trustBadges, image, showTodayCard } = section.content;

  const todayIndex = findTodayIndex(site?.openingHours);
  const todayRow = todayIndex >= 0 ? site?.openingHours?.[todayIndex] : undefined;

  return (
    <section
      id={stegaClean(section.settings?.hash)}
      data-page-builder-section="heroSection"
      className="bg-gradient-hero pt-40 pb-64 lg:pt-64 lg:pb-96"
    >
      <div className="container-page grid items-center gap-48 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="reveal-group flex flex-col items-start gap-24">
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <h1 className="text-balance font-display text-display text-text-heading tracking-tight">{headline}</h1>
          {lead && <p className="max-w-[480px] font-sans text-lead text-text-muted">{lead}</p>}
          <div className="flex flex-wrap gap-12">
            {primaryCta?.href && (
              <Button asChild size="lg" rightIcon={<SanityLinkIcon link={primaryCta} className="text-[18px]" />}>
                <SanityLink link={primaryCta}>{primaryCta.text}</SanityLink>
              </Button>
            )}
            {secondaryCta?.href && (
              <Button asChild size="lg" variant="outline">
                <SanityLink link={secondaryCta}>{secondaryCta.text}</SanityLink>
              </Button>
            )}
          </div>
          {trustBadges && trustBadges.length > 0 && (
            <div className="flex flex-wrap gap-12">
              {trustBadges.map((badge) => (
                <Badge
                  key={badge.key}
                  tone={badgeTone(badge.tone)}
                  icon={badge.appIcon ? <Icon name={badge.appIcon as IconName} className="text-[12px]" /> : undefined}
                >
                  {badge.text}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="reveal relative [animation-delay:180ms]">
          <SanityImage
            image={image?.image}
            aspectRatio="4/3"
            sizes="(min-width: 64rem) 50vw, 100vw"
            priority
            className="block w-full rounded-media object-cover"
          />
          {showTodayCard && (todayRow || site?.phone) && (
            <div className="absolute -bottom-24 -left-16 w-[230px] rounded-card bg-surface-card p-20 shadow-lg lg:-bottom-34 lg:-left-28 lg:w-[250px]">
              <div className="mb-12 flex items-center gap-8">
                <Icon name="clock" className="text-[16px] text-brand" />
                <strong className="font-sans text-blue-900 text-label">
                  {todayRow ? (todayRow.hours ? "Heute geöffnet" : "Heute geschlossen") : "Öffnungszeiten"}
                </strong>
              </div>
              {todayRow?.hours && (
                <div className="font-sans text-small text-text-body tabular-nums">
                  {todayRow.hours.split(" · ").map((slot) => (
                    <div key={slot}>{slot}</div>
                  ))}
                </div>
              )}
              {site?.phone && (
                <a
                  href={`tel:${site.phone.replace(/\s/g, "")}`}
                  className="mt-16 inline-flex items-center gap-6 font-medium font-sans text-small text-text-body no-underline hover:text-brand-strong hover:no-underline"
                >
                  <Icon name="phone" className="text-[14px]" />
                  {site.phone}
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
