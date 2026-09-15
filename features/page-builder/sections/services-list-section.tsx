import { defineQuery, stegaClean } from "next-sanity";
import { Alert } from "~/components/alert";
import { Badge } from "~/components/badge";
import { Icon } from "~/components/icon";
import { SectionHeading } from "~/components/section-heading";
import type { ServiceCardProps } from "~/components/service-card";
import { ServiceCard } from "~/components/service-card";
import { sanityFetch } from "~/features/sanity/client";
import type { ServicesListSectionQResult } from "~/sanity/types";

const ServicesListSectionQ =
  defineQuery(`*[_id == $docId][0].pageBuilder.sectionsArray[_type == "servicesListSectionField" && _key == $sectionKey][0]{
    "content": sectionContent{
      eyebrow,
      title,
      lead,
      infoNote,
      selbstzahlerLead,
    },
    "settings": sectionSettings {
      "hash": coalesce(sectionHash.current, _key),
    }
}`);

const AllServicesQ = defineQuery(
  `*[_type == "service"] | order(coalesce(order, 9999) asc, title asc) {
    "key": _id,
    title,
    category,
    appIcon,
    text,
    meta,
  }`
);

type ServiceRow = ServiceCardProps & { key: string; category?: string | null };

function ServiceGroup({
  badgeTone,
  badgeIcon,
  badgeLabel,
  heading,
  lead,
  services,
}: {
  badgeTone: "success" | "brand";
  badgeIcon: "check" | "sparkles";
  badgeLabel: string;
  heading: string;
  lead?: string;
  services: ServiceRow[];
}) {
  if (services.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-32">
      <div className="flex flex-wrap items-center gap-12">
        <Badge tone={badgeTone} icon={<Icon name={badgeIcon} className="text-[12px]" />}>
          {badgeLabel}
        </Badge>
        <h2 className="font-display text-h2 text-text-heading">{heading}</h2>
      </div>
      {lead && <p className="max-w-[640px] font-sans text-body text-text-muted">{lead}</p>}
      <div className="reveal-group grid gap-24 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((s) => (
          <ServiceCard key={s.key} icon={s.icon} title={s.title} text={s.text} meta={s.meta} />
        ))}
      </div>
    </div>
  );
}

export async function ServicesListSection({ docId, sectionKey }: { docId: string; sectionKey: string }) {
  const [section, allServices] = await Promise.all([
    sanityFetch<ServicesListSectionQResult>({
      query: ServicesListSectionQ,
      params: { docId, sectionKey },
      options: { next: { tags: [`doc:${docId}`] } },
    }),
    sanityFetch<
      {
        key: string;
        title: string;
        category?: string | null;
        appIcon?: string | null;
        text?: string | null;
        meta?: string | null;
      }[]
    >({
      query: AllServicesQ,
      options: { next: { tags: ["service"] } },
    }),
  ]);

  if (!section?.content) {
    return null;
  }

  const { eyebrow, title, lead, infoNote, selbstzahlerLead } = section.content;

  const kasse = (allServices ?? [])
    .filter((s) => s.category === "kasse")
    .map((s) => ({ key: s.key, icon: s.appIcon as ServiceRow["icon"], title: s.title, text: s.text, meta: s.meta }));
  const selbstzahler = (allServices ?? [])
    .filter((s) => s.category === "selbstzahler")
    .map((s) => ({ key: s.key, icon: s.appIcon as ServiceRow["icon"], title: s.title, text: s.text, meta: s.meta }));

  return (
    <section
      id={stegaClean(section.settings?.hash)}
      data-page-builder-section="servicesListSection"
      className="bg-surface-page py-64 lg:py-96"
    >
      <div className="container-page flex flex-col gap-48">
        <div className="flex flex-col gap-24">
          <SectionHeading eyebrow={eyebrow ?? undefined} title={title ?? ""} lead={lead ?? undefined} />
          {infoNote && (
            <Alert tone="info" title="Kassen- und Privatleistungen">
              {infoNote}
            </Alert>
          )}
        </div>

        <ServiceGroup
          badgeTone="success"
          badgeIcon="check"
          badgeLabel="Kasse"
          heading="Gesetzlich abgedeckte Leistungen"
          services={kasse}
        />

        <ServiceGroup
          badgeTone="brand"
          badgeIcon="sparkles"
          badgeLabel="Selbstzahler"
          heading="Selbstzahlerleistungen"
          lead={selbstzahlerLead ?? undefined}
          services={selbstzahler}
        />
      </div>
    </section>
  );
}
