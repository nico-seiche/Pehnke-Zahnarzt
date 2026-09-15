import { metadata, viewport } from "next-sanity/studio";
import type * as React from "react";
import "~/features/style/studio.css";

export { metadata, viewport };

export default function Layout(props: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{props.children}</body>
    </html>
  );
}

export const dynamic = "force-static";
