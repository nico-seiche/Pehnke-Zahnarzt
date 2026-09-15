"use client";

import { usePathname } from "next/navigation";
import { AnimatedText } from "~/components/animated-text";
import { SanityLink } from "~/features/sanity/link";
import type { LinkFragmentResult } from "~/features/sanity/link/fragment";
import { cx } from "~/features/style/utils";

export function SiteHeaderLink({
  link,
  animationDelay,
  className,
  onClick,
}: {
  link: LinkFragmentResult;
  animationDelay?: number;
  className?: string;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  // Anchor links (e.g. "/#leistungen") point at a section, not a route — never mark those active.
  const isActive = !link.href.includes("#") && pathname === link.href.split(/[?#]/)[0];

  return (
    <SanityLink
      link={link}
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      className={cx(
        "border-transparent border-b-2 pb-2 font-medium font-sans text-small text-text-body no-underline transition-colors duration-160 ease-out hover:text-brand-strong hover:no-underline",
        isActive && "border-brand text-brand-strong",
        className
      )}
    >
      <AnimatedText animationDelay={animationDelay}>{link.text}</AnimatedText>
    </SanityLink>
  );
}
