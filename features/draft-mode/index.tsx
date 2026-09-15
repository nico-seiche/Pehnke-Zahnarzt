"use client";

import * as React from "react";
import { disableDraftMode } from "~/features/draft-mode/actions";

export function DisableDraftMode() {
  const [visible, setVisible] = React.useState(true);
  const [pending, startTransition] = React.useTransition();

  // If the the window is not the parent window, it means we are
  // inside an iframe. Most likely within the CMS preview panel.
  React.useEffect(() => {
    if (window !== window.parent) {
      setVisible(false);
    } else {
      setVisible(true);
    }
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <button
      disabled={pending}
      type="button"
      onClick={() => {
        startTransition(async () => {
          await disableDraftMode();
          window.location.reload();
        });
      }}
      className="fixed inset-x-0 bottom-0 z-2 cursor-pointer bg-black p-8 text-center font-semibold text-white uppercase"
    >
      {pending ? "Disabling draft mode..." : "Disable draft mode"}
    </button>
  );
}
