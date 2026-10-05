import dynamic from "next/dynamic";
import Script from "next/script";
import * as React from "react";
import { ThemeSwitcher } from "~/components/theme-switcher";
import { env } from "~/env";
import { KeyboardFocusMode } from "~/features/dom/keyboard-focus-mode";
import { DraftModeProvider } from "~/features/draft-mode/context";
import { fonts } from "~/features/fonts";
import { Lenis } from "~/features/lenis";
import { COLOR_THEME_STORAGE_KEY, COLOR_THEMES } from "~/features/style/color-theme";
import { cx } from "~/features/style/utils";
import { ViewTransitions } from "~/features/view-transition/app-view-transitions";

// Applies the saved color scheme before paint, so there's no flash of the default (sage) theme.
const COLOR_THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  COLOR_THEME_STORAGE_KEY
)});if(${JSON.stringify(COLOR_THEMES)}.indexOf(t)!==-1){document.documentElement.dataset.theme=t;}}catch(e){}})();`;

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
      {/* suppressHydrationWarning: the color-theme-init script sets `data-theme` on <html> before
          hydration (to avoid a flash of the wrong scheme), which otherwise mismatches the server markup. */}
      <html lang="de" className={cx([fonts.map((f) => f.variable)])} suppressHydrationWarning>
        <body>
          <Script id="color-theme-init" strategy="beforeInteractive">
            {COLOR_THEME_INIT_SCRIPT}
          </Script>
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
          <ThemeSwitcher />
          {env.NEXT_PUBLIC_UNAMI_WEBSITE_ID && (
            <Script defer src="https://cloud.umami.is/script.js" data-website-id={env.NEXT_PUBLIC_UNAMI_WEBSITE_ID} />
          )}
          {props.bodyEnd}
        </body>
      </html>
    </ViewTransitions>
  );
}
