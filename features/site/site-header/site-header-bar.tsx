"use client";

import { useDisclosure } from "@mantine/hooks";
import { Button } from "~/components/button";
import { Icon } from "~/components/icon";
import { Link } from "~/components/link";
import { SanityLink } from "~/features/sanity/link";
import type { LinkFragmentResult } from "~/features/sanity/link/fragment";
import { SiteHeaderLink } from "~/features/site/site-header/site-header-link";

export type SiteHeaderBarProps = {
  name: string;
  phone?: string | null;
  links: (LinkFragmentResult & { key: string })[];
  cta?: LinkFragmentResult | null;
};

export function SiteHeaderBar({ name, phone, links, cta }: SiteHeaderBarProps) {
  const [opened, { toggle, close }] = useDisclosure(false);

  return (
    <header className="sticky top-0 z-40 border-border-subtle border-b bg-surface-glass backdrop-blur-md">
      <div className="container-page flex items-center gap-16 py-12 lg:gap-32 lg:py-16">
        <Link href="/" onClick={close} className="flex items-center gap-10 no-underline hover:no-underline">
          <span className="flex size-40 shrink-0 items-center justify-center rounded-md border border-brand text-brand">
            <Icon name="tooth" className="text-[20px]" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="font-bold font-sans text-[12px] text-text-heading uppercase tracking-wide">Zahnarztpraxis</span>
            <span className="font-sans text-[12px] text-text-muted uppercase tracking-wide">
              {name.replace(/^Zahnarztpraxis\s+/i, "")}
            </span>
          </span>
        </Link>

        <nav aria-label="Hauptnavigation" className="ml-auto hidden items-center gap-24 lg:flex">
          {links.map((link, i) => (
            <SiteHeaderLink key={link.key} link={link} animationDelay={i * 0.1} />
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-16 lg:ml-0">
          {phone && (
            <a
              href={`tel:${phone.replace(/\s/g, "")}`}
              className="hidden items-center gap-6 font-medium font-sans text-small text-text-body no-underline hover:text-brand-strong hover:no-underline md:inline-flex"
            >
              <Icon name="phone" className="text-brand" />
              {phone}
            </a>
          )}
          {cta?.href && (
            <Button
              asChild
              size="sm"
              className="hidden sm:inline-flex"
              leftIcon={<Icon name="calendar-check" className="text-[16px]" />}
            >
              <SanityLink link={cta}>{cta.text}</SanityLink>
            </Button>
          )}
          <button
            type="button"
            aria-label={opened ? "Menü schließen" : "Menü öffnen"}
            aria-expanded={opened}
            onClick={toggle}
            className="inline-flex size-36 items-center justify-center rounded-control text-text-heading lg:hidden"
          >
            <Icon name={opened ? "x" : "menu"} className="text-[22px]" />
          </button>
        </div>
      </div>

      {opened && (
        <nav
          aria-label="Mobile Navigation"
          className="reveal-group flex flex-col gap-4 border-border-subtle border-t bg-surface-page px-24 py-16 lg:hidden"
        >
          {links.map((link) => (
            <SiteHeaderLink key={link.key} link={link} onClick={close} className="border-b-0 py-8 text-body" />
          ))}
          {phone && (
            <a
              href={`tel:${phone.replace(/\s/g, "")}`}
              className="inline-flex items-center gap-6 py-8 font-sans text-body text-text-body no-underline"
            >
              <Icon name="phone" className="text-brand" />
              {phone}
            </a>
          )}
          {cta?.href && (
            <Button asChild size="md" className="mt-8 w-full">
              <SanityLink link={cta} onClick={close}>
                {cta.text}
              </SanityLink>
            </Button>
          )}
        </nav>
      )}
    </header>
  );
}
