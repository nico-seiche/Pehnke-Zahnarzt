import { useMediaQuery } from "@mantine/hooks";
import { type Screen, screens } from "~/features/dom/constants";

type UseMediaQueryOptions = {
  /**
   * When `false` (default), the initial render uses `false` until the effect runs (SSR-safe).
   * When `true`, the initial state matches `initialValue` before hydration completes.
   */
  initializeWithValue?: boolean;
};

/**
 * Check if the current viewport is at least the given Tailwind-aligned breakpoint.
 *
 * @see https://mantine.dev/hooks/use-media-query/
 */
export function useBreakpoint(screen: Screen, options?: UseMediaQueryOptions) {
  const initialValue = options?.initializeWithValue ?? false;
  return useMediaQuery(`(min-width: ${screens[screen]})`, initialValue);
}

/**
 * Whether the browser reports the **primary** pointer as coarse (CSS `(pointer: coarse)`).
 *
 * @see https://mantine.dev/hooks/use-media-query/
 */
export function useIsTouchDevice(options?: UseMediaQueryOptions) {
  const initialValue = options?.initializeWithValue ?? false;
  return useMediaQuery("(pointer: coarse)", initialValue);
}
