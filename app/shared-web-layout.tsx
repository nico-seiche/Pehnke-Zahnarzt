import dynamic from "next/dynamic";
import Script from "next/script";
import * as React from "react";
import { env } from "~/env";
import { KeyboardFocusMode } from "~/features/dom/keyboard-focus-mode";
import { DraftModeProvider } from "~/features/draft-mode/context";
import { fonts } from "~/features/fonts";
import { Lenis } from "~/features/lenis";
import { cx } from "~/features/style/utils";
import { ViewTransitions } from "~/features/view-transition/app-view-transitions";

const SanityLive = dynamic(() => import("~/features/sanity/client").then((mod) => mod.SanityLive));
const VisualEditing = dynamic(() => import("next-sanity/visual-editing").then((mod) => mod.VisualEditing));
const DisableDraftMode = dynamic(() => import("~/features/draft-mode").then((mod) => mod.DisableDraftMode));

export type SharedWebLayoutProps = {
  children: React.ReactNode;
  isDraft: boolean;
  bodyStart?: React.ReactNode;
  bodyEnd?: React.ReactNode;
};

export function SharedWebLayout(props: SharedWebLayoutProps) {
  return (
    <ViewTransitions>
      <html lang="de" className={cx([fonts.map((f) => f.variable)])}>
        <body>
          <KeyboardFocusMode />
          {props.bodyStart}
          <DraftModeProvider isDraft={props.isDraft}>
            {props.isDraft && (
              <React.Suspense fallback={null}>
                <SanityLive />
                <VisualEditing />
                <DisableDraftMode />
              </React.Suspense>
            )}
            <Lenis>{props.children}</Lenis>
          </DraftModeProvider>
          {env.NEXT_PUBLIC_UNAMI_WEBSITE_ID && (
            <Script defer src="https://cloud.umami.is/script.js" data-website-id={env.NEXT_PUBLIC_UNAMI_WEBSITE_ID} />
          )}
          {props.bodyEnd}
        </body>
      </html>
    </ViewTransitions>
  );
}
