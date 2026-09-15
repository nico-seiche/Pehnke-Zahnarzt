"use client";

import { usePathname } from "next/navigation";
import { AnimatedText } from "~/components/animated-text";
import { SanityLink } from "~/features/sanity/link";
import type { LinkFragmentResult } from "~/features/sanity/link/fragment";
import { cx } from "~/features/style/utils";

export function SiteFooterLink({ link, animationDelay }: { link: LinkFragmentResult; animationDelay?: number }) {
  const pathname = usePathname();
  // Anchor links (e.g. "/#leistungen") point at a section, not a route — never mark those active.
  const isActive = !link.href.includes("#") && pathname === link.href.split(/[?#]/)[0];

  return (
    <SanityLink
      link={link}
      aria-current={isActive ? "page" : undefined}
      className={cx(
        "font-sans text-blue-100 text-small no-underline transition-colors duration-160 ease-out hover:text-white hover:no-underline",
        isActive && "text-white underline underline-offset-4"
      )}
    >
      <AnimatedText animationDelay={animationDelay} viewport={{ margin: "0px" }}>
        {link.text}
      </AnimatedText>
    </SanityLink>
  );
}
