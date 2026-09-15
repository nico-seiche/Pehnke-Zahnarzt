import type * as React from "react";
import { SiteFooter } from "~/features/site/site-footer";
import { SiteHeader } from "~/features/site/site-header";

export type SiteShellProps = {
  children: React.ReactNode;
  showHeader?: boolean;
  showFooter?: boolean;
};

export function SiteShell(props: SiteShellProps) {
  const { children, showHeader = true, showFooter = true } = props;

  return (
    <div className="flex min-h-dvh flex-col">
      {showHeader && <SiteHeader />}
      <main className="flex-1">{children}</main>
      {showFooter && <SiteFooter />}
    </div>
  );
}
