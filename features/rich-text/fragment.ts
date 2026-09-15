// PLOP: Add Import
import type { PortableTextProps } from "@portabletext/react";
import { LinkFragment } from "~/features/sanity/link/fragment";
import { MediaFragment } from "~/features/sanity/media/fragment";
import { MediaBlockFragment } from "./blocks/media-block/fragment";

export const RichTextFragment = `
  ...,
  ${MediaBlockFragment},
  // PLOP: Add Export
  markDefs[] {
    ...,
    _type == "linkField" => {${LinkFragment}},
  },
  children[] {
    ...,
    _type == "inlineMediaField" => {
      media{${MediaFragment}},
    },
  }
`;

export type RichTextFragmentResult = PortableTextProps["value"];
