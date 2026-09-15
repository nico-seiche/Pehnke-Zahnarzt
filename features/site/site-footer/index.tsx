import { Icon } from "~/components/icon";
import { sanityFetch } from "~/features/sanity/client";
import { SiteFooterQ } from "~/features/site/site-footer/query";
import { SiteFooterLink } from "~/features/site/site-footer/site-footer-link";
import { SANITY_SINGLETON_SITE_ID } from "~/sanity/constants";
import type { SiteFooterQResult } from "~/sanity/types";

export async function SiteFooter() {
  const siteFooter = await sanityFetch<SiteFooterQResult>({
    query: SiteFooterQ,
    options: { next: { tags: [SANITY_SINGLETON_SITE_ID] } },
  });

  if (!siteFooter?.footer?.links) {
    return null;
  }

  const { name, phone, email, addressLines, footer } = siteFooter;
  const year = new Date().getFullYear();

  return (
    <footer className="bg-surface-deep pt-64 pb-32 text-blue-100">
      <div className="container-page flex flex-wrap gap-40">
        <div className="flex min-w-[180px] flex-1 flex-col gap-16">
          <span className="font-display font-semibold text-h3 text-white">Pehnke</span>
          {addressLines && addressLines.length > 0 && (
            <div className="font-sans text-blue-200 text-small leading-relaxed">
              {addressLines.map((line) => (
                <div key={line}>{line}</div>
              ))}
            </div>
          )}
          <div className="flex flex-col gap-8 font-sans text-small">
            {phone && (
              <a href={`tel:${phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-8 text-blue-100 no-underline">
                <Icon name="phone" />
                {phone}
              </a>
            )}
            {email && (
              <a href={`mailto:${email}`} className="inline-flex items-center gap-8 text-blue-100 no-underline">
                <Icon name="mail" />
                {email}
              </a>
            )}
          </div>
        </div>

        {footer.links && footer.links.length > 0 && (
          <div className="flex min-w-[110px] flex-1 flex-col gap-12">
            <span className="eyebrow text-blue-300">Navigation</span>
            {footer.links.map((link, i) => (
              <SiteFooterLink key={link.key} link={link} animationDelay={i * 0.1} />
            ))}
          </div>
        )}
      </div>

      <div className="container-page mt-48 flex flex-wrap items-center justify-between gap-16 border-white/15 border-t pt-24 font-sans text-blue-200 text-caption">
        <span>
          © {year} {name}
        </span>
        {footer.legalLinks && footer.legalLinks.length > 0 && (
          <nav aria-label="Rechtliches">
            <ul className="flex gap-24">
              {footer.legalLinks.map((link, i) => (
                <li key={link.key}>
                  <SiteFooterLink link={link} animationDelay={i * 0.1} />
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </footer>
  );
}
