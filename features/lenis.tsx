"use client";

import { ReactLenis, useLenis } from "lenis/react";
import { usePathname } from "next/navigation";
import * as React from "react";
import "lenis/dist/lenis.css";
import { cx } from "~/features/style/utils";

/**
 * Lenis keeps its own scroll offset; Next's `scroll: true` on navigation does not reset it.
 * @see https://github.com/darkroomengineering/lenis/issues/375
 */
function LenisScrollResetOnRoute() {
  const pathname = usePathname();
  const lenis = useLenis();
  const prevPathname = React.useRef<string | null>(null);

  React.useLayoutEffect(() => {
    if (prevPathname.current === pathname) {
      return;
    }

    if (prevPathname.current !== null) {
      lenis?.scrollTo(0, { immediate: true, force: true });
    }

    prevPathname.current = pathname;
  }, [pathname, lenis]);

  return null;
}

/**
 * Honors a URL hash on initial load (Lenis owns the scroll surface, so the browser won't).
 * Scrolls once the layout above the target has settled: fonts reflow line heights and images
 * reflow as they load, so an earlier scroll reads a stale offset and lands short of the target.
 */
function LenisHashScrollOnLoad() {
  const lenis = useLenis();

  React.useEffect(() => {
    if (!lenis) {
      return;
    }

    const hash = window.location.hash.slice(1);

    if (!hash) {
      return;
    }

    const controller = new AbortController();

    const whenLoaded =
      document.readyState === "complete"
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            window.addEventListener("load", () => resolve(), { once: true, signal: controller.signal });
          });

    Promise.all([document.fonts.ready, whenLoaded]).then(() => {
      const target = document.getElementById(decodeURIComponent(hash));

      if (target && !controller.signal.aborted) {
        lenis.scrollTo(target, { force: true });
      }
    });

    return () => controller.abort();
  }, [lenis]);

  return null;
}

export function Lenis(props: React.ComponentProps<typeof ReactLenis>) {
  const { children, className, ...rest } = props;

  return (
    <ReactLenis
      className={cx(
        "scrollbar-thin relative h-dvh min-h-0 overflow-auto overscroll-none [scrollbar-color:gray_transparent]",
        className
      )}
      options={{
        anchors: {
          duration: 1.2,
          easing: (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2),
        },
      }}
      {...rest}
    >
      <LenisScrollResetOnRoute />
      <LenisHashScrollOnLoad />
      {children}
    </ReactLenis>
  );
}
