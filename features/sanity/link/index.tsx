import type * as React from "react";
import { Icon } from "~/components/icon";
import { Link } from "~/components/link";
import type { LinkFragmentResult } from "~/features/sanity/link/fragment";

export function SanityLink(
  props: {
    link: LinkFragmentResult;
    children?: React.ReactNode;
  } & Omit<React.ComponentProps<typeof Link>, "href">
) {
  const { link, children, ...rest } = props;
  const computedChildren = children ?? link.text;

  const target = link.openInNewTab ? "_blank" : undefined;
  const rel = link.openInNewTab ? "noopener" : undefined;
  const download = link.canDownload ? "" : undefined;

  return (
    <Link href={link.href} target={target} rel={rel} download={download} {...rest}>
      {computedChildren}
    </Link>
  );
}

export function SanityLinkIcon({
  link,
  ...props
}: { link: LinkFragmentResult } & Omit<React.ComponentProps<typeof Icon>, "name">) {
  if (link.openInNewTab) {
    return <Icon name="arrow-up-right" {...props} />;
  }

  if (link.canDownload) {
    return <Icon name="arrow-down" {...props} />;
  }

  return <Icon name="arrow-right" {...props} />;
}
