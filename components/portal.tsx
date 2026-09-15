"use client";

import * as React from "react";
import { createPortal } from "react-dom";

export type PortalProps = {
  children: React.ReactNode;
  targetId?: string;
};

export function Portal({ children, targetId }: PortalProps) {
  const [target, setTarget] = React.useState<HTMLElement | null>(null);

  React.useEffect(() => {
    if (targetId) {
      const el = document.getElementById(targetId);

      if (el) {
        setTarget(el);
      } else {
        setTarget(null);
      }

      return;
    }

    setTarget(document.body);
  }, [targetId]);

  if (!target) {
    return null;
  }

  return createPortal(children, target);
}
